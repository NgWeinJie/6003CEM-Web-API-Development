const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://User:1234@cluster0.oro1vef.mongodb.net/webApi';

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: String,
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  category: { type: String, required: true },
  images: [String]
});

const Product = mongoose.model('Product', productSchema);

// Product titles to exclude from syncing
const EXCLUDED_TITLES = [
  "Cat Food",
  "Dog Food",
  "Tissue Paper Box",
];

// Function to check if a product title should be excluded
function shouldExcludeProduct(title) {
  return EXCLUDED_TITLES.some(excludedTitle => 
    title.toLowerCase().includes(excludedTitle.toLowerCase())
  );
}

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Sync products from DummyJSON API with direct filtering
async function syncProductsFromAPI() {
  try {
    console.log('🔄 Starting product sync from DummyJSON API...');
    
    const categories = ["groceries", "beauty", "furniture", "fragrances"];
    let totalSynced = 0;
    let totalUpdated = 0;
    let totalCreated = 0;
    let totalExcluded = 0;
    
    for (const category of categories) {
      try {
        console.log(`📦 Fetching products from category: ${category}`);
        const response = await axios.get(`https://dummyjson.com/products/category/${category}`, {
          timeout: 10000
        });
        const products = response.data.products;
        
        // Filter out unwanted products before processing
        const filteredProducts = products.filter(product => {
          if (shouldExcludeProduct(product.title)) {
            console.log(`🚫 Skipping excluded product: ${product.title}`);
            totalExcluded++;
            return false;
          }
          return true; 
        });
        
        console.log(`✨ Filtered ${filteredProducts.length} products (excluded ${products.length - filteredProducts.length}) from category: ${category}`);
        
        // Process only the filtered products
        for (const product of filteredProducts) {
          try {
            const productData = {
              title: product.title,
              description: product.description,
              price: product.price,
              stock: product.stock,
              category: product.category,
              images: product.images || []
            };

            const existingProduct = await Product.findOne({ title: product.title });
            
            if (existingProduct) {
              await Product.updateOne({ title: product.title }, productData);
              totalUpdated++;
              console.log(`📝 Updated product: ${product.title}`);
            } else {
              await Product.create(productData);
              totalCreated++;
              console.log(`➕ Created product: ${product.title}`);
            }
            
            totalSynced++;
          } catch (productError) {
            console.error(`❌ Error syncing product ${product.title}:`, productError.message);
          }
        }
        
        console.log(`✅ Successfully processed ${filteredProducts.length} products from category: ${category}`);
      } catch (categoryError) {
        console.error(`❌ Error fetching category ${category}:`, categoryError.message);
      }
    }
    
    console.log('\n🎉 Product sync completed');
    console.log(`📊 Summary:`);
    console.log(`   - Products stored in database: ${totalSynced}`);
    console.log(`   - New products created: ${totalCreated}`);
    console.log(`   - Existing products updated: ${totalUpdated}`);
    console.log(`   - Products filtered out: ${totalExcluded}`);
    
    return { 
      success: true, 
      totalSynced, 
      totalCreated, 
      totalUpdated,
      totalExcluded
    };
  } catch (error) {
    console.error('❌ Error in product sync:', error);
    return { success: false, error: error.message };
  }
}

// Check current database status
async function checkDatabaseStatus() {
  try {
    const totalProducts = await Product.countDocuments();
    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📊 Current Database Status:');
    console.log(`   - Total products: ${totalProducts}`);
    console.log('   - Products by category:');
    productsByCategory.forEach(cat => {
      console.log(`     • ${cat._id}: ${cat.count} products`);
    });

    return { totalProducts, productsByCategory };
  } catch (error) {
    console.error('❌ Error checking database status:', error);
    return null;
  }
}

async function main() {
  await connectToDatabase();
  await syncProductsFromAPI();
  await checkDatabaseStatus();
  mongoose.connection.close();
  console.log('\n👋 Sync completed');
}

// Handle errors and cleanup
process.on('SIGINT', () => {
  console.log('\n⚠️  Received SIGINT. Closing database connection...');
  mongoose.connection.close();
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  mongoose.connection.close();
  process.exit(1);
});

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script error:', error);
    mongoose.connection.close();
    process.exit(1);
  });
}

module.exports = {
  syncProductsFromAPI,
  Product
};