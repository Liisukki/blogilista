const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const Blog = require('./models/blog')

require('dotenv').config()
const password = process.env.MONGODB_PASSWORD

const mongoUrl = `mongodb+srv://liisukotilainen:${password}@blogilista.2izhe.mongodb.net/?retryWrites=true&w=majority&appName=blogilista`;
mongoose.connect(mongoUrl);
mongoose.connect(mongoUrl);

app.use(cors());
app.use(express.json());

app.get("/api/blogs", (request, response) => {
  Blog.find({}).then((blogs) => {
    response.json(blogs);
  });
});

app.post("/api/blogs", (request, response) => {
  const blog = new Blog(request.body);

  blog.save().then((result) => {
    response.status(201).json(result);
  });
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
