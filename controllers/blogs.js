const blogRouter = require("express").Router();
const Blog = require("../models/blog");

// Hae kaikki blogit
blogRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({});
  response.json(blogs);
});

// Lisää uusi blogi
blogRouter.post("/", async (request, response) => {
  const { title, author, url, likes = 0 } = request.body;

  const blog = new Blog({
    title,
    author,
    url,
    likes,
  });

  const savedBlog = await blog.save();
  response.status(201).json(savedBlog);
});

// Poista blogi
blogRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedBlog = await Blog.findByIdAndDelete(id); // Käytetään findByIdAndDelete, joka poistaa blogin ja palauttaa sen
    if (!deletedBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    res.status(204).end(); // Poistaminen onnistui
  } catch (error) {
    res.status(400).json({ error: "Malformatted ID" }); // Jos ID on virheellinen
  }
});

module.exports = blogRouter;
