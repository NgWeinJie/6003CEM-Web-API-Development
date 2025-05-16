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
const storage = firebase.storage();

// Function to fetch product data from Firestore
function fetchProducts() {
    const productList = document.getElementById('productList');
    productList.innerHTML = ''; // Clear existing content

    // Fetch products collection from Firestore
    db.collection('products').orderBy('itemStock', 'asc').get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const product = doc.data();
                const productId = doc.id;
                const row = `
                    <tr class="product-item" id="${productId}">
                        <td><img src="${product.itemImageURL}" alt="${product.itemName}" style="max-width: 100px;"></td>
                        <td class="product-name">${product.itemName}</td>
                        <td>${product.itemPrice}</td>
                        <td>${product.itemStock}</td>
                        <td>${product.itemCategories}</td>
                        <td>${product.itemDetails}</td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="openEditModal('${productId}')">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${productId}')">Delete</button>
                        </td>
                    </tr>
                `;
                productList.innerHTML += row;
            });
            // Call searchProduct() after products are fetched and displayed
            searchProduct();
        })
        .catch(error => {
            console.error('Error fetching products:', error);
        });
}

// Function to open edit modal with product details
function openEditModal(productId) {
    const editProductModal = document.getElementById('editProductModal');
    const modalContent = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="editProductModalLabel">Edit Product</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <!-- Form for editing product details will be dynamically added here -->
                </div>
            </div>
        </div>
    `;
    editProductModal.innerHTML = modalContent;

    // Fetch product details based on productId and populate the modal form
    db.collection('products').doc(productId).get()
        .then(doc => {
            if (doc.exists) {
                const product = doc.data();
                const modalBody = `
                    <form id="editProductForm">
                        <div class="form-group">
                            <label for="editItemImage">Image</label>
                            <input type="file" class="form-control-file" id="editItemImage">
                            <img src="${product.itemImageURL}" alt="${product.itemName}" id="currentItemImage" class="mt-2" style="max-width: 100px;">
                        </div>
                        <div class="form-group">
                            <label for="editItemName">Name</label>
                            <input type="text" class="form-control" id="editItemName" value="${product.itemName}" required>
                        </div>
                        <div class="form-group">
                            <label for="editItemPrice">Price</label>
                            <input type="number" class="form-control" id="editItemPrice" value="${+product.itemPrice}" required>
                        </div>
                        <div class="form-group">
                            <label for="editItemStock">Stock</label>
                            <input type="number" class="form-control" id="editItemStock" value="${product.itemStock}" required>
                        </div>
                        <div class="form-group">
                            <label for="editItemCategories">Categories</label>
                            <input type="text" class="form-control" id="editItemCategories" value="${product.itemCategories}" required>
                        </div>
                        <div class="form-group">
                            <label for="editItemDetails">Details</label>
                            <textarea class="form-control" id="editItemDetails" rows="3" required>${product.itemDetails}</textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Update</button>
                    </form>
                `;
                const modalBodyElement = editProductModal.querySelector('.modal-body');
                modalBodyElement.innerHTML = modalBody;

                // Add event listener for form submission
                document.getElementById('editProductForm').addEventListener('submit', function(event) {
                    event.preventDefault();
                    const updatedDetails = {
                        itemName: document.getElementById('editItemName').value,
                        itemPrice: document.getElementById('editItemPrice').value,
                        itemStock: document.getElementById('editItemStock').value,
                        itemCategories: document.getElementById('editItemCategories').value,
                        itemDetails: document.getElementById('editItemDetails').value
                    };

                    // Check if a new image is uploaded
                    const imageFile = document.getElementById('editItemImage').files[0];
                    if (imageFile) {
                        // Upload new image to Firebase Storage
                        const storageRef = storage.ref('product_images/' + imageFile.name);
                        storageRef.put(imageFile).then(snapshot => {
                            snapshot.ref.getDownloadURL().then(downloadURL => {
                                updatedDetails.itemImageURL = downloadURL;
                                // Update Firestore document with new image URL
                                db.collection('products').doc(productId).update(updatedDetails)
                                    .then(() => {
                                        $('#editProductModal').modal('hide');
                                        fetchProducts();
                                        window.alert('Product edit successfully!');
                                    })
                                    .catch(error => {
                                        console.error('Error updating product:', error);
                                    });
                            });
                        }).catch(error => {
                            console.error('Error uploading image:', error);
                        });
                    } else {
                        // Update Firestore document without new image URL
                        db.collection('products').doc(productId).update(updatedDetails)
                            .then(() => {
                                $('#editProductModal').modal('hide');
                                fetchProducts();
                                window.alert('Product edit successfully!');
                            })
                            .catch(error => {
                                console.error('Error updating product:', error);
                            });
                    }
                });
            } else {
                console.error('No such document!');
            }
        })
        .catch(error => {
            console.error('Error getting document:', error);
        });

    // Show the modal
    $('#editProductModal').modal('show');
}

// Function to delete a product
function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        db.collection('products').doc(productId).delete()
            .then(() => {
                fetchProducts();
                window.alert('Product successfully deleted!');
            })
            .catch(error => {
                console.error('Error removing product:', error);
            });
    }
}

// Function to search products by name
function searchProduct() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const productItems = document.querySelectorAll('.product-item');

    productItems.forEach(item => {
        const productName = item.querySelector('.product-name').textContent.toLowerCase();
        if (productName.includes(searchInput)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// Event listener for search input
document.getElementById('searchInput').addEventListener('input', searchProduct);

// Initial fetch of products
fetchProducts();
