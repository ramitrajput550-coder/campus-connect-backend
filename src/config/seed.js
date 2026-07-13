const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const User = require('../models/User');
const Post = require('../models/Post');
const Connection = require('../models/Connection');
const Community = require('../models/Community');
const Event = require('../models/Event');
const Mentorship = require('../models/Mentorship');
const Referral = require('../models/Referral');
const Message = require('../models/Message');
const Resource = require('../models/Resource');
const dbHelper = require('./dbHelper');
const { connectDB } = require('./db');

const seedData = async () => {
  console.log('Seeding database with mock data...');

  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const studentPassword = await bcrypt.hash('ramit', salt);
  const alumniPassword = await bcrypt.hash('ramit', salt);
  const facultyPassword = await bcrypt.hash('ramit', salt);
  const placementPassword = await bcrypt.hash('ramit', salt);
  const adminPassword = await bcrypt.hash('ramit', salt);

  // 1. Seed Users & Profiles
  const userSeeds = [
    {
      email: 'admin@campusnet.edu',
      password: adminPassword,
      role: 'admin',
      isVerifiedAlumni: true,
      profile: {
        name: 'System Admin',
        photo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150',
        designation: 'Chief Administrator'
      }
    },
    {
      email: 'ananya@campusnet.edu',
      password: studentPassword,
      role: 'student',
      isVerifiedAlumni: false,
      profile: {
        name: 'Ananya Sharma',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
        department: 'Computer Science',
        course: 'B.Tech CSE',
        year: 'Final Year',
        skills: ['React', 'Node.js', 'Express', 'MongoDB', 'Javascript', 'Tailwind CSS'],
        projects: [
          { title: 'E-Commerce Site', description: 'React & Node fullstack web shop', link: 'github.com/ananya/shop' },
          { title: 'Campus Attendance System', description: 'Spring Boot scanner app', link: 'github.com/ananya/attend' }
        ],
        achievements: ['Smart India Hackathon 2025 Runner-up', 'Dean List Academic Excellence'],
        socialLinks: {
          linkedin: 'linkedin.com/in/ananya-sharma',
          github: 'github.com/ananya-sharma'
        }
      }
    },
    {
      email: 'rohan@campusnet.edu',
      password: alumniPassword,
      role: 'alumni',
      isVerifiedAlumni: true,
      verificationDetails: {
        enrollmentNumber: 'CSE16045',
        passingYear: 2020,
        universityEmail: 'rohan.v.alumni@campus.edu',
        approvedAt: new Date().toISOString()
      },
      profile: {
        name: 'Rohan Verma',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
        department: 'Computer Science & Engineering',
        currentCompany: 'Microsoft',
        designation: 'Software Engineer II',
        experience: '4 Years',
        location: 'Bengaluru, India',
        skills: ['System Design', 'C#', 'TypeScript', 'Azure', 'Microservices'],
        achievements: ['Microsoft Gold Star Award 2024', 'College Gold Medalist 2020'],
        mentorshipAvailability: true,
        socialLinks: {
          linkedin: 'linkedin.com/in/rohan-verma',
          github: 'github.com/rohan-verma'
        }
      }
    },
    {
      email: 'sneha@campusnet.edu',
      password: alumniPassword,
      role: 'alumni',
      isVerifiedAlumni: true,
      verificationDetails: {
        enrollmentNumber: 'CSE17092',
        passingYear: 2021,
        universityEmail: 'sneha.p.alumni@campus.edu',
        approvedAt: new Date().toISOString()
      },
      profile: {
        name: 'Sneha Patil',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
        department: 'Computer Science & Engineering',
        currentCompany: 'Google',
        designation: 'Data Scientist',
        experience: '3 Years',
        location: 'Hyderabad, India',
        skills: ['Python', 'TensorFlow', 'Machine Learning', 'SQL', 'BigQuery'],
        achievements: ['Google ML Research Contributor', 'Grace Hopper Speaker'],
        mentorshipAvailability: true,
        socialLinks: {
          linkedin: 'linkedin.com/in/sneha-patil',
          github: 'github.com/sneha-patil'
        }
      }
    },
    {
      email: 'arjun@campusnet.edu',
      password: alumniPassword,
      role: 'alumni',
      isVerifiedAlumni: false, // Unverified initially for testing Admin approvals
      verificationDetails: {
        enrollmentNumber: 'ECE17088',
        passingYear: 2021,
        universityEmail: 'arjun.m.alumni@campus.edu'
      },
      profile: {
        name: 'Arjun Menon',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
        department: 'Electronics & Communication',
        currentCompany: 'Amazon',
        designation: 'Product Manager',
        experience: '3 Years',
        location: 'Bengaluru, India',
        skills: ['Agile', 'Product Strategy', 'SQL', 'Analytics'],
        achievements: ['Amazon Deliver Results Award 2025'],
        mentorshipAvailability: false,
        socialLinks: {
          linkedin: 'linkedin.com/in/arjun-menon'
        }
      }
    },
    {
      email: 'faculty@campusnet.edu',
      password: facultyPassword,
      role: 'faculty',
      isVerifiedAlumni: false,
      profile: {
        name: 'Dr. R. K. Sharma',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
        department: 'Computer Science',
        designation: 'Professor & Head',
        researchInterests: ['Artificial Intelligence', 'Natural Language Processing', 'Cryptography'],
        achievements: ['Best Researcher Award 2024', 'IEEE Senior Member']
      }
    },
    {
      email: 'placement@campusnet.edu',
      password: placementPassword,
      role: 'placement',
      isVerifiedAlumni: false,
      profile: {
        name: 'Mr. Amitabh Sen',
        photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150',
        department: 'Training & Placements',
        designation: 'Placement Director'
      }
    }
  ];

  // Clean and Write users
  await dbHelper.deleteMany(User);
  const users = [];
  for (let u of userSeeds) {
    const createdUser = await dbHelper.create(User, u);
    users.push(createdUser);
  }

  const admin = users[0];
  const student = users[1];
  const rohan = users[2];
  const sneha = users[3];
  const arjun = users[4];
  const faculty = users[5];
  const placement = users[6];

  console.log(`Created ${users.length} user accounts.`);

  // 2. Seed Connections (Clean slate)
  await dbHelper.deleteMany(Connection);

  // 3. Seed Communities (Clean slate, only empty groups)
  await dbHelper.deleteMany(Community);
  await dbHelper.create(Community, {
    name: 'MERN Stack Developers',
    description: 'A community for React, Node, Express, and MongoDB enthusiasts to share resources and projects.',
    category: 'Coding',
    creator: faculty._id,
    members: [faculty._id],
    discussions: []
  });

  await dbHelper.create(Community, {
    name: 'Data Science Club',
    description: 'Discuss data analytics, Machine Learning pipelines, Python frameworks, and statistics.',
    category: 'Research',
    creator: faculty._id,
    members: [faculty._id],
    discussions: []
  });

  await dbHelper.create(Community, {
    name: 'CSE Batch of 2024',
    description: 'Official group for class of 2024 Computer Science and Engineering students.',
    category: 'Department',
    creator: faculty._id,
    members: [faculty._id],
    discussions: []
  });

  // 4. Seed Posts (Clean slate)
  await dbHelper.deleteMany(Post);

  // 5. Seed Events (Clean slate)
  await dbHelper.deleteMany(Event);

  // 6. Seed Career Resources (Clean slate)
  await dbHelper.deleteMany(Resource);

  // 7. Seed Mentorships (Clean slate)
  try {
    const Mentorship = require('../models/Mentorship');
    await dbHelper.deleteMany(Mentorship);
  } catch (e) {
    // Ignore
  }

  console.log('Database seeding completed successfully!');
};

// Check if run directly
if (require.main === module) {
  dotenv.config();
  connectDB().then(async () => {
    await seedData();
    process.exit(0);
  });
}

module.exports = seedData;
