const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

//  MONGO URL
const MONGO_URI = "mongodb+srv://amex:Amex2004%40lm7@sudostream.llbngjy.mongodb.net/sudostream?appName=SudoStream";

//  LOGIN
const ADMIN_USER = "amex";
const ADMIN_PASS = "admin123"; 

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log("Connected to DB...");

        // 1. Check if user exists
        const existingUser = await User.findOne({ username: ADMIN_USER });
        if (existingUser) {
            console.log("⚠️ Admin already exists!");
            process.exit();
        }

        // 2. Hash the password (Security!)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_PASS, salt);

        // 3. Create the User
        const newUser = new User({
            username: ADMIN_USER,
            password: hashedPassword
        });

        await newUser.save();
        console.log("✅ Admin Created Successfully!");
        process.exit();
    })
    .catch(err => console.log(err));
