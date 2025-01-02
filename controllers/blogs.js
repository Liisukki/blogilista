const jwt = require("jsonwebtoken");
const blogsRouter = require("express").Router();
const Blog = require("../models/blog");
const User = require("../models/user");

// Tokenin hakeminen requestin headeristä
const getTokenFrom = (request) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "");
  }
  return null;
};

// Hae kaikki blogit
blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", { username: 1, name: 1 });
  response.json(blogs);
});

// Lisää uusi blogi
blogsRouter.post("/", async (request, response) => {
  const body = request.body;

  // Tokenin dekoodaus
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET);
  if (!decodedToken.id) {
    return response.status(401).json({ error: "token invalid" });
  }

  // Tarkistetaan, että tarvittavat kentät ovat olemassa
  if (!body.title || !body.url) {
    return response.status(400).json({ error: "Title and URL are required" });
  }

  // Luodaan uusi blogi
  const user = await User.findById(decodedToken.id);
  if (!user) {
    return response.status(401).json({ error: "User not found" });
  }

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0, // Jos likes puuttuu, oletusarvo 0
    user: user._id, 
  });

  try {
    const savedBlog = await blog.save();

    // Lisää blogi käyttäjän listaan
    user.blogs = user.blogs.concat(savedBlog._id);
    await user.save();

    response.status(201).json(savedBlog);
  } catch (error) {
    response.status(500).json({ error: "Failed to save the blog" });
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
