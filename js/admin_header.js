// Execute fetchProducts function when the page loads
$(document).ready(function() {
    fetchProducts();

    // Add event listener for input changes in the search input field
    document.getElementById('searchInput').addEventListener('input', function() {
        searchProduct(); // Call searchProduct function when input changes
    });
});