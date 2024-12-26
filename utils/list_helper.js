const User = require("../models/user");

const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0);
};

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) {
    return null;
  }

  const favorite = blogs.reduce(
    (max, blog) => (blog.likes > max.likes ? blog : max),
    blogs[0]
  );

  return {
    title: favorite.title,
    author: favorite.author,
    likes: favorite.likes,
  };
};

const usersInDb = async () => {
  const users = await User.find({});
  return users.map((user) => user.toJSON());
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  usersInDb, // Lisää tämä exportteihin
};
