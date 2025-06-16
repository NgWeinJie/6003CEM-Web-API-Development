document.addEventListener('DOMContentLoaded', () => {
  const userId = localStorage.getItem('uid');

  if (!userId) {
    alert('Please log in to view your order history.');
    window.location.href = 'login.html';
    return;
  }

  const fetchOrderHistory = () => {
    fetch(`/api/orders?userId=${userId}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch order history');
        return response.json();
      })
      .then(orders => {
        const orderHistoryContainer = document.getElementById('orderHistory');
        orderHistoryContainer.innerHTML = '';

        orders.forEach(order => {
          const orderId = order._id;
          // const trackingUrl = `http://192.168.100.15:8080/track/${order.trackingNumber}`;
          // const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingUrl)}`;

          const orderCard = document.createElement('div');
          orderCard.classList.add('card', 'order-card');
          orderCard.innerHTML = `
            <div class="card-body">
              <h5 class="card-title">Order ID: ${orderId}</h5>
              <p class="card-text"><strong>Name:</strong> ${order.userName}</p>
              <p class="card-text"><strong>Phone:</strong> ${order.userPhone}</p>
              <p class="card-text"><strong>Address:</strong> ${order.userAddress}, ${order.userCity}, ${order.userState}, ${order.userPostcode}</p>
              <p class="card-text"><strong>Remark:</strong> ${order.userRemark}</p>
              <p class="card-text"><strong>Date:</strong> ${new Date(order.timestamp).toLocaleString()}</p>
              <p class="card-text"><strong>Status:</strong> <span class="text-success font-weight-bold">${order.status}</span></p>
              <p class="card-text"><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
              <h6 class="mt-3"><strong>Cart Items:</strong></h6>
              <div id="cart-items-${orderId}" class="cart-items-container table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
                ${order.promoCode ? `<p class="card-text text-right"><strong>Promo Code:</strong> ${order.promoCode}</p>` : ''}
                ${order.discount ? `<p class="card-text text-right"><strong>Promo Code Discount:</strong> -RM ${order.discount}</p>` : ''}
                ${order.coinsDiscount ? `<p class="card-text text-right"><strong>Redeem Coins Discount:</strong> -RM ${order.coinsDiscount.toFixed(2)}</p>` : ''}
                <p class="card-text text-right"><strong>Shipping Fee:</strong> RM ${order.shippingFee}</p>
                <p class="card-text text-right"><strong>Total Amount:</strong> RM ${order.totalAmount.toFixed(2)}</p>
            
                <button class="btn btn-primary reorder-all-button" data-order-id="${orderId}">Reorder All Items</button>
              </div>
            </div>
          `;
          // <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
          // <img src="${qrCodeUrl}" alt="QR Code for tracking" />
          orderHistoryContainer.appendChild(orderCard);

          const cartItemsTableBody = document.querySelector(`#cart-items-${orderId} tbody`);
          order.cartItems.forEach(item => {
            const productImageUrl = item.productImage || 'https://via.placeholder.com/50';
            const cartItemRow = document.createElement('tr');
            cartItemRow.innerHTML = `
              <td><img src="${productImageUrl}" alt="${item.productName}" class="product-image img-fluid"></td>
              <td>${item.productName}</td>
              <td>${item.productQuantity}</td>
              <td>RM ${item.productPrice.toFixed(2)}</td>
              <td>RM ${(item.productPrice * item.productQuantity).toFixed(2)}</td>
            `;
            cartItemsTableBody.appendChild(cartItemRow);
          });

          // Reorder all items button
          const reorderButton = orderCard.querySelector('.reorder-all-button');
          reorderButton.addEventListener('click', () => reorderItems(order.cartItems));
        });
      })
      .catch(error => {
        console.error('Error fetching order history:', error);
        alert('Failed to fetch order history. Please try again later.');
      });
  };

  const reorderItems = (items) => {
    fetch('/api/cart/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, items })
    })
      .then(response => {
        if (!response.ok) throw new Error('Reorder failed');
        return response.json();
      })
      .then(() => {
        alert('Items reordered successfully!');
      })
      .catch(error => {
        console.error('Reorder error:', error);
        alert('Failed to reorder items. Please try again later.');
      });
  };

  // Initial load
  fetchOrderHistory();
});
