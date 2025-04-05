const classSchema = require("../models/class");
const Question = require("../models/question");
const User = require("../models/user");
const Teacher = require("../models/teacher");
const Paper = require("../models/paper");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

//creating a new teacher using POST method /api/user/createuser
const createTeacher = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "All fields are mendatory", success: false });
  } else {
    //checking for user already exist or not
    const userExist = await Teacher.findOne({ email });
    if (!userExist) {
      //hashing password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 7);
      try {
        const create = await Teacher.create({
          name,
          email,
          password: hashedPassword,
        });
        //returnign json web token in respose
        const authToken = jwt.sign(create.id, process.env.SECRET);
        return res.status(200).json({
          message: "New teacher created successfully",
          authToken,
          success: true,
        });
      } catch (error) {
        console.log("teacher creating internal server error", error);
        return res.status(400).json({
          message: "Teacher creating internal server error",
          success: false,
        });
      }
    } else {
      return res
        .status(400)
        .json({ message: "Email already registered", success: false });
    }
  }
};

//login a teacher using POST method /api/user/loginuser
const loginTeacher = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "All fields are mendatory", success: false });
  } else {
    // checking for teacher exist or not
    const userExist = await Teacher.findOne({ email });
    if (userExist) {
      // comparing the user input password and data base password
      const isCorrectPassword = await bcrypt.compare(
        password,
        userExist.password
      );
      if (isCorrectPassword) {
        // returning a json web token to logined user
        const authToken = jwt.sign(userExist.id, process.env.SECRET);
        return res.status(200).json({
          message: "Teacher login successfully",
          authToken,
          success: true,
        });
      } else {
        console.log("Please enter with right credentials");
        return res.status(400).json({
          message: "Please enter with right credentials",
          success: false,
        });
      }
    } else {
      return res
        .status(404)
        .json({ message: "User does not exist", success: false });
    }
  }
};

//creating new class
const createClass = async (req, res) => {
  const { className } = req.body;
  const _id = req.id;
  console.log(className, _id);
  if (className && _id) {
    //checking class name is already exist or not
    const classNameExist = await classSchema.find({
      name: className,
      teacher: _id,
    });
    if (classNameExist.length === 0) {
      try {
        const newClass = await classSchema.create({
          name: className,
          teacher: _id,
        });
        console.log("New class created successfully", newClass);
        return res
          .status(200)
          .json({ message: "New class created successfully", success: true });
      } catch (error) {
        console.log("Creating class server error", error);
        return res
          .status(400)
          .json({ message: "Creating class server error", success: false });
      }
    } else {
      console.log("class already exist with same name");
      return res.status(401).json({
        message: "class already exist with same name",
        success: false,
      });
    }
  } else {
    console.log("teacher required");
    return res
      .status(400)
      .json({ message: "teacher required", success: false });
  }
};

//getting all TEACHER CREATED CLASSES
const allExstClasses = async (req, res) => {
  const teacherId = req.id;
  try {
    const allClasses = await classSchema.find({ teacher: teacherId });
    console.log("all classes", allClasses);
    return res.status(200).json({ allClasses: allClasses, success: true });
  } catch (error) {
    console.log("all exist classes error", error);
    return res.status(400).json({ message: "server error", success: false });
  }
};

//creating quesion paper
const createPaper = async (req, res) => {
  const { title, classId, questions } = req.body;
  if (classId && title && questions && questions.length !== 0) {
    try {
      const existingClass = await classSchema.findById(classId);
      // Step 2: Create the Paper document and associate it with the found Class
      const newPaper = new Paper({
        title: title,
        classId: existingClass._id, // Reference to the existing Class
      });

      const savedPaper = await newPaper.save(); // Save the Paper to DB
      console.log("saved paper is", savedPaper);

      // Step 3: Create the Questions with the reference to the saved Paper
      const questionDocs = questions.map((q) => ({
        text: q.text,
        answere: q.answere,
        paperId: savedPaper._id, // Reference to the saved Paper
      }));

      // Step 4: Insert the questions into the database
      const savedQuestions = await Question.insertMany(questionDocs);
      console.log("saved questions is", savedQuestions);

      // Step 5: Update the Paper document with the Question references
      savedPaper.questions = savedQuestions.map((q) => q._id);
      const cmptPaper = await savedPaper.save();

      await classSchema.findByIdAndUpdate(
        { _id: existingClass._id },
        { $push: { papers: cmptPaper._id } },
        { new: true }
      );

      // Return the response with the created Paper and Questions
      return res.status(201).json({
        message: "Paper and Questions created successfully",
        paper: savedPaper,
        questions: savedQuestions,
        success: true,
      });
    } catch (error) {
      console.log("Creating class server error", error);
      return res
        .status(400)
        .json({ message: "Creating class server error", success: false });
    }
  } else {
    console.log("all fields required");
    return res
      .status(400)
      .json({ message: "all fields required", success: false });
  }
};

//fetching all SAVED PAPER of CLASS
const allClassPaper = async (req, res) => {
  const { classId } = req.body;
  if (classId) {
    try {
      const allSavedPaper = await Paper.find({ classId: classId }).populate(
        "questions"
      );
      console.log("all saved papers", allSavedPaper);
      return res
        .status(200)
        .json({ success: true, allClassPapers: allSavedPaper });
    } catch (error) {
      console.log("all class paper server error", error);
      return res
        .status(400)
        .json({ message: "all class paper server error", success: false });
    }
  } else {
    console.log("Class id is missing");
    return res
      .status(400)
      .json({ message: "Class id is missing", success: false });
  }
};

//fetching all ENROLLED STUDENTS of a CLASS
const allStudents = async (req, res) => {
  const { classId } = req.body;
  if (classId) {
    const stu = await classSchema
      .findById(classId)
      .populate("students", "name");
    console.log("students is", stu);
    return res.status(200).json({ students: stu.students, success: true });
  } else {
    console.log("classid fields required");
    return res
      .status(400)
      .json({ message: "classid fields required", success: false });
  }
};

//fetching the USER ALL ATTEMPTED PAPER in a class
const allAttempedPaper = async (req, res) => {
  const { classId, userId } = req.body;
  if (classId && userId) {
    try {
      const userDetails = await User.findById(userId).select("history");
      const filterPapers = userDetails.history.filter(
        (ppr) => ppr.classId == classId
      );
      // console.log("user details", filterPapers);
      res.status(200).json({ success: true, attmpPapr: filterPapers });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: "Internal server error, try again" });
    }
  } else {
    console.log("classid/userId fields required");
    return res.status(400).json({ message: "Try again", success: false });
  }
};

module.exports = {
  createTeacher,
  loginTeacher,
  createClass,
  allExstClasses,
  createPaper,
  allClassPaper,
  allStudents,
  allAttempedPaper,
};
