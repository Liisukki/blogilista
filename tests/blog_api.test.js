const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const supertest = require("supertest");
const mongoose = require("mongoose");
const app = require("../app"); // Express-sovellus

const Blog = require("../models/blog");
const api = supertest(app);

const initialBlogs = [
  {
    title: "React patterns",
    author: "Michael Chan",
    url: "https://reactpatterns.com/",
    likes: 7,
  },
  {
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
    likes: 5,
  },
];

before(async () => {
  await mongoose.connect(process.env.TEST_MONGODB_URI);
  await Blog.deleteMany({});
  await Blog.insertMany(initialBlogs);
});

after(async () => {
  await mongoose.connection.close();
});

describe("GET /api/blogs", () => {
  test("returns blogs as JSON", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("returns the correct number of blogs", async () => {
    const response = await api.get("/api/blogs");
    assert.strictEqual(response.body.length, initialBlogs.length);
  });

  test("blogs have an id field instead of _id", async () => {
    const response = await api.get("/api/blogs");

    response.body.forEach((blog) => {
      assert.strictEqual(blog.id !== undefined, true); // Onhan id olemassa
      assert.strictEqual(blog._id, undefined); // Eihän _id ole olemassa
    });
  });
});
describe("POST /api/blogs", () => {
  test("a valid blog can be added", async () => {
    const newBlog = {
      title: "New Blog Post",
      author: "Test Author",
      url: "http://example.com/new-blog",
      likes: 10,
    };

    const blogsAtStart = await Blog.find({});
    const initialCount = blogsAtStart.length;

    const response = await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const blogsAtEnd = await Blog.find({});
    const finalCount = blogsAtEnd.length;

    // Varmista, että määrä kasvaa yhdellä
    assert.strictEqual(finalCount, initialCount + 1);

    // Varmista, että lisätty blogi löytyy tietokannasta
    const titles = blogsAtEnd.map((blog) => blog.title);
    assert.strictEqual(titles.includes(newBlog.title), true);

    // Tarkista lisätyn blogin sisältö
    const addedBlog = response.body;
    assert.strictEqual(addedBlog.title, newBlog.title);
    assert.strictEqual(addedBlog.author, newBlog.author);
    assert.strictEqual(addedBlog.url, newBlog.url);
    assert.strictEqual(addedBlog.likes, newBlog.likes);
  });
});
