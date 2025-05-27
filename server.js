const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://User:1234@cluster0.oro1vef.mongodb.net/webApi';

app.use(express.json());

// === MONGOOSE (for orders) ===
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB (Mongoose)'))
  .catch(err => console.error('❌ Mongoose connection error:', err));

// Order Schema (Mongoose)
const orderSchema = new mongoose.Schema({
  userId: String,
  userName: String,
  userPhone: String,
  userAddress: String,
  userPostcode: String,
  userCity: String,
  userState: String,
  userRemark: String,
  orderId: String,
  cartItems: [{ productName: String, productPrice: Number, productQuantity: Number, productImage: String }],
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

// === NATIVE MONGODB CLIENT (for cart, users, etc.) ===
const client = new MongoClient(MONGO_URI);
const dbName = 'webApi';
const cartCollection = 'cart';

// Fix for MongoDB native driver connection
let cachedClient = null;
let cachedDb = null;

async function connectDB() {
  if (cachedDb) return cachedDb; 

  if (!cachedClient) {
    cachedClient = new MongoClient(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db(dbName);
  return cachedDb;
}


// === MIDDLEWARE ===
app.use(cors());
app.use(express.json());

// === STATIC FILES ===
app.use(express.static(path.join(__dirname, 'html')));
app.use('/html', express.static(path.join(__dirname, 'html')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/image', express.static(path.join(__dirname, 'image')));

// === ROOT ROUTE ===
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'home.html'));
});

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency } = req.body;

    const amountInSen = Math.round(amount * 100); 
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSen,
      currency: currency,
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating PaymentIntent:', error);
    res.status(500).json({ error: 'Failed to create PaymentIntent' });
  }
});

// === ORDER QR CODE APIs ===
app.post('/api/payment', async (req, res) => {
  try {
    console.log('Received order:', req.body);

    const orderData = req.body;

    // Use your machine's LAN IP here, not localhost
    const serverIp = '192.168.100.15';
    const trackingUrl = `http://${serverIp}:${PORT}/track/${orderData.trackingNumber}?v=${Date.now()}`;
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

    const orderId = order._id;
    const trackingUrl = `http://${req.hostname}:${PORT}/track/${order.trackingNumber}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingUrl)}`;

    const cartItemsHtml = order.cartItems.map(item => `
      <tr>
        <td><img src="${item.productImage || 'https://via.placeholder.com/50'}" width="250"/></td>
        <td>${item.productName}</td>
        <td>${item.productQuantity}</td>
        <td>RM ${item.productPrice.toFixed(2)}</td>
        <td>RM ${(item.productPrice * item.productQuantity).toFixed(2)}</td>
      </tr>
    `).join('');

    res.send(`
      <html>
        <head>
          <title>Tracking Info</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .card { border: 1px solid #ccc; padding: 20px; border-radius: 10px; }
            img { margin-top: 10px; }
            .card-text {text-align: right; padding-right:20px;}
            .promo-code {padding-top: 30px; text-align: right; padding-right:20px;}
            table {margin-left:10px;}
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Order Tracking</h1>
            <p><strong>Name:</strong> ${order.userName}</p>
            <p><strong>Phone:</strong> ${order.userPhone}</p>
            <p><strong>Address:</strong> ${order.userAddress}, ${order.userCity}, ${order.userState}, ${order.userPostcode}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Date:</strong> ${new Date(order.timestamp).toLocaleString()}</p>
            <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
            <h4>Items:</h4>
            <table border="1" cellpadding="35" cellspacing="0">
              <thead>
                <tr><th>Image</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
              </thead>
              <tbody>${cartItemsHtml}</tbody>
            </table>
            ${order.coinsDiscount ? `<p class="promo-code"><strong>Redeem Coins Discount:</strong> -RM ${order.coinsDiscount.toFixed(2)}</p>` : ''}
            <p class="card-text"><strong>Shipping Fee:</strong> RM ${order.shippingFee}</p>
            <p class="card-text"><strong>Total Amount:</strong> RM ${order.totalAmount.toFixed(2)}</p>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send('<h1>Server error</h1>');
  }
});

app.get('/api/users/:uid', async (req, res) => {
  const uid = req.params.uid;

  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection('users');

    const user = await users.findOne({ uid: uid });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  } finally {
    await client.close();
  }
});

// PUT /api/users/:uid - Update user details
app.put('/api/users/:uid', async (req, res) => {
  const uid = req.params.uid;
  const updatedData = req.body; // Contains fields like email, address, phoneNumber, etc.

  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection('users');

    const result = await users.updateOne(
      { uid: uid }, // Filter by user UID
      { $set: updatedData } // Update the fields sent in request body
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  } finally {
    await client.close();
  }
});


// === USER POINTS API ===
app.patch('/api/users/:userId/points', async (req, res) => {
  const userId = req.params.userId;
  const { pointsEarned, pointsRedeemed } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne({ uid: userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate the new points balance
    const currentPoints = user.points || 0;
    const newPoints = currentPoints + (pointsEarned || 0) - (pointsRedeemed || 0);

    // Update the user's points
    const result = await db.collection('users').updateOne(
      { uid: userId },
      { $set: { points: newPoints } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({
        message: 'User points updated successfully',
        previousPoints: currentPoints,
        earned: pointsEarned || 0,
        redeemed: pointsRedeemed || 0,
        currentPoints: newPoints
      });
    } else {
      res.status(500).json({ message: 'Failed to update user points' });
    }
  } catch (error) {
    console.error('❌ Error updating user points:', error);
    res.status(500).json({ message: 'Failed to update user points' });
  }
});

// === CLEAR CART API ===
app.delete('/api/cart/clear', async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const db = await connectDB();
    const result = await db.collection(cartCollection).deleteMany({ userId });

    res.status(200).json({
      message: 'Cart cleared successfully',
      itemsDeleted: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error clearing cart:', error);
    res.status(500).json({ message: 'Failed to clear cart' });
  }
});

// === REORDER ALL ITEMS API ===
app.post('/api/cart/reorder', async (req, res) => {
  const { userId, items } = req.body;

  if (!userId || !Array.isArray(items)) {
    return res.status(400).json({ message: 'userId and items array are required' });
  }

  try {
    const db = await connectDB();
    const collection = db.collection(cartCollection);

    const itemsToInsert = items.map(item => ({
      userId,
      productName: item.productName,
      productPrice: item.productPrice,
      productQuantity: item.productQuantity,
      productImage: item.productImage || '',
    }));

    await collection.insertMany(itemsToInsert);

    res.status(200).json({ message: 'Reordered items added to cart' });
  } catch (error) {
    console.error('❌ Reorder error:', error);
    res.status(500).json({ message: 'Failed to reorder items' });
  }
});

// === CART APIs ===

app.get('/api/cart', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ message: 'Missing userId query parameter' });

  try {
    const db = await connectDB();
    const collection = db.collection(cartCollection);
    const items = await collection.find({ userId }).toArray();
    res.status(200).json(items);
  } catch (error) {
    console.error('❌ Failed to fetch cart items:', error);
    res.status(500).json({ message: 'Failed to fetch cart items' });
  }
});

app.get('/api/cart/:userId', async (req, res) => {
  const userId = req.params.userId;
  console.log('Received request for userId:', userId);

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId parameter' });
  }

  try {
    const db = await connectDB();  // Now connection should be live
    const collection = db.collection('cart');
    const items = await collection.find({ userId }).toArray();
    res.status(200).json(items);

  } catch (error) {
    console.error('Failed to fetch cart items:', error);
    res.status(500).json({ message: 'Failed to fetch cart items' });
  }
});


app.post('/api/cart', async (req, res) => {
  const cartItem = req.body;
  if (!cartItem.userId) return res.status(401).json({ message: 'Please login before adding to cart' });

  try {
    const db = await connectDB();
    const result = await db.collection(cartCollection).insertOne(cartItem);
    res.status(200).json({ message: 'Cart item added', itemId: result.insertedId });
  } catch (error) {
    console.error('❌ Insert failed:', error);
    res.status(500).json({ message: 'Failed to add cart item' });
  }
});

app.patch('/api/cart/:id', async (req, res) => {
  const { id } = req.params;
  const { productQuantity } = req.body;
  if (productQuantity == null) return res.status(400).json({ message: 'Missing productQuantity' });

  try {
    const db = await connectDB();
    const result = await db.collection(cartCollection).updateOne(
      { _id: new ObjectId(id) },
      { $set: { productQuantity: parseInt(productQuantity) } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: 'Cart item quantity updated' });
    } else {
      res.status(404).json({ message: 'Cart item not found' });
    }
  } catch (error) {
    console.error('❌ Update failed:', error);
    res.status(500).json({ message: 'Failed to update cart item' });
  }
});

app.delete('/api/cart/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const db = await connectDB();
    const result = await db.collection(cartCollection).deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 1) {
      res.status(200).json({ message: 'Cart item deleted' });
    } else {
      res.status(404).json({ message: 'Cart item not found' });
    }
  } catch (error) {
    console.error('❌ Delete failed:', error);
    res.status(500).json({ message: 'Failed to delete cart item' });
  }
});

// === USER REGISTRATION ===
app.post('/api/register', async (req, res) => {
  const userData = req.body;
  console.log('Received userData:', userData);

  // Sanitize input: remove undefined fields
  const sanitizedUserData = {};
  for (const key in userData) {
    if (userData[key] !== undefined) {
      sanitizedUserData[key] = userData[key];
    }
  }
  console.log('Sanitized userData:', sanitizedUserData);

  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection('users');

    const result = await users.insertOne(sanitizedUserData);
    console.log('Insert result:', result);

    res.status(200).json({ message: 'User registered successfully', id: result.insertedId });
  } catch (error) {
    console.error('❌ Error saving user:', error);
    res.status(500).json({ message: 'Failed to register user', error: error.message });
  } finally {
    await client.close();
  }
});


// === START SERVER ===
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
// });

app.listen(PORT, 'localhost', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
