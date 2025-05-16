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

// Get a reference to Firestore database
const db = firebase.firestore();

// Add an event listener for the contact form submission
document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault();  // Prevent the default form submission

    // Get user input values from the form
    const userName = document.getElementById('userName').value;
    const userEmail = document.getElementById('userEmail').value;
    const userMessage = document.getElementById('userMessage').value;

    // Check if a user is logged in
    const user = firebase.auth().currentUser;
    if (user) {
        // Save the data to the Firestore collection "messages"
        db.collection('messages').add({
            uid: user.uid,  // Save the user's UID
            name: userName,
            email: userEmail,
            message: userMessage,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()  // Add a timestamp
        }).then(() => {
            alert('Message sent successfully!');
            // Optionally, clear the form
            document.getElementById('contactForm').reset();
        }).catch(error => {
            console.error('Error writing document: ', error);
            alert('Error sending message. Please try again.');
        });
    } else {
        alert('Please log in to send a message.');
    }
});

// Listen for changes in user authentication state
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        fetchCartItems(user);
        fetchUserDetails(user.uid);  // Fetch and display user details
    } else {
        alert('Please log in to proceed with payment.');
    }
});



