
const ApiKey = "AIzaSyBHl8xfPt6Mql2_9nDrJV7A-QsVyGOiZew";

async function registerUserWithApi(email, password) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${ApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message || 'Failed to register user');
  }

  return response.json(); // Returns idToken, localId.
}

// Function to send email verification
async function sendVerificationEmail(idToken) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${ApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestType: "VERIFY_EMAIL",
      idToken
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message || 'Failed to send verification email');
  }

  return response.json();
}

// Function to send user data to Express backend
async function saveUserDataToServer(userData) {
  const response = await fetch('http://localhost:3000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save user data to server');
  }

  return response.json();
}

// Main register function triggered by form
async function registerUser() {
  const firstName = document.getElementById('user_fullname').value;
  const lastName = document.getElementById('user_lastname').value;
  const email = document.getElementById('user_email').value;
  const password = document.getElementById('user_password').value;
  const address = document.getElementById('user_address').value;
  const phoneNumber = document.getElementById('user_phoneNo').value;
  const postcode = document.getElementById('user_postcode').value;
  const city = document.getElementById('user_city').value;
  const state = document.getElementById('user_state').value;

  try {
    // Register user with Firebase
    const authResponse = await registerUserWithApi(email, password);

    // Send email verification
    await sendVerificationEmail(authResponse.idToken);

    // Save profile data to backend
    const userData = {
      uid: authResponse.localId,
      email,
      firstName,
      lastName,
      address,
      phoneNumber,
      postcode,
      city,
      state
    };

    await saveUserDataToServer(userData);

    alert('Registration successful! Please verify your email.');
    localStorage.setItem('registeredEmail', email);
    localStorage.setItem('userType', 'user');
    window.location.href = 'Login.html';

  } catch (error) {
    alert(error.message);
  }
}

document.getElementById('registerBtn').addEventListener('click', registerUser);