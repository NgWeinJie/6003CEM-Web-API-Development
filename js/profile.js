// Get user ID from localStorage
const currentUser = { id: localStorage.getItem('uid') };

if (!currentUser.id) {
  alert('Please log in first.');
  window.location.href = 'login.html';
}

// Fetch user details from backend
async function fetchUserDetails(userId) {
  try {
    const res = await fetch(`/api/users/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user details');
    const userData = await res.json();
    displayUserDetailsInForm(userData);
    displayUserData(userData);
  } catch (err) {
    console.error(err);
    displayUserCoins(0);
  }
}

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

// Update user data via backend
const updateUserProfile = async (userId, newData) => {
  try {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newData)
    });

    if (!res.ok) throw new Error('Failed to update user data');
    console.log('User data updated successfully');
    fetchUserDetails(userId); // Refresh user data
    $('#editProfileModal').modal('hide');
  } catch (error) {
    console.error('Error updating user data:', error);
  }
};

// Form submission handler
document.getElementById('editProfileFormModal').addEventListener('submit', (event) => {
  event.preventDefault(); // Prevent default form submission

  const userId = currentUser.id;

  const newData = {
    email: document.getElementById('emailModal').value,
    address: document.getElementById('addressModal').value,
    phoneNumber: document.getElementById('phoneModal').value,
    postcode: document.getElementById('postcodeModal').value,
    city: document.getElementById('cityModal').value,
    state: document.getElementById('stateModal').value
  };

  updateUserProfile(userId, newData);
});

// Initial fetch of user data
fetchUserDetails(currentUser.id);
