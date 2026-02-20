require('dotenv').config();
const mongoose = require('mongoose');
const Song = require('./models/Song');

async function lockItDown() {
    try {
        console.log("🔌 Connecting to Atlas...");
        await mongoose.connect(process.env.MONGO_URI);
        
       
        const result = await Song.updateMany({}, { isPrivate: true });
        
        console.log(`🏴‍☠️ SUCCESS: Locked down ${result.modifiedCount} songs! They are now inside the Private Collection.`);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

lockItDown();
