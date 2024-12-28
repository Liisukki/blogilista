const { test, describe, beforeEach, after } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const supertest = require("supertest");

const app = require("../app"); // Express-sovellus
const api = supertest(app);
const bcrypt = require("bcryptjs");

const helper = require("./list_helper");

const User = require("../models/user");
const Blog = require("../models/blog");

describe("when there is initially some blogs saved", () => {
  beforeEach(async () => {
    await Blog.deleteMany({});
    await Blog.insertMany(helper.initialBlogs);
  });

  test("blogs are returned as json", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("all blogs are returned", async () => {
    const response = await api.get("/api/blogs");

    assert.strictEqual(response.body.length, helper.initialBlogs.length);
  });

  test("a specific blog is within the returned blogs", async () => {
    const response = await api.get("/api/blogs");

    const titles = response.body.map((r) => r.title);
    assert(titles.includes("TDD harms architecture"));
  });

  describe("viewing a specific blog", () => {
    test("succeeds with a valid id", async () => {
      const blogsAtStart = await helper.blogsInDb();

      const blogToView = blogsAtStart[0];

      const resultBlog = await api
        .get(`/api/blogs/${blogToView.id}`)
        .expect(200)
        .expect("Content-Type", /application\/json/);

      assert.deepStrictEqual(resultBlog.body, blogToView);
    });
  });

  describe("addition of a new blog", () => {
    beforeEach(async () => {
      await User.deleteMany({});
      const newUser = {
        username: "testuser",
        name: "Test User",
        password: "password123",
      };
      const savedUser = await api.post("/api/users").send(newUser).expect(201);
      this.userId = savedUser.body.id; // Tallenna käyttäjän ID testien käyttöön
    });

    test("a valid blog can be added", async () => {
      const newBlog = {
        title: "New Blog Post",
        author: "Test Author",
        url: "http://example.com/new-blog",
        likes: 10,
        userId: this.userId, // Lisää käyttäjän ID pyyntöön
      };

      await api
        .post("/api/blogs")
        .send(newBlog)
        .expect(201)
        .expect("Content-Type", /application\/json/);

      const blogsAtEnd = await helper.blogsInDb();
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1);

      const titles = blogsAtEnd.map((b) => b.title);
      assert(titles.includes("New Blog Post"));
    });

    test("fails with status code 400 if data invalid", async () => {
      const newBlog = {
        title: "Incomplete Blog",
      };

      await api.post("/api/blogs").send(newBlog).expect(400);

      const blogsAtEnd = await helper.blogsInDb();
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length);
    });
  });

  describe("Deletion of a blog", () => {
    test("succeeds with status code 204 if id is valid", async () => {
      const blogsAtStart = await helper.blogsInDb();
      const blogToDelete = blogsAtStart[0];

      // Poistetaan blogi
      await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);

      // Tarkistetaan, että blogi on poistettu tietokannasta
      const blogsAtEnd = await helper.blogsInDb();

      assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1);

      // Varmistetaan, ettei poistettua blogia löydy tietokannasta
      const titles = blogsAtEnd.map((b) => b.title);
      assert.ok(!titles.includes(blogToDelete.title));
    });
  });
});

describe("Blogs API", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    const newUser = {
      username: "testuser",
      name: "Test User",
      password: "password123",
    };
    const savedUser = await api.post("/api/users").send(newUser).expect(201);
    this.userId = savedUser.body.id;
  });

  test("blogs have an id field instead of _id", async () => {
    const response = await api.get("/api/blogs");
    response.body.forEach((blog) => {
      assert.strictEqual(blog.id !== undefined, true); // id exists
      assert.strictEqual(blog._id, undefined); // _id does not exist
    });
  });

  test("if likes is missing, it defaults to 0", async () => {
    const newBlog = {
      title: "Default Likes Test",
      author: "Test Author",
      url: "http://example.com",
      userId: this.userId, // Lisää käyttäjän ID
    };

    const response = await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const savedBlog = response.body;

    // Ensure the likes field defaults to 0
    assert.strictEqual(savedBlog.likes, 0);
  });
});

describe("when there is initially one user at db", () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash("sekret", 10);
    const user = new User({ username: "root", passwordHash });

    await user.save();
  });

  test("creation succeeds with a fresh username", async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: "liisukki",
      name: "Liisa Kotilainen",
      password: "salainen",
    };

    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    assert(usernames.includes(newUser.username));
  });

  test("creation fails with status code 400 if username is not unique", async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: "root", // Sama käyttäjätunnus kuin alkuperäisellä käyttäjällä
      name: "Superuser",
      password: "salainen",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);
    console.log(result.body);

    const usersAtEnd = await helper.usersInDb();

    assert(result.body.error.includes("Username must be unique"));

    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });
});

describe("adding a new blog with a user", () => {
  beforeEach(async () => {
    // Tyhjennetään tietokanta ja luodaan käyttäjä
    await User.deleteMany({});
    await Blog.deleteMany({});

    const newUser = {
      username: "testuser",
      name: "Test User",
      password: "password123",
    };

    const savedUser = await api.post("/api/users").send(newUser).expect(201);
    this.userId = savedUser.body.id; // Tallenna käyttäjän ID
  });

  test("a blog can be added with a valid user", async () => {
    const newBlog = {
      title: "User-Assigned Blog",
      author: "User Author",
      url: "http://example.com/user-blog",
      likes: 5,
      userId: this.userId, // Lisää käyttäjän ID
    };

    const response = await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const savedBlog = response.body;

    // Tarkista, että blogi tallentuu tietokantaan ja käyttäjä on määritetty
    assert.strictEqual(savedBlog.title, newBlog.title);
    assert.strictEqual(savedBlog.author, newBlog.author);
    assert.strictEqual(savedBlog.url, newBlog.url);
    assert.strictEqual(savedBlog.likes, newBlog.likes);
    assert.strictEqual(savedBlog.user, this.userId);

    // Tarkista tietokannasta
    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, 1);

    const createdBlog = blogsAtEnd[0];
    assert.strictEqual(createdBlog.title, "User-Assigned Blog");
    assert.strictEqual(createdBlog.user.toString(), this.userId);
  });
});

// Tykkäyksien testaus
describe("total likes", () => {
  test("of an empty list is zero", () => {
    const result = helper.totalLikes([]);
    assert.strictEqual(result, 0);
  });

  test("when list has only one blog, equals the likes of that blog", () => {
    const listWithOneBlog = [helper.initialBlogs[0]];
    const result = helper.totalLikes(listWithOneBlog);
    assert.strictEqual(result, 7);
  });

  test("of a bigger list is calculated right", () => {
    const result = helper.totalLikes(helper.initialBlogs);
    assert.strictEqual(result, 36);
  });
});

// Blogi jolla eniten tykkäyksiä
describe("favorite blog", () => {
  test("when list has no blogs, returns null", () => {
    const result = helper.favoriteBlog([]);
    assert.strictEqual(result, null);
  });

  test("when list has one blog, returns that blog", () => {
    const listWithOneBlog = [helper.initialBlogs[0]];
    const result = helper.favoriteBlog(listWithOneBlog);
    assert.deepStrictEqual(result, {
      title: "React patterns",
      author: "Michael Chan",
      likes: 7,
    });
  });

  test("when list has multiple blogs, returns the blog with most likes", () => {
    const result = helper.favoriteBlog(helper.initialBlogs);
    assert.deepStrictEqual(result, {
      title: "Canonical string reduction",
      author: "Edsger W. Dijkstra",
      likes: 12,
    });
  });
});
