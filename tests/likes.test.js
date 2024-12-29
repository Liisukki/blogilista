const { test, describe } = require("node:test");
const assert = require("node:assert");
const helper = require("./list_helper");

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

describe("favorite blog", () => {
  test("when list has no blogs, returns null", () => {
    const result = helper.favoriteBlog([]);
    assert.strictEqual(result, null);
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
