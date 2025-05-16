// Firebase configuration
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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// Function to fetch promo codes from Firestore and delete expired ones
function fetchPromoCodes() {
    db.collection('promotion').get()
        .then((querySnapshot) => {
            const promoTableBody = document.querySelector('#promoTable tbody');
            promoTableBody.innerHTML = '';
            const currentDate = new Date();
            querySnapshot.forEach((doc) => {
                const promo = doc.data();
                if (promo.endDate.seconds * 1000 < currentDate.getTime()) {
                    deletePromoCode(doc.id);
                } else {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><img src="${promo.slideImage}" alt="Slide Image" width="100"></td>
                        <td>${promo.code}</td>
                        <td>${promo.discount}</td>
                        <td>${promo.minPurchase}</td>
                        <td>${new Date(promo.startDate.seconds * 1000).toLocaleString()}</td>
                        <td>${new Date(promo.endDate.seconds * 1000).toLocaleString()}</td>
                        <td>
                            <button class="btn btn-primary btn-sm" style="margin-right: 0;" onclick="openEditModal('${doc.id}', '${promo.slideImage}', '${promo.code}', '${promo.discount}', '${promo.minPurchase}', '${promo.startDate.toDate().toISOString().slice(0, 16)}', '${promo.endDate.toDate().toISOString().slice(0, 16)}')">Edit</button>
                            <button class="btn btn-danger btn-sm" style="margin-left: 0;" onclick="deletePromoCode('${doc.id}')">Delete</button>
                        </td>
                    `;
                    promoTableBody.appendChild(row);
                }
            });
        })
        .catch((error) => {
            console.error('Error fetching promo codes: ', error);
        });
}

// Function to add a new promo code to Firestore and Firebase Storage
document.querySelector('#promoForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const slideImage = document.querySelector('#slideImage').files[0];
    const promoCode = document.querySelector('#promoCode').value;
    const discountAmount = document.querySelector('#discountAmount').value;
    const minPurchase = document.querySelector('#minPurchase').value;
    const startDate = document.querySelector('#startDate').value;
    const endDate = document.querySelector('#endDate').value;

    const storageRef = storage.ref();
    const imageRef = storageRef.child(`slides/${slideImage.name}`);

    imageRef.put(slideImage).then((snapshot) => {
        snapshot.ref.getDownloadURL().then((url) => {
            db.collection('promotion').add({
                slideImage: url,
                code: promoCode,
                discount: parseFloat(discountAmount),
                minPurchase: parseFloat(minPurchase),
                startDate: firebase.firestore.Timestamp.fromDate(new Date(startDate)),
                endDate: firebase.firestore.Timestamp.fromDate(new Date(endDate))
            })
            .then(() => {
                alert('Promo code added successfully!');
                fetchPromoCodes();
                document.querySelector('#promoForm').reset();
            })
            .catch((error) => {
                console.error('Error adding promo code: ', error);
            });
        }).catch((error) => {
            console.error('Error getting image URL: ', error);
        });
    }).catch((error) => {
        console.error('Error uploading image: ', error);
    });
});

// Function to delete a promo code from Firestore and Firebase Storage
function deletePromoCode(promoId) {
    db.collection('promotion').doc(promoId).get().then((doc) => {
        const slideImageUrl = doc.data().slideImage;
        const imageRef = storage.refFromURL(slideImageUrl);
        imageRef.delete().then(() => {
            db.collection('promotion').doc(promoId).delete()
                .then(() => {
                    alert('Promo code deleted successfully!');
                    fetchPromoCodes();
                })
                .catch((error) => {
                    console.error('Error deleting promo code: ', error);
                });
        }).catch((error) => {
            console.error('Error deleting image from storage: ', error);
        });
    }).catch((error) => {
        console.error('Error getting promo code data: ', error);
    });
}

// Function to open the edit modal with current promo code details
function openEditModal(promoId, slideImage, code, discount, minPurchase, startDate, endDate) {
    document.querySelector('#editPromoId').value = promoId;
    document.querySelector('#editPromoCode').value = code;
    document.querySelector('#editDiscountAmount').value = discount;
    document.querySelector('#editMinPurchase').value = minPurchase;
    document.querySelector('#editStartDate').value = startDate;
    document.querySelector('#editEndDate').value = endDate;
    document.querySelector('#editSlideImage').dataset.currentImageUrl = slideImage; // Store current image URL in dataset
    $('#editPromoModal').modal('show');
}

// Function to update a promo code in Firestore and Firebase Storage
document.querySelector('#editPromoForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const promoId = document.querySelector('#editPromoId').value;
    const newSlideImage = document.querySelector('#editSlideImage').files[0];
    const promoCode = document.querySelector('#editPromoCode').value;
    const discountAmount = document.querySelector('#editDiscountAmount').value;
    const minPurchase = document.querySelector('#editMinPurchase').value;
    const startDate = document.querySelector('#editStartDate').value;
    const endDate = document.querySelector('#editEndDate').value;

    const updateData = {
        code: promoCode,
        discount: parseFloat(discountAmount),
        minPurchase: parseFloat(minPurchase),
        startDate: firebase.firestore.Timestamp.fromDate(new Date(startDate)),
        endDate: firebase.firestore.Timestamp.fromDate(new Date(endDate))
    };

    if (newSlideImage) {
        const storageRef = storage.ref();
        const newImageRef = storageRef.child(`slides/${newSlideImage.name}`);
        newImageRef.put(newSlideImage).then((snapshot) => {
            snapshot.ref.getDownloadURL().then((newUrl) => {
                updateData.slideImage = newUrl;
                db.collection('promotion').doc(promoId).update(updateData)
                    .then(() => {
                        const currentImageUrl = document.querySelector('#editSlideImage').dataset.currentImageUrl;
                        const oldImageRef = storage.refFromURL(currentImageUrl);
                        oldImageRef.delete().then(() => {
                            alert('Promo code updated successfully!');
                            $('#editPromoModal').modal('hide');
                            fetchPromoCodes();
                        }).catch((error) => {
                            console.error('Error deleting old image from storage: ', error);
                        });
                    })
                    .catch((error) => {
                        console.error('Error updating promo code: ', error);
                    });
            }).catch((error) => {
                console.error('Error getting new image URL: ', error);
            });
        }).catch((error) => {
            console.error('Error uploading new image: ', error);
        });
    } else {
        db.collection('promotion').doc(promoId).update(updateData)
            .then(() => {
                alert('Promo code updated successfully!');
                $('#editPromoModal').modal('hide');
                fetchPromoCodes();
            })
            .catch((error) => {
                console.error('Error updating promo code: ', error);
            });
    }
});

// Fetch promo codes when the page loads
document.addEventListener('DOMContentLoaded', fetchPromoCodes);
