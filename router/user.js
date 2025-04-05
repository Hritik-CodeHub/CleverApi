const express = require("express");
const {
  createUser,
  loginUser,
  joinClass,
  attemptPaper,
  allAtmptPapers,
  allClasses,
  allPapers,
  allEnrolledClasses,
} = require("../controller/userController");
const authUser = require("../middleware/userAuth");

// const authUser = require("../middleware/userAuth");

const userRouter = express.Router();

//making rote for creating a new user
userRouter.post("/createUser", createUser);
// making route for login user
userRouter.post("/loginUser", loginUser);
//route for FETCHING ALL CLASSES
userRouter.get("/allClasses", authUser, allClasses);
//route for FETCHING ALL ENROLLED CLASSES
userRouter.get("/allEnrldClasses", authUser, allEnrolledClasses);
//route for joining class
userRouter.put("/joinClass", authUser, joinClass);
//route for getting all PAPERS
userRouter.post("/allPapers", authUser, allPapers);
//route for attempting the questions
userRouter.post("/answeres", authUser, attemptPaper);
//route for fetching all the attempted papers
userRouter.get("/allAtmptPapers", authUser, allAtmptPapers);

module.exports = userRouter;
