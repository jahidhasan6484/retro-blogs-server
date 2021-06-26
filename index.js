const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const admin = require('firebase-admin');
require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require('mongodb').ObjectID;

const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.j3ujg.mongodb.net/${process.env.DB_Name}?retryWrites=true&w=majority`;

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("blog"));
app.use(fileUpload());

const serviceAccount = require("./retro-blogs-firebase-adminsdk-bipve-db862c67c9.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const port = 5000;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const adminCollection = client.db("blogs").collection("addAdmin");
  const blogsCollection = client.db("blogs").collection("addBlog");

  //Add Admin
  app.post("/addAdmin", (req, res) => {
    const newAdmin = req.body;
    adminCollection.insertOne(newAdmin).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });


  //Check Admin or not
  app.post('/isAdmin', (req, res) => {
    const email = req.body.email;
    adminCollection.find({ email: email })
      .toArray((err, doctors) => {
        res.send(doctors.length > 0);
      })
  })


  //Add Blogs
  app.post("/addABlog", (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const content = req.body.content;
    const date = req.body.date;
    const newImg = file.data;
    const encImg = newImg.toString("base64");

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, "base64"),
    };

    blogsCollection
      .insertOne({ title, content, date, image })
      .then((result) => {
        res.send(result.insertedCount > 0);
      });
  });



  //Get Blogs
  app.get("/blogs", (req, res) => {
    blogsCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  //Delete Blog
  app.delete('/delete/:id', (req, res) => {
    console.log(req.params.id);
    blogsCollection.deleteOne({ _id: ObjectId(req.params.id) })
      .then(result => {
        res.send(result.deletedCount > 0);
      });
  });


});


app.listen(process.env.PORT || port);
