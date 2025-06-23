// Fetch and display products by category
async function fetchAndDisplayProductsByCategory() {
    const productList = document.getElementById('productList');
    productList.innerHTML = ''; 

    try {
        const response = await fetch('/api/products/categories');
        const allCategoriesData = await response.json();

        // Loop through each category in the response
        for (const [category, products] of Object.entries(allCategoriesData)) {
            // Create category heading
            const categoryHeading = document.createElement('h3');
            categoryHeading.id = category.replace(/\s+/g, '');
            categoryHeading.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            categoryHeading.style.marginBottom = '40px';
            productList.appendChild(categoryHeading);

            // Container for products of this category
            const categoryProductsContainer = document.createElement('div');
            categoryProductsContainer.classList.add('row', 'mb-4');

            if (products && products.length > 0) {
                products.forEach(product => {
                    const productCard = createProductCardFromMongoDB(product);
                    categoryProductsContainer.appendChild(productCard);
                });
            } else {
                const noProductsMessage = document.createElement('p');
                noProductsMessage.textContent = 'No products found in this category.';
                categoryProductsContainer.appendChild(noProductsMessage);
            }

            productList.appendChild(categoryProductsContainer);
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        alert('Failed to fetch products. Please try again later.');
    }
}

// Create product card element from MongoDB product objec
function createProductCardFromMongoDB(product) {
    const productCard = document.createElement('div');
    productCard.classList.add('col-md-3', 'mb-4');

    // Use _id as product identifier
    const productId = product._id || '';
    productCard.dataset.productId = productId;

    const card = document.createElement('div');
    card.classList.add('card');
    card.style.height = '480px';
    card.style.borderRadius = '8px';
    card.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    card.style.transition = 'transform 0.2s';

    const img = document.createElement('img');
    img.src = (product.images && product.images[0]) || 'https://via.placeholder.com/250x250?text=No+Image';
    img.classList.add('card-img-top');
    img.alt = product.title || 'No name';
    img.style.height = '250px';
    img.style.borderRadius = '8px 8px 0 0';
    img.style.padding = '20px';

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    const title = document.createElement('h5');
    title.classList.add('card-title');
    title.textContent = product.title || 'Unnamed product';

    const price = document.createElement('p');
    price.classList.add('card-text');
    price.textContent = 'Price: RM ' + (product.price != null ? product.price.toFixed(2) : 'N/A');

    const stock = document.createElement('p');
    stock.classList.add('card-text');
    stock.textContent = 'Stock: ' + (product.stock != null ? product.stock : 'N/A');

    const addToCartButton = document.createElement('button');
    addToCartButton.classList.add('btn', 'btn-primary', 'add-to-cart');
    addToCartButton.textContent = 'Add to Cart';

    // Add click event listener to Add to Cart button
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
            productId: product._id,
            productName: product.title,
            productPrice: product.price,
            productImage: (product.images && product.images[0]) || '',
            productStock: product.stock,
            productQuantity: 1,
            productCategory: product.category
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
    cardBody.appendChild(price);
    cardBody.appendChild(stock);
    cardBody.appendChild(addToCartButton);

    card.appendChild(img);
    card.appendChild(cardBody);

    productCard.appendChild(card);

    return productCard;
}

// Scroll to category function
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

// Dynamically populate the dropdown menu with itemCategories
function populateProductCategoriesDropdown() {
    const itemCategories = [
        "groceries",
        "beauty",
        "furniture",
        "fragrances"
    ];

    const dropdown = document.getElementById("productCategoriesDropdown");

    // Clear existing dropdown items
    dropdown.innerHTML = '';

    // Optional: add "All Products" link
    const allProductsLink = document.createElement("a");
    allProductsLink.className = "dropdown-item";
    allProductsLink.href = "#allProducts";
    allProductsLink.textContent = "All Products";
    dropdown.appendChild(allProductsLink);

    const divider = document.createElement("div");
    divider.className = "dropdown-divider";
    dropdown.appendChild(divider);

    // Add each category
    itemCategories.forEach(category => {
        const link = document.createElement("a");
        link.className = "dropdown-item";
        link.href = `#${category.replace(/\s+/g, '')}`;
        link.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        dropdown.appendChild(link);
    });

    dropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', scrollToCategory);
    });
}

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
document.addEventListener('DOMContentLoaded', () => {
    populateProductCategoriesDropdown();
    fetchAndDisplayProductsByCategory();
});