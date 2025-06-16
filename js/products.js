const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://User:1234@cluster0.oro1vef.mongodb.net/webApi';

// Minimal Product Schema - Only essential business fields
const productSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: String,
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  category: { type: String, required: true },
  images: [String]
});

const Product = mongoose.model('Product', productSchema);

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Sync products from DummyJSON API
async function syncProductsFromAPI() {
  try {
    console.log('🔄 Starting product sync from DummyJSON API...');
    
    const categories = ["groceries", "beauty", "furniture", "fragrances"];
    let totalSynced = 0;
    let totalUpdated = 0;
    let totalCreated = 0;
    
    for (const category of categories) {
      try {
        console.log(`📦 Fetching products from category: ${category}`);
        const response = await axios.get(`https://dummyjson.com/products/category/${category}`, {
          timeout: 10000
        });
        const products = response.data.products;
        
        for (const product of products) {
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
        
        console.log(`✅ Processed ${products.length} products from category: ${category}`);
      } catch (categoryError) {
        console.error(`❌ Error fetching category ${category}:`, categoryError.message);
      }
    }
    
    console.log('\n🎉 Product sync completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Total products processed: ${totalSynced}`);
    console.log(`   - New products created: ${totalCreated}`);
    console.log(`   - Existing products updated: ${totalUpdated}`);
    
    return { 
      success: true, 
      totalSynced, 
      totalCreated, 
      totalUpdated 
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

// Clear all products
async function clearAllProducts() {
  try {
    const result = await Product.deleteMany({});
    console.log(`🗑️  Cleared ${result.deletedCount} products from database`);
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Error clearing products:', error);
    return 0;
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'sync';

  await connectToDatabase();

  switch (command) {
    case 'sync':
      await syncProductsFromAPI();
      break;
    
    case 'status':
      await checkDatabaseStatus();
      break;
    
    case 'clear':
      console.log('⚠️  WARNING: This will delete all products from the database!');
      console.log('Type "yes" to confirm or press Ctrl+C to cancel');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('Confirm deletion (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes') {
          await clearAllProducts();
        } else {
          console.log('❌ Operation cancelled');
        }
        rl.close();
        mongoose.connection.close();
      });
      return;
    
    case 'force-sync':
      console.log('🔄 Force syncing all products (clearing existing data first)...');
      await clearAllProducts();
      await syncProductsFromAPI();
      break;
    
    default:
      console.log('📖 Available commands:');
      console.log('   - sync: Sync products from DummyJSON API (default)');
      console.log('   - status: Check current database status');
      console.log('   - clear: Clear all products from database');
      console.log('   - force-sync: Clear and re-sync all products');
      console.log('\nUsage: node products.js [command]');
  }

  if (command !== 'clear') {
    await checkDatabaseStatus();
  }

  mongoose.connection.close();
  console.log('\n👋 Sync script completed');
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

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script error:', error);
    mongoose.connection.close();
    process.exit(1);
  });
}

module.exports = {
  syncProductsFromAPI,
  checkDatabaseStatus,
  clearAllProducts,
  Product
};