const blogRouter = require("express").Router();
const Blog = require("../models/blog");

// Hae kaikki blogit
blogRouter.get("/", (request, response) => {
  Blog.find({}).then((blogs) => {
    response.json(blogs);
  });
});

// Lisää uusi blogi
blogRouter.post("/", (request, response) => {
  const body = request.body;

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
  });

  blog.save().then((savedBlog) => {
    response.status(201).json(savedBlog);
  });
});

module.exports = blogRouter;
