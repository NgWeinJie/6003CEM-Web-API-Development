const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://User:1234@cluster0.oro1vef.mongodb.net/webApi';
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

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

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, required: true },  // your UID from Firebase
  email: { type: String, required: true },
  firstName: String,
  lastName: String,
  address: String,
  phoneNumber: String,
  postcode: String,
  city: String,
  state: String,
  points: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);


// === NATIVE MONGODB CLIENT (for cart, users, etc.) ===
const client = new MongoClient(MONGO_URI);
const dbName = 'webApi';
const cartCollection = 'cart';

async function connectDB() {
  if (!client.isConnected?.()) {
    await client.connect();
  }
  return client.db(dbName);
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

// server.js or routes/payment.js
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, paymentMethodId, customerId } = req.body;

    // Convert amount to smallest currency unit (e.g., cents)
    const amountInSen = Math.round(amount * 100);

    let customer = customerId;

    // Create a new customer if no ID provided
    if (!customer) {
      const newCustomer = await stripe.customers.create();
      customer = newCustomer.id;
    }

    // Attach payment method if not already attached
    try {
      await stripe.paymentMethods.attach(paymentMethodId, { customer });
    } catch (err) {
      if (err.code !== 'payment_method_already_attached') {
        throw err;
      }
    }

    // Update customer's default payment method
    await stripe.customers.update(customer, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Create PaymentIntent but DO NOT confirm here (confirm: false)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSen,
      currency,
      customer,
      payment_method: paymentMethodId,
      off_session: false,
      confirm: false,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      customerId: customer,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating PaymentIntent:', error);
    res.status(500).json({ error: error.message });
  }
});


// === ORDER APIs ===
// app.post('/api/payment', async (req, res) => {
//   try {
//     const orderData = req.body;
//     const serverIp = process.env.SERVER_IP || '127.0.0.1';
//     const trackingUrl = `http://${serverIp}:${PORT}/track/${orderData.trackingNumber}`;
//     orderData.trackingUrl = trackingUrl;

//     const order = new Order(orderData);
//     await order.save();

//     const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingUrl)}`;

//     res.status(201).json({
//       message: 'Order saved',
//       trackingNumber: order.trackingNumber,
//       pointsEarned: order.pointsEarned,
//       qrCodeUrl,
//     });
//   } catch (error) {
//     console.error('❌ Error saving order:', error);
//     res.status(500).json({ error: 'Failed to save order' });
//   }
// });

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ timestamp: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/track/:trackingNumber', async (req, res) => {
  try {
    const order = await Order.findOne({ trackingNumber: req.params.trackingNumber });
    if (!order) {
      return res.status(404).send('<h1>Tracking info not found</h1>');
    }

    res.send(`
      <h1>Tracking Information</h1>
      <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Order Date:</strong> ${new Date(order.timestamp).toLocaleString()}</p>
      <p><strong>Shipping Address:</strong> ${order.userAddress}, ${order.userCity}, ${order.userState}, ${order.userPostcode}</p>
    `);
  } catch (err) {
    console.error('❌ Tracking error:', err);
    res.status(500).send('<h1>Server error</h1>');
  }
});

app.get('/api/users/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne({ uid: userId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

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

  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection('users');

    const result = await users.insertOne(userData);
    res.status(200).json({ message: 'User registered successfully', id: result.insertedId });
  } catch (error) {
    console.error('❌ Error saving user:', error);
    res.status(500).json({ message: 'Failed to register user' });
  } finally {
    await client.close();
  }
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
