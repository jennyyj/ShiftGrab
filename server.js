const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: ['https://jennyyj.github.io', 'https://shiftgrab.onrender.com'] }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from /public

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
    jobDescription: { type: String, required: true },
    datetime: { type: Date, required: true },
    category: { type: String, required: true },
    fileUrl: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}));

// Connect to MongoDB and start the server
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Successfully connected to MongoDB Atlas');
        const PORT = process.env.PORT || 8080;
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
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

// Serve HTML Pages from the Public Directory
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/post-job', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'post-job.html'));
});

app.get('/claimShift', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'claimShift.html'));
});

// variable for the TextBelt API key
const TEXTBELT_API_KEY = process.env.TEXTBELT_API_KEY;

// Function to send SMS via TextBelt
async function sendTextBeltSMS(phoneNumber, message) {
    if (!phoneNumber) {
        console.error("Phone number is missing.");
        return;
    }

    console.log(`Sending SMS to: ${phoneNumber}`); // Debugging log

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

app.post('/register', async (req, res) => {
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

app.post('/login', async (req, res) => {
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

app.post('/postJob', authenticateToken, async (req, res) => {
    const { businessName, jobDescription, datetime, category } = req.body;

    try {
        const user = await User.findOne({ username: req.user.username });

        if (!user || user.phoneNumbers.length === 0) {
            return res.status(404).json({ message: 'No phone numbers found for this user.' });
        }

        const relevantNumbers = category === 'everyone'
            ? user.phoneNumbers // Send to all registered numbers
            : user.phoneNumbers.filter(pn => pn.category === category);

        if (relevantNumbers.length === 0) {
            return res.status(404).json({ message: `No phone numbers found for category: ${category}.` });
        }

        // Create the job object
        const job = new Job({
            businessName,
            jobDescription,
            datetime,
            category,
            user: user._id,
        });

        const savedJob = await job.save(); // Save the job and get the result back

        // Update the message with the saved job's ID
        const message = `New Shift: ${businessName} - ${jobDescription} on ${datetime}. Claim the shift: https://shiftgrab.onrender.com/claimShift?shiftId=${savedJob._id}`;
        // Send SMS notifications
        const smsPromises = relevantNumbers.map(({ number }) => sendTextBeltSMS(number, message));
        await Promise.all(smsPromises);

        // Respond with the saved job data
        res.status(201).json({ message: 'Job posted and SMS sent successfully!', job: savedJob });
    } catch (error) {
        console.error('Error posting job:', error);
        res.status(500).json({ message: 'Error posting job or sending SMS.' });
    }
});

app.get('/getJobs', authenticateToken, async (req, res) => {
    try {
        const jobs = await Job.find({ user: req.user._id });
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching jobs', error });
    }
});

app.get('/getPhoneNumbers', authenticateToken, async (req, res) => {
    const user = await User.findOne({ username: req.user.username });
    res.json(user.phoneNumbers);
});

app.post('/addPhoneNumber', authenticateToken, async (req, res) => {
    const { name, number, category } = req.body;
    const user = await User.findOne({ username: req.user.username });

    user.phoneNumbers.push({ name, number, category });
    await user.save();
    res.json({ phoneNumbers: user.phoneNumbers });
});

app.post('/deletePhoneNumber', authenticateToken, async (req, res) => {
    const { number } = req.body;
    const user = await User.findOne({ username: req.user.username });

    user.phoneNumbers = user.phoneNumbers.filter(pn => pn.number !== number);
    await user.save();
    res.json({ phoneNumbers: user.phoneNumbers });
});

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Catch-all route for undefined routes
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// Claim Shift Route
app.post('/claimShift', authenticateToken, async (req, res) => {
    const { shiftId, workerName } = req.body;

    console.log('Shift claim request received:', req.body);

    try {
        const job = await Job.findById(shiftId);
        if (!job) return res.status(404).json({ message: 'Shift not found.' });

        const user = await User.findById(job.user);
        const relevantNumbers = user.phoneNumbers.filter(pn => pn.category === job.category);

        if (relevantNumbers.length === 0) {
            return res.status(404).json({ message: `No workers found in category: ${job.category}.` });
        }

        const message = `The shift at ${job.businessName} has been claimed by ${workerName}.`;

        const smsPromises = relevantNumbers.map(({ number }) =>
            axios.post('https://textbelt.com/text', {
                phone: number,
                message,
                key: TEXTBELT_API_KEY
            })
        );

        await Promise.all(smsPromises);

        res.status(200).json({ message: 'Shift claimed and notifications sent.' });
    } catch (error) {
        console.error('Error claiming shift:', error);
        res.status(500).json({ message: 'Error claiming shift.' });
    }
});

// Function to send push notifications
function sendPushNotification(username, message) {
    // Placeholder function - integrate a push notification service like Firebase later
    console.log(`Push notification sent to ${username}: ${message}`);
}
