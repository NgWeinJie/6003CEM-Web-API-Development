let tableBody;

// Fetch cart items from REST API and render
async function fetchCartItems(userId) {
  if (!userId) {
    alert('Please log in to view your cart.');
    return;
  }

  const cartItemsContainer = document.getElementById('cartItems');
  cartItemsContainer.innerHTML = '';

  try {
    // Use userId directly (string)
    const res = await fetch(`/api/cart?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error('Failed to fetch cart items');
    const cartItems = await res.json();

    if (cartItems.length === 0) {
      cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
      document.getElementById('totalPrice').textContent = 'RM 0.00';
      return;
    }

    const table = document.createElement('table');
    table.classList.add('table', 'table-bordered');

    const tableHeader = document.createElement('thead');
    tableHeader.innerHTML = `
      <tr>
        <th>No</th>
        <th>Image</th>
        <th>Name</th>
        <th>Price</th>
        <th>Quantity</th>
        <th>Delete</th>
      </tr>
    `;
    table.appendChild(tableHeader);

    tableBody = document.createElement('tbody');

    let counter = 1;
    let totalPrice = 0;

    for (const cartItem of cartItems) {
      const row = document.createElement('tr');

      // No
      const numberCell = document.createElement('td');
      numberCell.textContent = counter++;
      row.appendChild(numberCell);

      // Image
      const imageCell = document.createElement('td');
      const image = document.createElement('img');
      image.src = cartItem.productImageURL || cartItem.productImage[0]; // fallback if needed
      image.alt = cartItem.productName;
      image.style.width = '120px';
      image.style.height = '120px';
      imageCell.appendChild(image);
      row.appendChild(imageCell);

      // Name
      const nameCell = document.createElement('td');
      nameCell.textContent = cartItem.productName;
      row.appendChild(nameCell);

      // Price
      const priceCell = document.createElement('td');
      const productPrice = cartItem.productPrice || 0;
      priceCell.textContent = 'RM ' + parseFloat(productPrice).toFixed(2);
      row.appendChild(priceCell);

      // Quantity
      const quantityCell = document.createElement('td');

      const minusButton = document.createElement('button');
      minusButton.textContent = '-';
      minusButton.classList.add('btn', 'btn-danger', 'mr-1');

      const quantityInput = document.createElement('input');
      quantityInput.type = 'number';
      quantityInput.value = cartItem.productQuantity;
      quantityInput.classList.add('form-control', 'd-inline-block', 'w-25', 'text-center');
      quantityInput.setAttribute('max', cartItem.productStock);

      const plusButton = document.createElement('button');
      plusButton.textContent = '+';
      plusButton.classList.add('btn', 'btn-success', 'ml-1');

      async function updateQuantity(newQty) {
        if (newQty < 1) newQty = 1;
        if (newQty > cartItem.productStock) newQty = cartItem.productStock;
        quantityInput.value = newQty;
        await updateCartItemQuantity(cartItem._id, newQty);
        updateTotalPrice();
      }

      quantityInput.addEventListener('input', () => {
        let val = parseInt(quantityInput.value);
        if (isNaN(val) || val < 1) val = 1;
        if (val > cartItem.productStock) val = cartItem.productStock;
        updateQuantity(val);
      });

      minusButton.addEventListener('click', () => {
        let val = parseInt(quantityInput.value) - 1;
        if (val < 1) val = 1;
        updateQuantity(val);
      });

      plusButton.addEventListener('click', () => {
        let val = parseInt(quantityInput.value) + 1;
        if (val > cartItem.productStock) val = cartItem.productStock;
        updateQuantity(val);
      });

      quantityCell.appendChild(minusButton);
      quantityCell.appendChild(quantityInput);
      quantityCell.appendChild(plusButton);
      row.appendChild(quantityCell);

      // Delete button
      const deleteCell = document.createElement('td');
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.classList.add('btn', 'btn-danger');

      deleteButton.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this item from cart?')) {
          try {
            const delRes = await fetch(`/api/cart/${cartItem._id}`, { method: 'DELETE' });
            if (!delRes.ok) throw new Error('Delete failed');
            row.remove();
            alert('Item deleted successfully!');
            renumberProducts();
            updateTotalPrice();
          } catch (err) {
            alert('Failed to delete item. Please try again later.');
            console.error(err);
          }
        }
      });

      deleteCell.appendChild(deleteButton);
      row.appendChild(deleteCell);

      tableBody.appendChild(row);

      totalPrice += productPrice * parseInt(quantityInput.value);
    }

    table.appendChild(tableBody);
    cartItemsContainer.appendChild(table);

    updateTotalPrice();

    // Promo code & payment logic unchanged

  } catch (error) {
    console.error('Error fetching cart items:', error);
    alert('Failed to fetch cart items. Please try again later.');
  }
}

// PATCH update cart item quantity on server
async function updateCartItemQuantity(cartItemId, newQuantity) {
  try {
    const res = await fetch(`/api/cart/${cartItemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productQuantity: newQuantity })
    });
    if (!res.ok) throw new Error('Failed to update quantity');
    console.log('Cart item quantity updated successfully!');
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
  }
}

function updateTotalPrice() {
  let totalPrice = 0;
  const rows = tableBody.querySelectorAll('tr');
  rows.forEach(row => {
    const priceCell = row.querySelector('td:nth-child(4)');
    const quantityInput = row.querySelector('td:nth-child(5) input');
    if (priceCell && quantityInput) {
      const productPrice = parseFloat(priceCell.textContent.replace('RM ', '')) || 0;
      const quantity = parseInt(quantityInput.value) || 0;
      totalPrice += productPrice * quantity;
    }
  });
  const totalPriceElement = document.getElementById('totalPrice');
  totalPriceElement.textContent = 'RM ' + totalPrice.toFixed(2);
}

function renumberProducts() {
  const rows = tableBody.querySelectorAll('tr');
  let counter = 1;
  rows.forEach(row => {
    row.querySelector('td:nth-child(1)').textContent = counter++;
  });
}

// On DOM load, get user ID from localStorage and fetch cart
document.addEventListener('DOMContentLoaded', () => {
  const uid = localStorage.getItem('uid');  // <-- read user ID here

  if (uid) {
    fetchCartItems(uid);
  } else {
    alert('Please log in to view your cart.');
  }
});
