const config = require("./utils/config"); // Lataa ympäristömuuttujat
const express = require("express"); // Lataa Express
const app = express(); // Luo Express-sovellus
const cors = require("cors"); // Lataa CORS
const blogsRouter = require("./controllers/blogs"); // Lataa reitit
const middleware = require("./utils/middleware"); // Lataa middlewaret
const logger = require("./utils/logger"); // Lataa logger
const mongoose = require("mongoose"); // Lataa mongoose (MongoDB:n käyttö)

mongoose.set("strictQuery", false); // Aseta Mongoose-virheenkäsittely

// MongoDB-yhteyden muodostaminen
logger.info("connecting to", config.MONGODB_URI);
mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info("connected to MongoDB"); // Yhdistetty MongoDB:hen
  })
  .catch((error) => {
    logger.error("error connection to MongoDB:", error.message); // Virhe yhdistettäessä
  });

// Middlewaret
app.use(cors()); // Salli CORS
app.use(express.json()); // Parsitaan JSON-dataa pyynnöistä
app.use(middleware.requestLogger); // Lokittaa saapuvat pyynnöt

// Reitit
app.use("/api/blogs", blogsRouter); // Käytä blogsRouteria /api/blogs-pyynnöissä

// Virheenkäsittely
app.use(middleware.unknownEndpoint); // Tuntemattomat päätepisteet
app.use(middleware.errorHandler); // Virheenkäsittely

module.exports = app; // Vie app.js, jotta se voidaan käyttää index.js-tiedostossa
