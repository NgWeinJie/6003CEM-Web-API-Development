const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const port = 8080;

// Connect to MongoDB 
mongoose.connect('mongodb+srv://User:1234@cluster0.oro1vef.mongodb.net/webApi', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Order Schema
const orderSchema = new mongoose.Schema({
  userId: String,
  userName: String,
  userPhone: String,
  userAddress: String,
  userPostcode: String,
  userCity: String,
  userState: String,
  userRemark: String,
  cartItems: [{ productName: String, productPrice: Number, productQuantity: Number }],
  totalAmount: Number,
  shippingFee: Number,
  status: String,
  trackingNumber: String,
  promoCode: String,
  discount: Number,
  coinsDiscount: Number,
  pointsEarned: Number,
  timestamp: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'html')));
app.use('/html', express.static(path.join(__dirname, 'html')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/image', express.static(path.join(__dirname, 'image')));

// Optional: serve home.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'home.html'));
});

// POST API to save order
app.post('/api/payment', async (req, res) => {
  try {
    console.log('Received order:', req.body);

    const orderData = req.body;

    // Use your machine's LAN IP here, not localhost
    const serverIp = '192.168.100.15'; // replace with your actual IP
    const trackingUrl = `http://${serverIp}:${port}/track/${orderData.trackingNumber}`;
    orderData.trackingUrl = trackingUrl;

    const order = new Order(orderData);
    await order.save();

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingUrl)}`;

    res.status(201).json({
      message: 'Order saved',
      trackingNumber: order.trackingNumber,
      pointsEarned: order.pointsEarned,
      qrCodeUrl,
    });
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

// GET all orders (no userId filter)
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ timestamp: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/track/:trackingNumber', async (req, res) => {
  const trackingNumber = req.params.trackingNumber;

  try {
    const order = await Order.findOne({ trackingNumber });
    if (!order) {
      return res.status(404).send('<h1>Tracking info not found</h1>');
    }

    // Render a simple HTML page showing order status
    res.send(`
      <h1>Tracking Information</h1>
      <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Order Date:</strong> ${new Date(order.timestamp).toLocaleString()}</p>
      <p><strong>Shipping Address:</strong> ${order.userAddress}, ${order.userCity}, ${order.userState}, ${order.userPostcode}</p>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send('<h1>Server error</h1>');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
