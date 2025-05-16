// Assuming you already have Firebase initialized and user authenticated
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

// Function to fetch user data from Firestore
const fetchUserData = (userId) => {
    firebase.firestore().collection('users').doc(userId).get()
    .then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            // Display user data on the profile page
            displayUserData(userData);
            // Display user data in the edit profile modal form
            displayUserDetailsInForm(userData);
            // Display coins balance
            displayCoinsBalance(userData.points || 0); 
        } else {
            console.log('No such document!');
        }
    })
    .catch((error) => {
        console.error('Error getting user data:', error);
    });
};

// Function to display user data on the modal form
const displayUserDetailsInForm = (userData) => {
    document.getElementById('emailModal').value = userData.email;
    document.getElementById('addressModal').value = userData.address;
    document.getElementById('phoneModal').value = userData.phoneNumber;
    document.getElementById('postcodeModal').value = userData.postcode;
    document.getElementById('cityModal').value = userData.city;
    document.getElementById('stateModal').value = userData.state;
};

// Function to display user data on the profile page
const displayUserData = (userData) => {
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    const userAddressElement = document.getElementById('userAddress');
    const userPhoneElement = document.getElementById('userPhone');
    const userPostcodeElement = document.getElementById('userPostcode');
    const userCityElement = document.getElementById('userCity');
    const userStateElement = document.getElementById('userState');
    const coinsBalanceElement = document.getElementById('coinsBalance');

    if (userNameElement && userEmailElement && userAddressElement &&
        userPhoneElement && userPostcodeElement && userCityElement &&
        userStateElement && coinsBalanceElement) {
        
        userNameElement.textContent = `${userData.firstName} ${userData.lastName}`;
        userEmailElement.textContent = userData.email;
        userAddressElement.textContent = userData.address;
        userPhoneElement.textContent = userData.phoneNumber;
        userPostcodeElement.textContent = userData.postcode;
        userCityElement.textContent = userData.city;
        userStateElement.textContent = userData.state;
        coinsBalanceElement.textContent = `${userData.points || 0}`;
    }
};

// Function to update user data in Firestore
const updateUserProfile = (userId, newData) => {
    firebase.firestore().collection('users').doc(userId).update(newData)
    .then(() => {
        console.log('User data updated successfully');
        // Fetch and display updated user data
        fetchUserData(userId);
        // Close the edit profile modal
        $('#editProfileModal').modal('hide');
    })
    .catch((error) => {
        console.error('Error updating user data:', error);
    });
};

// Event listener for form submission
document.getElementById('editProfileFormModal').addEventListener('submit', (event) => {
    event.preventDefault(); // Prevent the default form submission

    // Get the user ID
    const user = firebase.auth().currentUser;
    const userId = user.uid;

    // Get the new data from the form
    const newData = {
        email: document.getElementById('emailModal').value,
        address: document.getElementById('addressModal').value,
        phoneNumber: document.getElementById('phoneModal').value,
        postcode: document.getElementById('postcodeModal').value,
        city: document.getElementById('cityModal').value,
        state: document.getElementById('stateModal').value
    };

    // Update the user profile with the new data
    updateUserProfile(userId, newData);
});

// Check if user is authenticated and fetch user data
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        const userId = user.uid;

        // Retrieve user data from Firestore
        fetchUserData(userId);
    } else {
        // User is signed out
        console.log('User is not logged in.');
    }
});
