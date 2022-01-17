const mongoose = require("mongoose");
const request = require("supertest");
require("dotenv").config();

const app = require("../../app");
const { User } = require("../../model/user");

const { DB_TEST_HOST, PORT } = process.env;

describe("test signup, login", () => {
  let server;
  beforeAll(() => (server = app.listen(PORT)));
  afterAll(() => server.close());

  beforeEach((done) => {
    mongoose.connect(DB_TEST_HOST).then(() => done());
  });

  afterEach((done) => {
    mongoose.connection.db.dropDatabase(() => {
      mongoose.connection.close(() => done());
    });
  });

  test("test signup route", async () => {
    const registerData = {
      email: "test@gmail.com",
      password: "1234567",
    };

    const response = await request(app)
      .post("/api/users/signup")
      .send(registerData);

    expect(response.statusCode).toBe(201);

    const user = await User.findOne(response.body.email);
    expect(user).toBeTruthy();
    expect(user.email).toBe(registerData.email);
  });

  test("test login route", async () => {
    const loginData = {
      email: "test@gmail.com",
      password: "1234567",
    };

    const response = await request(app)
      .post("/api/users/login")
      .send(loginData);

    expect(response.statusCode).toBe(200);

    const user = await User.findOne(response.body.email);
    expect(user.token).toBeTruthy();
    expect(typeof user.email).toBe("string");
    expect(typeof user.subscription).toBe("string");
  });
});
