require('dotenv').config();
const mongoose = require('mongoose');

// 1. Connect (Copy-Paste from server.js basically)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to DB...'))
    .catch(err => console.log(err));

// 2. Define the Shape (Must match server.js)
const Song = mongoose.model('Song', new mongoose.Schema({
    title: String,
    artist: String,
    filename: String,
    image: String,
    addedAt: { type: Date, default: Date.now }
}));

// 3. The Data to Insert
const seedSongs = [
    {
    title: "Be my Baby",
    artist: "Priated by AmeX",
    filename: "song.mp3",
    // This link gives a random valid photo every time
    image: "https://picsum.photos/200" 

    },
    {
        title: "Debug Mode",
        artist: "Linux Mint",
        filename: "test.mp3",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Tux.svg/1200px-Tux.svg.png" // The Linux Penguin
    }
];

// 4. Run the Injection
const seedDB = async () => {
    await Song.deleteMany({}); // Safety: Wipes old data so we don't get duplicates
    await Song.insertMany(seedSongs);
    console.log("🌱 Database Seeded! Added 2 Songs.");
    mongoose.connection.close(); // Cut connection when done
};

seedDB();
