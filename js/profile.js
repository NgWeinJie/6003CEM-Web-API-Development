// Function to fetch user data from Firestore
// Example: Fetch user data from your API and display it

const fetchAndDisplayUser = async (userId) => {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error('User not found or fetch failed');
        const userData = await response.json();

        // Display user details in the modal form inputs
        displayUserDetailsInForm(userData);

        // Display user data on the profile page
        displayUserData(userData);
    } catch (error) {
        console.error('Error fetching and displaying user:', error);
    }
};


// Function to display user data on the modal form
const displayUserDetailsInForm = (userData) => {
    document.getElementById('emailModal').value = userData.email;
    document.getElementById('addressModal').value = userData.address;
    document.getElementById('phoneModal').value = userData.phoneNumber;
    document.getElementById('postcodeModal').value = userData.postcode;
    document.getElementById('cityModal').value = userData.city;
    document.getElementById('stateModal').value = userData.state;
};

// Function to display user data on the profile page
const displayUserData = (userData) => {
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    const userAddressElement = document.getElementById('userAddress');
    const userPhoneElement = document.getElementById('userPhone');
    const userPostcodeElement = document.getElementById('userPostcode');
    const userCityElement = document.getElementById('userCity');
    const userStateElement = document.getElementById('userState');
    const coinsBalanceElement = document.getElementById('coinsBalance');

    if (userNameElement && userEmailElement && userAddressElement &&
        userPhoneElement && userPostcodeElement && userCityElement &&
        userStateElement && coinsBalanceElement) {

        userNameElement.textContent = `${userData.firstName} ${userData.lastName}`;
        userEmailElement.textContent = userData.email;
        userAddressElement.textContent = userData.address;
        userPhoneElement.textContent = userData.phoneNumber;
        userPostcodeElement.textContent = userData.postcode;
        userCityElement.textContent = userData.city;
        userStateElement.textContent = userData.state;
        coinsBalanceElement.textContent = `${userData.points || 0}`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('uid');
    if (userId) {
        fetchAndDisplayUser(userId);
    }

    document.getElementById('submit').addEventListener('click', async (event) => {
        event.preventDefault(); // Prevent form from submitting normally

        // Collect updated data from the modal form
        const updatedData = {
            email: document.getElementById('emailModal').value,
            address: document.getElementById('addressModal').value,
            phoneNumber: document.getElementById('phoneModal').value,
            postcode: document.getElementById('postcodeModal').value,
            city: document.getElementById('cityModal').value,
            state: document.getElementById('stateModal').value
        };

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update user');
            }

            messageEl = data.message || 'User updated successfully';
            console.log(messageEl);

            // Update the profile page UI with the new data
            displayUserData(updatedData);

            // Hide the modal
            $('#editProfileModal').modal('hide');

        } catch (err) {
            errorEl = err.message;
            console.log(errorEl);
        }
    });
});
