const blogsRouter = require("express").Router();
const { response } = require("../app");
const Blog = require("../models/blog");

// Hae kaikki blogit
blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}); // Hae kaikki blogit
  response.json(blogs);
});

// Lisää uusi blogi
blogsRouter.post("/", async (request, response) => {
  const body = request.body;

  // Check for required fields
  if (!body.title || !body.url) {
    return response.status(400).json({ error: "Title and URL are required" });
  }

  // Luodaan uusi blogi
  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0, // Jos likes puuttuu, oletusarvo 0
  });

  try {
    const savedBlog = await blog.save();
    response.status(201).json(savedBlog); // Return the saved blog
  } catch (error) {
    response.status(500).json({ error: "Failed to save the blog" });
  }

  // Tallennetaan blogi tietokantaan
  const savedBlog = await blog.save();
});

blogsRouter.get("/:id", async (request, response) => {
  const blog = await Blog.findById(request.params.id);
  if (blog) {
    response.json(blog);
  } else {
    response.status(404).end();
  }
});

// Poista blogi
blogsRouter.delete("/:id", async (request, response) => {
  await Blog.findByIdAndDelete(request.params.id);
  response.status(204).end();
});

// Lisää tarvittaessa PUT reitti blogin päivitykselle
blogsRouter.put("/:id", async (request, response) => {
  const body = request.body;

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  };

  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
    new: true,
  });
  response.json(updatedBlog);
});

module.exports = blogsRouter;
