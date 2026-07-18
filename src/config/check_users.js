const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoURI = 'mongodb+srv://ramitrajput550_db_user:Ramitraj%409305@cluster0.f8679rq.mongodb.net/?appName=Cluster0';

const run = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoURI);
    console.log('Connected!');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name));
    
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log('Number of documents in users collection:', userCount);
    
    const adminUser = await usersCollection.findOne({ email: 'admin@campusnet.edu' });
    console.log('Admin user found in Atlas:', adminUser ? 'YES' : 'NO');
    if (adminUser) {
      console.log('Admin user details:', { id: adminUser._id, email: adminUser.email, role: adminUser.role });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error querying MongoDB:', err);
    process.exit(1);
  }
};

run();
