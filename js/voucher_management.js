// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDCdP64LQYeS4vu3lFH7XtUHOPVJOYCbO8",
    authDomain: "enterprise-project-3448b.firebaseapp.com",
    projectId: "enterprise-project-3448b",
    storageBucket: "enterprise-project-3448b.appspot.com",
    messagingSenderId: "1042464271522",
    appId: "1:1042464271522:web:1d1a3ffadf6830b5767bfb",
    measurementId: "G-3S19G51X7T"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

// Function to render vouchers
const renderVouchers = () => {
    db.collection('vouchers').get().then((querySnapshot) => {
        const voucherTableBody = document.getElementById('voucherTableBody');
        if (voucherTableBody) {
            voucherTableBody.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const voucher = doc.data();
                const row = `
                    <tr>
                        <td><img src="${voucher.image}" alt="${voucher.name}" style="width: 100px;"></td>
                        <td>${voucher.name}</td>
                        <td>${voucher.stocks}</td>
                        <td>${voucher.cost}</td>
                        <td>${voucher.whereToUse}</td>
                        <td>${voucher.termsConditions}</td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="editVoucher('${doc.id}')">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteVoucher('${doc.id}')">Delete</button>
                        </td>
                    </tr>
                `;
                voucherTableBody.insertAdjacentHTML('beforeend', row);
            });
        } else {
            console.error('Element with ID "voucherTableBody" not found.');
        }
    }).catch((error) => {
        console.error('Error getting vouchers:', error);
    });
};

// Function to edit voucher (show modal with data)
const editVoucher = (voucherId) => {
    db.collection('vouchers').doc(voucherId).get().then((doc) => {
        if (doc.exists) {
            const voucher = doc.data();
            document.getElementById('editVoucherId').value = voucherId;
            document.getElementById('editVoucherName').value = voucher.name;
            document.getElementById('editStocks').value = voucher.stocks;
            document.getElementById('editCost').value = voucher.cost;
            document.getElementById('editWhereToUse').value = voucher.whereToUse;
            document.getElementById('editTermsConditions').value = voucher.termsConditions;
            
            // Display current image
            const editVoucherImage = document.getElementById('editVoucherImage');
            editVoucherImage.src = voucher.image;
            editVoucherImage.alt = voucher.name;
            
            // Store current image URL in hidden input
            document.getElementById('currentImageUrl').value = voucher.image;

            // Show the modal
            $('#editVoucherModal').modal('show');
        } else {
            console.log('No such document!');
        }
    }).catch((error) => {
        console.error('Error getting voucher data:', error);
    });
};

// Handle edit voucher form submission
document.getElementById('editVoucherForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const voucherId = document.getElementById('editVoucherId').value;
    const voucherData = {
        name: document.getElementById('editVoucherName').value,
        stocks: document.getElementById('editStocks').value,
        cost: document.getElementById('editCost').value,
        whereToUse: document.getElementById('editWhereToUse').value,
        termsConditions: document.getElementById('editTermsConditions').value
    };

    // Check if there's a new image selected
    const editNewVoucherImage = document.getElementById('editNewVoucherImage').files[0];
    if (editNewVoucherImage) {
        const storageRef = storage.ref();
        const voucherImageRef = storageRef.child(`vouchers/${editNewVoucherImage.name}`);
        await voucherImageRef.put(editNewVoucherImage);
        voucherData.image = await voucherImageRef.getDownloadURL();
    } else {
        // Use the current image URL if no new image selected
        voucherData.image = document.getElementById('currentImageUrl').value;
    }

    // Update existing voucher
    db.collection('vouchers').doc(voucherId).update(voucherData).then(() => {
        console.log('Voucher successfully updated!');
        $('#editVoucherModal').modal('hide'); // Hide the modal
        renderVouchers(); // Refresh the vouchers list
        alert('Voucher successfully updated!');
    }).catch((error) => {
        console.error('Error updating voucher: ', error);
        alert('Error updating voucher: ' + error.message);
    });
});


// Function to delete voucher
const deleteVoucher = (voucherId) => {
    if (confirm("Are you sure you want to delete this voucher?")) {
        db.collection('vouchers').doc(voucherId).delete().then(() => {
            console.log('Voucher successfully deleted!');
            alert('Voucher successfully deleted!');
            renderVouchers(); // Refresh the vouchers list
        }).catch((error) => {
            console.error('Error removing voucher: ', error);
            alert('Error deleting voucher: ' + error.message);
        });
    }
};

// Handle form submission for adding new voucher
document.getElementById('voucherForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const voucherName = document.getElementById('voucherName').value;
    const stocks = document.getElementById('stocks').value;
    const cost = document.getElementById('cost').value;
    const whereToUse = document.getElementById('whereToUse').value;
    const termsConditions = document.getElementById('termsConditions').value;
    const voucherImageFile = document.getElementById('voucherImage').files[0];

    let imageUrl = '';

    if (voucherImageFile) {
        const storageRef = storage.ref();
        const voucherImageRef = storageRef.child(`vouchers/${voucherImageFile.name}`);
        await voucherImageRef.put(voucherImageFile);
        imageUrl = await voucherImageRef.getDownloadURL();
    }

    const voucherData = {
        name: voucherName,
        stocks: stocks,
        cost: cost,
        whereToUse: whereToUse,
        termsConditions: termsConditions,
        image: imageUrl
    };

    // Add new voucher
    db.collection('vouchers').add(voucherData).then(() => {
        console.log('Voucher successfully added!');
        renderVouchers(); // Refresh the vouchers list
        document.getElementById('voucherForm').reset(); // Clear form fields
        alert('Voucher successfully added!');
    }).catch((error) => {
        console.error('Error adding voucher: ', error);
        alert('Error adding voucher: ' + error.message);
    });
});

// Check if user is authenticated and fetch user data and vouchers
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        renderVouchers();
    } else {
        // User is signed out
        console.log('User is not logged in.');
    }
});