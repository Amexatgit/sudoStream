require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
const User = require('./models/User'); // Path to your User model

async function createGuest() {
    try {
        console.log("🔌 Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        
        // Hash the password so your login route can read it
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('guest123', salt);
        
        // Save the new user
        const newUser = new User({
            username: 'guest',
            password: hashedPassword
        });
        
        await newUser.save();
        console.log("🎧 SUCCESS: Guest user created! (Username: guest | Password: guest123)");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

createGuest();
