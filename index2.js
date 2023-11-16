const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use("/", express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const userExercisesSchema = mongoose.Schema({
  username: { type: String, required: true },

  log: [
    {
      description: {
        type: String,
        required: true,
      },
      duration: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
    },
  ],
});

const User = mongoose.model("User", userExercisesSchema);

app.use(bodyParser.urlencoded({ extended: true }));

app.post("/api/users", (req, res) => {
  User.findOne({ username: req.body.username }, (err, doc) => {
    if (doc) {
      res.json({
        userame: doc.username,
        _id: doc._id,
      });
    } else {
      User.create({
        username: req.body.username,
        log: [],
      }).then((savedDoc) => {
        res.json({
          username: savedDoc.username,
          _id: savedDoc._id,
        });
      });
    }
  });
});

app.post("/api/users/:id/exercises/", (req, res) => {
  // Access document related to input id
  User.findById(req.params.id, (err, doc) => {
    if (doc) {
      doc.log.push({
        description: req.body.description,
        duration: req.body.duration,
        date:
          new Date(req.body.date).toDateString() != "Invalid Date"
            ? new Date(req.body.date)
            : new Date(),
      });

      doc.save().catch((err) => {
        console.log("DOCSAVE ERR ", err);
      });

      res.json({
        _id: doc._id,
        username: doc.username,
        description: req.body.description,
        duration: parseInt(req.body.duration),
        date:
          new Date(req.body.date).toDateString() != "Invalid Date"
            ? new Date(req.body.date).toDateString()
            : new Date().toDateString(),
      });
    }
  });
});

app.get("/api/users", (req, res) => {
  User.find({}, (err, docs) => {
    res.json(docs);
  }).select({ username: 1, _id: 1 });
});

app.get("/api/users/:id/logs", (req, res) => {
  User.findById(req.params.id, (err, doc) => {
    if (doc) {
      res.json({
        username: doc.username,
        count: doc.log.length,
        _id: doc._id,
        log: doc.log
          .sort((exerciseA, exerciseB) => {
            return exerciseA.date - exerciseB.date;
          })

          .filter((exercise) => {
            let fromDate = new Date(req.query.from);
            let toDate = new Date(req.query.to);

            if (
              fromDate.toDateString() !== "Invalid Date" &&
              toDate.toDateString() !== "Invalid Date"
            ) {
              return exercise.date >= fromDate && exercise.date <= toDate;
            } else if (fromDate.toDateString() !== "Invalid Date") {
              return exercise.date >= fromDate;
            } else if (toDate.toDateString() !== "Invalid Date") {
              return exercise.date <= toDate;
            } else if (
              fromDate.toDateString() == "Invalid Date" &&
              toDate.toDateString() == "Invalid Date"
            ) {
              return true;
            }
          })
          .slice(
            0,
            parseInt(req.query.limit)
              ? parseInt(req.query.limit)
              : doc.log.length
          )
          .map((exercise, index) => {
            return {
              description: exercise.description,
              duration: exercise.duration,
              date: exercise.date.toDateString(),
              _id: exercise._id,
            };
          }),
      });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
