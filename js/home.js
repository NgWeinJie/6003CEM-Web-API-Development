// Remove or comment out all Firebase-related code if not used anymore

// Fetch and display products by category from DummyJSON API
async function fetchAndDisplayProductsByCategory() {
    const productList = document.getElementById('productList');
    productList.innerHTML = ''; // Clear previous content

    // Use categories available from DummyJSON API or your app's categories
    const itemCategories = [
        "groceries",
        "beauty",
        "furniture",
        "fragrances"

    ];

    for (const category of itemCategories) {
        // Create category heading
        const categoryHeading = document.createElement('h3');
        categoryHeading.id = category.replace(/\s+/g, '');
        categoryHeading.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        categoryHeading.style.marginBottom = '40px';
        productList.appendChild(categoryHeading);

        // Container for products of this category
        const categoryProductsContainer = document.createElement('div');
        categoryProductsContainer.classList.add('row', 'mb-4');

        try {
            // Fetch products by category from DummyJSON API
            const response = await fetch(`https://dummyjson.com/products/category/${encodeURIComponent(category)}`);
            const data = await response.json();

            if (data.products && data.products.length > 0) {
                data.products.forEach(product => {
                    const productCard = createProductCardFromAPI(product);
                    categoryProductsContainer.appendChild(productCard);
                });
            } else {
                const noProductsMessage = document.createElement('p');
                noProductsMessage.textContent = 'No products found in this category.';
                categoryProductsContainer.appendChild(noProductsMessage);
            }

            productList.appendChild(categoryProductsContainer);
        } catch (error) {
            console.error('Error fetching products for category:', category, error);
            alert('Failed to fetch products for category: ' + category + '. Please try again later.');
        }
    }
}

// Create product card element from DummyJSON API product object
function createProductCardFromAPI(product) {
    const productCard = document.createElement('div');
    productCard.classList.add('col-md-3', 'mb-4');

    const productId = product.id || '';

    productCard.dataset.productId = productId;

    const card = document.createElement('div');
    card.classList.add('card');
    card.style.height = '480px';
    // card.style.backgroundColor = '#ebf8ff';
    card.style.borderRadius = '8px';
    card.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    card.style.transition = 'transform 0.2s';

    const img = document.createElement('img');
    img.src = (product.thumbnail || (product.images && product.images[0])) || 'https://via.placeholder.com/250x250?text=No+Image';
    img.classList.add('card-img-top');
    img.alt = product.title || 'No name';
    img.style.height = '250px';
    img.style.borderRadius = '8px 8px 0 0'; // Match card corners
    // img.style.backgroundColor = '#ebf8ff';
    img.style.padding = '20px';

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    const title = document.createElement('h5');
    title.classList.add('card-title');
    title.textContent = product.title || 'Unnamed product';

    const brand = document.createElement('p');
    brand.classList.add('card-text');
    brand.textContent = 'Brand: ' + (product.brand || 'Unknown');

    const price = document.createElement('p');
    price.classList.add('card-text');
    price.textContent = 'Price: RM ' + (product.price != null ? product.price.toFixed(2) : 'N/A');

    const stock = document.createElement('p');
    stock.classList.add('card-text');
    stock.textContent = 'Stock: ' + (product.stock != null ? product.stock : 'N/A');

    const addToCartButton = document.createElement('button');
    addToCartButton.classList.add('btn', 'btn-primary', 'add-to-cart');
    addToCartButton.textContent = 'Add to Cart';

    // Add click event listener to Add to Cart button (customize as needed)
    addToCartButton.addEventListener('click', async function(event) {
    event.stopPropagation();

    const userId = localStorage.getItem('uid');

    if (!userId) {
    alert('Please login before adding to cart.');
    window.location.href = 'login.html';
    return;
    }

    const cartItem = {
        userId,
        productId: product.id,
        productName: product.title,
        productPrice: product.price,
        productBrand: product.brand,
        productImage: product.images[0] || '',
        productStock: product.stock,
        productQuantity: 1
    };

    try {
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cartItem)
        });

        if (response.ok) {
            const data = await response.json();
            alert(`Added "${product.title}" to cart!`);
        } else {
            const err = await response.json();
            console.error('Failed to add to cart:', err);
            alert('Failed to add to cart.');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Error adding to cart.');
    }
});

    cardBody.appendChild(title);
    cardBody.appendChild(brand);
    cardBody.appendChild(price);
    cardBody.appendChild(stock);
    cardBody.appendChild(addToCartButton);

    card.appendChild(img);
    card.appendChild(cardBody);

    productCard.appendChild(card);

    return productCard;
}

// Scroll to category on dropdown click
document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', scrollToCategory);
});

function scrollToCategory(event) {
    event.preventDefault();
    const targetId = this.getAttribute('href').substring(1);
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Filter products by name from the search input
function filterProductsByName(searchTerm) {
    const productList = document.getElementById('productList');
    const categoryHeadings = productList.querySelectorAll('h3');

    if (searchTerm.trim() !== '') {
        categoryHeadings.forEach(heading => heading.remove());
    }

    const categoryProductsContainers = productList.getElementsByClassName('row mb-4');
    for (const container of categoryProductsContainers) {
        const products = container.getElementsByClassName('col-md-3 mb-4');
        for (const product of products) {
            const productName = product.querySelector('.card-title').textContent.toLowerCase();
            const isVisible = productName.includes(searchTerm.toLowerCase());
            product.style.display = isVisible ? 'block' : 'none';
        }
    }
}

document.getElementById('searchInput').addEventListener('input', function(event) {
    filterProductsByName(event.target.value.trim());
});

// Navigate to product details page on product click
document.getElementById('productList').addEventListener('click', function(event) {
    let clickedElement = event.target;
    const productCard = clickedElement.closest('[data-product-id]');
    if (productCard) {
        const productId = productCard.dataset.productId;
        window.location.href = `product_details.html#${productId}`;
    }
});

// Scroll to top button functionality
window.onscroll = function() { scrollFunction() };

function scrollFunction() {
    const backToTopBtn = document.getElementById("backToTopBtn");
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopBtn.style.display = "block";
    } else {
        backToTopBtn.style.display = "none";
    }
}

document.getElementById('backToTopBtn').addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Call the product fetching when the page loads
document.addEventListener('DOMContentLoaded', fetchAndDisplayProductsByCategory);
