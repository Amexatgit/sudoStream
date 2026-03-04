require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const NodeID3 = require('node-id3'); // 🟢 Our new extractor

const MONGO_URI = process.env.MONGO_URI; 
const Song = require('./models/Song'); 

const MUSIC_DIR = path.join(__dirname, 'music'); 
const COVERS_DIR = path.join(__dirname, 'covers');

// 🟢 Auto-create the covers folder if it doesn't exist
if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR);

async function ingestSongs() {
    try {
        console.log("🔌 Connecting to Database...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected!\n");

        const files = fs.readdirSync(MUSIC_DIR);
        let updatedCount = 0;
        let newCount = 0;

        console.log(`📂 Scanning ${files.length} files for embedded album art...\n`);

        for (const file of files) {
            try {
                if (file.toLowerCase().endsWith('.mp3')) {
                    const safeFileName = file.replace(/[\r\n\t]/g, ''); 
                    const nameWithoutExt = file.substring(0, file.lastIndexOf('.'));
                    const parts = nameWithoutExt.split('-');
                    
                    if (parts.length >= 2) {
                        const artist = parts[0].trim();
                        const title = parts.slice(1).join('-').trim();
                        
                        // 🟢 EXTRACTION MAGIC
                        const filePath = path.join(MUSIC_DIR, file);
                        const tags = NodeID3.read(filePath);
                        
                        // Default fallback image
                        let imageUrl = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=150&auto=format&fit=crop"; 

                        if (tags.image && tags.image.imageBuffer) {
                            // Save the embedded image to the covers folder
                            const imageName = `${safeFileName}.jpg`;
                            const imagePath = path.join(COVERS_DIR, imageName);
                            fs.writeFileSync(imagePath, tags.image.imageBuffer);
                            
                            // ✅ THE FIX: Save ONLY the relative path!
                            imageUrl = `/covers/${imageName}`;
                        }

                        const exists = await Song.findOne({ filename: file });
                        
                        if (!exists) {
                            // Add brand new song
                            const newSong = new Song({
                                title: title, artist: artist, filename: file,
                                image: imageUrl, isPrivate: true 
                            });
                            await newSong.save();
                            console.log(`🎵 Added: ${title} (with Album Art)`);
                            newCount++;
                        } else {
                            // 🟢 UPDATE EXISTING SONG WITH REAL ART
                            if (exists.image !== imageUrl && imageUrl.includes('/covers/')) {
                                exists.image = imageUrl;
                                await exists.save();
                                console.log(`🖼️ Fixed Art for: ${safeFileName}`);
                                updatedCount++;
                            } else {
                                console.log(`⏭️ Skipped (Already perfect): ${safeFileName}`);
                            }
                        }
                    }
                }
            } catch (fileErr) {
                console.log(`❌ Error processing file ${file}:`, fileErr.message);
            }
        }

        console.log(`\n🎉 Done! Added ${newCount} new songs and fixed art for ${updatedCount} existing songs.`);
        process.exit(0);

    } catch (err) {
        console.error("❌ Fatal Error:", err);
        process.exit(1);
    }
}

ingestSongs();
