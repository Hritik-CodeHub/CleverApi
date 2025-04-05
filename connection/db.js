const mongoose = require("mongoose");

const connectDb = async () => {
  await mongoose
    .connect(process.env.STRING)
    .then(() => {
      console.log("connected to data base successfully");
    })
    .catch((error) => {
      console.log("failed to connect with data base", error);
    });
};

module.exports = connectDb;