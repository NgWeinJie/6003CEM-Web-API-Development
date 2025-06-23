const ApiKey = "AIzaSyBHl8xfPt6Mql2_9nDrJV7A-QsVyGOiZew";

function validation() {
    const email = document.getElementById('user_email').value.trim();
    const password = document.getElementById('user_password').value.trim();

    const isEmailValid = (email) => email.includes('@') && email.includes('.');

    const errorMessages = {
        user_email: 'Email must be valid.',
        user_password: 'Password must not be empty.'
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
    const isValidPassword = validateField('user_password', (password) => !!password, errorMessages.user_password);

    return isValidEmail && isValidPassword;
}

// Call Firebase REST API to login
async function loginUser() {
    const email = document.getElementById('user_email').value;
    const password = document.getElementById('user_password').value;

    if (!email || !password) {
        alert('Email and password cannot be empty.');
        return;
    }

    try {
        //Sign in with email and password
        const signInResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${ApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password,
                returnSecureToken: true
            })
        });

        if (!signInResponse.ok) {
            const errorData = await signInResponse.json();
            throw new Error(errorData.error.message || 'Failed to login');
        }

        const signInData = await signInResponse.json();

        // Check if email is verified using accounts:lookup
        const lookupResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${ApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: signInData.idToken })
        });

        if (!lookupResponse.ok) {
            const errorData = await lookupResponse.json();
            throw new Error(errorData.error.message || 'Failed to verify user');
        }

        const lookupData = await lookupResponse.json();

        const user = lookupData.users[0];

        if (user.emailVerified) {
            // Email is verified, redirect to home
            localStorage.setItem('uid', signInData.localId);
            window.location.href = 'home.html';
        } else {
            alert('Please verify your email before logging in.');
        }

    } catch (error) {
        handleLoginError(error);
    }
}

function handleLoginError(error) {
    const msg = error.message || 'Failed to login';
    switch (msg) {
        case 'EMAIL_NOT_FOUND':
        case 'INVALID_PASSWORD':
            alert('Invalid email or password.');
            break;
        case 'INVALID_EMAIL':
            alert('Invalid email format.');
            break;
        case 'USER_DISABLED':
            alert('User account is disabled.');
            break;
        default:
            alert('Failed to login: ' + msg);
            break;
    }
}

document.getElementById('loginBtn').addEventListener('click', function(event) {
    event.preventDefault();

    if (validation()) {
        loginUser();
    } else {
        const form = document.getElementById('loginForm');
        form.classList.add('was-validated');
    }
});

// Toggle password visibility remains the same
const togglePasswordBtn = document.getElementById('togglePassword');
const passwordField = document.getElementById('user_password');

togglePasswordBtn.addEventListener('click', function() {
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash');
});
