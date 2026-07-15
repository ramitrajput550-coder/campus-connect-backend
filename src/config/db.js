const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MOCK_DB_PATH = path.join(__dirname, '..', '..', 'mock_db.json');

// Initial seed template for mock database fallback
const INITIAL_MOCK_DATA = {
  users: [],
  profiles: [],
  posts: [],
  comments: [],
  likes: [],
  connections: [],
  communities: [],
  communityMembers: [],
  jobs: [],
  referrals: [],
  applications: [],
  events: [],
  eventRegistrations: [],
  messages: [],
  notifications: [],
  mentorshipRequests: [],
  resources: []
};

// Check if mock_db.json exists, if not create it
if (!fs.existsSync(MOCK_DB_PATH)) {
  fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(INITIAL_MOCK_DATA, null, 2));
}

// Global flag to track if we are running in fallback mode
global.dbFallback = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_net';
  
  console.log('Connecting to MongoDB...');
  try {
    // Attempt connection with a short timeout to prevent hanging if MongoDB is not running
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000 // 2 seconds timeout
    });
    console.log('MongoDB connected successfully!');
    global.dbFallback = false;
  } catch (error) {
    console.warn('\n======================================================');
    console.warn('WARNING: Failed to connect to MongoDB.');
    console.warn(`Error: ${error.message}`);
    console.warn('FALLBACK: Using local JSON database (mock_db.json) instead.');
    console.warn('======================================================\n');
    global.dbFallback = true;
  }
};

module.exports = { connectDB, MOCK_DB_PATH };
