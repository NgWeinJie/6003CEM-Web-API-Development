document.getElementById('contactForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const name = document.getElementById('userName').value.trim();
  const email = document.getElementById('userEmail').value.trim();
  const message = document.getElementById('userMessage').value.trim();

  if (!name || !email || !message) {
    alert('Please fill out all fields.');
    return;
  }

  try {
    const response = await fetch(`${window.location.origin}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, message })
    });

    const text = await response.text(); 
    console.log('Server response:', text);

    let result;
    try {
      result = JSON.parse(text);
    } catch (err) {
      throw new Error('Response is not valid JSON');
    }

    if (response.ok) {
      alert('Your message has been sent. Thank you!');
      document.getElementById('contactForm').reset();
    } else {
      alert(result.error || 'Something went wrong. Please try again.');
    }
  } catch (err) {
    console.error('Error submitting feedback:', err);
    alert('Failed to submit message. Please try again.');
  }
});
