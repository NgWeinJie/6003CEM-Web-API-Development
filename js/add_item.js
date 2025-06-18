document.getElementById('addItemForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const formData = new FormData();
  formData.append("title", document.getElementById("itemName").value.trim());
  formData.append("price", document.getElementById("itemPrice").value.trim());
  formData.append("stock", document.getElementById("itemStock").value.trim());
  formData.append("category", document.getElementById("itemCategories").value.trim());
  formData.append("description", document.getElementById("itemDetails").value.trim());

  const fileInput = document.getElementById("itemImage");
  if (fileInput.files.length > 0) {
    formData.append("images", fileInput.files[0]);
  }

  try {
    const response = await fetch("/api/products", {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Failed to add item. Please try again.");
      return;
    }

    alert(result.message || "Item added successfully!");
    document.getElementById('addItemForm').reset();

  } catch (err) {
    console.error("⚠️ Network or server error:", err);
    alert("Network error. Please try again later.");
  }
});
