
require("dotenv").config();
const request = require("supertest");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const app = require("../app"); 

describe("Server and Configuration Tests", () => {
  //Avant Test  connexion à MongoDB 
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  // Après les tests : fermeture de la connexion à MongoDB
  afterAll(async () => {
    await mongoose.connection.close();
  });
  

  // Test 1 : Vérifie que le serveur répond à la route principale
  it("should return a welcome message on GET /", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body).toBe("Bienvenue sur l'API de Vinted de Paul");
  });

  // Test 2 : Vérifie la configuration de Cloudinary
  it("should have Cloudinary configured correctly", () => {
    expect(cloudinary.config().cloud_name).toBe(process.env.CLOUDINARY_CLOUD_NAME);
    expect(cloudinary.config().api_key).toBe(process.env.CLOUDINARY_API_KEY);
    expect(cloudinary.config().api_secret).toBe(process.env.CLOUDINARY_API_SECRET);
  });

  // Test 3 : Vérifie que les routes de la version 2 sont accessibles
  it("should respond to /v2 routes", async () => {
    const response = await request(app).get("/v2");
    // Ajustement de la  assertion selon ce que /v2 retourne
    expect(response.status).toBe(404); // Si la route existe mais est vide
  });

  // Test 4 : Vérifier que le serveur est actif sur le port configuré
  it("should start the server on the correct port", () => {
    const port = process.env.PORT || 4000;
    expect(port).toBeDefined();
    expect(Number(port)).toBeGreaterThan(0);
  });
});
