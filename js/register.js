const firebaseConfig = {
    apiKey: "AIzaSyDCdP64LQYeS4vu3lFH7XtUHOPVJOYCbO8",
    authDomain: "enterprise-project-3448b.firebaseapp.com",
    databaseURL: "https://enterprise-project-3448b-default-rtdb.firebaseio.com",
    projectId: "enterprise-project-3448b",
    storageBucket: "enterprise-project-3448b.appspot.com",
    messagingSenderId: "1042464271522",
    appId: "1:1042464271522:web:1d1a3ffadf6830b5767bfb",
    measurementId: "G-3S19G51X7T"
};

// Initialize Firebase app
firebase.initializeApp(firebaseConfig);


function validation() {
    // Get all the input field values
    const firstName = document.getElementById('user_fullname').value.trim();
    const lastName = document.getElementById('user_lastname').value.trim();
    const email = document.getElementById('user_email').value.trim();
    const password = document.getElementById('user_password').value.trim();
    const address = document.getElementById('user_address').value.trim();
    const phoneNumber = document.getElementById('user_phoneNo').value.trim();
    const postcode = document.getElementById('user_postcode').value.trim();
    const city = document.getElementById('user_city').value.trim();


    const emailRegex = (email) => email.includes('@') && email.includes('.');
    const passwordRegex = (password) => password.length >= 6 && /[A-Za-z]/.test(password) && /\d/.test(password) && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    const phoneRegex = (phoneNumber) => phoneNumber.length >= 10 && phoneNumber.length <= 12 && !isNaN(phoneNumber);
    const postcodeRegex = (postcode) => postcode.length === 5 && !isNaN(postcode);

    // Error messages
    const errorMessages = {
        user_fullname: 'First Name must not be empty.',
        user_lastname: 'Last Name must not be empty.',
        user_email: 'Email invalid.',
        user_password: 'Password must be at least 6 characters long and contain at least one letter, one number and one symbol.',
        user_address: 'Full Address must not be empty.',
        user_phoneNo: 'Phone Number must be numeric and at least 10 digits long.',
        user_postcode: 'Postcode must be a 5-digit number.',
        user_city: 'City must not be empty.'
    };

    // Function to validate each field
    function validateField(fieldId, validationFunction, errorMessage) {
        const value = document.getElementById(fieldId).value.trim();
        const errorField = document.getElementById(fieldId + 'E');
        if (!validationFunction(value)) {
            errorField.textContent = errorMessage;
            errorField.classList.remove('d-none');
            return false;
        } else {
            errorField.textContent = '';
            errorField.classList.add('d-none');
            return true;
        }
    }

    // Check each field for validation
    const isValidFirstName = validateField('user_fullname', (value) => value !== '', errorMessages.user_fullname);
    const isValidLastName = validateField('user_lastname', (value) => value !== '', errorMessages.user_lastname);
    const isValidEmail = validateField('user_email', emailRegex, errorMessages.user_email);
    const isValidPassword = validateField('user_password', passwordRegex, errorMessages.user_password);
    const isValidAddress = validateField('user_address', (value) => value !== '', errorMessages.user_address);
    const isValidPhoneNumber = validateField('user_phoneNo', phoneRegex, errorMessages.user_phoneNo);
    const isValidPostcode = validateField('user_postcode', postcodeRegex, errorMessages.user_postcode);
    const isValidCity = validateField('user_city', (value) => value !== '', errorMessages.user_city);

    // Log error status and return true if all fields pass validation, otherwise false
    const isValidForm = isValidFirstName && isValidLastName && isValidEmail && isValidPassword &&
        isValidAddress && isValidPhoneNumber && isValidPostcode && isValidCity;
    return isValidForm;
}

function registerUser() {
    const firstName = document.getElementById('user_fullname').value;
    const lastName = document.getElementById('user_lastname').value;
    const email = document.getElementById('user_email').value;
    const password = document.getElementById('user_password').value;
    const address = document.getElementById('user_address').value;
    const phoneNumber = document.getElementById('user_phoneNo').value;
    const postcode = document.getElementById('user_postcode').value;
    const city = document.getElementById('user_city').value;
    const state = document.getElementById('user_state').value;

    firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const uid = user.uid;

            user.sendEmailVerification()
                .then(() => {
                    alert('Registration successful! Please check your email to verify your account.');
                    localStorage.setItem('registeredEmail', email);
                    window.location.href = 'Login.html';
                })
                .catch((error) => {
                    alert('Failed to send verification email: ' + error.message);
                });

            firebase.firestore().collection('users').doc(uid).set({
                uid: uid,
                firstName: firstName,
                lastName: lastName,
                email: email,
                address: address,
                phoneNumber: phoneNumber,
                postcode: postcode,
                city: city,
                state: state,
            })
                .then(() => {
                    console.log('User data saved to Firestore successfully');
                    window.location.href = 'Login.html';
                })
                .catch((error) => {
                    console.error('Error saving user data to Firestore:', error);
                    alert('Failed to save user data to Firestore: ' + error.message);
                });
        })
        .catch((error) => {
            alert('Failed to register user: ' + error.message);
        });
    localStorage.setItem('userType', 'user');
}

// Get the Register button element
const registerBtn = document.getElementById('registerBtn');

// Attach an event listener to the Register button
registerBtn.addEventListener('click', function(event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Trigger validation for each field
    if (validation()) {
        // If validation passes, proceed with user registration
        registerUser();
    } else {
        // If validation fails, add Bootstrap's was-validated class to the form
        const form = document.getElementById('registerForm');
        form.classList.add('was-validated');
    }
});