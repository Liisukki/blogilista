const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);

const User = require("../models/user");
const helper = require("./list_helper");
const bcrypt = require("bcryptjs");

describe("when there are initial users in the database", () => {
    beforeEach(async () => {
      await User.deleteMany({}); // Clear all users from the database
  
      const initialUsers = [
        { username: "root", name: "Root User", password: "sekret" },
        { username: "liisukki", name: "Liisa Kotilainen", password: "salainen" },
      ];
  
      for (const user of initialUsers) {
        const passwordHash = await bcrypt.hash(user.password, 10); // Hash password
        const newUser = new User({ username: user.username, name: user.name, passwordHash });
        await newUser.save(); // Save each user to the database
      }
    });
  
    test("creation succeeds with a new username", async () => {
      const usersAtStart = await helper.usersInDb();
  
      const newUser = {
        username: "newuser",
        name: "New User",
        password: "password123",
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
  
      const duplicateUser = {
        username: "root", // Attempt to create a user with an existing username
        name: "Duplicate Root",
        password: "anotherpassword",
      };
  
      const result = await api
        .post("/api/users")
        .send(duplicateUser)
        .expect(400)
        .expect("Content-Type", /application\/json/);
  
      assert(result.body.error.includes("Username must be unique"));
  
      const usersAtEnd = await helper.usersInDb();
      assert.strictEqual(usersAtEnd.length, usersAtStart.length);
    });
  });
  

  test("creation fails with status code 400 if username is not unique", async () => {
    const usersAtStart = await helper.usersInDb();
    const newUser = { username: "root", name: "Superuser", password: "salainen" };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    assert(result.body.error.includes("Username must be unique"));
    const usersAtEnd = await helper.usersInDb();
    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });
