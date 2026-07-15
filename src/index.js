const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/api');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure socket.io
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow all origins for dev/testing ease
    methods: ['GET', 'POST']
  }
});

// Connect to Database
connectDB().then(() => {
  // If we are running in fallback mode, print a status log
  if (global.dbFallback) {
    console.log('Database helper is set to JSON fallback mode.');
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Routes
app.use('/api', apiRoutes);

// Simple health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'CampusNet API is running successfully!', fallbackMode: global.dbFallback });
});

// Temporary endpoint to seed database in the cloud
app.get('/api/seed-db', async (req, res) => {
  try {
    const seedData = require('./config/seed');
    await seedData();
    res.json({ message: 'Database seeded successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.io Real-time Event Management
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User joins a room based on their userId
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  // User joins a community room (group chat)
  socket.on('join_community', (communityId) => {
    socket.join(communityId);
    console.log(`User joined community chat room: ${communityId}`);
  });

  // Handle direct message send
  socket.on('send_message', (message) => {
    // message: { senderId, receiverId, text, isGroupChat, createdAt }
    if (message.isGroupChat) {
      socket.to(message.receiverId).emit('receive_message', message);
    } else {
      socket.to(message.receiverId).emit('receive_message', message);
    }
  });

  // Handle live notifications
  socket.on('send_notification', (data) => {
    // data: { targetUserId, text, type, relatedId }
    socket.to(data.targetUserId).emit('receive_notification', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Server Listen Port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
