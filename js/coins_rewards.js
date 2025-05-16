// Assuming you already have Firebase initialized and user authenticated
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


// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Function to fetch user data
const fetchUserData = (userId) => {
    db.collection('users').doc(userId).get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            const userCoins = userData.points || 0;
            document.getElementById('userCoins').textContent = `Coins Balance: ${userCoins}`;
        } else {
            console.log('No such document!');
        }
    }).catch((error) => {
        console.error('Error getting user data:', error);
    });
};

// Function to render vouchers
const renderVouchers = () => {
    db.collection('vouchers').where('stocks', '!=', '0').get().then((querySnapshot) => {
        const voucherContainer = document.getElementById('voucherContainer');
        voucherContainer.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const voucher = doc.data();
            const card = `
                <div class="col-md-4 mb-4">
                    <div class="card">
                        <img src="${voucher.image}" class="card-img-top" alt="${voucher.name}">
                        <div class="card-body">
                            <h5 class="card-title">${voucher.name}</h5>
                            <p class="card-text"><strong>Stocks:</strong> ${voucher.stocks}</p>
                            <p class="card-text"><strong>Cost (Coins):</strong> ${voucher.cost}</p>
                            <p class="card-text"><strong>How to Use:</strong> ${voucher.whereToUse}</p>
                            <button class="btn btn-primary" onclick="redeemVoucher('${doc.id}', ${voucher.cost})">Redeem</button>
                            <a href="#" class="card-link terms-link" data-toggle="termsModal" data-terms="${voucher.termsConditions}">Terms & Conditions</a>
                            <div id="promoCode-${doc.id}" class="mt-2"></div>
                        </div>
                    </div>
                </div>
            `;
            voucherContainer.insertAdjacentHTML('beforeend', card);
        });
    });
};

// Function to record redemption in Firestore
const recordRedemption = async (userId, voucherId, voucher, promoCode) => {
    try {
        const redemptionData = {
            userId: userId,
            voucherId: voucherId,
            voucherName: voucher.name,
            promoCode: promoCode,
            redeemedAt: firebase.firestore.Timestamp.now()
        };

        // Add redemption data to 'redeemHistory' collection
        await db.collection('redeemHistory').add(redemptionData);
    } catch (error) {
        console.error('Error recording redemption:', error);
        throw error;
    }
};

const redeemVoucher = (voucherId, cost) => {
    const user = auth.currentUser;
    if (user) {
        const userId = user.uid;
        $('#redeemModal').modal('show'); // Show redeem confirmation modal

        $('#redeemConfirmBtn').on('click', () => {
            db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(db.collection('users').doc(userId));
                const voucherDoc = await transaction.get(db.collection('vouchers').doc(voucherId));

                if (!userDoc.exists) {
                    throw 'User does not exist!';
                }

                if (!voucherDoc.exists) {
                    throw 'Voucher does not exist!';
                }

                const userCoins = userDoc.data().points || 0;
                const voucher = voucherDoc.data();

                if (userCoins < cost) {
                    $('#redeemModal').modal('hide'); // Hide modal if not enough coins
                    alert('Not enough coins to redeem this voucher.');
                    return;
                }

                transaction.update(db.collection('users').doc(userId), {
                    points: userCoins - cost
                });

                const promoCode = `PROMO-${Math.random().toString(36).substr(2, 6)}`;
                document.getElementById('redeemModalContent').innerHTML = `
                    <p>Are you sure you want to redeem this voucher?</p>
                    <p>Promo Code: <strong>${promoCode}</strong></p>
                `;

                await recordRedemption(userId, voucherId, voucher, promoCode);

                transaction.update(db.collection('vouchers').doc(voucherId), {
                    stocks: voucher.stocks - 1
                });

                // Transaction completed successfully, show success message
                $('#redeemModal').modal('hide');
                alert('Voucher redeemed successfully!');
                fetchRedeemHistory(userId);
            }).catch((error) => {
                console.error('Transaction failed:', error);
                $('#redeemModal').modal('hide');
                alert('Failed to redeem voucher. Please try again later.');
            });
        });
    } else {
        alert('User not logged in. Please log in to redeem vouchers.');
    }
};


// Function to fetch and display redeem history for current user
const fetchRedeemHistory = (userId) => {
    db.collection('redeemHistory').where('userId', '==', userId).orderBy('redeemedAt', 'desc').get()
        .then((querySnapshot) => {
            const redeemHistoryContainer = document.getElementById('redeemHistoryContainer');
            redeemHistoryContainer.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const redemption = doc.data();
                const redemptionCard = `
                    <div class="card mb-3">
                        <div class="card-body">
                            <h5 class="card-title">${redemption.voucherName}</h5>
                            <p class="card-text"><strong>Promo Code:</strong> ${redemption.promoCode}</p>
                            <p class="card-text"><strong>Redeemed At:</strong> ${redemption.redeemedAt.toDate()}</p>
                        </div>
                    </div>
                `;
                redeemHistoryContainer.insertAdjacentHTML('beforeend', redemptionCard);
            });
        })
        .catch((error) => {
            console.error('Error fetching redeem history:', error);
        });
};

// Event delegation to handle Terms & Conditions modal
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('terms-link')) {
        event.preventDefault();
        const termsText = event.target.dataset.terms;
        document.getElementById('termsText').textContent = termsText;
        $('#termsModal').modal('show');
    }
});

// Check if user is authenticated
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        const userId = user.uid;
        fetchUserData(userId);
        renderVouchers();
        fetchRedeemHistory(userId);
    } else {
        alert('User not logged in. Please log in to view and redeem vouchers.');
    }
});
