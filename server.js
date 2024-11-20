const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.options('*', cors());

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// MongoDB connection URI
const uri = process.env.MONGODB_URI;

// Mongoose Models
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumbers: [{ name: String, number: String, category: String }],
    jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }]
}));

const Job = mongoose.model('Job', new mongoose.Schema({
    businessName: { type: String, required: true },
    jobDescription: { type: String }, 
    category: { type: String, required: true },
    shift: {
        type: { type: String, enum: ['morning', 'midday', 'night', 'custom'], required: true },
        date: { type: Date }, 
        startTime: { type: String, required: true },
        endTime: { type: String, required: true }
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    claimedBy: { type: String },
    claimedAt: { type: Date }
}));

// Connect to MongoDB and start the server
mongoose.connect(uri)
    .then(() => {
        console.log('Successfully connected to MongoDB Atlas');
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB Atlas:', err);
        process.exit(1);
    });

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// TextBelt API key
const TEXTBELT_API_KEY = process.env.TEXTBELT_API_KEY;

// Function to send SMS via TextBelt
async function sendTextBeltSMS(phoneNumber, message) {
    if (!phoneNumber) {
        console.error("Phone number is missing.");
        return;
    }

    console.log(`Sending SMS to: ${phoneNumber}`);
    try {
        const response = await axios.post('https://textbelt.com/text', {
            phone: phoneNumber,
            message: message,
            key: TEXTBELT_API_KEY
        });

        if (response.data.success) {
            console.log(`SMS sent successfully to ${phoneNumber}`);
        } else {
            console.error(`Failed to send SMS to ${phoneNumber}: ${response.data.error}`);
        }
    } catch (error) {
        console.error(`Error sending SMS to ${phoneNumber}: ${error.message}`);
    }
}

// API Routes
app.post('/api/register', async (req, res) => {
    const { username, password, phoneNumbers } = req.body;

    try {
        if (await User.findOne({ username })) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, phoneNumbers });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
});

app.post('/api/postJob', authenticateToken, async (req, res) => {
    const { businessName, jobDescription, shift, category } = req.body;

    try {
        // Step 1: Find the user by the username from the token
        const user = await User.findOne({ username: req.user.username });

        if (!user || user.phoneNumbers.length === 0) {
            return res.status(404).json({ message: 'No phone numbers found for this user.' });
        }

        // Step 2: Validate shift data
        if (!shift || !shift.type || !shift.startTime || !shift.endTime) {
            console.error('Error: Incomplete shift data:', shift);
            return res.status(400).json({ message: 'Incomplete shift data. Ensure all shift fields are provided.' });
        }

        // Step 3: Filter phone numbers based on the category
        const relevantNumbers = category === 'everyone'
            ? user.phoneNumbers
            : user.phoneNumbers.filter(pn => pn.category === category);

        if (relevantNumbers.length === 0) {
            return res.status(404).json({ message: `No phone numbers found for category: ${category}.` });
        }

        // Step 4: Create a new job
        const job = new Job({
            businessName,
            jobDescription: jobDescription || 'No description provided',
            shift,
            category,
            user: user._id,
        });

        // Step 5: Save the job to the database
        const savedJob = await job.save();

        // Step 6: Update the user document to add the job reference
        user.jobs.push(savedJob._id); // Add the job's ObjectId to the user's jobs array
        await user.save(); // Save the updated user document

        // Step 7: Prepare and send SMS notifications
        const shiftTime = shift.type === 'custom'
            ? `on ${new Date(shift.date).toLocaleDateString()} from ${shift.startTime} to ${shift.endTime}`
            : `${shift.type} shift (${shift.startTime} - ${shift.endTime})`;

        const message = `New Shift: ${businessName} - ${jobDescription || 'No description provided'} ${shiftTime}. Claim the shift: https://shift-grab.vercel.app/claimShift.html?shiftId=${savedJob._id}`;
        const smsPromises = relevantNumbers.map(({ number }) => sendTextBeltSMS(number, message));
        await Promise.all(smsPromises);

        // Step 8: Send a response to the client
        res.status(201).json({ message: 'Job posted and SMS sent successfully!', job: savedJob });
    } catch (error) {
        console.error('Error posting job:', error);
        res.status(500).json({ message: 'Error posting job or sending SMS.' });
    }
});


app.get('/api/getJobs', authenticateToken, async (req, res) => {
    try {
        const jobs = await Job.find({ user: req.user._id });
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching jobs', error });
    }
});

app.get('/api/getJob/:id', authenticateToken, async (req, res) => {
    try {
        const job = await Job.findOne({ _id: req.params.id, user: req.user._id });
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json(job);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching job', error });
    }
});


app.get('/api/getPhoneNumbers', authenticateToken, async (req, res) => {
    const user = await User.findOne({ username: req.user.username });
    res.json(user.phoneNumbers);
});

app.post('/api/addPhoneNumber', authenticateToken, async (req, res) => {
    const { name, number, category } = req.body;
    const user = await User.findOne({ username: req.user.username });

    user.phoneNumbers.push({ name, number, category });
    await user.save();
    res.json({ phoneNumbers: user.phoneNumbers });
});

app.post('/api/deletePhoneNumber', authenticateToken, async (req, res) => {
    const { number } = req.body;
    const user = await User.findOne({ username: req.user.username });

    user.phoneNumbers = user.phoneNumbers.filter(pn => pn.number !== number);
    await user.save();
    res.json({ phoneNumbers: user.phoneNumbers });
});

app.get('/api/getUserInfo', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ 
            username: user.username,
            // Add any other user info you want to send
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user info', error });
    }
});

// shift status page
app.get('/api/getRecentShift', authenticateToken, async (req, res) => {
    try {
        // Fetch the most recent job created by the user
        const recentShift = await Job.findOne({ user: req.user._id }).sort({ 'shift.date': -1 });
        if (!recentShift) {
            return res.status(404).json({ message: 'No recent shift found' });
        }
        res.status(200).json(recentShift);
    } catch (error) {
        console.error('Error fetching recent shift:', error);
        res.status(500).json({ message: 'Internal server error while fetching recent shift' });
    }
});

app.get('/api/getPastShifts', authenticateToken, async (req, res) => {
    const filter = req.query.filter;

    let query = { user: req.user._id };
    if (filter === 'removed') {
        query['shift.status'] = 'removed';
    } else if (filter === 'claimed') {
        query['shift.status'] = 'claimed';
    } else if (filter === 'unclaimed') {
        query['claimedBy'] = { $exists: false };
    }

    try {
        const shifts = await Job.find(query);
        res.status(200).json(shifts);
    } catch (error) {
        console.error('Error fetching past shifts:', error);
        res.status(500).json({ message: 'Error fetching past shifts' });
    }
});


// Claim Shift Route
app.post('/api/claimShift', async (req, res) => {
    const { shiftId, workerName } = req.body;

    try {
        const job = await Job.findById(shiftId);
        if (!job) return res.status(404).json({ message: 'Shift not found.' });

        if (job.claimedBy) return res.status(400).json({ message: 'Shift already claimed.' });

                const user = await User.findById(job.user);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        job.claimedBy = workerName;
        job.claimedAt = new Date();
        await job.save();

        const message = `The shift at ${job.businessName} has been claimed by ${workerName}.`;
        const smsPromises = user.phoneNumbers
            .filter(pn => pn.category === job.category)
            .map(({ number }) =>
                axios.post('https://textbelt.com/text', {
                    phone: number,
                    message,
                    key: process.env.TEXTBELT_API_KEY
                })
            );

        await Promise.all(smsPromises);

        res.status(200).json({
            message: 'Shift claimed successfully!',
            jobDetails: {
                businessName: job.businessName,
                datetime: job.datetime,
                jobDescription: job.jobDescription
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error claiming shift. Please try again.' });
    }
});

// Settings API's
app.post('/api/updateUserPreferences', authenticateToken, async (req, res) => {
    const { shiftTimes } = req.body;

    try {
        const user = await User.findOne({ username: req.user.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Add or update the shift times in the user's preferences
        user.preferences = user.preferences || {};
        user.preferences.shiftTimes = shiftTimes;
        await user.save();

        res.status(200).json({ message: 'User preferences updated successfully' });
    } catch (error) {
        console.error('Error updating user preferences:', error);
        res.status(500).json({ message: 'Error updating user preferences' });
    }
});

app.post('/api/addCategory', authenticateToken, async (req, res) => {
    const { categoryName } = req.body;

    try {
        const user = await User.findOne({ username: req.user.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.categories = user.categories || [];
        if (user.categories.includes(categoryName)) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        user.categories.push(categoryName);
        await user.save();

        res.status(200).json({ message: 'Category added successfully' });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ message: 'Error adding category' });
    }
});

app.get('/api/getCategories', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user.categories || []);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

app.post('/api/updateUsernamePassword', authenticateToken, async (req, res) => {
    const { newUsername, newPassword } = req.body;

    try {
        const user = await User.findOne({ username: req.user.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (newUsername) {
            user.username = newUsername;
        }

        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
        }

        await user.save();
        res.status(200).json({ message: 'Credentials updated successfully' });
    } catch (error) {
        console.error('Error updating user credentials:', error);
        res.status(500).json({ message: 'Error updating credentials' });
    }
});


// Function to send push notifications
function sendPushNotification(username, message) {
    // Placeholder function - integrate a push notification service like Firebase later
    console.log(`Push notification sent to ${username}: ${message}`);
}

// Get user preferences
app.get('/api/getUserPreferences', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user.preferences || {});
    } catch (error) {
        console.error('Error fetching user preferences:', error);
        res.status(500).json({ message: 'Error fetching user preferences', error });
    }
});
