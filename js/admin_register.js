// Firebase configuration
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Function to validate admin registration fields
function adminValidation() {
    const admin_email = document.getElementById('admin_email').value.trim();
    const admin_password = document.getElementById('admin_password').value.trim();
    const admin_phoneNo = document.getElementById('admin_phoneNo').value.trim();

    const emailRegex = (email) => email.includes('@') && email.includes('.');
    const passwordRegex = (password) => password.length >= 6 && /[A-Za-z]/.test(password) && /\d/.test(password) && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    const phoneRegex = (phoneNumber) => phoneNumber.length >= 10 && phoneNumber.length <= 12 && !isNaN(phoneNumber);

    // Error messages
    const errorMessages = {
        admin_email: 'Email invalid.',
        admin_password: 'Password must be at least 6 characters long and contain at least one letter, one number and one symbol.',
        admin_phoneNo: 'Phone Number must be numeric and between 10 to 12 digits long.'
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
    const isValidEmail = validateField('admin_email', emailRegex, errorMessages.admin_email);
    const isValidPassword = validateField('admin_password', passwordRegex, errorMessages.admin_password);
    const isValidPhoneNumber = validateField('admin_phoneNo', phoneRegex, errorMessages.admin_phoneNo);

    // Return true if all fields pass validation, otherwise false
    return isValidEmail && isValidPassword && isValidPhoneNumber;
}

// Function to register admin user
function adminRegister() {
    const admin_email = document.getElementById('admin_email').value;
    const admin_password = document.getElementById('admin_password').value;
    const admin_phoneNo = document.getElementById('admin_phoneNo').value;

    // Create admin user with email and password
    firebase.auth().createUserWithEmailAndPassword(admin_email, admin_password)
        .then((userCredential) => {
            // User created successfully
            const user = userCredential.user;
            const uid = user.uid;

            // Example: Save additional admin details to Firestore
            firebase.firestore().collection('admins').doc(uid).set({
                uid: uid,
                email: admin_email,
                phoneNumber: admin_phoneNo,
                // Add more fields as needed
            })
            .then(() => {
                console.log('Admin data saved to Firestore successfully');
                alert('Admin registration successful!');
                // Redirect to admin login page
                window.location.href = 'admin_login.html';
            })
            .catch((error) => {
                console.error('Error saving admin data to Firestore:', error);
                alert('Failed to save admin data: ' + error.message);
            });
        })
        .catch((error) => {
            // Error handling for registration failure
            alert('Failed to register admin: ' + error.message);
        });
}

// Get the Register button element
const adminRegisterBtn = document.getElementById('adminRegisterBtn');

// Attach an event listener to the Register button
adminRegisterBtn.addEventListener('click', function(event) {
    event.preventDefault();

    // Trigger validation for each field
    if (adminValidation()) {
        // If validation passes, proceed with admin registration
        adminRegister();
    } else {
        // If validation fails, add Bootstrap's was-validated class to the form
        const form = document.getElementById('adminRegisterForm');
        form.classList.add('was-validated');
    }
});
