const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

const connectDB = async (uri) => {
    await mongoose.connect(uri, {
        maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE || "20", 10),
        serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB connected");
    return mongoose.connection;
};

module.exports = connectDB;
