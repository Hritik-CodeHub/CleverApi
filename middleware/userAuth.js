const jwt = require("jsonwebtoken");

const authUser = async (req, res, next) => {
  const token = req.header("auth-token");
  console.log("middleware");
  if (!token) {
    console.log("User token is missing. Please login");
    res.status(401).json({ message: "User token is missing. Please login" });
  }
  try {
    const data = jwt.verify(token, process.env.SECRET);
    req.id = data;
    next();
    console.log("middleware data", data);
  } catch (error) {
    console.log("internal server error", error);
    res.status(400).json({ message: "internal server error authtoken" });
  }
};
module.exports = authUser;
