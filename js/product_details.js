// Get product ID from the URL hash
const productId = window.location.hash.substring(1);

// Get references to HTML elements
const productNameElement = document.getElementById('productName');
const productImageElement = document.getElementById('productImage');
const productPriceElement = document.getElementById('productPrice');
const productStockElement = document.getElementById('productStock');
const productDetailsElement = document.getElementById('productDetails');
const quantityInput = document.getElementById('quantity');

// Function to fetch product details
async function fetchProductDetails(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`);
        
        if (!response.ok) {
            throw new Error('Product not found');
        }

        const product = await response.json();

        // Display product details in the DOM
        productNameElement.textContent = product.title;
        productImageElement.src = product.images?.[0] || 'https://via.placeholder.com/400x400?text=No+Image';
        productPriceElement.textContent = `Price: RM ${product.price.toFixed(2)}`;
        productStockElement.textContent = `Stock: ${product.stock}`;
        productDetailsElement.textContent = product.description || 'No description available';

        // Fetch recipes
        const recipeContainer = document.getElementById('recipeContainer');
        fetchRecipesByIngredient(product._id, recipeContainer, product.category);
        
    } catch (error) {
        console.error('Error fetching product:', error);
        alert('Failed to load product details.');
    }
}

async function fetchRecipesByIngredient(productId, containerElement, category) {
  try {
    const response = await fetch(`/api/recipes/product/${productId}`);
    if (!response.ok) throw new Error('Failed to fetch recipes');

    const data = await response.json();

    // If not Groceries, show nothing at all
    if (category.toLowerCase() !== 'groceries') {
      containerElement.innerHTML = '';
      return;
    }

    // Show message if no recipes found
    if (!Array.isArray(data) || data.length === 0) {
      containerElement.innerHTML = '<h5 class="mb-3">No recipes found.</h5>';
      return;
    }

    // Render recipes
    const recipeCards = data
      .filter(recipe => recipe.image)
      .map(recipe => `
        <div class="col-md-4 mb-4">
          <div class="card h-100">
            <img src="${recipe.image}" class="card-img-top" style="height: 200px; object-fit: cover;" alt="${recipe.title}">
            <div class="card-body d-flex flex-column">
              <h6 class="card-title">${recipe.title}</h6>
              <a href="${recipe.sourceUrl}" target="_blank" class="btn btn-sm btn-outline-primary mt-auto">View Recipe</a>
            </div>
          </div>
        </div>
      `).join('');

    containerElement.innerHTML = `
      <h5 class="mb-3">Related Recipe: </h5>
      <div class="row">${recipeCards}</div>
    `;

  } catch (error) {
    console.error('Error fetching recipes:', error);
    containerElement.innerHTML = ''; // Hide all on error
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
        const userId = localStorage.getItem('uid');

        if (!userId) {
            alert('Please login before adding to cart.');
            window.location.href = 'login.html';
            return;
        }

        // Fetch the product data from MongoDB API
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) throw new Error('Failed to fetch product for cart');

        const product = await response.json();

        const cartItem = {
            userId: userId,
            productId: product._id,
            productName: product.title,
            productPrice: product.price,
            productImage: product.images?.[0],
            productStock: product.stock,
            productQuantity: quantity,
            productCategory: product.category
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