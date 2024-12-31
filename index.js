// Permet l'accès aux variables d'environnement
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

mongoose.set("strictQuery", true);

mongoose.connect(process.env.MONGODB_URI);

// Connexion à l'espace de stockage cloudinary
cloudinary.config({
  cloud_name: "lereacteur",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
const paymentRoutes = require("./routes/payment");
app.use(userRoutes);
app.use(offerRoutes);
app.use(paymentRoutes);

const v2Routes = require("./routes/v2/index");
app.use("/v2", v2Routes);

app.get("/", (req, res) => {
  res.json("Bienvenue sur l'API de Vinted de Paul");
});

const server = app.listen(process.env.PORT || 4000, () => {
  console.log("Server started");
});
server.timeout = Number(process.env.SERVER_TIMEOUT) || 1000000;





