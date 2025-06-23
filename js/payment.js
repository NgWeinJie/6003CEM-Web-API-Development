const stripe = Stripe('pk_test_51RSxGMPBTfKCtpdh8bdgV3pCyK9MHBSRaR1lJtBAjrMTKn7km5YlyGOUfCzMUtGdqBPq8mr5d4lpuVSKO7zNIRd500LbK3sash');
const elements = stripe.elements();

(function () {
  emailjs.init("9R5K8FyRub386RIu8");
})();

function openTab(evt, tabName) {
  const tabcontent = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  const tablinks = document.getElementsByClassName("tablinks");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

window.onload = function () {
  document.querySelector(".tablinks").click();
};

function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const results = regex.exec(window.location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

const promoDiscountElement = document.getElementById('promoDiscount');
const discount = parseFloat(getUrlParameter('discount'));
const promoCode = getUrlParameter('promoCode');
if (discount > 0) {
  promoDiscountElement.textContent = `Promo Discount: RM ${discount.toFixed(2)}`;
}

const currentUser = { id: localStorage.getItem('uid') };

if (!currentUser.id) {
  alert('Please log in first.');
  window.location.href = 'login.html';
}

async function fetchUserDetails(userId) {
  try {
    const res = await fetch(`/api/users/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user details');
    const userData = await res.json();
    displayUserDetails(userData);
    displayUserCoins(userData.points || 0);
  } catch (err) {
    console.error(err);
    displayUserCoins(0);
  }
}

function displayUserDetails(user) {
  document.getElementById('userName').value = `${user.firstName} ${user.lastName}`;
  document.getElementById('userPhone').value = user.phoneNumber || '';
  document.getElementById('userAddress').value = user.address || '';
  document.getElementById('userPostcode').value = user.postcode || '';
  document.getElementById('userCity').value = user.city || '';
  document.getElementById('userState').value = user.state || '';
}

function displayUserCoins(points) {
  const userCoinsElem = document.getElementById('userCoins');
  const redeemCoinsSwitch = document.getElementById('redeemCoinsSwitch');

  userCoinsElem.textContent = points;
  if (points === 0) {
    redeemCoinsSwitch.checked = false;
    redeemCoinsSwitch.disabled = true;
  } else {
    redeemCoinsSwitch.disabled = false;
  }
}

let cartItemsWithImage = [];

async function fetchCartItems(userId) {
  try {
    const res = await fetch(`/api/cart?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch cart items');

    const cartItems = await res.json();
    cartItemsWithImage = cartItems;

    const container = document.getElementById('paymentItems');
    container.innerHTML = ''; 

    if (cartItems.length === 0) {
      container.textContent = 'Your cart is empty.';
      document.getElementById('shippingFee').textContent = '';
      document.getElementById('totalAmount').textContent = '';
      return;
    }

    let totalAmount = 0;
    const shippingFee = 10.00;

    cartItems.forEach(item => {
      const div = document.createElement('div');
      div.classList.add('payment-item');
      div.innerHTML = `
        <img class="product-image" src="${item.productImage}" alt="${item.productName}" style="max-width: 100px; max-height: 100px;">
        <p class="product-name">Product Name: ${item.productName}</p>
        <p class="product-price">Product Price: RM ${item.productPrice.toFixed(2)}</p>
        <p class="product-quantity">Quantity: ${item.productQuantity}</p>
        <br>
      `;
      container.appendChild(div);
      totalAmount += item.productPrice * item.productQuantity;
    });

    const discountElem = document.getElementById('discount');
    const discountAmount = discountElem ? parseFloat(discountElem.textContent) || 0 : 0;
    if (discountAmount > 0) totalAmount -= discountAmount;

    document.getElementById('shippingFee').textContent = `Shipping Fee: RM ${shippingFee.toFixed(2)}`;

    const finalAmount = totalAmount + shippingFee;
    const totalElem = document.getElementById('totalAmount');
    totalElem.textContent = `Total Amount: RM ${finalAmount.toFixed(2)}`;
    totalElem.dataset.originalTotalAmount = finalAmount;

  } catch (err) {
    console.error(err);
    alert('Failed to load cart items.');
  }
}

const cardNumberElement = elements.create('cardNumber');
cardNumberElement.mount('#card-number-element');

const cardExpiryElement = elements.create('cardExpiry');
cardExpiryElement.mount('#card-expiry-element');

const cardCvcElement = elements.create('cardCvc');
cardCvcElement.mount('#card-cvc-element');

async function validateCardDetails() {
  const cardHolderName = document.getElementById('cardHolder').value.trim();

  const { error: cardNumberError, paymentMethod } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardNumberElement,
    billing_details: {
      name: cardHolderName,
    },
  });

  const { error: cardExpiryError } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardExpiryElement,
    billing_details: {
      name: cardHolderName,
    },
  });

  const { error: cardCvcError } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardCvcElement,
    billing_details: {
      name: cardHolderName,
    },
  });

  if (!cardNumberElement || !cardCvcElement || !cardExpiryElement || !cardHolderName) {
    window.alert(`Please fill in all credit card detials.`)
    return false;
  }

  if (cardNumberError) {
    window.alert(`Card Number Error: ${cardNumberError.message}`);
    return false;
  }

  if (cardExpiryError) {
    window.alert(`Card Expiry Error: ${cardExpiryError.message}`);
    return false;
  }

  if (cardCvcError) {
    window.alert(`Card CVC Error: ${cardCvcError.message}`);
    return false;
  }

  const paymentDetails = {
    cardHolderName: cardHolderName,
    paymentMethodId: paymentMethod.id,
  };
  localStorage.setItem('paymentDetails', JSON.stringify(paymentDetails));

  console.log("Payment details stored in session:", paymentDetails);

  return true;
}

function generateOTP() {
  let otpNumber = Math.floor(100000 + Math.random() * 900000);
  return otpNumber.toString();
}

document.getElementById("payment").addEventListener("click", function (e) {
  e.preventDefault();
  SendMailOtp();
});

async function SendMailOtp() {
  try {
    const isCardValid = await validateCardDetails();
    if (!isCardValid) return;

    if (!localStorage.getItem('resendAttempts')) {
      localStorage.setItem('resendAttempts', '1');
    }

    const userId = getCurrentUserId();
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      alert("User not found.");
      return;
    }
    const userData = await response.json();
    const userEmail = userData.email;

    if (!userEmail || userEmail.trim() === "") {
      alert("Invalid email address.");
      return;
    }

    const otp = generateOTP();
    const currentTime = Date.now();
    const expiry = currentTime + 5 * 1000;

    const userName = document.getElementById('userName')?.value || '';
    const phone = document.getElementById('userPhone')?.value || '';
    const address = document.getElementById('userAddress')?.value || '';
    const postcode = document.getElementById('userPostcode')?.value || '';
    const city = document.getElementById('userCity')?.value || '';
    const state = document.getElementById('userState')?.value || '';
    const remark = document.getElementById('userRemark')?.value || '';
    const totalText = document.getElementById('totalAmount')?.textContent || '';
    const total = parseFloat(totalText.split('RM')[1]?.trim()) || 0;
    const userCoins = parseInt(document.getElementById('userCoins')?.textContent || '0', 10);
    const redeemSwitch = document.getElementById('redeemCoinsSwitch');
    const discount = document.getElementById('discount');
    const promoCode = document.getElementById('promoCode')?.value || '';

    const cartElements = document.querySelectorAll('.payment-item');
    const cartItemsWithImage = [];

    cartElements.forEach(itemEl => {
      const productNameRaw = itemEl.querySelector('.product-name')?.textContent || '';
      const productName = productNameRaw.replace('Product Name:', '').trim();

      const productPriceRaw = itemEl.querySelector('.product-price')?.textContent || '';
      const productPrice = parseFloat(productPriceRaw.replace('Product Price: RM', '').trim());

      const productQuantityRaw = itemEl.querySelector('.product-quantity')?.textContent || '';
      const productQuantity = parseInt(productQuantityRaw.replace('Quantity:', '').trim(), 10);

      const productImage = itemEl.querySelector('.product-image')?.src || '';

      if (productName && !isNaN(productPrice) && !isNaN(productQuantity)) {
        cartItemsWithImage.push({
          productName,
          productPrice,
          productQuantity,
          productImage
        });
      } else {
        console.warn('Skipping invalid cart item:', { productName, productPrice, productQuantity, productImage });
      }
    });

    console.log('Collected cart items:', cartItemsWithImage);

    localStorage.setItem("generatedOTP", otp);
    localStorage.setItem("otpExpiry", expiry.toString());
    localStorage.setItem("uid", userId);
    localStorage.setItem("userName", userName);
    localStorage.setItem("userEmail", userEmail);
    localStorage.setItem("userPhone", phone);
    localStorage.setItem("userAddress", address);
    localStorage.setItem("userPostcode", postcode);
    localStorage.setItem("userCity", city);
    localStorage.setItem("userState", state);
    localStorage.setItem("userRemark", remark);
    localStorage.setItem("promoCode", promoCode);
    localStorage.setItem("totalAmount", total.toString());
    localStorage.setItem("userCoins", userCoins.toString());
    localStorage.setItem('discount', discount?.textContent || '0');
    localStorage.setItem("redeemCoinsSwitch", redeemSwitch?.checked ? "true" : "false");
    localStorage.setItem("cartItemsWithImage", JSON.stringify(cartItemsWithImage));

    const templateParams = {
      from_name: userName,
      to_email: userEmail,
      otp: otp,
      expiration_time:new Date(expiry).toLocaleString()
    };

    const result = await emailjs.send('service_7e6jx2j', 'template_l3gma7d', templateParams);
    alert("OTP has been sent to your email.");
    console.log("Email sent:", result);

    window.location.href = "otp.html";

  } catch (error) {
    console.error("Error in SendMailOtp:", error);
    alert("Something went wrong. Please try again.");
  }
}


function getCurrentUserId() {
  const userId = localStorage.getItem('uid');

  if (!userId) {
    alert('Please log in to view your order history.');
    window.location.href = 'login.html';
    return;
  }
  return userId;
}

function updateTotalAmount() {
  const totalElem = document.getElementById('totalAmount');
  const redeemSwitch = document.getElementById('redeemCoinsSwitch');
  const userCoins = parseInt(document.getElementById('userCoins').textContent);
  const originalTotal = parseFloat(totalElem.dataset.originalTotalAmount);

  if (redeemSwitch.checked && userCoins === 0) {
    alert('You have no coins to redeem.');
    redeemSwitch.checked = false;
    return;
  }

  let total = originalTotal;
  let coinsDiscount = 0;

  if (redeemSwitch.checked) {
    coinsDiscount = userCoins * 0.01;
    total -= coinsDiscount;
  }

  totalElem.textContent = `Total Amount: RM ${total.toFixed(2)}`;
  document.getElementById('coinsDiscount').textContent = redeemSwitch.checked ? `Coins Discount: RM ${coinsDiscount.toFixed(2)}` : '';
}

document.getElementById('redeemCoinsSwitch').addEventListener('change', updateTotalAmount);
document.getElementById('backToCartBtn').addEventListener('click', () => window.location.href = 'cart.html');

fetchUserDetails(currentUser.id);
fetchCartItems(currentUser.id);
