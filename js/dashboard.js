document.addEventListener('DOMContentLoaded', () => {
  const productTableBody = document.querySelector('#productTable');
  const searchInput = document.getElementById('searchInput');
  let allProducts = [];

  fetchProducts();

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products');
      const products = await res.json();
      allProducts = products;
      displayProducts(products);
    } catch (err) {
      console.error('Error fetching products:', err);
      alert('Failed to load products.');
    }
  }

  function displayProducts(products) {
    productTableBody.innerHTML = '';

    products.forEach(product => {
      const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'placeholder.png';

      const row = document.createElement('tr');
      row.innerHTML = `
          <td><img src="${imageUrl}" alt="${product.title}" width="100"></td>
          <td><input type="text" class="form-control form-control-sm" value="${product.title}" data-field="title" /></td>
          <td><input type="text" class="form-control form-control-sm" value="${product.price}" data-field="price" /></td>
          <td><input type="number" class="form-control form-control-sm" value="${product.stock}" data-field="stock" /></td>
          <td><span class="form-control-plaintext">${product.category}</span></td>
          <td><textarea class="form-control form-control-sm" data-field="description">${product.description}</textarea></td>
          <td>
              <button class="btn btn-sm btn-success save-btn" data-id="${product._id}">Save</button>
              <button class="btn btn-sm btn-danger delete-btn" data-id="${product._id}">Delete</button>
          </td>
      `;
      productTableBody.appendChild(row);
    });
  }

  // Manual search by button
  window.searchProduct = function () {
    const keyword = searchInput.value.trim().toLowerCase();
    const filtered = allProducts.filter(p => p.title.toLowerCase().includes(keyword));
    displayProducts(filtered);
  };

  // Refresh when input is cleared
  searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.trim().toLowerCase();
    if (keyword === '') {
      displayProducts(allProducts);s
    }
  });

  productTableBody.addEventListener('click', async e => {
    const btn = e.target;
    const row = btn.closest('tr');
    const productId = btn.dataset.id;

    if (btn.classList.contains('save-btn')) {
      const inputs = row.querySelectorAll('[data-field]');
      const updatedData = {};
      inputs.forEach(input => {
        updatedData[input.dataset.field] = input.value;
      });

      try {
        const res = await fetch(`/api/products/${productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        });

        if (!res.ok) throw new Error('Failed to update');
        alert('Product updated successfully!');
        fetchProducts();
      } catch (err) {
        console.error('Update error:', err);
        alert('Update failed.');
      }
    }

    if (btn.classList.contains('delete-btn')) {
      if (!confirm('Are you sure you want to delete this product?')) return;

      try {
        const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });

        if (!res.ok) throw new Error('Delete failed');
        alert('Product deleted!');
        fetchProducts();
      } catch (err) {
        console.error('Delete error:', err);
        alert('Delete failed.');
      }
    }
  });
});