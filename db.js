const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: String,

  coin: { type: Number, default: 0 },
  silver: { type: Number, default: 0 },
  hp: { type: Number, default: 0 },

  chromeLevel: { type: Number, default: 1 },

  nft: { type: Array, default: [] },

  lastDaily: { type: Number, default: 0 },
  lastWheel: { type: Number, default: 0 },
  lastBoost: { type: Number, default: 0 },

  referralCount: { type: Number, default: 0 },
  referredBy: String
});

const User = mongoose.model("User", userSchema);

// ================= CONNECT DB (FIXED) =================
async function connectDB() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("🟢 MongoDB Connected Successfully");
  } catch (err) {
    console.log("🔴 Mongo Error:", err.message);

    // مهم برای Railway که کرش نکنه
    process.exit(1);
  }
}

module.exports = { User, connectDB };