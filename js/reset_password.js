const ApiKey = "AIzaSyBHl8xfPt6Mql2_9nDrJV7A-QsVyGOiZew";

// Function to send password reset email using Firebase REST API
async function sendPasswordResetEmail(email) {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${ApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            requestType: "PASSWORD_RESET",
            email
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message || 'Failed to send password reset email');
    }

    return response.json();
}

function validation() {
    // Get the input field value
    const email = document.getElementById('user_email').value.trim();

    // Regular expression for email validation
    const isEmailValid = (email) => email.includes('@') && email.includes('.');

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

    const isValidEmail = validateField('user_email', isEmailValid, errorMessages.user_email);

    return isValidEmail;
}

// Updated resetPassword function using REST API
async function resetPassword() {
    const email = document.getElementById('user_email').value;

    try {
        await sendPasswordResetEmail(email);
        alert('Password reset email sent! Please check your email inbox.');
        // Redirect to login page after sending reset email
        window.location.href = 'login.html';
    } catch (error) {
        alert('Failed to send password reset email: ' + error.message);
    }
}

// Get the Reset button element
const resetBtn = document.getElementById('resetBtn');

resetBtn.addEventListener('click', function(event) {
    event.preventDefault();

    if (validation()) {
        // If validation passes, proceed with sending password reset email
        resetPassword();
    } else {
        const form = document.getElementById('resetPasswordForm');
        form.classList.add('was-validated');
    }
});