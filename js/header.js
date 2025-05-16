// Add event listener to dropdown items
document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', scrollToCategory);
});

// Function to scroll to category
function scrollToCategory(event) {
    console.log('Dropdown item clicked.'); // Debug log
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

// Example JavaScript code for handling logout button click event
$(document).ready(function() {
    $('#logoutButton').click(function() {
        // Perform logout actions here, e.g., redirect to logout page
        window.location.href = 'logout.html';
    });
});
