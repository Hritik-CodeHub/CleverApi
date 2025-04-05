const express = require("express");
const cors = require("cors");
const userRouter = require("./router/user");
const teacherRouter = require("./router/teacher");
const connectDb = require("./connection/db");
require("dotenv").config();
const bodyParser = require("body-parser");
const { createServer } = require("node:http");

const app = express();
const PORT = process.env.PORT || 8021;

// CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://clever-ai-two.vercel.app"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(bodyParser.json());

connectDb();

app.use("/api/user/st", userRouter);
app.use("/api/user/tec", teacherRouter);

app.get("/", (req, res) => {
  res.send("API IS RUNNING");
});

const server = createServer(app);
server.listen(PORT, () => {
  console.log(`CleverAi is running on port ${PORT}`);
});
