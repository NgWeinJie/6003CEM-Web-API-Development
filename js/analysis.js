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

// Function to fetch product data and render chart
function fetchProductDataAndRenderChart() {
    db.collection('orders').get().then(snapshot => {
        const productCounts = {};
        const monthlyRevenue = {};

        snapshot.forEach(doc => {
            const order = doc.data();
            const orderTimestamp = order.timestamp || order.orderDate; // Use orderDate if timestamp is not present

            if (orderTimestamp) {
                const orderDate = orderTimestamp.toDate();
                const monthYear = `${orderDate.getMonth() + 1}/${orderDate.getFullYear()}`;

                order.cartItems.forEach(item => {
                    // Count product quantities
                    if (productCounts[item.productName]) {
                        productCounts[item.productName] += item.productQuantity;
                    } else {
                        productCounts[item.productName] = item.productQuantity;
                    }

                    // Calculate monthly revenue
                    const itemRevenue = item.productPrice * item.productQuantity;
                    if (monthlyRevenue[monthYear]) {
                        monthlyRevenue[monthYear] += itemRevenue;
                    } else {
                        monthlyRevenue[monthYear] = itemRevenue;
                    }
                });
            } else {
                console.warn(`Order ${doc.id} is missing a timestamp.`);
            }
        });

        const productNames = Object.keys(productCounts);
        const productQuantities = Object.values(productCounts);

        renderChart(productNames, productQuantities);
        renderMonthlyRevenue(monthlyRevenue);
    }).catch(error => {
        console.error("Error fetching product data: ", error);
    });
}

// Function to render chart
function renderChart(productNames, productQuantities) {
    const ctx = document.getElementById('productChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: productNames,
            datasets: [{
                label: 'Product Quantity',
                data: productQuantities,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Most Frequently Purchased Products'
                }
            }
        }
    });
}

// Function to render monthly revenue
function renderMonthlyRevenue(monthlyRevenue) {
    const revenueTableBody = document.getElementById('revenueTableBody');
    for (const [monthYear, revenue] of Object.entries(monthlyRevenue)) {
        const row = document.createElement('tr');
        const monthCell = document.createElement('td');
        const revenueCell = document.createElement('td');

        monthCell.textContent = monthYear;
        revenueCell.textContent = revenue.toFixed(2); // Format revenue to 2 decimal places

        row.appendChild(monthCell);
        row.appendChild(revenueCell);
        revenueTableBody.appendChild(row);
    }
}

// Fetch and display product data when the document is ready
document.addEventListener('DOMContentLoaded', fetchProductDataAndRenderChart);