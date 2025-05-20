const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ✅ Serve static files
app.use(express.static(path.join(__dirname, 'html')));
app.use('/html', express.static(path.join(__dirname, 'html')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/image', express.static(path.join(__dirname, 'image')));

// ✅ Serve home.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'home.html'));
});

// === MONGODB: Native Client for Cart ===
const client = new MongoClient(process.env.MONGO_URI);
const dbName = 'webApi';
const cartCollection = 'cart';

async function connectDB() {
  await client.connect();
  return client.db(dbName);
}

app.get('/api/cart', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ message: 'Missing userId query parameter' });
  }

  try {
    const db = await connectDB();
    const collection = db.collection(cartCollection);
    const items = await collection.find({ userId }).toArray();
    res.status(200).json(items);
  } catch (error) {
    console.error('Failed to fetch cart items:', error);
    res.status(500).json({ message: 'Failed to fetch cart items' });
  }
});

// ✅ POST add item to cart
app.post('/api/cart', async (req, res) => {
  const cartItem = req.body;

  if (!cartItem.userId) {
    return res.status(401).json({ message: 'Please login before adding to cart' });
  }

  try {
    const db = await connectDB();
    const collection = db.collection(cartCollection);

    const result = await collection.insertOne(cartItem);
    res.status(200).json({ message: 'Cart item added', itemId: result.insertedId });
  } catch (error) {
    console.error('Insert failed:', error);
    res.status(500).json({ message: 'Failed to add cart item' });
  }
});

// ✅ PATCH update item quantity by _id
app.patch('/api/cart/:id', async (req, res) => {
  const cartItemId = req.params.id;
  const { productQuantity } = req.body;

  if (productQuantity == null) {
    return res.status(400).json({ message: 'Missing productQuantity in body' });
  }

  try {
    const db = await connectDB();
    const collection = db.collection(cartCollection);

    const result = await collection.updateOne(
      { _id: new ObjectId(cartItemId) },
      { $set: { productQuantity: parseInt(productQuantity) } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: 'Cart item quantity updated' });
    } else {
      res.status(404).json({ message: 'Cart item not found' });
    }
  } catch (error) {
    console.error('Update failed:', error);
    res.status(500).json({ message: 'Failed to update cart item' });
  }
});

// ✅ DELETE cart item by _id
app.delete('/api/cart/:id', async (req, res) => {
  const cartItemId = req.params.id;

  try {
    const db = await connectDB();
    const collection = db.collection(cartCollection);

    const result = await collection.deleteOne({ _id: new ObjectId(cartItemId) });

    if (result.deletedCount === 1) {
      res.status(200).json({ message: 'Cart item deleted' });
    } else {
      res.status(404).json({ message: 'Cart item not found' });
    }
  } catch (error) {
    console.error('Delete failed:', error);
    res.status(500).json({ message: 'Failed to delete cart item' });
  }
});


app.post('/api/register', async (req, res) => {
  const userData = req.body;

  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection('users');

    const result = await users.insertOne(userData);
    res.status(200).json({ message: 'User registered successfully', id: result.insertedId });
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ message: 'Failed to register user' });
  } finally {
    await client.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});