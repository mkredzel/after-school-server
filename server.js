const dotenv = require("dotenv");
const express = require("express");
const app = express();
app.use(express.json()); 

// Declare MongoClient and ObjectID
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;

dotenv.config();

// MongoDB connection
MongoClient.connect(
  process.env.MONGO_DB,
  { useUnifiedTopology: true },
  (err, client) => {
    db = client.db("AfterSchool");
  }
);

// Set static folder
app.use("/public", express.static("public", { fallthrough: true }));

// Logger middleware
let logger = (req, res, next) => {
  let current_datetime = new Date();
  let formatted_date = `${current_datetime.getFullYear()}-${
    current_datetime.getMonth() + 1
  }-${current_datetime.getDate()} ${current_datetime.getHours()}:${current_datetime.getMinutes()}:${current_datetime.getSeconds()}`;
  let method = req.method;
  let url = req.url;
  let status = res.statusCode;
  let log = `[${formatted_date}] ${method}:${url} ${status}`;
  console.log(log);
  next();
};

app.use(logger);

// CORS
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS");
  next();
});

app.param("collectionName", (req, res, next, collectionName) => {
  req.collection = db.collection(collectionName);
  return next();
});

// Display message
app.get("/", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send("Select a collection, e.g., /collection/messages");
});

// GET documents from collection
app.get("/collection/:collectionName", (req, res, next) => {
  req.collection.find({}).toArray((e, results) => {
    if (e) return next(e);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(results);
  });
});

// POST document to collection
app.post("/collection/:collectionName", (req, res, next) => {
  req.collection.insertOne(req.body, (e, results) => {
    if (e) return next(e);
    res.send(results.ops);
  });
});

// PUT document by id
app.put("/collection/:collectionName/:id", (req, res, next) => {
  req.collection.updateOne(
    { _id: new ObjectID(req.params.id) },
    { $set: req.body },
    { safe: true, multi: false },
    (e, result) => {
      if (e) return next(e);
      res.send(result.result.n === 1 ? { msg: "success" } : { msg: "error" });
    }
  );
});

// Display 404 image on all other paths
app.get("*", function (req, res) {
  res.sendFile("public/404.jpg", { root: __dirname });
});

// Port declaration
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, console.log(`Server started on port ${PORT}`));