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

// Get a reference to the storage service, which is used to create references in your storage bucket
const storage = firebase.storage();

// Get a reference to Firestore database
const db = firebase.firestore();

// Function to handle form submission
document.getElementById('addItemForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission behavior
    
    // Get form values
    const itemName = document.getElementById('itemName').value.trim();
    const itemPrice = document.getElementById('itemPrice').value.trim();
    const itemStock = document.getElementById('itemStock').value.trim();
    const itemCategories = document.getElementById('itemCategories').value.trim();
    const itemDetails = document.getElementById('itemDetails').value.trim();
    const itemImage = document.getElementById('itemImage').files[0];

    // Check if an image is selected
    if (!itemImage) {
        alert('Please select an image file.');
        return;
    }

    // Upload image to Firebase Storage
    const storageRef = storage.ref();
    const imageRef = storageRef.child('item_images/' + itemImage.name);
    imageRef.put(itemImage)
        .then((snapshot) => {
            console.log('Image uploaded successfully');
            // Get the download URL for the image
            return snapshot.ref.getDownloadURL();
        })
        .then((downloadURL) => {
            // Save item details and image URL to Firestore
            return db.collection('products').add({
                itemName: itemName,
                itemPrice: itemPrice,
                itemStock: parseInt(itemStock),
                itemCategories: itemCategories,
                itemImageURL: downloadURL,
                itemDetails: itemDetails
            });
        })
        .then((docRef) => {
            // Get the auto-generated ID from the added document
            const itemId = docRef.id;
            // Save the generated ID inside Firestore as a field
            return docRef.update({
                itemId: itemId
            });
        })
        .then(() => {
            // Reset form after successful submission
            document.getElementById('addItemForm').reset();
            alert('Item added successfully!');
        })
        .catch((error) => {
            console.error('Error uploading image:', error);
            alert('Failed to add item. Please try again later.');
        });
});
