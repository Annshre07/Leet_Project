const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const { Readable } = require("stream");

let bucket;

// Initialize GridFSBucket once MongoDB is connected
mongoose.connection.once("open", () => {
    bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "codes" });
    console.log("📂 GridFSBucket initialized for storing source code");
});

/**
 * Stores the generated code in MongoDB GridFS
 * @param {string} format - Programming language file extension (e.g., "cpp", "py")
 * @param {string} content - The actual source code
 * @returns {Promise<string>} - Returns file ID of stored code
 */
const generateFile = async (format, content) => {
    if (!bucket) {
        throw new Error("⚠️ GridFSBucket is not initialized. Ensure MongoDB is connected.");
    }

    return new Promise((resolve, reject) => {
        const filename = `code-${Date.now()}.${format}`;
        const readStream = Readable.from(content);

        const uploadStream = bucket.openUploadStream(filename);

        readStream.pipe(uploadStream)
            .on("error", (err) => {
                console.error("❌ GridFS Upload Error:", err);
                reject(err);
            })
            .on("finish", () => {
                console.log(`✅ Code stored in MongoDB with ID: ${uploadStream.id}`);
                resolve(uploadStream.id.toString()); // Convert ObjectId to string
            });
    });
};

module.exports = { generateFile };
