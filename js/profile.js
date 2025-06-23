const fetchAndDisplayUser = async (userId) => {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error('User not found or fetch failed');
        const userData = await response.json();

        displayUserDetailsInForm(userData);

        displayUserData(userData);
    } catch (error) {
        console.error('Error fetching and displaying user:', error);
    }
};

const displayUserDetailsInForm = (userData) => {
    document.getElementById('emailModal').value = userData.email;
    document.getElementById('addressModal').value = userData.address;
    document.getElementById('phoneModal').value = userData.phoneNumber;
    document.getElementById('postcodeModal').value = userData.postcode;
    document.getElementById('cityModal').value = userData.city;
    document.getElementById('stateModal').value = userData.state;
};

const displayUserData = (userData) => {
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    const userAddressElement = document.getElementById('userAddress');
    const userPhoneElement = document.getElementById('userPhone');
    const userPostcodeElement = document.getElementById('userPostcode');
    const userCityElement = document.getElementById('userCity');
    const userStateElement = document.getElementById('userState');
    const coinsBalanceElement = document.getElementById('coinsBalance');
    const profilePicElement = document.getElementById('profilePic');

    if (userNameElement && userEmailElement && userAddressElement &&
        userPhoneElement && userPostcodeElement && userCityElement &&
        userStateElement && coinsBalanceElement && profilePicElement) {

        userNameElement.textContent = `${userData.firstName} ${userData.lastName}`;
        userEmailElement.textContent = userData.email;
        userAddressElement.textContent = userData.address;
        userPhoneElement.textContent = userData.phoneNumber;
        userPostcodeElement.textContent = userData.postcode;
        userCityElement.textContent = userData.city;
        userStateElement.textContent = userData.state;
        coinsBalanceElement.textContent = `${userData.points || 0}`;

        if (userData.profilePic) {
            profilePicElement.src = userData.profilePic;
        } else {
            profilePicElement.src = '/uploads/profile-pics/default.png'; 
        }
    }
};


document.addEventListener('DOMContentLoaded', () => {

    const userId = localStorage.getItem('uid');
    if (userId) {
        fetchAndDisplayUser(userId);
    }

    document.getElementById('submit').addEventListener('click', async (event) => {
        event.preventDefault();

        const userId = localStorage.getItem('uid');
        if (!userId) {
            alert("User ID not found");
            return;
        }

        const formData = new FormData();
        formData.append('email', document.getElementById('emailModal').value);
        formData.append('address', document.getElementById('addressModal').value);
        formData.append('phoneNumber', document.getElementById('phoneModal').value);
        formData.append('postcode', document.getElementById('postcodeModal').value);
        formData.append('city', document.getElementById('cityModal').value);
        formData.append('state', document.getElementById('stateModal').value);

        const file = document.getElementById('uploadPic').files[0];
        if (file) {
            formData.append('profilePic', file);
        }

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Update failed');

            console.log("✅ Full response from backend:", result);

            if (result?.user?.profilePic) {
                document.getElementById('profilePic').src = result.user.profilePic;
            }

            await fetchAndDisplayUser(userId);
            alert(`User detials updated !`);
            $('#editProfileModal').modal('hide');
            location.reload();
        } catch (err) {
            console.error("❌ Error:", err.message);
            alert(`Error: ${err.message}`);
        }
    });


    document.getElementById('deleteProfilePic').addEventListener('click', async () => {
        const userId = localStorage.getItem('uid');
        if (!userId) return alert("User ID not found");

        const confirmed = confirm("Are you sure you want to delete your profile picture?");
        if (!confirmed) return;

        const response = await fetch(`/api/users/${userId}/profile-pic`, { method: 'DELETE' });
        const data = await response.json();

        if (data.success) {
            document.getElementById('profilePic').src = data.imageUrl;
            alert("Profile picture deleted");
        } else {
            alert("Failed to delete profile picture");
        }

        await fetchAndDisplayUser(userId);
    });

});
