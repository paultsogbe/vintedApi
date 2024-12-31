

const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const User = require("../models/User");
const isAuthenticated = require("../middlewares/isAuthenticated");
const httpMocks = require("node-mocks-http");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(() => {
  jest.clearAllMocks();
});

test("should proceed to next middleware if token is valid", async () => {
  // Simule un utilisateur dans la base de données
  const user = await User.create({
    token: "valid_token",
    account: { username: "testuser" },
  });

  // Simule une requête et une réponse
  const req = httpMocks.createRequest({
    headers: {
      authorization: "Bearer valid_token",
    },
  });
  const res = httpMocks.createResponse();
  const next = jest.fn();

  await isAuthenticated(req, res, next);

  // Vérifie que req.user est défini et que next() est appelé
  expect(req.user).toBeDefined();
  expect(req.user._id.toString()).toEqual(user._id.toString());
  expect(next).toHaveBeenCalled();
});

test("should return 401 if token is invalid", async () => {
  const req = httpMocks.createRequest({
    headers: {
      authorization: "Bearer invalid_token",
    },
  });
  const res = httpMocks.createResponse();
  const next = jest.fn();

  await isAuthenticated(req, res, next);

  // Vérifie que la réponse est une erreur 401
  expect(res.statusCode).toBe(401);
  expect(res._getData()).toEqual(
    expect.objectContaining({ message: "Unauthorized" })
  );
  expect(next).not.toHaveBeenCalled();
});

test("should return 401 if token is missing", async () => {
  const req = httpMocks.createRequest();
  const res = httpMocks.createResponse();
  const next = jest.fn();

  await isAuthenticated(req, res, next);

  // Vérifie que la réponse est une erreur 401
  expect(res.statusCode).toBe(401);
  expect(res._getData()).toEqual(
    expect.objectContaining({ message: "Unauthorized" })
  );
  expect(next).not.toHaveBeenCalled();
});

test("should return 500 if there is a server error", async () => {
  // Simule une erreur dans User.findOne
  jest.spyOn(User, "findOne").mockImplementationOnce(() => {
    throw new Error("Database error");
  });

  const req = httpMocks.createRequest({
    headers: {
      authorization: "Bearer valid_token",
    },
  });
  const res = httpMocks.createResponse();
  const next = jest.fn();

  await isAuthenticated(req, res, next);

  // Vérifie que la réponse est une erreur 500
  expect(res.statusCode).toBe(500);
  expect(res._getData()).toEqual(
    expect.objectContaining({ message: "Database error" })
  );
  expect(next).not.toHaveBeenCalled();
});

//npm install --save-dev jest (pour les tests unitaires et fonctionnels)
//npm install --save-dev supertest(pour simuler les requêtes HTTP)

//npm install --save-dev mongodb-memory-server(pour une base de données MongoDB en mémoire)

