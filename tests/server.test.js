

require("dotenv").config();
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../index"); 

let mongoServer;

beforeAll(async () => {
  // Configure MongoDB en mémoire
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(() => {
  jest.clearAllMocks();
});



//Tests Unitaires((mocking) la bibliothèque cloudinary)
```
describe("Environment Variables", () => {
  test("should have necessary environment variables", () => {
    expect(process.env.MONGODB_URI).toBeDefined();
    expect(process.env.CLOUDINARY_API_KEY).toBeDefined();
    expect(process.env.CLOUDINARY_API_SECRET).toBeDefined();
  });
});

describe("Cloudinary Configuration", () => {
  const cloudinary = require("cloudinary").v2;

  test("should configure Cloudinary with correct credentials", () => {
    expect(cloudinary.config().cloud_name).toBe("lereacteur");
    expect(cloudinary.config().api_key).toBe(process.env.CLOUDINARY_API_KEY);
    expect(cloudinary.config().api_secret).toBe(process.env.CLOUDINARY_API_SECRET);
  });
});



-------------------

### **Tests d'Intégration**

```
describe("Routes Integration", () => {
    test("GET / should return welcome message", async () => {
      const response = await request(app).get("/");
      expect(response.status).toBe(200);
      expect(response.body).toBe("Bienvenue sur l'API de Vinted de Paul");
    });
  
    test("GET /v2 should return 404 for missing routes", async () => {
      const response = await request(app).get("/v2/missing-route");
      expect(response.status).toBe(404);
    });
  });

```  


-------------------------------
### **Tests Fonctionnels**
```
describe("User Routes", () => {
    test("POST /user/signup should create a new user", async () => {
      const response = await request(app)
        .post("/user/signup")
        .send({ email: "test@example.com", password: "password123" });
  
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
    });
  });
  
  describe("Offer Routes", () => {
    test("GET /offers should return a list of offers", async () => {
      const response = await request(app).get("/offers");
  
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  javascript

  //Tests de Performance
``
  describe("Server Performance", () => {
  test("Server should respond within the configured timeout", async () => {
    const timeout = Number(process.env.SERVER_TIMEOUT) || 1000000;

    const start = Date.now();
    const response = await request(app).get("/");
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThanOrEqual(timeout);
  });
});




//npm install --save-dev jest supertest mongodb-memory-server
//npm install jest supertest mongoose --save-dev

