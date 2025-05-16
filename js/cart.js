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

// Define tableBody as a global variable
let tableBody;

// Function to fetch cart items from Firestore
function fetchCartItems(currentUser) {
    if (!currentUser) {
        console.error('Current user is not defined.');
        alert('Please log in to view your cart.');
        return;
    }

    const cartItemsContainer = document.getElementById('cartItems');
    cartItemsContainer.innerHTML = '';

    const table = document.createElement('table');
    table.classList.add('table', 'table-bordered');

    const tableHeader = document.createElement('thead');
    tableHeader.innerHTML = `
        <tr>
            <th>No</th>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Quantity</th>
        </tr>
    `;
    table.appendChild(tableHeader);

    tableBody = document.createElement('tbody');

    let totalPrice = 0;

    db.collection('cart').where('userId', '==', currentUser.uid).get()
        .then((querySnapshot) => {
            let counter = 1;
            querySnapshot.forEach((doc) => {
                const cartItem = doc.data();

                const row = document.createElement('tr');

                const numberCell = document.createElement('td');
                numberCell.textContent = counter++;
                row.appendChild(numberCell);

                const imageCell = document.createElement('td');
                const image = document.createElement('img');
                image.src = cartItem.productImageURL;
                image.alt = cartItem.productName;
                image.style.width = '120px';
                image.style.height = '120px';
                imageCell.appendChild(image);
                row.appendChild(imageCell);

                const nameCell = document.createElement('td');
                nameCell.textContent = cartItem.productName;
                row.appendChild(nameCell);

                const priceCell = document.createElement('td');
                const productPrice = cartItem.productPrice ? cartItem.productPrice : 0;
                const formattedPrice = 'RM ' + productPrice.toFixed(2);
                priceCell.textContent = formattedPrice;
                row.appendChild(priceCell);

                const quantityCell = document.createElement('td');
                const minusButton = document.createElement('button');
                minusButton.textContent = '-';
                minusButton.classList.add('btn', 'btn-danger', 'mr-1');
                const quantityInput = document.createElement('input');
                quantityInput.type = 'number';
                quantityInput.value = cartItem.productQuantity;
                quantityInput.classList.add('form-control', 'd-inline-block', 'w-25', 'text-center');
                quantityInput.setAttribute('max', cartItem.productStock);
                const plusButton = document.createElement('button');
                plusButton.textContent = '+';
                plusButton.classList.add('btn', 'btn-success', 'ml-1');

                quantityInput.addEventListener('input', () => {
                    let enteredValue = parseInt(quantityInput.value);
                    if (enteredValue < 0) {
                        quantityInput.value = 0;
                    }
                    if (enteredValue > cartItem.productStock) {
                        quantityInput.value = cartItem.productStock;
                    }
                    updateTotalPrice();
                    updateCartItemQuantity(doc.id, quantityInput.value);
                });

                minusButton.addEventListener('click', () => {
                    if (parseInt(quantityInput.value) > 1) {
                        quantityInput.value = parseInt(quantityInput.value) - 1;
                        updateTotalPrice();
                        updateCartItemQuantity(doc.id, quantityInput.value);
                    } else {
                        db.collection('cart').doc(doc.id).delete()
                            .then(() => {
                                row.remove();
                                alert('Item deleted successfully!');
                                updateTotalPrice();
                                renumberProducts();
                            })
                            .catch((error) => {
                                alert('Failed to delete item. Please try again later.');
                                console.error('Error removing document: ', error);
                            });
                    }
                });

                plusButton.addEventListener('click', () => {
                    if (parseInt(quantityInput.value) < cartItem.productStock) {
                        quantityInput.value = parseInt(quantityInput.value) + 1;
                        updateTotalPrice();
                        updateCartItemQuantity(doc.id, quantityInput.value);
                    }
                });

                quantityCell.appendChild(minusButton);
                quantityCell.appendChild(quantityInput);
                quantityCell.appendChild(plusButton);
                row.appendChild(quantityCell);

                totalPrice += productPrice * parseInt(quantityInput.value);

                const deleteCell = document.createElement('td');
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.classList.add('btn', 'btn-danger');

                deleteButton.addEventListener('click', () => {
                    db.collection('cart').doc(doc.id).delete()
                        .then(() => {
                            row.remove();
                            alert('Item deleted successfully!');
                            updateTotalPrice();
                            renumberProducts();
                        })
                        .catch((error) => {
                            alert('Failed to delete item. Please try again later.');
                            console.error('Error removing document: ', error);
                        });
                });
                deleteCell.appendChild(deleteButton);
                row.appendChild(deleteCell);

                tableBody.appendChild(row);
            });

            table.appendChild(tableBody);
            cartItemsContainer.appendChild(table);

            updateTotalPrice();

            const proceedToPaymentBtn = document.getElementById('proceedToPaymentBtn');
            proceedToPaymentBtn.addEventListener('click', function() {
                const promoCode = document.getElementById('promoCode').value;
                const currentDate = new Date();
                const totalPriceElement = document.getElementById('totalPrice');
                const totalPrice = parseFloat(totalPriceElement.textContent.replace('RM ', ''));

                if (promoCode.trim() !== '') {
                    if (promoCodes[promoCode] && currentDate >= promoCodes[promoCode].startDate && currentDate <= promoCodes[promoCode].endDate) {
                        const { discount, minPurchase } = promoCodes[promoCode];
                        if (totalPrice >= minPurchase) {
                            const newTotal = totalPrice - discount;
                            alert(`Promo code applied successfully! You have received a discount of RM ${discount}. Your new total is RM ${newTotal.toFixed(2)}.`);
                            window.location.href = `payment.html?discount=${discount}&total=${newTotal.toFixed(2)}&promoCode=${promoCode}`;
                        } else {
                            alert(`The minimum purchase amount for this promo code is RM ${minPurchase}.`);
                        }
                    } else {
                        alert('Invalid or expired promo code.');
                    }
                } else {
                    window.location.href = `payment.html?total=${totalPrice.toFixed(2)}`;
                }
            });
        })
        .catch((error) => {
            console.error('Error fetching cart items:', error);
            alert('Failed to fetch cart items. Please try again later.');
        });
}

// Function to update the quantity of a cart item in Firestore
function updateCartItemQuantity(cartItemId, newQuantity) {
    db.collection('cart').doc(cartItemId).update({
        productQuantity: newQuantity
    })
    .then(() => {
        console.log('Cart item quantity updated successfully!');
    })
    .catch((error) => {
        console.error('Error updating cart item quantity: ', error);
    });
}

// Function to update total price
function updateTotalPrice() {
    let totalPrice = 0;
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const productPrice = parseFloat(row.querySelector('td:nth-child(4)').textContent.replace('RM ', ''));
        const quantity = parseInt(row.querySelector('td:nth-child(5) input').value);
        totalPrice += productPrice * quantity;
    });
    const totalPriceElement = document.getElementById('totalPrice');
    totalPriceElement.textContent = 'RM ' + totalPrice.toFixed(2);
}

// Function to renumber the products after deletion
function renumberProducts() {
    const rows = tableBody.querySelectorAll('tr');
    let counter = 1;
    rows.forEach(row => {
        row.querySelector('td:nth-child(1)').textContent = counter++;
    });
}

// Function to fetch promo codes from Firestore
function fetchPromoCodes() {
    return db.collection('promotion').get()
        .then((querySnapshot) => {
            const promoCodes = {};
            querySnapshot.forEach((doc) => {
                const promo = doc.data();
                promoCodes[promo.code] = {
                    discount: promo.discount,
                    minPurchase: promo.minPurchase,
                    startDate: promo.startDate.toDate(),
                    endDate: promo.endDate.toDate()
                };
            });
            return promoCodes;
        })
        .catch((error) => {
            console.error('Error fetching promo codes: ', error);
            return {};
        });
}

// Fetch promo codes when the page loads
let promoCodes = {};
document.addEventListener('DOMContentLoaded', () => {
    fetchPromoCodes().then((codes) => {
        promoCodes = codes;
    });
});

// Call the function to fetch and display cart items when the page loads
document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            fetchCartItems(user);
        } else {
            alert('Please log in to view your cart.');
        }
    });
});
