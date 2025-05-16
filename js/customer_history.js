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

// Function to fetch and display registered customers sorted by status and date/time
function fetchAndDisplayCustomers() {
    const customersTableBody = document.getElementById('customersTableBody');
    // Clear the existing rows
    customersTableBody.innerHTML = '';

    db.collection('orders')
        .get()
        .then(snapshot => {
            const orders = [];
            snapshot.forEach(doc => {
                const order = doc.data();
                order.id = doc.id; // Store the document ID in the order object
                if (order.timestamp && order.timestamp.toDate) {
                    orders.push(order);
                } else {
                    console.warn(`Order ${doc.id} does not have a valid timestamp`);
                }
            });

            // Sort orders by status and date/time
            orders.sort((a, b) => {
                const statusOrder = ['Order Received', 'Preparing', 'Shipped', 'Out for Delivery', 'Delivered'];
                const statusComparison = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
                if (statusComparison !== 0) {
                    return statusComparison;
                }
                return a.timestamp.toDate() - b.timestamp.toDate();
            });

            // Display sorted orders
            orders.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.userName}</td>
                    <td>${order.id}</td>
                    <td>${order.timestamp.toDate().toLocaleString()}</td>
                    <td>
                        <select class="form-control" onchange="updateOrderStatus('${order.id}', this.value)">
                            <option value="Order Received" ${order.status === 'Order Received' ? 'selected' : ''}>Order Received</option>
                            <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                            <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="Out for Delivery" ${order.status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                            <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        </select>
                    </td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="viewCustomerHistory('${order.id}')">View</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteOrder('${order.id}')">Delete</button>
                    </td>
                `;
                customersTableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error("Error fetching registered customers: ", error);
        });
}


// Function to update order status
function updateOrderStatus(orderId, newStatus) {
    db.collection('orders').doc(orderId).update({
        status: newStatus
    }).then(() => {
        console.log("Order status successfully updated!");
        alert("Order status successfully updated.");
        // Adding a slight delay before refreshing the page
        setTimeout(() => {
            location.reload();
        }, 100);
    }).catch(error => {
        console.error("Error updating order status: ", error);
        alert("Failed to update order status. Please try again later.");
    });
}

// Function to delete an order
function deleteOrder(orderId) {
    if (confirm("Are you sure you want to delete this order?")) {
        db.collection('orders').doc(orderId).delete().then(() => {
            console.log("Order successfully deleted!");
            alert("Order successfully deleted.");
            // After deletion, fetch and display customers again to reflect the changes
            fetchAndDisplayCustomers();
        }).catch(error => {
            console.error("Error deleting order: ", error);
            alert("Failed to delete order. Please try again later.");
        });
    }
}

// Function to fetch product image URL by item name
const fetchProductImage = (itemName) => {
    return db.collection('products').where('itemName', '==', itemName).get()
        .then(querySnapshot => {
            if (!querySnapshot.empty) {
                const productDoc = querySnapshot.docs[0];
                return productDoc.data().itemImageURL;
            } else {
                return 'https://via.placeholder.com/50';  // Fallback image URL if product not found
            }
        })
        .catch(error => {
            console.error('Error fetching product image:', error);
            return 'https://via.placeholder.com/50';  // Fallback image URL in case of error
        });
};

// Function to fetch and display order history using doc.id
const fetchOrderHistory = (docId) => {
    return db.collection('orders').doc(docId).get()
        .then(doc => {
            if (!doc.exists) {
                throw new Error('No such document!');
            }
            const order = doc.data();
            const orderHistoryContainer = document.getElementById('orderHistory');
            orderHistoryContainer.innerHTML = '';

            // Create the order card with conditional fields
            const orderCard = document.createElement('div');
            orderCard.classList.add('card', 'order-card');

            // Order card HTML
            let orderCardHTML = `
                <div class="card-body">
                    <h5 class="card-title">Order ID: ${doc.id}</h5>
                    <p class="card-text"><strong>Name:</strong> ${order.userName}</p>
                    <p class="card-text"><strong>Phone:</strong> ${order.userPhone}</p>
                    <p class="card-text"><strong>Address:</strong> ${order.userAddress}, ${order.userCity}, ${order.userState}, ${order.userPostcode}</p>
                    <p class="card-text"><strong>Remark:</strong> ${order.userRemark}</p>
                    <p class="card-text"><strong>Date:</strong> ${order.timestamp.toDate().toLocaleString()}</p>
                    <p class="card-text"><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
                    <h6 class="mt-3"><strong>Cart Items:</strong></h6>
                    <div id="cart-items-${doc.id}" class="cart-items-container table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            `;

            // Add Promo Code if available
            if (order.promoCode) {
                orderCardHTML += `<p class="card-text text-right"><strong>Promo Code:</strong> ${order.promoCode}</p>`;
            }

            // Add Promo Code Discount if greater than 0
            if (order.discount > 0) {
                orderCardHTML += `<p class="card-text text-right"><strong>Promo Code Discount:</strong> -RM ${order.discount.toFixed(2)}</p>`;
            }

            // Add Redeem Coins Discount if greater than 0
            if (order.coinsDiscount > 0) {
                orderCardHTML += `<p class="card-text text-right"><strong>Redeem Coins Discount:</strong> -RM ${order.coinsDiscount.toFixed(2)}</p>`;
            }

            // Add Shipping Fee and Total Amount
            orderCardHTML += `
                <p class="card-text text-right"><strong>Shipping Fee:</strong> RM ${order.shippingFee}</p>
                <p class="card-text text-right"><strong>Total Amount:</strong> RM ${order.totalAmount.toFixed(2)}</p>
            `;

            // Set the inner HTML of the order card
            orderCard.innerHTML = orderCardHTML;

            // Append the order card to the container
            orderHistoryContainer.appendChild(orderCard);

            // Fetch and display cart items
            const cartItemsTableBody = document.querySelector(`#cart-items-${doc.id} tbody`);
            order.cartItems.forEach(async (item) => {
                const productImageUrl = await fetchProductImage(item.productName);
                const cartItemRow = document.createElement('tr');
                cartItemRow.innerHTML = `
                    <td><img src="${productImageUrl}" alt="${item.productName}" class="product-image img-fluid"></td>
                    <td>${item.productName}</td>
                    <td>${item.productQuantity}</td>
                    <td>RM ${item.productPrice.toFixed(2)}</td>
                    <td>RM ${(item.productPrice * item.productQuantity).toFixed(2)}</td>
                `;
                cartItemsTableBody.appendChild(cartItemRow);
            });
        })
        .catch(error => {
            console.error('Error fetching order history:', error);
            alert('Failed to fetch order history. Please try again later.');
        });
};


// Function to view customer history using doc.id
function viewCustomerHistory(docId) {
    fetchOrderHistory(docId).then(() => {
        $('#viewCustomerHistoryModal').modal('show');
    }).catch(error => {
        console.error("Error fetching customer history: ", error);
    });
}

// Fetch and display customers when the document is ready
document.addEventListener('DOMContentLoaded', fetchAndDisplayCustomers);
