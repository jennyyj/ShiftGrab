// models.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumbers: [{ name: String, number: String, category: String }],
    jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }]
});

const JobSchema = new mongoose.Schema({
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
    status: { type: String, enum: ['waiting', 'claimed', 'unclaimed', 'removed'], default: 'waiting' },
    claimedBy: { type: String },
    claimedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Job = mongoose.models.Job || mongoose.model('Job', JobSchema);

module.exports = { User, Job };
