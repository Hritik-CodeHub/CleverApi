const express = require("express");
const userRouter = require("./router/user");
const teacherRouter = require("./router/teacher");
const connectDb = require("./connection/db");
const cors = require("cors");

require("dotenv").config();

const bodyParser = require("body-parser");

const { createServer } = require("node:http");

const app = express();

const PORT = process.env.PORT || 8021;
connectDb();

const server = createServer(app);

app.use(cors());
app.use(bodyParser.json());
// app.use(express.json({ limit: "50mb" }));


// making middleware for differnt-different API call
app.use("/api/user/st", userRouter);
app.use("/api/user/tec", teacherRouter);

app.get("/", (req, res) => {
  res.send("API IS RUNNING");
});


server.listen(PORT, () => {
  console.log(`CleverAi is running on port ${PORT}`);
});
