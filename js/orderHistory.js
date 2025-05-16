document.addEventListener('DOMContentLoaded', () => {
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
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    const fetchProductData = (itemName) => {
        return db.collection('products').where('itemName', '==', itemName).get()
            .then(querySnapshot => {
                if (!querySnapshot.empty) {
                    const productDoc = querySnapshot.docs[0];
                    return {
                        id: productDoc.id,
                        ...productDoc.data()
                    };
                } else {
                    console.error(`No product found with name: ${itemName}`);
                    return null;
                }
            })
            .catch(error => {
                console.error('Error fetching product data:', error);
                return null;
            });
    };

    const fetchOrderHistory = (userId) => {
        db.collection('orders').where('userId', '==', userId).orderBy('timestamp', 'desc').get()
            .then(querySnapshot => {
                const orderHistoryContainer = document.getElementById('orderHistory');
                orderHistoryContainer.innerHTML = '';

                querySnapshot.forEach(doc => {
                    const order = doc.data();
                    const orderCard = document.createElement('div');
                    orderCard.classList.add('card', 'order-card');
                    orderCard.innerHTML = `
                        <div class="card-body">
                            <h5 class="card-title">Order ID: ${doc.id}</h5>
                            <p class="card-text"><strong>Name:</strong> ${order.userName}</p>
                            <p class="card-text"><strong>Phone:</strong> ${order.userPhone}</p>
                            <p class="card-text"><strong>Address:</strong> ${order.userAddress}, ${order.userCity}, ${order.userState}, ${order.userPostcode}</p>
                            <p class="card-text"><strong>Remark:</strong> ${order.userRemark}</p>
                            <p class="card-text"><strong>Date:</strong> ${order.timestamp.toDate().toLocaleString()}</p>
                            <p class="card-text"><strong>Status:</strong> <span class="text-success font-weight-bold">${order.status}</span></p>
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
                                    <tbody>
                                    </tbody>
                                </table>
                                ${order.promoCode ? `<p class="card-text text-right"><strong>Promo Code:</strong> ${order.promoCode}</p>` : ''}
                                ${order.discount ? `<p class="card-text text-right"><strong>Promo Code Discount:</strong> -RM ${order.discount}</p>` : ''}
                                ${order.coinsDiscount ? `<p class="card-text text-right"><strong>Redeem Coins Discount:</strong> -RM ${order.coinsDiscount.toFixed(2)}</p>` : ''}
                                <p class="card-text text-right"><strong>Shipping Fee:</strong> RM ${order.shippingFee}</p>
                                <p class="card-text text-right"><strong>Total Amount:</strong> RM ${order.totalAmount.toFixed(2)}</p>
                                <button class="btn btn-primary reorder-all-button" data-order-id="${doc.id}">Reorder All Items</button>
                            </div>
                        </div>
                    `;
                    orderHistoryContainer.appendChild(orderCard);

                    const cartItemsTableBody = document.querySelector(`#cart-items-${doc.id} tbody`);
                    order.cartItems.forEach(async (item) => {
                        const productData = await fetchProductData(item.productName);
                        const cartItemRow = document.createElement('tr');
                        const productImageUrl = productData ? productData.itemImageURL : 'https://via.placeholder.com/50';
                        cartItemRow.innerHTML = `
                            <td><img src="${productImageUrl}" alt="${item.productName}" class="product-image img-fluid"></td>
                            <td>${item.productName}</td>
                            <td>${item.productQuantity}</td>
                            <td>RM ${item.productPrice.toFixed(2)}</td>
                            <td>RM ${(item.productPrice * item.productQuantity).toFixed(2)}</td>
                        `;
                        cartItemsTableBody.appendChild(cartItemRow);
                    });

                    const reorderButton = orderCard.querySelector('.reorder-all-button');
                    reorderButton.addEventListener('click', async (event) => {
                        const orderId = event.target.getAttribute('data-order-id');
                        const orderDoc = await db.collection('orders').doc(orderId).get();
                        const orderData = orderDoc.data();

                        for (let item of orderData.cartItems) {
                            addToCart({
                                userId,
                                productName: item.productName,
                                productPrice: item.productPrice,
                                productQuantity: item.productQuantity
                            });
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching order history:', error);
                if (error.code === 'failed-precondition' && error.message.includes('requires an index')) {
                    const url = error.message.match(/https:\/\/console\.firebase\.google\.com\/[^\s]+/)[0];
                    alert(`The query requires an index. You can create it here: ${url}`);
                } else {
                    alert('Failed to fetch order history. Please try again later.');
                }
            });
    };

    function addToCart(cartItem) {
        const {
            userId,
            productName,
            productPrice,
            productQuantity
        } = cartItem;

        // Retrieve product data from the products collection
        db.collection('products').where('itemName', '==', productName).get()
            .then(querySnapshot => {
                if (!querySnapshot.empty) {
                    const productData = querySnapshot.docs[0].data();
                    const { itemStock, itemImageURL } = productData;

                    // Save cart item to the cart collection
                    db.collection('cart').add({
                        userId,
                        productName,
                        productPrice,
                        productQuantity,
                        productStock: itemStock,
                        productImageURL: itemImageURL
                    })
                    .then(() => {
                        console.log('Item added to cart successfully');
                        alert('Item reordered successfully!');
                    })
                    .catch((error) => {
                        console.error('Error adding item to cart: ', error);
                        alert('Failed to reorder item. Please try again later.');
                    });
                } else {
                    console.error(`No product found with name: ${productName}`);
                    alert('Failed to reorder item. Product not found.');
                }
            })
            .catch(error => {
                console.error('Error fetching product data:', error);
                alert('Failed to reorder item. Please try again later.');
            });
    }

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            fetchOrderHistory(user.uid);
        } else {
            alert('Please log in to view your order history.');
            window.location.href = 'login.html';
        }
    });
});
