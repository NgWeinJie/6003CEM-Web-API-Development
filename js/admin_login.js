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
    // Get the input field values
    const email = document.getElementById('admin_email').value.trim();
    const password = document.getElementById('admin_password').value.trim();

    // Regular expression for email validation
    const isEmailValid = (email) => email.includes('@') && email.includes('.');

    // Error messages
    const errorMessages = {
        admin_email: 'Email must be valid.',
        admin_password: 'Password must not be empty.'
    };

    // Function to validate each field
    function validateField(fieldId, isValid, errorMessage) {
        const value = document.getElementById(fieldId).value.trim();
        const errorField = document.getElementById(fieldId + 'E');
        if (!isValid(value)) {
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
    const isValidEmail = validateField('admin_email', isEmailValid, errorMessages.admin_email);
    const isValidPassword = validateField('admin_password', (password) => !!password, errorMessages.admin_password); // Validation for non-empty password

    // Log error status and return true if all fields pass validation, otherwise false
    const isValidForm = isValidEmail && isValidPassword;
    return isValidForm;
}

function adminLogin() {
    const email = document.getElementById('admin_email').value;
    const password = document.getElementById('admin_password').value;

    // Basic validation for email and password before making the API call
    if (!email || !password) {
        alert('Email and password cannot be empty.');
        return;
    }

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Redirect to admin panel or dashboard after successful login
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            console.error('Login error:', error); // Log the detailed error for debugging
            handleLoginError(error);
        });
}

function handleLoginError(error) {
    switch (error.code) {
        case 'auth/wrong-password':
        case 'auth/user-not-found':
            alert('Invalid email or password.');
            break;
        case 'auth/invalid-email':
            alert('Invalid email format.');
            break;
        case 'auth/user-disabled':
            alert('User account is disabled.');
            break;
        case 'auth/internal-error':
            alert('Invalid email or password.');
            break;
        default:
            alert('Failed to login: ' + error.message);
            break;
    }
}

// Get the Login button element
const adminLoginBtn = document.getElementById('adminLoginBtn');

// Attach an event listener to the Login button
adminLoginBtn.addEventListener('click', function(event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Trigger validation for each field
    if (validation()) {
        // If validation passes, proceed with admin login
        adminLogin();
    } else {
        // If validation fails, add Bootstrap's was-validated class to the form
        const form = document.getElementById('adminLoginForm');
        form.classList.add('was-validated');
    }
});

// Toggle password visibility
const togglePasswordBtn = document.getElementById('togglePassword');
const passwordField = document.getElementById('admin_password');

togglePasswordBtn.addEventListener('click', function() {
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash'); // Toggle the eye icon
});
