// Get product ID from the URL hash
const productId = window.location.hash.substring(1);

// Get references to HTML elements
const productNameElement = document.getElementById('productName');
const productImageElement = document.getElementById('productImage');
const productPriceElement = document.getElementById('productPrice');
const productStockElement = document.getElementById('productStock');
const productDetailsElement = document.getElementById('productDetails');
const quantityInput = document.getElementById('quantity');

// Function to fetch product details from DummyJSON API
async function fetchProductDetails(productId) {
    try {
        const response = await fetch(`https://dummyjson.com/products/${productId}`);
        if (!response.ok) throw new Error('Product not found');

        const product = await response.json();

        // Display product details in the DOM
        productNameElement.textContent = product.title;
        productImageElement.src = product.thumbnail || product.images?.[0] || '';
        productPriceElement.textContent = `Price: RM ${product.price.toFixed(2)}`;
        productStockElement.textContent = `Stock: ${product.stock}`;
        productDetailsElement.textContent = product.description;
    } catch (error) {
        console.error('Error fetching product:', error);
        alert('Failed to load product details.');
    }
}

// Call the function to fetch and display product details
fetchProductDetails(productId);

// Quantity increase button
document.getElementById('increaseQuantity').addEventListener('click', function () {
    let quantity = parseInt(quantityInput.value);
    quantity = isNaN(quantity) ? 1 : quantity;
    quantityInput.value = quantity + 1;
});

// Quantity decrease button
document.getElementById('decreaseQuantity').addEventListener('click', function () {
    let quantity = parseInt(quantityInput.value);
    quantity = isNaN(quantity) ? 1 : quantity;
    if (quantity > 1) {
        quantityInput.value = quantity - 1;
    }
});

// Add to Cart button
document.getElementById('addToCart').addEventListener('click', async function () {
    try {
        const quantity = parseInt(quantityInput.value) || 1;

        // Fetch the product data again for cart submission
        const response = await fetch(`https://dummyjson.com/products/${productId}`);
        if (!response.ok) throw new Error('Failed to fetch product for cart');

        const product = await response.json();

        const cartItem = {
            productId: product.id,
            productName: product.title,
            productPrice: product.price,
            productBrand: product.brand,
            productImage: product.images, // Array of image URLs
            productStock: product.stock,
            productQuantity: quantity
        };

        const cartResponse = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cartItem)
        });

        if (!cartResponse.ok) {
            const err = await cartResponse.json();
            throw new Error(err.message || 'Unknown error adding to cart');
        }

        const result = await cartResponse.json();
        alert(`Added "${product.title}" to cart!`);

    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Error adding to cart. Please try again.');
    }
});
