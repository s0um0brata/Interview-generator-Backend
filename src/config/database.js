// const mongoose = require("mongoose");

// async function connectToDB() {
//     try {
//         await mongoose.connect(process.env.MONGO_URI);

//         console.log("Connected to Database")
//     } catch (error) {
//         console.log(error);
//     }
// }

// module.exports = connectToDB;


const mongoose = require("mongoose");

function connectToDB() {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("MongoDB connected successfully");
    })
    .catch((err) => {
      console.log("MongoDB connection error:", err);
    });
}

module.exports = connectToDB;