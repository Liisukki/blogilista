const config = require("./utils/config"); 
const express = require("express"); 
const app = express(); 
const cors = require("cors"); // Lataa CORS
const blogsRouter = require("./controllers/blogs"); 
const middleware = require("./utils/middleware"); 
const logger = require("./utils/logger"); 
const mongoose = require("mongoose"); 

mongoose.set("strictQuery", false); // Aseta Mongoose-virheenkäsittely

// MongoDB-yhteyden muodostaminen
logger.info("connecting to", config.MONGODB_URI);
mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info("connected to MongoDB"); 
  })
  .catch((error) => {
    logger.error("error connection to MongoDB:", error.message);
  });

// Middlewaret
app.use(cors());
app.use(express.json()); 
app.use(middleware.requestLogger); 

// Reitit
app.use("/api/blogs", blogsRouter); 

// Virheenkäsittely
app.use(middleware.unknownEndpoint); 
app.use(middleware.errorHandler); 

module.exports = app;
