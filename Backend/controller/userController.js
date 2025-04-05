const User = require("../models/user");
const Paper = require("../models/paper");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const classSchema = require("../models/class");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

//creating a new user using POST method /api/user/createuser
const createUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "All fields are mendatory", success: false });
  } else {
    //checking for user already exist or not
    const userExist = await User.findOne({ email });
    if (!userExist) {
      //hashing password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 7);
      try {
        const create = await User.create({
          name,
          email,
          password: hashedPassword,
        });
        //returnign json web token in respose
        const authToken = jwt.sign(create.id, process.env.SECRET);
        return res.status(200).json({
          message: "New user created successfully",
          authToken,
          success: true,
        });
      } catch (error) {
        console.log("user creating internal server error", error);
        return res.status(400).json({
          message: "user creating internal server error",
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

//login a new user using POST method /api/user/loginuser
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "All fields are mendatory", success: false });
  } else {
    // checking for user exist or not
    try {
      const userExist = await User.findOne({ email });
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
            message: "User login successfully",
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
    } catch (error) {
      console.log("login user server error", error);
      return res
        .status(400)
        .json({ success: false, message: "Internal server error try again" });
    }
  }
};

//getting ALL CLASSES in which USER NOT ENROLLED
const allClasses = async (req, res) => {
  try {
    const enrldClass = await User.findById(req.id)
      .select("enrolledClasses")
      .populate("enrolledClasses", "_id")
      .exec();
    // console.log("user", enrldClass);
    const allClass = await classSchema.find();
    const enrolledClassIds = new Set(
      enrldClass.enrolledClasses.map((cls) => cls._id.toString())
    );
    const unenrolledClasses = allClass.filter(
      (cls) => !enrolledClassIds.has(cls._id.toString())
    );
    // console.log("unenrolled classes", unenrolledClasses);
    return res.status(200).json({ success: true, classes: unenrolledClasses });
  } catch (error) {
    console.log("all classes server error", error);
    return res
      .status(400)
      .json({ success: false, message: "Internal server error try again" });
  }
};

//getting ALL CLASSES in which USER IS ENROLLED
const allEnrolledClasses = async (req, res) => {
  try {
    const enrldClass = await User.findById(req.id)
      .select("enrolledClasses")
      .populate("enrolledClasses")
      .exec();
    console.log("user", enrldClass);
    return res.status(200).json({ success: true, classes: enrldClass });
  } catch (error) {
    console.log("allEnrolledClasses server error", error);
    return res
      .status(400)
      .json({ success: false, message: "Internal server error try again" });
  }
};

//student can join the class /api/user/st/joinClass
const joinClass = async (req, res) => {
  const { classId } = req.body;
  if (classId) {
    try {
      const classData = await classSchema.findByIdAndUpdate(
        { _id: classId },
        { $push: { students: req.id } },
        { new: true }
      );
      //saving CLASSID in STUDENT SCHEMA
      await User.findByIdAndUpdate(
        { _id: req.id },
        { $push: { enrolledClasses: classId } },
        { new: true }
      );
      console.log("class joined successfully");
      return res.status(200).json({ message: "Class joined", success: true });
    } catch (error) {
      console.log("Join class internal server error. Try agin");
      return res.status(400).json({
        message: "Join class internal server error. Try agin",
        success: false,
      });
    }
  } else {
    return res
      .status(404)
      .json({ message: "Class id missing. Try again", success: false });
  }
};

//fetching all the PAPERS of a class
const allPapers = async (req, res) => {
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

//creating post request for ATTEMPTIN the QUESITON PAPAER and VALIDATING WITH GIMINI ans STORING RESULT in DATABASE
const attemptPaper = async (req, res) => {
  const { classId, answeres, paperId } = req.body;
  console.log("answere is", answeres);
  if (classId && answeres && paperId) {
    try {
      //fetching all QUESTIONS of PAPERID
      const qutn = await Paper.findById(paperId).populate(
        "questions",
        "text answere"
      );
      console.log("questions is", qutn.questions);

      //attaching USER-ANSWERES with EACH QUESTION
      const GimPrompt = qutn.questions.map((q, num) => {
        return {
          question: q.text,
          answere: q.answere,
          userAnswere: answeres[num].answere,
        };
      });

      //converting ARRAY of OBJECTS into STRING for GIMINI prompt
      const promptText = GimPrompt.map(
        (item, index) =>
          `Question ${index + 1}: ${item.question}\nCorrect Answer: ${
            item.answere
          }\nUser Answer: ${item.userAnswere}\n`
      ).join("\n");

      console.log("answere with quesiton", promptText);

      //communicating with GIMINI
      const genAI = new GoogleGenerativeAI(process.env.GIMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `${promptText} Evaluate the user's answers to the questions. For each response, provide feedback on how it can be improved in one line. After evaluating all responses, give a final score out of 100 based on the overall quality. Return the feedback only in the following format: 'response1 $ response2 $ response3 $ score'. Do not mention the question numbers, response number, score.`;
      // const prompt = `${promptText} evaluate each user answere with its answere and return how to improve user his answere for each quesion within 1 line like this response1 $ response2 $ response3 without mentioning the quesiton number at last give score out of 100`;

      let result = await model.generateContent(prompt);
      console.log("result", result.response.text());
      const giminiResponse = result.response.text().split("$ ");
      const n = parseInt(giminiResponse[giminiResponse.length - 1].trim());
      console.log("gimini response", giminiResponse);
      console.log("score", n);

      // STORING the PAPER RESULT in USER HISTORY
      const user = await User.findById(req.id);

      const newHistory = {
        classId: classId,
        paperId: paperId,
        responses: answeres.map((r, num) => {
          return {
            question: qutn.questions[num].text,
            answere: r.answere,
            isCorrect: giminiResponse[num],
          };
        }),
        score: n,
        attemptedAt: new Date(),
      };

      console.log("new user history", newHistory);
      user.history.push(newHistory);
      await user.save();

      // Return the response with the created Paper and Questions
      return res.status(201).json({
        message: "Answere saved successfully",
        paper: user,
        success: true,
      });
      // return res.status(200).json({
      //   message: "Answere saved successfully",
      //   success: true,
      // });
    } catch (error) {
      console.log("Creating Answeres server error", error);
      return res
        .status(400)
        .json({ message: "Creating Answeres server error", success: false });
    }
  } else {
    console.log("classid or answeres is missing");
    return res
      .status(404)
      .json({ message: "classid or answeres is missing", success: false });
  }
};

//returning all the attempted papper
const allAtmptPapers = async (req, res) => {
  try {
    const allAttempts = await User.findById(req.id).select("history");

    // const allAttempts = await User.findById(req.id)
    //   .populate({
    //     path: "history.responses.questionId",
    //     select: "text answere",
    //   })
    //   .select("history");
    return res.status(200).json({ allPapers: allAttempts });
  } catch (error) {
    console.log("allAtmpPaper server error", error);
    return res.status(400).json({ message: "allAtmpPaper server error" });
  }
};

module.exports = {
  createUser,
  loginUser,
  allClasses,
  allEnrolledClasses,
  joinClass,
  allPapers,
  attemptPaper,
  allAtmptPapers,
};

// const genAI = new GoogleGenerativeAI(process.env.GIMINI_API_KEY);
//   const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

//   const prompt = "who are you";

//   const result = await model.generateContent(prompt);
//   console.log(result.response.text());
