
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

// Function to fetch messages and display them
function fetchMessages() {
    db.collection('messages').orderBy('timestamp', 'desc').get()
        .then(querySnapshot => {
            const messagesContainer = document.getElementById('messagesContainer');
            messagesContainer.innerHTML = '';

            querySnapshot.forEach(doc => {
                const messageData = doc.data();
                const messageElement = document.createElement('div');
                messageElement.classList.add('card', 'mb-3');
                messageElement.innerHTML = `
                    <div class="card-header">
                        <strong>${messageData.name}</strong> <em>${messageData.email}</em>
                        <span class="float-right">${new Date(messageData.timestamp.seconds * 1000).toLocaleString()}</span>
                    </div>
                    <div class="card-body">
                        <p class="card-text">${messageData.message}</p>
                    </div>
                `;
                messagesContainer.appendChild(messageElement);
            });
        })
        .catch(error => {
            console.error('Error fetching messages: ', error);
        });
}

// Fetch messages when the page loads
document.addEventListener('DOMContentLoaded', fetchMessages);
