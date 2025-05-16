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
    // Get the input field value
    const email = document.getElementById('user_email').value.trim();

    // Regular expression for email validation
    const isEmailValid = (email) => email.includes('@') && email.includes('.');

    // Error message
    const errorMessages = {
        user_email: 'Email must be valid.'
    };

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

    // Check the email field for validation
    const isValidEmail = validateField('user_email', isEmailValid, errorMessages.user_email);

    // Log error status and return true if the email field passes validation, otherwise false
    return isValidEmail;
}

function resetPassword() {
    const email = document.getElementById('user_email').value;

    firebase.auth().sendPasswordResetEmail(email)
        .then(() => {
            alert('Password reset email sent! Please check your email inbox.');
            // Redirect to login page or home page after sending reset email
            window.location.href = 'login.html';
        })
        .catch((error) => {
            alert('Failed to send password reset email: ' + error.message);
        });
}

// Get the Reset button element
const resetBtn = document.getElementById('resetBtn');

// Attach an event listener to the Reset button
resetBtn.addEventListener('click', function(event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Trigger validation for the email field
    if (validation()) {
        // If validation passes, proceed with sending password reset email
        resetPassword();
    } else {
        // If validation fails, add Bootstrap's was-validated class to the form
        const form = document.getElementById('resetPasswordForm');
        form.classList.add('was-validated');
    }
});
