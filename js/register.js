
const firebaseApiKey = "AIzaSyDCdP64LQYeS4vu3lFH7XtUHOPVJOYCbO8";

// Function to register user with Firebase Auth using REST
async function registerUserWithApi(email, password) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error.message || 'Failed to register user');
  }

  const data = await response.json();

  localStorage.setItem('idToken', data.idToken);  
  return data; 
}

// Function to send email verification
async function sendVerificationEmail(idToken) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${firebaseApiKey}`, {
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

// Function to send user data to your Express backend
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

// Main register function triggered by your form
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
    // Step 1: Register user with Firebase
    const authResponse = await registerUserWithApi(email, password);

    // Step 2: Send email verification
    await sendVerificationEmail(authResponse.idToken);

    // Step 3: Save profile data to your backend
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

    // Step 4: Finalize
    alert('Registration successful! Please verify your email.');
    localStorage.setItem('registeredEmail', email);
    localStorage.setItem('userType', 'user');
    window.location.href = 'Login.html';

  } catch (error) {
    alert(error.message);
  }
}

document.getElementById('registerBtn').addEventListener('click', registerUser);