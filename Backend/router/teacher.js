const express = require("express");
const {
  createTeacher,
  loginTeacher,
  createClass,
  createPaper,
  allStudents,
  allExstClasses,
  allClassPaper,
  allAttempedPaper,
} = require("../controller/teacherController");
const authUser = require("../middleware/userAuth");

const teacheRouter = express.Router();

//route for creating new teacher
teacheRouter.post("/create", createTeacher);
//route for login new teacher
teacheRouter.post("/login", loginTeacher);
//route for creating new class
teacheRouter.post("/createClass", authUser, createClass);
//route for getting all existing classes
teacheRouter.get("/allExstClasses", authUser, allExstClasses);
//route for creating new  QUESTION PAPER
teacheRouter.post("/createPaper", authUser, createPaper);
//route for getting all CLASS SAVED PAPER
teacheRouter.post("/allPapers", authUser, allClassPaper);
//getting all students of a class
teacheRouter.post("/allStudents", authUser, allStudents);
//route for getting the all USER ATTEMPTED PAPERS
teacheRouter.post("/allAttempedPaper", authUser, allAttempedPaper);

module.exports = teacheRouter;
