const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require("mongoose");
// const bodyParser = require("body-parser");
// const urlencodedParser = bodyParser.urlencoded({ extended: false });

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true }, () => {
  console.log("Database Connected Successfully...");
});

const userSchema = new mongoose.Schema({
  username: String,
});

const excerciseSchema = new mongoose.Schema({
  id: String,
  username: String,
  userId: String,
  duration: Number,
  description: { type: String, require: true },
  date: Date,
});

const Users = mongoose.model("Users", userSchema);
const Excercise = mongoose.model("Excercise", excerciseSchema);

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

//#1. user registration - PASSED
app.post("/api/users", function (req, res) {
  console.log("usename...", req.body.username);
  const userName = new Users({ username: req.body.username });
  userName.save((err, userName) => {
    if (err) return console.log("error-user");
    res.status(200).json({ username: userName.username, _id: userName._id });
  });
});

//#2. show all users - PASSED
app.get("/api/users", function (req, res) {
  Users.find({}, { username: 1, _id: 1 }, (err, data) => {
    if (err) return console.log("error-usersss");
    res.status(200).send(data);
  });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const userId = req.params._id;
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  let date = new Date(req.body.date);
  // res.json({ echo: userId, userId: userId, description: description, duration: duration });

  if (date === "Invalid Date") {
    date = new Date().toDateString();
  } else {
    date = new Date(date).toDateString();
  }

  if (!description) return res.json({ error: "description is require" });
  if (!duration) return res.json({ error: "duration is require" });

  let user = await Users.findById(userId).select("username");

  if (!user) return res.json({ error: "unknown user" });

  let excercise = await Excercise.create({
    username: user.username,
    description,
    duration,
    date,
    userId,
  });

  return res.json({
    _id: user._id,
    username: user.username,
    date,
    duration,
    description,
  });
});

//#3. add exercises returning user and exercise data - NOT PASSED YET
// app.get("/api/users/:_id/exercises", (req, res) => {
//   const { _id } = req.params;
//   console.log("userid", _id);
// });

// app.get("/api/users/:_id/logs", async (req, res) => {
//   const { _id } = req.params;

//   Excercise.find(
//     {},
//     { userId: 1, username: 1, description: 1, duration: 1, date: 1 },
//     (err, data) => {
//       if (err) return console.log("error-logs", err);
//       res.status(200).send(data);
//     }
//   );
// });

// app.get('/api/users/:_id/logs?', (req, res) => {
//   objId = "";
//   objId = mongoose.Types.ObjectId(req.params._id);
//   Users.findOne({"_id": objId}, (err,user)=> {
//     if(err) return console.log(err);

//     const queryStr =
//       (!isNaN(new Date(req.query.from)) && !isNaN(new Date(req.query.to)))?

//     {
//       "id": req.params._id,
//       "date": {
//         "$gte": new Date(req.query.from),
//         "$lte": new Date(req.query.to)
//       }
//       }
//       :
//     {
//       "id": req.params._id
//       }

//     Excercise.find(queryStr, (err,data)=> {
//       if(err) return console.log(err);

//       const excCount = data.reduce((acc, curr) => {
//         return acc + 1
//       },0)

//       res.status(200).json({_id:user._id, username:user.username, count:excCount, log:data});
//     }).limit(parseInt(req.query.limit))
//   })
// })

app.get("/api/users/:_id/logs", async (req, res) => {
  let userId = req.params._id;
  let user = await Users.findById(userId).select("username");
  let count = await Excercise.countDocuments({ userId });
  let log = await Excercise.find({ userId });

  if (!user) {
    return res.json({ error: "unknown userId" });
  }

  if (req.query.from || req.query.to) {
    let from = new Date(req.query.from);
    let to = new Date(req.query.to);
    let limit = parseInt(req.query.limit);

    if (from == "Invalid Date") {
      from = new Date();
    } else {
      from = new Date(from);
    }

    if (to == "Invalid Date") {
      to = new Date();
    } else {
      to = new Date(to);
    }

    log = await Excercise.find({
      userId,
      date: { $gte: from, $lte: to },
    }).limit(limit);
    count = log.length;
  } else if (req.query.limit) {
    let limit = parseInt(req.query.limit);
    log = await Excercise.find({ userId }).limit(limit);
    count = log.length;
  }

  let userLog = log.map((each) => {
    return {
      description: each.description,
      duration: each.duration,
      date: new Date(each.date).toDateString(),
    };
  });

  res.json({
    _id: user._id,
    username: user.username,
    count,
    log: userLog,
  });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
