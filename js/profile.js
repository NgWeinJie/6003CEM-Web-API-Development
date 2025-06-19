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
            profilePicElement.src = 'default.jpg'; // fallback image
        }
    }
};

// document.getElementById('upload').addEventListener('click', async (event) => {
//     const userId = localStorage.getItem('uid');
//     const fileInput = document.getElementById('uploadPic');
//     const file = fileInput.files[0];
//     const uid = localStorage.getItem('uid');

//     if (!file || !uid) {
//         alert("Missing file or user ID.");
//         return;
//     }

//     const formData = new FormData();
//     formData.append('profilePic', file);
//     formData.append('uid', userId);

//     const response = await fetch(`/api/users/${userId}`, {
//         method: 'PUT',
//         body: formData
//     });

//     const data = await response.json();

//     if (data.success) {
//         document.getElementById('profilePic').src = data.imageUrl;
//         alert("Upload successful!");
//     } else {
//         alert("Upload failed.");
//     }
//     console.log("Updating user:", userId);

// });

document.addEventListener('DOMContentLoaded', () => {

    const userId = localStorage.getItem('uid');
    if (userId) {
        fetchAndDisplayUser(userId);
    }

    document.getElementById('uploadPic').addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('profilePic').src = e.target.result;
                console.log('Preview image src:', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

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

            // Update profile pic if returned
            if (result?.user?.profilePic) {
                document.getElementById('profilePic').src = result.user.profilePic;
            }

            // Optionally refresh profile info
            await fetchAndDisplayUser(userId);
            alert(`User detials updated !`);
            $('#editProfileModal').modal('hide');
            location.reload();
        } catch (err) {
            console.error("❌ Error:", err.message);
            alert(`Error: ${err.message}`);
        }
    });



    // document.getElementById('submit').addEventListener('click', async (event) => {
    //     event.preventDefault();

    //     const userId = localStorage.getItem('uid');
    //     if (!userId) {
    //         alert("User ID not found");
    //         return;
    //     }

    //     const updatedData = {
    //         email: document.getElementById('emailModal').value,
    //         address: document.getElementById('addressModal').value,
    //         phoneNumber: document.getElementById('phoneModal').value,
    //         postcode: document.getElementById('postcodeModal').value,
    //         city: document.getElementById('cityModal').value,
    //         state: document.getElementById('stateModal').value
    //     };

    //     try {
    //         const textResponse = await fetch(`/api/users/${userId}`, {
    //             method: 'PUT',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify(updatedData)
    //         });

    //         const textData = await textResponse.json();
    //         if (!textResponse.ok) throw new Error(textData.message || 'Failed to update user info');

    //         console.log("User info updated:", textData.message || 'Success');

    //         const fileInput = document.getElementById('uploadPic');
    //         const file = fileInput.files[0];

    //         if (file) {
    //             const formData = new FormData();
    //             formData.append('profilePic', file);

    //             const imageResponse = await fetch(`/api/users/${userId}`, {
    //                 method: 'PUT',
    //                 body: formData
    //             });

    //             const imageData = await imageResponse.json();
    //             if (!imageResponse.ok) throw new Error(imageData.message || 'Image upload failed');

    //             if (imageData.imageUrl) {
    //                 document.getElementById('profilePic').src = imageData.imageUrl;
    //             }
    //         }

    //         await fetchAndDisplayUser(userId);

    //         $('#editProfileModal').modal('hide');

    //     } catch (err) {
    //         console.error("❌ Error:", err.message);
    //         alert(`Error: ${err.message}`);
    //     }
    // });

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
