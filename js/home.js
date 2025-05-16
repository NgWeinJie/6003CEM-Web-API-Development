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

// Get a reference to the storage service, which is used to create references in your storage bucket
const storage = firebase.storage();

// Get a reference to Firestore database
const db = firebase.firestore();

// Get a reference to the auth service
const auth = firebase.auth();

async function fetchAndDisplayProductsByCategory() {
    const productList = document.getElementById('productList');

    // Clear any existing content
    productList.innerHTML = '';

    const itemCategories = [
        "Biscuits & Cakes",
        "Canned Food",
        "Cereals",
        "Snacks",
        "Commodities",
        "Jams, Spreads & Honey",
        "Pasta & Instant Food",
        "Sauce, Spice & Seasoning",
        "Sundry"
    ];

    // Iterate through each item category
    for (const category of itemCategories) {
        // Create a heading for the category
        const categoryHeading = document.createElement('h3');
        categoryHeading.id = category.replace(/\s+/g, '');
        categoryHeading.textContent = category;
        categoryHeading.style.marginBottom = '40px';
        productList.appendChild(categoryHeading);

        // Create a container for the products in this category
        const categoryProductsContainer = document.createElement('div');
        categoryProductsContainer.classList.add('row', 'mb-4');

        try {
            // Query Firestore for products in the current category
            const querySnapshot = await db.collection('products')
                .where('itemCategories', '==', category)
                .where('itemStock', '!=', '0')
                .get();

            // Check if any products were found for the category
            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const product = doc.data();
                    const productId =doc. id; // Use the document ID as product ID
                    const productCard = createProductCard(product, productId); // Pass the document ID here
                    categoryProductsContainer.appendChild(productCard);
                });
            } else {
                // No products found for this category, display a message
                const noProductsMessage = document.createElement('p');
                noProductsMessage.textContent = 'No products found in this category.';
                categoryProductsContainer.appendChild(noProductsMessage);
            }

            // Append the category products container to the product list
            productList.appendChild(categoryProductsContainer);
        } catch (error) {
            console.error('Error fetching products for category:', category, error);
            alert('Failed to fetch products for category: ' + category + '. Please try again later.');
        }
    }
}

function createProductCard(product, productId) {
    const productCard = document.createElement('div');
    productCard.classList.add('col-md-3', 'mb-4');

    productCard.dataset.productId = productId;

    const card = document.createElement('div');
    card.classList.add('card');
    card.style.height = '480px';
    card.style.backgroundColor = '#ebf8ff';
    card.style.borderRadius = '8px';
    card.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'; 
    card.style.transition = 'transform 0.2s';

    const img = document.createElement('img');
    img.src = product.itemImageURL;
    img.classList.add('card-img-top');
    img.alt = product.itemName;
    img.style.height = '250px';
    img.style.borderRadius = '8px 8px 0 0'; // Match card corners
    img.style.backgroundColor = '#ebf8ff';

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    const title = document.createElement('h5');
    title.classList.add('card-title');
    title.textContent = product.itemName;

    const price = document.createElement('p');
    price.classList.add('card-text');
    price.textContent = 'Price: RM' + product.itemPrice;

    const stock = document.createElement('p');
    stock.classList.add('card-text');
    stock.textContent = 'Stock: ' + product.itemStock;

    const addToCartButton = document.createElement('button');
    addToCartButton.classList.add('btn', 'btn-primary', 'add-to-cart');
    addToCartButton.textContent = 'Add to Cart';

    // Add click event listener to "Add to Cart" button
    addToCartButton.addEventListener('click', async function(event) {
        event.stopPropagation(); // Stop the event from propagating further
        console.log('Item added to cart:', product.itemName);

        // Retrieve product information
        const productName = product.itemName;
        const productPrice = parseFloat(product.itemPrice);
        const productStock = parseInt(product.itemStock);
        const productImageURL = product.itemImageURL;

        // Get the current user's ID
        const userId = firebase.auth().currentUser.uid;

        try {
            // Save product information to Firestore collection 'cart'
            const docRef = await db.collection('cart').add({
                userId: userId,
                productName: productName,
                productPrice: productPrice,
                productStock: productStock,
                productQuantity: 1,
                productImageURL: productImageURL
            });

            console.log('Product added to cart:', docRef.id);
            alert('Product added to cart!');

            // Animate add to cart
            const cartIcon = document.getElementById('cartIcon');
            const productCardClone = productCard.cloneNode(true);
            productCardClone.style.position = 'absolute';
            productCardClone.style.left = productCard.getBoundingClientRect().left + 'px';
            productCardClone.style.top = productCard.getBoundingClientRect().top + 'px';
            document.body.appendChild(productCardClone);
            setTimeout(() => {
                productCardClone.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
                productCardClone.style.transform = 'translate(' + (cartIcon.getBoundingClientRect().left - productCard.getBoundingClientRect().left) + 'px, ' + (cartIcon.getBoundingClientRect().top - productCard.getBoundingClientRect().top) + 'px) scale(0.1)';
                productCardClone.style.opacity = '0';
            }, 50);
            setTimeout(() => {
                productCardClone.remove();
            }, 500);
        } catch (error) {
            console.error('Error adding product to cart:', error);
            alert('Failed to add product to cart. Please try again later.');
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



// Add event listener to dropdown items
document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', scrollToCategory);
});

// Function to scroll to category
function scrollToCategory(event) {
    event.preventDefault(); // Prevent default anchor behavior

    // Get the target section ID from the href attribute
    const targetId = this.getAttribute('href').substring(1);

    // Scroll to the target section
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
        targetSection.scrollIntoView({
            behavior: 'smooth' // Optional: Use smooth scrolling
        });
    } else {
        console.log('Target section not found:', targetId); // Debug log
    }
}

// Call the function to fetch and display products by category when the page loads
document.addEventListener('DOMContentLoaded', fetchAndDisplayProductsByCategory);

function filterProductsByName(searchTerm) {
    const productList = document.getElementById('productList');
    const categoryHeadings = productList.querySelectorAll('h3');

    if (searchTerm.trim() !== '') {
        // If search term is not empty, remove all category headings
        categoryHeadings.forEach(heading => heading.remove());
    } else {
        // If search term is empty, reinstate category headings
        const firstCategoryContainer = productList.querySelector('.row.mb-4');
        const firstCategoryHeading = firstCategoryContainer.previousElementSibling;

        // Check if there is at least one category container
        if (firstCategoryHeading && firstCategoryHeading.tagName.toLowerCase() === 'h3') {
            // Ensure there is only one category heading for each category
            if (!productList.contains(firstCategoryHeading)) {
                firstCategoryContainer.insertAdjacentElement('beforebegin', firstCategoryHeading);
            }
        }
    }

    // Iterate through each category's products
    const categoryProductsContainers = productList.getElementsByClassName('row mb-4');
    for (const container of categoryProductsContainers) {
        const products = container.getElementsByClassName('col-md-3 mb-4');
        // Iterate through each product in the category
        for (const product of products) {
            const isCategoryHeading = product.tagName.toLowerCase() === 'h3';
            if (isCategoryHeading) {
                continue;
            }

            const productName = product.querySelector('.card-title').textContent.toLowerCase();
            const isVisible = productName.includes(searchTerm.toLowerCase());
            product.style.display = isVisible ? 'block' : 'none'; // Show or hide the product card based on visibility
        }
    }
}




// Event listener for the search input
document.getElementById('searchInput').addEventListener('input', function(event) {
    const searchTerm = event.target.value.trim();
    filterProductsByName(searchTerm);
});

// Event delegation for handling clicks on product cards
document.getElementById('productList').addEventListener('click', function(event) {
    let clickedElement = event.target;
    // Find the closest ancestor element with the data-product-id attribute
    const productCard = clickedElement.closest('[data-product-id]');
    if (productCard) {
        const productId = productCard.dataset.productId;
        console.log("Clicked Product ID:", productId);
        window.location.href = `product_details.html#${productId}`;
    } else {
        console.log("Clicked element is not a product card."); 
    }
});

async function fetchSlides() {
    const carouselInner = document.getElementById('carouselInner');
    carouselInner.innerHTML = ''; // Clear existing content

    try {
        const querySnapshot = await db.collection('promotion').get();
        let isFirstSlide = true;

        querySnapshot.forEach((doc) => {
            const slide = doc.data();
            const slideItem = document.createElement('div');
            slideItem.classList.add('carousel-item');
            if (isFirstSlide) {
                slideItem.classList.add('active');
                isFirstSlide = false;
            }

            const slideImage = document.createElement('img');
            slideImage.src = slide.slideImage;
            slideImage.classList.add('d-block', 'w-100');
            slideImage.alt = 'Slide Image';

            slideItem.appendChild(slideImage);
            carouselInner.appendChild(slideItem);
        });
    } catch (error) {
        console.error('Error fetching slides: ', error);
        alert('Failed to fetch slides. Please try again later.');
    }
}

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() { scrollFunction() };

function scrollFunction() {
    const backToTopBtn = document.getElementById("backToTopBtn");
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopBtn.style.display = "block";
    } else {
        backToTopBtn.style.display = "none";
    }
}

// When the user clicks on the button, scroll to the top of the document
document.getElementById('backToTopBtn').addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // Smooth scroll to top
    });
});

// Call the function to fetch and display slides when the page loads
document.addEventListener('DOMContentLoaded', fetchSlides);