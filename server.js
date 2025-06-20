
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
require('dotenv').config();
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://User:1234@cluster0.oro1vef.mongodb.net/webApi';
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Ensure the directory exists
const uploadDir = path.join(__dirname, 'uploads', 'profile-pics');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uid = req.params.userId || 'default';  // <-- corrected line
    cb(null, `${uid}${ext}`); // e.g. qfKuk9...jpg
  }
});

const upload = multer({ storage }); // use this in your route

const memoryStorage = multer.memoryStorage();

// Create upload instances for different purposes
const uploadToMemory = multer({ storage: memoryStorage });

// === MONGOOSE (for orders and products) ===
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB (Mongoose)'))
  .catch(err => console.error('❌ Mongoose connection error:', err));

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

// Product Schema
const productSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: String,
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  category: { type: String, required: true },
  images: [String]
});
const Product = mongoose.model('Product', productSchema);

// User Schema
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

// Recipe Schema
const RecipeSchema = new mongoose.Schema({
  productId: mongoose.Schema.Types.ObjectId,
  title: String,
  recipes: [{
    id: Number,
    title: String,
    image: String,
    sourceUrl: String
  }]
});

const Recipe = mongoose.model('Recipe', RecipeSchema);

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
app.use(express.urlencoded({ extended: true }));

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

// === PRODUCT APIs ===
// Get all products by category
app.get('/api/products/categories', async (req, res) => {
  try {
    const categories = ["groceries", "beauty", "furniture", "fragrances"];
    const result = {};

    for (const category of categories) {
      const products = await Product.find({ category }).lean();
      result[category] = products;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error fetching products by categories:', error);
    res.status(500).json({ error: 'Failed to fetch products by categories' });
  }
});

// Get single product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Search products by title
app.get('/api/products/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const products = await Product.find({
      title: { $regex: query, $options: 'i' }
    }).lean();

    res.status(200).json({ products });
  } catch (error) {
    console.error('❌ Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// === MANAGE PRODUCTS ===
// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Update a product
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, price, stock, category } = req.body;

  try {
    const product = await Product.findByIdAndUpdate(
      id,
      { title, description, price, stock, category },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete a product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// === ADD PRODUCTS ===
// Serve static files
app.use(express.static("html"));

// API endpoint to handle form submission
app.post("/api/products", uploadToMemory.single("images"), async (req, res) => {
  try {
    const { title, description, price, stock, category } = req.body;

    // Validate required fields
    if (!title || !description || !price || !stock || !category) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const allowedCategories = ["groceries", "beauty", "furniture", "fragrances"];
    if (!allowedCategories.includes(category.toLowerCase())) {
      return res.status(400).json({ error: "Invalid category" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    // Check for duplicate product title
    const existingProduct = await Product.findOne({ title });
    if (existingProduct) {
      return res.status(409).json({ error: "Product with the same title already exists" });
    }

    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const newProduct = new Product({
      title,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      images: [base64Image]
    });

    await newProduct.save();
    res.status(201).json({ message: "Product added successfully" });

  } catch (error) {
    console.error("❌ Error saving product:", error);
    res.status(500).json({ error: "Failed to add item. Please try again." });
  }
});

// === FOOD RECIPE APIs ===
const SPOONACULAR_API_KEY = 'c1e4b2cdb5d04c01835f1ec26f8145cb';

// API route to fetch & store recipe based on product ID
// Helper: check if an image URL is valid (returns 200)
const imageExists = async (url) => {
  try {
    const res = await axios.head(url);
    return res.status === 200;
  } catch {
    return false;
  }
};

app.get('/api/recipes/product/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Only allow "Groceries" category
    if (product.category.toLowerCase() !== 'groceries') {
      return res.status(200).json([]); // Return blank for non-groceries
    }

    // Return from cache if exists
    const existing = await Recipe.findOne({ productId: product._id });
    if (existing) return res.status(200).json(existing.recipes);

    // Step 1: Search recipes by product title
    const searchUrl = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(product.title)}&number=10&apiKey=${SPOONACULAR_API_KEY}`;
    const searchRes = await axios.get(searchUrl);

    const productWords = product.title.toLowerCase().split(/\s+/);
    const recipes = [];

    // Step 2: Fetch recipe details with filtering
    for (const r of searchRes.data.results) {
      if (recipes.length >= 3) break;

      try {
        const infoUrl = `https://api.spoonacular.com/recipes/${r.id}/information?includeNutrition=false&apiKey=${SPOONACULAR_API_KEY}`;
        const detailRes = await axios.get(infoUrl);
        const details = detailRes.data;

        const titleLower = details.title.toLowerCase();
        const matchesWord = productWords.some(word => titleLower.includes(word));
        if (!matchesWord) continue;

        const imgUrl = details.image || '';
        const isImageValid = imgUrl && imgUrl.startsWith('http');

        if (!isImageValid) continue;

        // Optional: Validate image exists (skip broken ones)
        const imageOK = await axios.head(imgUrl).then(r => r.status === 200).catch(() => false);
        if (!imageOK) continue;

        recipes.push({
          id: details.id,
          title: details.title,
          image: imgUrl,
          sourceUrl: details.sourceUrl
        });

      } catch (e) {
        console.warn(`⚠️ Skipping recipe ${r.id}:`, e.message);
      }
    }

    // ✅ Save to DB
    const newRecipe = new Recipe({
      productId: product._id,
      title: product.title,
      recipes
    });

    await newRecipe.save();
    res.status(200).json(recipes);

  } catch (error) {
    console.error('❌ Recipe fetch error:', error.message || error);
    res.status(500).json({ error: 'Failed to get recipes' });
  }
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
app.post('/api/payment', async (req, res) => {
  try {
    const orderData = req.body;

    const order = new Order(orderData);
    await order.save();

    res.status(201).json({
      message: 'Order saved',
      trackingNumber: order.trackingNumber,
      pointsEarned: order.pointsEarned,
    });
  } catch (error) {
    console.error('❌ Error saving order:', error);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

app.get('/api/orders', async (req, res) => {
  const userId = req.query.userId;

  try {
    const filter = userId ? { userId } : {};
    const orders = await Order.find(filter).sort({ timestamp: -1 });

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

app.use('/uploads', express.static('uploads'));

// app.put('/api/users/:userId', (req, res, next) => {
//   req.uid = req.params.userId; // make UID available to multer
//   next();
// }, upload.single('profilePic'), async (req, res) => {
//   try {
//     const db = client.db(dbName);
//     const users = db.collection('users');

//     const uid = req.params.userId.trim(); // Clean input
//     console.log('UID:', uid);

//     const user = await users.findOne({ uid: uid });
//     if (!user) {
//       console.log('❌ User not found in MongoDB');
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     const updateData = {};
//     if (req.file) {
//       updateData.profilePic = `/uploads/profile-pics/${req.file.filename}`;
//     }

//     const result = await users.findOneAndUpdate(
//       { uid: uid },
//       { $set: updateData },
//       { returnDocument: 'after' }
//     );

//     res.json({ success: true, user: result.value });
//   } catch (err) {
//     console.error('Error during update:', err);
//     res.status(500).json({ success: false, message: 'Update failed' });
//   }
// });

app.put('/api/users/:userId', upload.single('profilePic'), async (req, res) => {
  const userId = req.params.userId.trim();

  const {
    email,
    address,
    phoneNumber,
    postcode,
    city,
    state
  } = req.body;

  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection('users');

    // Optional: Debug check if user exists
    const checkUser = await users.findOne({ uid: userId });
    console.log('🔍 Found user:', checkUser);

    const updateData = {
      ...(email && { email }),
      ...(address && { address }),
      ...(phoneNumber && { phoneNumber }),
      ...(postcode && { postcode }),
      ...(city && { city }),
      ...(state && { state }),
    };

    if (req.file) {
      updateData.profilePic = `/uploads/profile-pics/${req.file.filename}`;
    }

    console.log('📝 Update data to save:', updateData);

    const result = await users.findOneAndUpdate(
      { uid: userId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    let updatedUser = result.value;

    if (!updatedUser) {
      console.log('⚠️ No change in data — re-fetching user...');
      updatedUser = await users.findOne({ uid: userId });
    }

    if (!updatedUser) {
      console.log('❌ No user found to update.');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('✅ Updated user from DB:', updatedUser);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  } finally {
    await client.close();
  }
});

app.delete('/api/users/:userId/profile-pic', async (req, res) => {
  const userId = req.params.userId;

  try {
    const db = await connectDB();
    const users = db.collection('users');

    const user = await users.findOne({ uid: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Remove file from disk if it's a custom image
    if (user.profilePic && !user.profilePic.includes('default.png')) {
      const imagePath = path.join(__dirname, user.profilePic);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Set profilePic to default
    await users.updateOne({ uid: userId }, { $set: { profilePic: '/uploads/profile-pics/default.png' } });

    res.json({ success: true, imageUrl: '/uploads/profile-pics/default.png' });
  } catch (error) {
    console.error('Error deleting profile image:', error);
    res.status(500).json({ success: false, message: 'Failed to delete image' });
  }
});

// app.put('/api/users/:uid', async (req, res) => {
//   const uid = req.params.uid;
//   const updatedData = req.body; // Contains fields like email, address, phoneNumber, etc.

//   try {
//     await client.connect();
//     const db = client.db(dbName);
//     const users = db.collection('users');

//     const result = await users.updateOne(
//       { uid: uid }, // Filter by user UID
//       { $set: updatedData } // Update the fields sent in request body
//     );

//     if (result.matchedCount === 0) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.status(200).json({ message: 'User updated successfully' });
//   } catch (error) {
//     console.error('❌ Error updating user:', error);
//     res.status(500).json({ message: 'Failed to update user', error: error.message });
//   } finally {
//     await client.close();
//   }
// });

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

// === CART RECOMMENDATION API ===
app.get('/api/cart/recommendation', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const db = await connectDB();
    const cartItems = await db.collection(cartCollection).find({ userId }).toArray();

    if (cartItems.length === 0) {
      return res.status(404).json({ message: 'No items in cart to base recommendations on.' });
    }

    const keywords = cartItems.map(item => item.productName.split(' ')[0]); // Get first word of each product name
    const searchQuery = keywords[Math.floor(Math.random() * keywords.length)];

    // Fetch recommendation from DummyJSON
    const response = await axios.get(`https://dummyjson.com/products/search?q=${searchQuery}`);
    const results = response.data.products;

    if (results.length > 0) {
      const randomRecommendation = results[Math.floor(Math.random() * results.length)];
      return res.json({ recommendation: randomRecommendation });
    } else {
      return res.status(404).json({ message: 'No recommendations found based on your cart items.' });
    }
  } catch (err) {
    console.error('❌ Error in recommendation API:', err);
    res.status(500).json({ message: 'Internal server error while fetching recommendations.' });
  }
});



// === START SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
