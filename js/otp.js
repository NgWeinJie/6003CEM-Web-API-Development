const stripe = Stripe('pk_test_51RSxGMPBTfKCtpdh8bdgV3pCyK9MHBSRaR1lJtBAjrMTKn7km5YlyGOUfCzMUtGdqBPq8mr5d4lpuVSKO7zNIRd500LbK3sash');
const elements = stripe.elements();




document.addEventListener("DOMContentLoaded", () => {

    (function () {
        emailjs.init("9R5K8FyRub386RIu8");
    })();

    const userId = localStorage.getItem("uid");
    console.log("User ID from localStorage:", userId);


    if (!userId) {
        alert("You must be logged in to continue.");
        window.location.href = "../html/login.html";
        return;
    }

    async function fetchUserDetails(userId) {
        try {
            const res = await fetch(`/api/users/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch user details');
            const userData = await res.json();
            displayUserDetails(userData);
        } catch (err) {
            console.error(err);
        }
    }

    function displayUserDetails(user) {
        document.getElementById('email').textContent = user.email || '';
    }

    document.getElementById("resend-otp").addEventListener("click", handleResendOTP);
    document.getElementById("verify-otp").addEventListener("click", async function (e) {
        e.preventDefault();

        try {
            await verifyOTP();

            // Get the userId however you store it (localStorage, context, etc.)
            const userId = localStorage.getItem('uid');  // example

            // Build order object
            const order = await saveOrder(userId);

            // Get payment method ID string from session storage
            const paymentDetails = JSON.parse(localStorage.getItem('paymentDetails'));
            if (!paymentDetails || !paymentDetails.paymentMethodId) throw new Error('Payment method missing');
            const paymentMethodId = paymentDetails.paymentMethodId;

            // Create payment intent on server
            const response = await fetch('/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: order.totalAmount,
                    currency: 'myr',
                    paymentMethodId,
                    customerId: localStorage.getItem('stripeCustomerId') || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Payment intent creation failed');

            if (data.customerId) localStorage.setItem('stripeCustomerId', data.customerId);

            const { clientSecret } = data;

            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: paymentMethodId,
            });

            if (error) {
                alert('Payment failed: ' + error.message);
                return;
            }

            if (paymentIntent.status === 'succeeded') {
                const res = await fetch('/api/payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(order),
                });

                if (!res.ok) {
                    const errText = await res.text();
                    alert('Order submission failed: ' + errText);
                    return;
                }

                try {
                    await deleteCartItems(userId);  // clear cart
                    await updateUserPoints(userId, order.pointsEarned, order.pointsRedeemed);  // update points
                } catch (err) {
                    console.error('Post-payment update failed:', err);
                    // You can choose to alert user or silently fail here
                }

                alert('✅ Payment succeeded and order placed!');
                window.location.href = 'home.html';
            }
        } catch (err) {
            console.error(err);
            alert('Error: ' + err.message);
        }
    });
    fetchUserDetails(userId);

});

function generateOTP() {
    return (Math.floor(100000 + Math.random() * 900000)).toString();
}

function handleResendOTP(e) {
    e.preventDefault();

    const resendBtn = document.getElementById("resend-otp");
    resendBtn.style.pointerEvents = 'none';
    resendBtn.style.opacity = '0.5';

    resendOTP().finally(() => {
        setTimeout(() => {
            resendBtn.style.pointerEvents = 'auto';
            resendBtn.style.opacity = '1';
        }, 30000);
    });
}

async function resendOTP() {
    const resendAttempts = parseInt(localStorage.getItem('resendAttempts') || "0");
    const lastResendTime = localStorage.getItem('lastResendTime');
    const currentTime = Date.now();

    if (resendAttempts >= 4) {
        alert("Too many attempts. Payment canceled.");
        cancelPayment();
        return;
    }

    if (lastResendTime && currentTime - lastResendTime < 30000) {
        const secondsLeft = Math.ceil((30000 - (currentTime - lastResendTime)) / 1000);
        alert(`Wait ${secondsLeft} seconds to resend OTP.`);
        return;
    }

    const otp = generateOTP();
    const expiry = currentTime + 5 * 60 * 1000;

    localStorage.setItem("generatedOTP", otp);
    localStorage.setItem("otpGenerationTime", currentTime.toString());
    localStorage.setItem("otpExpirationTime", expiry.toString());
    localStorage.setItem("lastResendTime", currentTime.toString());
    localStorage.setItem("resendAttempts", (resendAttempts + 1).toString());

    const email = localStorage.getItem("userEmail");
    const name = localStorage.getItem("userName");

    if (!email) {
        alert("User email missing. Please log in again.");
        return;
    }

    await emailjs.send("service_7e6jx2j", "template_l3gma7d", {
        from_name: name,
        to_email: email,
        otp: otp,
        expiration_time: new Date(expiry).toLocaleString()
    });

    alert("OTP resent successfully.");
}

async function handleVerifyOTP(e) {
    e.preventDefault();
    try {
        await verifyOTP();

        const userId = localStorage.getItem("uid");
        if (!userId) throw new Error("Missing user ID.");

        await saveOrder(userId);
    } catch (err) {
        console.error(err);
        alert(err.message || "Verification or order failed.");
    }
}

async function verifyOTP() {
    const enteredOTP = document.getElementById("otp").value.trim();
    const storedOTP = localStorage.getItem("generatedOTP");
    const expiry = parseInt(localStorage.getItem("otpExpirationTime"), 10);
    const current = Date.now();

    if (!enteredOTP || enteredOTP.length !== 6) {
        throw new Error("OTP must be 6 digits.");
    }

    if (current > expiry) {
        throw new Error("OTP expired. Please resend.");
    }

    if (enteredOTP !== storedOTP) {
        throw new Error("Invalid OTP. Try again.");
    }
}

function generateTrackingNumber() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function deleteCartItems(userId) {
    const res = await fetch(`/api/cart/clear?userId=${userId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to clear cart.");
}

async function updateUserPoints(userId, earned, redeemed) {
    const res = await fetch(`/api/users/${userId}/points`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pointsEarned: earned, pointsRedeemed: redeemed })
    });
    if (!res.ok) throw new Error("Failed to update points.");
}

async function saveOrder(userId) {
    const name = localStorage.getItem('userName') || '';
    const phone = localStorage.getItem('userPhone') || '';
    const address = localStorage.getItem('userAddress') || '';
    const postcode = localStorage.getItem('userPostcode') || '';
    const city = localStorage.getItem('userCity') || '';
    const state = localStorage.getItem('userState') || '';
    const remark = localStorage.getItem('userRemark') || '';
    const promoCode = localStorage.getItem('promoCode') || '';
    const discount = Number(localStorage.getItem('discount')) || 0;

    const total = parseFloat(localStorage.getItem('totalAmount')) || 0;
    const userCoins = parseInt(localStorage.getItem('userCoins')) || 0;
    const redeemSwitch = localStorage.getItem('redeemCoinsSwitch') === "true";
    const cartItemsWithImage = JSON.parse(localStorage.getItem('cartItemsWithImage')) || [];

    const coinsDiscount = redeemSwitch ? userCoins * 0.01 : 0;
    const pointsRedeemed = redeemSwitch ? userCoins : 0;
    const pointsEarned = Math.floor(total);

    const cartItems = cartItemsWithImage.map(item => ({
        productName: item.productName,
        productPrice: item.productPrice,
        productQuantity: item.productQuantity,
        productImage: Array.isArray(item.productImage) ? item.productImage[0] : item.productImage
    }));

    const order = {
        userId,
        userName: name,
        userPhone: phone,
        userAddress: address,
        userPostcode: postcode,
        userCity: city,
        userState: state,
        userRemark: remark,
        cartItems,
        totalAmount: total,
        shippingFee: 10.00,
        status: "Order Received",
        trackingNumber: generateTrackingNumber(),
        promoCode: promoCode || '',
        discount: discount || 0,
        coinsDiscount,
        pointsEarned,
        pointsRedeemed
    };

    return order;
}

function cancelPayment() {
    alert("Payment canceled due to too many OTP attempts.");
    ["generatedOTP", "otpGenerationTime", "otpExpirationTime", "lastResendTime", "resendAttempts"].forEach(key => {
        localStorage.removeItem(key);
    });
    window.location.href = "../html/payment.html";
}

