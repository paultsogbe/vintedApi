"use strict";

// Permet l'accès aux variables d'environnement
require("dotenv").config();

var express = require("express");

var mongoose = require("mongoose");

var cors = require("cors");

var morgan = require("morgan");

var cloudinary = require("cloudinary").v2;

var app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGODB_URI); // Connexion à l'espace de stockage cloudinary

cloudinary.config({
  cloud_name: "lereacteur",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

var userRoutes = require("./routes/user");

var offerRoutes = require("./routes/offer");

var paymentRoutes = require("./routes/payment");

app.use(userRoutes);
app.use(offerRoutes);
app.use(paymentRoutes);

var v2Routes = require("./routes/v2/index");

app.use("/v2", v2Routes);
app.get("/", function (req, res) {
  res.json("Bienvenue sur l'API de Vinted de Paul");
});
var server = app.listen(process.env.PORT || 4000, function () {
  console.log("Server started");
});
server.timeout = Number(process.env.SERVER_TIMEOUT) || 1000000;
//# sourceMappingURL=index.dev.js.map
