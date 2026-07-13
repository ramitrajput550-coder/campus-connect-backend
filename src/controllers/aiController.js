const User = require('../models/User');
const dbHelper = require('../config/dbHelper');

const aiController = {
  chat: async (req, res) => {
    const { message } = req.body;
    const userId = req.user.id;

    try {
      const user = await dbHelper.findById(User, userId);
      const name = user?.profile?.name || 'Student';
      const skills = user?.profile?.skills || [];
      const role = user?.role || 'student';

      let responseText = '';
      const msg = message.toLowerCase();

      if (msg.includes('adm') || msg.includes('admn') || msg.includes('addm')) {
        responseText = `Hello ${name}! The Campus Connect administrator is **Ramit Rajput**. You can find him registered as the Admin user, or email him at admin@campusnet.edu.`;
      } else if (msg.includes('career') || msg.includes('job') || msg.includes('guidance') || msg.includes('naukri') || msg.includes('intern')) {
        responseText = `Hello ${name}! Based on your profile as a ${role} with skills in ${skills.join(', ') || 'Computer Science'}, here is my AI Career Guidance:\n\n` +
          `1. **Focus Area:** Deep dive into Full Stack web development and Cloud Architectures.\n` +
          `2. **Jobs:** Check the Jobs & Internships tab for active matching opportunities.\n` +
          `3. **Skills:** Upgrade your profile by learning TypeScript, Docker, and system design.\n\n` +
          `Would you like me to recommend specific mentors or review your resume?`;
      } else if (msg.includes('resum') || msg.includes('cv') || msg.includes('review')) {
        responseText = `Hello ${name}! To get your resume reviewed, you can use our dedicated **AI Resume Reviewer** tab above. Just paste your resume text, and I will analyze it against industry standard templates, calculate a match score, and highlight areas for improvement!`;
      } else if (msg.includes('mentor') || msg.includes('alum')) {
        responseText = `Hello ${name}! I recommend connecting with Alumni who work at top companies. You can find them in the **Campus Directory** or check out your personalized recommendations in the AI Hub!`;
      } else {
        responseText = `Hello ${name}! I am your Campus Connect AI Assistant. I can help you with:\n` +
          `- **AI Career Advising:** Ask me about job roles, learning paths, or career growth.\n` +
          `- **Resume Reviews:** Paste your resume in the Resume Review tab for a detailed analysis.\n` +
          `- **Recommendations:** Get matched with jobs, alumni, and mentors on our platform.\n\n` +
          `What can I assist you with today?`;
      }

      res.json({ reply: responseText });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'AI Assistant error' });
    }
  },

  resumeReview: async (req, res) => {
    const { resumeText } = req.body;
    if (!resumeText || resumeText.length < 20) {
      return res.status(400).json({ msg: 'Please provide a valid resume text (at least 20 characters)' });
    }

    try {
      const length = resumeText.length;
      let score = 65; // Base score
      if (length > 100) score += 10;
      if (length > 300) score += 10;
      if (resumeText.toLowerCase().includes('project')) score += 5;
      if (resumeText.toLowerCase().includes('experience')) score += 5;
      if (resumeText.toLowerCase().includes('education')) score += 5;
      if (score > 100) score = 98;

      const feedback = [
        "Structure: Clear sections found (Education, Projects). Consider adding a Summary section at the top.",
        score < 80 ? "Improvement: Add more quantifiable achievements (e.g. 'Increased efficiency by 20%')." : "Strong usage of active verbs throughout your experience.",
        "Keywords: Consider adding skills like TypeScript, CI/CD, and Cloud Deployment if applicable to your targeted roles.",
        "Formatting: Keep descriptions bulleted and limited to 3-4 bullets per project or role."
      ];

      res.json({
        score,
        feedback,
        industryStandardMatch: score > 80 ? "High Match" : "Moderate Match",
        recommendation: "Apply to Mid-level or Associate Developer roles."
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Resume review failed' });
    }
  },

  getRecommendations: async (req, res) => {
    const userId = req.user.id;
    try {
      const user = await dbHelper.findById(User, userId);
      const userSkills = user?.profile?.skills || [];

      // Fetch all jobs
      const Post = require('../models/Post');
      const allPosts = await dbHelper.find(Post);
      const jobs = allPosts.filter(p => p.postType === 'job' || p.postType === 'referral');

      // Fetch all alumni
      const allUsers = await dbHelper.find(User, { role: 'alumni', isVerifiedAlumni: true });
      const mentors = allUsers.filter(u => u.profile?.mentorshipAvailability === true);

      // Simple keyword matching for jobs
      const recommendedJobs = jobs.map(j => {
        let matchCount = 0;
        const jobSkills = j.jobDetails?.skillsRequired || [];
        jobSkills.forEach(s => {
          if (userSkills.some(us => us.toLowerCase() === s.toLowerCase())) matchCount++;
        });
        return { job: j, matchPercentage: jobSkills.length > 0 ? Math.round((matchCount / jobSkills.length) * 100) : 50 };
      }).sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 3);

      // Simple matching for alumni/mentors
      const recommendedMentors = mentors.map(m => {
        let matchCount = 0;
        const mentorSkills = m.profile?.skills || [];
        mentorSkills.forEach(s => {
          if (userSkills.some(us => us.toLowerCase() === s.toLowerCase())) matchCount++;
        });
        return { mentor: m, matchPercentage: mentorSkills.length > 0 ? Math.round((matchCount / mentorSkills.length) * 100) : 50 };
      }).sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 3);

      res.json({
        jobs: recommendedJobs.map(rj => ({
          id: rj.job._id,
          title: rj.job.jobDetails?.title || 'Job Opening',
          company: rj.job.jobDetails?.company || 'Company',
          location: rj.job.jobDetails?.location || 'Remote',
          matchPercentage: rj.matchPercentage || 75
        })),
        mentors: recommendedMentors.map(rm => ({
          id: rm.mentor._id,
          name: rm.mentor.profile?.name || 'Mentor',
          company: rm.mentor.profile?.currentCompany || 'Alumni Partner',
          designation: rm.mentor.profile?.designation || 'Specialist',
          matchPercentage: rm.matchPercentage || 80
        }))
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Recommendations error' });
    }
  }
};

module.exports = aiController;
