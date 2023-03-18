const mongoose = require("mongoose");
const colors = require("colors");
const connectDB = () => {
  try {
    mongoose.set("strictQuery", false);
    mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`Database connected successfully`.bgCyan);
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    process.exit();
  }
};

module.exports = connectDB;
