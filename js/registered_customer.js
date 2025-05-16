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

// Function to fetch and display registered customers
function fetchAndDisplayCustomers() {
    const customersTableBody = document.getElementById('customersTableBody');
    // Clear the existing rows
    customersTableBody.innerHTML = '';

    db.collection('users').get().then(snapshot => {
        snapshot.forEach(doc => {
            const customer = doc.data();
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${customer.firstName}</td>
                <td>${customer.lastName}</td>
                <td>${customer.email}</td>
                <td>${customer.phoneNumber}</td>
                <td>${customer.address}</td>
                <td>${customer.postcode}</td>
                <td>${customer.state}</td>
                <td>${customer.city}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="editCustomer('${doc.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCustomer('${doc.id}')">Delete</button>
                </td>
            `;

            customersTableBody.appendChild(row);
        });
    }).catch(error => {
        console.error("Error fetching registered customers: ", error);
    });
}

// Function to edit a customer
function editCustomer(id) {
    db.collection('users').doc(id).get().then(doc => {
        if (doc.exists) {
            const customer = doc.data();
            document.getElementById('editFirstName').value = customer.firstName;
            document.getElementById('editLastName').value = customer.lastName;
            document.getElementById('editEmail').value = customer.email;
            document.getElementById('editPhoneNumber').value = customer.phoneNumber;
            document.getElementById('editAddress').value = customer.address;
            document.getElementById('editPostcode').value = customer.postcode;
            document.getElementById('editState').value = customer.state;
            document.getElementById('editCity').value = customer.city;
            document.getElementById('editCustomerId').value = id;
            
            $('#editCustomerModal').modal('show');
        } else {
            console.error("No such customer!");
        }
    }).catch(error => {
        console.error("Error getting customer:", error);
    });
}

// Function to delete a customer
function deleteCustomer(id) {
    if (confirm("Are you sure you want to delete this customer?")) {
        db.collection('users').doc(id).delete().then(() => {
            console.log("Customer successfully deleted!");
            alert('Customer deleted successfully!');
            // Remove the row from the table
            document.getElementById(id).remove();
        }).catch(error => {
            console.error("Error removing customer: ", error);
            alert('Failed to delete customer!');
        });
    }
}

// Function to handle form submission and update Firestore
document.getElementById('editCustomerForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const id = document.getElementById('editCustomerId').value;
    const updatedCustomer = {
        firstName: document.getElementById('editFirstName').value,
        lastName: document.getElementById('editLastName').value,
        email: document.getElementById('editEmail').value,
        phoneNumber: document.getElementById('editPhoneNumber').value,
        address: document.getElementById('editAddress').value,
        postcode: document.getElementById('editPostcode').value,
        state: document.getElementById('editState').value,
        city: document.getElementById('editCity').value,
    };

    db.collection('users').doc(id).update(updatedCustomer).then(() => {
        console.log("Customer successfully updated!");
        alert('Customer updated successfully!');
        $('#editCustomerModal').modal('hide');
        // Refresh the table or update the row directly
        fetchAndDisplayCustomers();
    }).catch(error => {
        console.error("Error updating customer: ", error);
        alert('Failed to update customer!');
    });
});

// Fetch and display customers when the document is ready
document.addEventListener('DOMContentLoaded', fetchAndDisplayCustomers);










