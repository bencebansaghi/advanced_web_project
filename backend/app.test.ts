import request from "supertest";
import app from "./app";
import { User } from "./src/models/User";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Board } from "./src/models/Board";
import { Column } from "./src/models/Column";
import { Card } from "./src/models/Card";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Might be redundant, but I finally got the tests to work so I can't be bothered
// If any future recruiters stumble upon this I swear I'm usually not this lazy (hire me pls)
beforeEach(async () => {
  await Card.deleteMany({});
  await Column.deleteMany({});
  await Board.deleteMany({});
  await User.deleteMany({});
});
it("should respond with a 404 status code for an unknown path", async () => {
  const response = await request(app).get("/unknown");
  expect(response.statusCode).toBe(404);
});

describe("POST /user/register", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });
  it("should handle user registration", async () => {
    const response = await request(app).post("/user/register").send({
      username: "testuser",
      email: "testuser@example.com",
      password: "Password123!",
    });
    expect(response.status).toBe(201);
  });

  it("should not register a user with an existing email", async () => {
    await new User({
      username: "existinguser",
      email: "existinguser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const response = await request(app).post("/user/register").send({
      username: "newuser",
      email: "existinguser@example.com",
      password: "Password123!",
    });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Email already in use");
  });

  it("should not register a user with an invalid email", async () => {
    const response = await request(app).post("/user/register").send({
      username: "testuser",
      email: "invalid-email",
      password: "Password123!",
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Please enter a valid email address");
  });

  it("should not register a user with a short password", async () => {
    const response = await request(app).post("/user/register").send({
      username: "testuser",
      email: "testuser@example.com",
      password: "A0!",
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Password must be at least 8 characters long"
    );
  });

  it("should not register a user with a password missing an uppercase letter", async () => {
    const response = await request(app).post("/user/register").send({
      username: "testuser",
      email: "testuser@example.com",
      password: "password123!",
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Password must contain at least one uppercase letter"
    );
  });

  it("should not register a user with a password missing a number", async () => {
    const response = await request(app).post("/user/register").send({
      username: "testuser",
      email: "testuser@example.com",
      password: "Password!",
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Password must contain at least one number"
    );
  });

  it("should not register a user with a password missing a special character", async () => {
    const response = await request(app).post("/user/register").send({
      username: "testuser",
      email: "testuser@example.com",
      password: "Password123",
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Password must contain at least one special character"
    );
  });

  it("should not register a user with incorrect admin password", async () => {
    const response = await request(app).post("/user/register").send({
      username: "adminuser",
      email: "badadminuser@example.com",
      password: "Password123!",
      adminPass: "wrongAdminPass",
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Incorrect admin password");
  });

  it("should register a user as admin with correct admin password", async () => {
    process.env.ADMIN_PASS = "correctAdminPass";
    const response = await request(app).post("/user/register").send({
      username: "adminuser",
      email: "adminuser@example.com",
      password: "Password123!",
      adminPass: "correctAdminPass",
    });
    expect(response.status).toBe(201);

    const adminUser = await User.findOne({ email: "adminuser@example.com" });
    expect(adminUser?.isAdmin).toBe(true);
  });
});

describe("POST /user/login", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });
  it("should not login a user with incorrect email", async () => {
    const response = await request(app).post("/user/login").send({
      email: "wrongemail",
      password: "Password123!",
    });
    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body.error)).toContain(
      "Please enter a valid email address"
    );
  });

  it("should handle user login", async () => {
    await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const response = await request(app).post("/user/login").send({
      email: "testuser@example.com",
      password: "Password123!",
    });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  it("should not login a user with incorrect email", async () => {
    const response = await request(app).post("/user/login").send({
      email: "testuser@example.com",
      password: "Password123!",
    });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Incorrect email or password");
  });

  it("should not login a user with incorrect password", async () => {
    await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const response = await request(app).post("/user/login").send({
      email: "testuser@example.com",
      password: "WrongPassword123!",
    });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Incorrect email or password");
  });

  it("should receive a valid JWT token on successful login", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const response = await request(app).post("/user/login").send({
      email: "testuser@example.com",
      password: "Password123!",
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();

    const decodedToken = jwt.verify(
      response.body.token,
      process.env.JWT_SECRET as string
    ) as jwt.JwtPayload;
    expect(decodedToken._id.toString()).toBe(user._id?.toString());
    expect(decodedToken.username).toBe("testuser");
  });
});

describe("PUT /user", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });

  it("should update user information successfully", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/user")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "updateduser" });

    expect(response.status).toBe(200);
    expect(response.body.user.username).toBe("updateduser");
  });

  it("should not update user information without token", async () => {
    const response = await request(app)
      .put("/user")
      .send({ username: "updateduser" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token not found");
  });

  it("should not update user information with invalid token", async () => {
    const response = await request(app)
      .put("/user")
      .set("Authorization", "Bearer invalidtoken")
      .send({ username: "updateduser" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Access denied, bad token");
  });

  it("should not update non-existent user", async () => {
    const token = jwt.sign(
      {
        _id: new mongoose.Types.ObjectId(),
        username: "nonexistentuser",
        email: "nonexistent@example.com",
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/user")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "updateduser" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("User not found");
  });

  it("should let admin update another user's information", async () => {
    const adminUser = await new User({
      username: "admin",
      email: "admin@example.com",
      password: bcrypt.hashSync("AdminPassword123!", bcrypt.genSaltSync(10)),
      isAdmin: true,
    }).save();

    const normalUser = await new User({
      username: "user",
      email: "user@example.com",
      password: bcrypt.hashSync("UserPassword123!", bcrypt.genSaltSync(10)),
    }).save();

    const adminToken = jwt.sign(
      {
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        isAdmin: adminUser.isAdmin,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/user")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        user_id: normalUser._id?.toString(),
        username: "adminupdateduser",
      });

    expect(response.status).toBe(200);
    expect(response.body.user.username).toBe("adminupdateduser");
  });

  it("should update user password successfully", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/user")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "NewPassword123!" });

    expect(response.status).toBe(200);

    const updatedUser = await User.findById(user._id);
    const isPasswordMatch = bcrypt.compareSync(
      "NewPassword123!",
      updatedUser?.password || ""
    );
    expect(isPasswordMatch).toBe(true);
  });

  it("should not update user information if nothing to modify", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/user")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Either username or password must be provided"
    );
  });
});

describe("DELETE /user", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });

  it("should delete user account successfully", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .delete("/user")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User deleted successfully");
  });

  it("should not delete user account without token", async () => {
    const response = await request(app).delete("/user");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token not found");
  });

  it("should not delete user account with invalid token", async () => {
    const response = await request(app)
      .delete("/user")
      .set("Authorization", "Bearer invalidtoken");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Access denied, bad token");
  });

  it("should not delete non-existent user", async () => {
    const token = jwt.sign(
      {
        _id: new mongoose.Types.ObjectId(),
        username: "nonexistentuser",
        email: "nonexistent@example.com",
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .delete("/user")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("User not found");
  });

  it("should let admin delete another user's account", async () => {
    const adminUser = await new User({
      username: "admin",
      email: "admin@example.com",
      password: bcrypt.hashSync("AdminPassword123!", bcrypt.genSaltSync(10)),
      isAdmin: true,
    }).save();

    const normalUser = await new User({
      username: "user",
      email: "user@example.com",
      password: bcrypt.hashSync("UserPassword123!", bcrypt.genSaltSync(10)),
    }).save();

    const adminToken = jwt.sign(
      {
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        isAdmin: adminUser.isAdmin,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .delete("/user")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ user_id: normalUser._id?.toString() });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User deleted successfully");
  });
});

describe("GET /board/", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });
  it("should fetch boards for a user", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();
    const payload: JwtPayload = {
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: false,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string);

    await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const response = await request(app)
      .get("/board/")
      .set("Authorization", `Bearer ${token}`)
      .query({ email: user.email });
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe("Test Board");
  });

  it("should not fetch boards for a user with invalid token", async () => {
    const response = await request(app)
      .get("/board/")
      .set("Authorization", "Bearer invalidtoken");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Access denied, bad token");
  });

  it("should not fetch boards for a user without token", async () => {
    const response = await request(app).get("/board/");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token not found");
  });

  it("should not give access to another user's board", async () => {
    const user1 = await new User({
      username: "user1",
      email: "user1@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const user2 = await new User({
      username: "user2",
      email: "user2@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user1._id,
        username: user1.username,
        email: user1.email,
        isAdmin: user1.isAdmin,
      },
      process.env.JWT_SECRET as string
    );

    await new Board({
      userID: user2._id,
      title: "User2's Board",
    }).save();

    const response = await request(app)
      .get("/board/")
      .set("Authorization", `Bearer ${token}`)
      .query({ email: user2.email });
    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Access denied");
  });

  it("should give access to any user's boards for admin", async () => {
    const adminUser = await new User({
      username: "admin",
      email: "admin@example.com",
      password: bcrypt.hashSync("AdminPassword123!", bcrypt.genSaltSync(10)),
      isAdmin: true,
    }).save();

    const normalUser = await new User({
      username: "user",
      email: "user@example.com",
      password: bcrypt.hashSync("UserPassword123!", bcrypt.genSaltSync(10)),
    }).save();

    const adminToken = jwt.sign(
      {
        _id: adminUser._id,
        username: adminUser.username,
        email: normalUser.email,
        isAdmin: adminUser.isAdmin,
      },
      process.env.JWT_SECRET as string
    );

    await new Board({
      userID: normalUser._id,
      title: "User's Board",
    }).save();

    const response = await request(app)
      .get("/board/")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ email: normalUser.email });

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe("User's Board");
  });
});

describe("GET /column/", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });
  it("should fetch columns for a board", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Test Column",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/column/")
      .set("Authorization", `Bearer ${token}`)
      .query({ board_id: board._id?.toString() });
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe("Test Column");
  });

  it("should not fetch columns for a non-existent board", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/column/")
      .set("Authorization", `Bearer ${token}`)
      .query({ board_id: "nonexistentboardid" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Board not found");
  });

  it("should not fetch columns for a board without token", async () => {
    const response = await request(app)
      .get("/column/")
      .query({ board_id: "someboardid" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token not found");
  });

  it("should not fetch columns for a board without board_id", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/column/")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("board_id is required");
  });

  it("should not fetch columns for a board if user has no access", async () => {
    const user1 = await new User({
      username: "user1",
      email: "user1@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const user2 = await new User({
      username: "user2",
      email: "user2@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user2._id,
      title: "User2's Board",
    }).save();

    const token = jwt.sign(
      {
        _id: user1._id,
        username: user1.username,
        email: user1.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/column/")
      .set("Authorization", `Bearer ${token}`)
      .query({ board_id: board._id?.toString() });
    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Access denied");
  });
});

describe("GET /card/", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });
  it("should fetch cards for a column", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Test Column",
      order: 0,
    }).save();

    await new Card({
      columnID: column._id,
      title: "Test Card",
      description: "Test Description",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/card/")
      .set("Authorization", `Bearer ${token}`)
      .query({ column_id: column._id?.toString() });
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe("Test Card");
  });

  it("should not fetch cards for a non-existent column", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/card/")
      .set("Authorization", `Bearer ${token}`)
      .query({ column_id: "nonexistentcolumnid" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Column not found");
  });

  it("should not fetch cards for a column without token", async () => {
    const response = await request(app)
      .get("/card/")
      .query({ column_id: "somecolumnid" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token not found");
  });

  it("should not fetch cards for a column without column_id", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/card/")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("column_id is required");
  });

  it("should not fetch cards for a column if user has no access", async () => {
    const user1 = await new User({
      username: "user1",
      email: "user1@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const user2 = await new User({
      username: "user2",
      email: "user2@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user2._id,
      title: "User2's Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "User2's Column",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user1._id,
        username: user1.username,
        email: user1.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/card/")
      .set("Authorization", `Bearer ${token}`)
      .query({ column_id: column._id?.toString() });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Access denied");
  });

  it("should show that no cards were found for an empty column", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Empty Column",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/card/")
      .set("Authorization", `Bearer ${token}`)
      .query({ column_id: column._id?.toString() });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("No cards found");
  });
});

describe("DELETE /card", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });
  it("should delete a card successfully", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Test Column",
      order: 0,
    }).save();

    const card = await new Card({
      columnID: column._id,
      title: "Test Card",
      description: "Test Description",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .delete("/card")
      .set("Authorization", `Bearer ${token}`)
      .send({ card_id: card._id?.toString() });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Card deleted successfully");
  });

  it("should not delete a card without token", async () => {
    const response = await request(app)
      .delete("/card")
      .send({ card_id: "somecardid" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token not found");
  });

  it("should not delete a card with invalid token", async () => {
    const response = await request(app)
      .delete("/card")
      .set("Authorization", "Bearer invalidtoken")
      .send({ card_id: "somecardid" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Access denied, bad token");
  });

  it("should not delete a card without card_id", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .delete("/card")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("card_id is required");
  });

  it("should not delete a non-existent card", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .delete("/card")
      .set("Authorization", `Bearer ${token}`)
      .send({ card_id: "nonexistentcardid" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Card not found");
  });

  it("should not delete a card if user has no access", async () => {
    const user1 = await new User({
      username: "user1",
      email: "user1@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const user2 = await new User({
      username: "user2",
      email: "user2@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user2._id,
      title: "User2's Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "User2's Column",
      order: 0,
    }).save();

    const card = await new Card({
      columnID: column._id,
      title: "User2's Card",
      description: "Test Description",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user1._id,
        username: user1.username,
        email: user1.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .delete("/card")
      .set("Authorization", `Bearer ${token}`)
      .send({ card_id: card._id?.toString() });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Access denied");
  });
});

describe("DELETE /column", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });
  it("should delete a column and its associated cards successfully", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Test Column",
      order: 0,
    }).save();

    const card = await new Card({
      columnID: column._id,
      title: "Test Card",
      description: "Test Description",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .delete("/column")
      .set("Authorization", `Bearer ${token}`)
      .send({ column_id: column._id?.toString() });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "Column and associated cards deleted successfully"
    );

    const deletedColumn = await Column.findById(column._id);
    const deletedCard = await Card.findById(card._id);

    expect(deletedColumn).toBeNull();
    expect(deletedCard).toBeNull();
  });

  it("should not delete a column without token", async () => {
    const response = await request(app)
      .delete("/column")
      .send({ column_id: "somecolumnid" });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token not found");
  });

  it("should not delete a column with invalid token", async () => {
    const response = await request(app)
      .delete("/column")
      .set("Authorization", "Bearer invalidtoken")
      .send({ column_id: "somecolumnid" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Access denied, bad token");
  });

  it("should not delete a column without column_id", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .delete("/column")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("column_id is required");
  });

  it("should not delete a non-existent column", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .delete("/column")
      .set("Authorization", `Bearer ${token}`)
      .send({ column_id: "nonexistentcolumnid" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Column not found");
  });

  it("should not delete a column if user has no access", async () => {
    const user1 = await new User({
      username: "user1",
      email: "user1@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const user2 = await new User({
      username: "user2",
      email: "user2@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user2._id,
      title: "User2's Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "User2's Column",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user1._id,
        username: user1.username,
        email: user1.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .delete("/column")
      .set("Authorization", `Bearer ${token}`)
      .send({ column_id: column._id?.toString() });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Access denied");
  });
});

describe("DELETE /board", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });
  it("should delete a board and its associated columns and cards successfully", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Test Column",
      order: 0,
    }).save();

    const card = await new Card({
      columnID: column._id,
      title: "Test Card",
      description: "Test Description",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .delete("/board")
      .set("Authorization", `Bearer ${token}`)
      .send({ board_id: board._id?.toString() });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "Board and associated columns and cards deleted successfully"
    );

    const deletedBoard = await Board.findById(board._id);
    const deletedColumn = await Column.findById(column._id);
    const deletedCard = await Card.findById(card._id);

    expect(deletedBoard).toBeNull();
    expect(deletedColumn).toBeNull();
    expect(deletedCard).toBeNull();
  });

  it("should not delete a board without token", async () => {
    const response = await request(app)
      .delete("/board")
      .send({ board_id: "someboardid" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token not found");
  });

  it("should not delete a board with invalid token", async () => {
    const response = await request(app)
      .delete("/board")
      .set("Authorization", "Bearer invalidtoken")
      .send({ board_id: "someboardid" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Access denied, bad token");
  });

  it("should not delete a board without board_id", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .delete("/board")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("board_id is required");
  });

  it("should not delete a non-existent board", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .delete("/board")
      .set("Authorization", `Bearer ${token}`)
      .send({ board_id: "nonexistentboardid" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Board not found");
  });

  it("should not delete a board if user has no access", async () => {
    const user1 = await new User({
      username: "user1",
      email: "user1@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const user2 = await new User({
      username: "user2",
      email: "user2@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user2._id,
      title: "User2's Board",
    }).save();

    const token = jwt.sign(
      {
        _id: user1._id,
        username: user1.username,
        email: user1.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .delete("/board")
      .set("Authorization", `Bearer ${token}`)
      .send({ board_id: board._id?.toString() });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Access denied");
  });
});

describe("PUT /card/modify", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });
  it("should update a card successfully", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Test Column",
      order: 0,
    }).save();

    const card = await new Card({
      columnID: column._id,
      title: "Test Card",
      description: "Test Description",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/card/modify")
      .set("Authorization", `Bearer ${token}`)
      .send({ card_id: card._id?.toString(), title: "Updated Card" });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Updated Card");
  });

  it("should reorder cards within the same column", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Test Column",
      order: 0,
    }).save();

    const card1 = await new Card({
      columnID: column._id,
      title: "Card 1",
      description: "Description 1",
      order: 0,
    }).save();

    const card2 = await new Card({
      columnID: column._id,
      title: "Card 2",
      description: "Description 2",
      order: 1,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/card/modify")
      .set("Authorization", `Bearer ${token}`)
      .send({ card_id: card1._id?.toString(), order: 1 });

    expect(response.status).toBe(200);
    expect(response.body.order).toBe(1);

    const updatedCard2 = await Card.findById(card2._id);
    expect(updatedCard2?.order).toBe(0);
  });
  it("should reorder cards when new order is higher", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Test Column",
      order: 0,
    }).save();

    const card1 = await new Card({
      columnID: column._id,
      title: "Card 1",
      description: "Description 1",
      order: 0,
    }).save();

    const card2 = await new Card({
      columnID: column._id,
      title: "Card 2",
      description: "Description 2",
      order: 1,
    }).save();

    const card3 = await new Card({
      columnID: column._id,
      title: "Card 3",
      description: "Description 3",
      order: 2,
    }).save();

    const card4 = await new Card({
      columnID: column._id,
      title: "Card 4",
      description: "Description 4",
      order: 3,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/card/modify")
      .set("Authorization", `Bearer ${token}`)
      .send({ card_id: card1._id?.toString(), order: 3 });

    expect(response.status).toBe(200);
    expect(response.body.order).toBe(3);

    const updatedCard2 = await Card.findById(card2._id);
    const updatedCard3 = await Card.findById(card3._id);
    const updatedCard4 = await Card.findById(card4._id);

    expect(updatedCard2?.order).toBe(0);
    expect(updatedCard3?.order).toBe(1);
    expect(updatedCard4?.order).toBe(2);
  });

  it("should reorder cards when new order is lower", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Test Column",
      order: 0,
    }).save();

    const card1 = await new Card({
      columnID: column._id,
      title: "Card 1",
      description: "Description 1",
      order: 0,
    }).save();

    const card2 = await new Card({
      columnID: column._id,
      title: "Card 2",
      description: "Description 2",
      order: 1,
    }).save();

    const card3 = await new Card({
      columnID: column._id,
      title: "Card 3",
      description: "Description 3",
      order: 2,
    }).save();

    const card4 = await new Card({
      columnID: column._id,
      title: "Card 4",
      description: "Description 4",
      order: 3,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/card/modify")
      .set("Authorization", `Bearer ${token}`)
      .send({ card_id: card4._id?.toString(), order: 1 });

    expect(response.status).toBe(200);
    expect(response.body.order).toBe(1);

    const updatedCard1 = await Card.findById(card1._id);
    const updatedCard2 = await Card.findById(card2._id);
    const updatedCard3 = await Card.findById(card3._id);

    expect(updatedCard1?.order).toBe(0);
    expect(updatedCard2?.order).toBe(2);
    expect(updatedCard3?.order).toBe(3);
  });
  it("should not update a card without token", async () => {
    const response = await request(app)
      .put("/card/modify")
      .send({ card_id: "somecardid", title: "Updated Card" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token not found");
  });

  it("should not update a card with invalid token", async () => {
    const response = await request(app)
      .put("/card/modify")
      .set("Authorization", "Bearer invalidtoken")
      .send({ card_id: "somecardid", title: "Updated Card" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Access denied, bad token");
  });

  it("should not update a card without card_id", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/card/modify")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated Card" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("card_id is required");
  });

  it("should not update a non-existent card", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/card/modify")
      .set("Authorization", `Bearer ${token}`)
      .send({ card_id: "nonexistentcardid", title: "Updated Card" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Card not found");
  });

  it("should not update a card if user has no access", async () => {
    const user1 = await new User({
      username: "user1",
      email: "user1@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const user2 = await new User({
      username: "user2",
      email: "user2@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user2._id,
      title: "User2's Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "User2's Column",
      order: 0,
    }).save();

    const card = await new Card({
      columnID: column._id,
      title: "User2's Card",
      description: "Test Description",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user1._id,
        username: user1.username,
        email: user1.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/card/modify")
      .set("Authorization", `Bearer ${token}`)
      .send({ card_id: card._id?.toString(), title: "Updated Card" });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Access denied");
  });

  it("should not update a card if nothing to modify", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Test Column",
      order: 0,
    }).save();

    const card = await new Card({
      columnID: column._id,
      title: "Test Card",
      description: "Test Description",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/card/modify")
      .set("Authorization", `Bearer ${token}`)
      .send({ card_id: card._id?.toString() });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Nothing to modify");
  });
  it("should let admin modify a card", async () => {
    const adminUser = await new User({
      username: "admin",
      email: "admin@example.com",
      password: bcrypt.hashSync("AdminPassword123!", bcrypt.genSaltSync(10)),
      isAdmin: true,
    }).save();

    const normalUser = await new User({
      username: "user",
      email: "user@example.com",
      password: bcrypt.hashSync("UserPassword123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: normalUser._id,
      title: "User's Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "User's Column",
      order: 0,
    }).save();

    const card = await new Card({
      columnID: column._id,
      title: "User's Card",
      description: "Test Description",
      order: 0,
    }).save();

    const adminToken = jwt.sign(
      {
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        isAdmin: adminUser.isAdmin,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/card/modify")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ card_id: card._id?.toString(), title: "Admin Updated Card" });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Admin Updated Card");
  });

  it("should update a card with a valid color", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Test Column",
      order: 0,
    }).save();

    const card = await new Card({
      columnID: column._id,
      title: "Test Card",
      description: "Test Description",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/card/modify")
      .set("Authorization", `Bearer ${token}`)
      .send({ card_id: card._id?.toString(), color: "#FF5733" });

    expect(response.status).toBe(200);
    expect(response.body.color).toBe("#FF5733");
  });

  it("should not update a card with an invalid color", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Test Column",
      order: 0,
    }).save();

    const card = await new Card({
      columnID: column._id,
      title: "Test Card",
      description: "Test Description",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/card/modify")
      .set("Authorization", `Bearer ${token}`)
      .send({ card_id: card._id?.toString(), color: "invalidcolor" });

    expect(response.status).toBe(200);
    expect(response.body.color).toBe("#D3D3D3");
  });
});

describe("PUT /card/move", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });
  it("should move a card to a different column successfully", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column1 = await new Column({
      boardID: board._id,
      title: "Column 1",
      order: 0,
    }).save();

    const column2 = await new Column({
      boardID: board._id,
      title: "Column 2",
      order: 1,
    }).save();

    const card = await new Card({
      columnID: column1._id,
      title: "Test Card",
      description: "Test Description",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/card/move")
      .set("Authorization", `Bearer ${token}`)
      .send({
        card_id: card._id?.toString(),
        column_id: column2._id?.toString(),
      });

    expect(response.status).toBe(200);
    expect(response.body.columnID).toBe(column2._id?.toString());
  });

  it("should not move a card without token", async () => {
    const response = await request(app)
      .put("/card/move")
      .send({ card_id: "somecardid", column_id: "somecolumnid" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token not found");
  });

  it("should not move a card with invalid token", async () => {
    const response = await request(app)
      .put("/card/move")
      .set("Authorization", "Bearer invalidtoken")
      .send({ card_id: "somecardid", column_id: "somecolumnid" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Access denied, bad token");
  });

  it("should not move a card without card_id or column_id", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/card/move")
      .set("Authorization", `Bearer ${token}`)
      .send({ column_id: "somecolumnid" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("card_id and column_id are required");
  });

  it("should not move a non-existent card", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/card/move")
      .set("Authorization", `Bearer ${token}`)
      .send({ card_id: "nonexistentcardid", column_id: "somecolumnid" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Card not found");
  });

  it("should not move a card to a non-existent column", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Test Column",
      order: 0,
    }).save();

    const card = await new Card({
      columnID: column._id,
      title: "Test Card",
      description: "Test Description",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/card/move")
      .set("Authorization", `Bearer ${token}`)
      .send({
        card_id: card._id?.toString(),
        column_id: "nonexistentcolumnid",
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("New column not found");
  });

  it("should not move a card to a column in a different board", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board1 = await new Board({
      userID: user._id,
      title: "Board 1",
    }).save();

    const board2 = await new Board({
      userID: user._id,
      title: "Board 2",
    }).save();

    const column1 = await new Column({
      boardID: board1._id,
      title: "Column 1",
      order: 0,
    }).save();

    const column2 = await new Column({
      boardID: board2._id,
      title: "Column 2",
      order: 1,
    }).save();

    const card = await new Card({
      columnID: column1._id,
      title: "Test Card",
      description: "Test Description",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/card/move")
      .set("Authorization", `Bearer ${token}`)
      .send({
        card_id: card._id?.toString(),
        column_id: column2._id?.toString(),
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe(
      "You can only move cards within the same board"
    );
  });

  it("should not move a card if user has no access", async () => {
    const user1 = await new User({
      username: "user1",
      email: "user1@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const user2 = await new User({
      username: "user2",
      email: "user2@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user2._id,
      title: "User2's Board",
    }).save();

    const column1 = await new Column({
      boardID: board._id,
      title: "Column 1",
      order: 0,
    }).save();

    const column2 = await new Column({
      boardID: board._id,
      title: "Column 2",
      order: 1,
    }).save();

    const card = await new Card({
      columnID: column1._id,
      title: "User2's Card",
      description: "Test Description",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user1._id,
        username: user1.username,
        email: user1.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/card/move")
      .set("Authorization", `Bearer ${token}`)
      .send({
        card_id: card._id?.toString(),
        column_id: column2._id?.toString(),
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Access denied");
  });

  it("should let admin move a card to a different column", async () => {
    const adminUser = await new User({
      username: "admin",
      email: "admin@example.com",
      password: bcrypt.hashSync("AdminPassword123!", bcrypt.genSaltSync(10)),
      isAdmin: true,
    }).save();

    const normalUser = await new User({
      username: "user",
      email: "user@example.com",
      password: bcrypt.hashSync("UserPassword123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: normalUser._id,
      title: "User's Board",
    }).save();

    const column1 = await new Column({
      boardID: board._id,
      title: "Column 1",
      order: 0,
    }).save();

    const column2 = await new Column({
      boardID: board._id,
      title: "Column 2",
      order: 1,
    }).save();

    const card = await new Card({
      columnID: column1._id,
      title: "User's Card",
      description: "Test Description",
      order: 0,
    }).save();

    const adminToken = jwt.sign(
      {
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        isAdmin: adminUser.isAdmin,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/card/move")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        card_id: card._id?.toString(),
        column_id: column2._id?.toString(),
      });

    expect(response.status).toBe(200);
    expect(response.body.columnID).toBe(column2._id?.toString());
  });
});

describe("POST /card", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });
  it("should add a card successfully", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Test Column",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .post("/card")
      .set("Authorization", `Bearer ${token}`)
      .send({
        column_id: column._id?.toString(),
        title: "Test Card",
        description: "Test Description",
        order: 0,
      });

    expect(response.status).toBe(201);
    expect(response.body.card.title).toBe("Test Card");
  });

  it("should not add a card without token", async () => {
    const response = await request(app).post("/card").send({
      column_id: "somecolumnid",
      title: "Test Card",
      description: "Test Description",
      order: 0,
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token not found");
  });

  it("should not add a card with invalid token", async () => {
    const response = await request(app)
      .post("/card")
      .set("Authorization", "Bearer invalidtoken")
      .send({
        column_id: "somecolumnid",
        title: "Test Card",
        description: "Test Description",
        order: 0,
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Access denied, bad token");
  });

  it("should not add a card without required fields", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .post("/card")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Card",
        description: "Test Description",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "column_id, title, and description are required"
    );
  });

  it("should not add a card to a non-existent column", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .post("/card")
      .set("Authorization", `Bearer ${token}`)
      .send({
        column_id: "nonexistentcolumnid",
        title: "Test Card",
        description: "Test Description",
        order: 0,
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Column not found");
  });

  it("should not add a card if user has no access", async () => {
    const user1 = await new User({
      username: "user1",
      email: "user1@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const user2 = await new User({
      username: "user2",
      email: "user2@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user2._id,
      title: "User2's Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "User2's Column",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user1._id,
        username: user1.username,
        email: user1.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .post("/card")
      .set("Authorization", `Bearer ${token}`)
      .send({
        column_id: column._id?.toString(),
        title: "Test Card",
        description: "Test Description",
        order: 0,
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Access denied");
  });

  it("should add a card with a valid color", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Test Column",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .post("/card")
      .set("Authorization", `Bearer ${token}`)
      .send({
        column_id: column._id?.toString(),
        title: "Test Card",
        description: "Test Description",
        order: 0,
        color: "#FF5733",
      });

    expect(response.status).toBe(201);
    expect(response.body.card.color).toBe("#FF5733");
  });

  it("should add a card without color if color format is invalid", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Test Column",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .post("/card")
      .set("Authorization", `Bearer ${token}`)
      .send({
        column_id: column._id?.toString(),
        title: "Test Card",
        description: "Test Description",
        order: 0,
        color: "invalidcolor",
      });

    expect(response.status).toBe(201);
    expect(response.body.warning).toBe(
      "Invalid color format. Card created without color."
    );
  });

  it("should let admin add a card to any column", async () => {
    const adminUser = await new User({
      username: "admin",
      email: "admin@example.com",
      password: bcrypt.hashSync("AdminPassword123!", bcrypt.genSaltSync(10)),
      isAdmin: true,
    }).save();

    const normalUser = await new User({
      username: "user",
      email: "user@example.com",
      password: bcrypt.hashSync("UserPassword123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: normalUser._id,
      title: "User's Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "User's Column",
      order: 0,
    }).save();

    const adminToken = jwt.sign(
      {
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        isAdmin: adminUser.isAdmin,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .post("/card")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        column_id: column._id?.toString(),
        title: "Admin Card",
        description: "Admin Description",
        order: 0,
      });

    expect(response.status).toBe(201);
    expect(response.body.card.title).toBe("Admin Card");
  });
});

describe("PUT /column/modify", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });
  it("should update a column successfully", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Test Column",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/column/modify")
      .set("Authorization", `Bearer ${token}`)
      .send({ column_id: column._id?.toString(), title: "Updated Column" });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Updated Column");
  });

  it("should reorder columns within the same board", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column1 = await new Column({
      boardID: board._id,
      title: "Column 1",
      order: 0,
    }).save();

    const column2 = await new Column({
      boardID: board._id,
      title: "Column 2",
      order: 1,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/column/modify")
      .set("Authorization", `Bearer ${token}`)
      .send({ column_id: column1._id?.toString(), order: 1 });

    expect(response.status).toBe(200);
    expect(response.body.order).toBe(1);

    const updatedColumn2 = await Column.findById(column2._id);
    expect(updatedColumn2?.order).toBe(0);
  });

  it("should not update a column without token", async () => {
    const response = await request(app)
      .put("/column/modify")
      .send({ column_id: "somecolumnid", title: "Updated Column" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token not found");
  });

  it("should not update a column with invalid token", async () => {
    const response = await request(app)
      .put("/column/modify")
      .set("Authorization", "Bearer invalidtoken")
      .send({ column_id: "somecolumnid", title: "Updated Column" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Access denied, bad token");
  });

  it("should not update a column without column_id", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/column/modify")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated Column" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("column_id is required");
  });

  it("should not update a non-existent column", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/column/modify")
      .set("Authorization", `Bearer ${token}`)
      .send({ column_id: "nonexistentcolumnid", title: "Updated Column" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Column not found");
  });

  it("should not update a column if user has no access", async () => {
    const user1 = await new User({
      username: "user1",
      email: "user1@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const user2 = await new User({
      username: "user2",
      email: "user2@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user2._id,
      title: "User2's Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "User2's Column",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user1._id,
        username: user1.username,
        email: user1.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/column/modify")
      .set("Authorization", `Bearer ${token}`)
      .send({ column_id: column._id?.toString(), title: "Updated Column" });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Access denied");
  });

  it("should not update a column if nothing to modify", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "Test Column",
      order: 0,
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/column/modify")
      .set("Authorization", `Bearer ${token}`)
      .send({ column_id: column._id?.toString() });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Nothing to modify");
  });

  it("should let admin modify a column", async () => {
    const adminUser = await new User({
      username: "admin",
      email: "admin@example.com",
      password: bcrypt.hashSync("AdminPassword123!", bcrypt.genSaltSync(10)),
      isAdmin: true,
    }).save();

    const normalUser = await new User({
      username: "user",
      email: "user@example.com",
      password: bcrypt.hashSync("UserPassword123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: normalUser._id,
      title: "User's Board",
    }).save();

    const column = await new Column({
      boardID: board._id,
      title: "User's Column",
      order: 0,
    }).save();

    const adminToken = jwt.sign(
      {
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        isAdmin: adminUser.isAdmin,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/column/modify")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        column_id: column._id?.toString(),
        title: "Admin Updated Column",
      });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Admin Updated Column");
  });
});

describe("POST /column", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });
  it("should create a new column successfully", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .post("/column")
      .set("Authorization", `Bearer ${token}`)
      .send({
        board_id: board._id?.toString(),
        title: "Test Column",
        order: 0,
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Test Column");
  });

  it("should not create a column without token", async () => {
    const response = await request(app).post("/column").send({
      board_id: "someboardid",
      title: "Test Column",
      order: 0,
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token not found");
  });

  it("should not create a column with invalid token", async () => {
    const response = await request(app)
      .post("/column")
      .set("Authorization", "Bearer invalidtoken")
      .send({
        board_id: "someboardid",
        title: "Test Column",
        order: 0,
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Access denied, bad token");
  });

  it("should not create a column without required fields", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .post("/column")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Column",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("board_id and title are required");
  });

  it("should not create a column for a non-existent board", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .post("/column")
      .set("Authorization", `Bearer ${token}`)
      .send({
        board_id: "nonexistentboardid",
        title: "Test Column",
        order: 0,
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Board not found");
  });

  it("should not create a column if user has no access", async () => {
    const user1 = await new User({
      username: "user1",
      email: "user1@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const user2 = await new User({
      username: "user2",
      email: "user2@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user2._id,
      title: "User2's Board",
    }).save();

    const token = jwt.sign(
      {
        _id: user1._id,
        username: user1.username,
        email: user1.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .post("/column")
      .set("Authorization", `Bearer ${token}`)
      .send({
        board_id: board._id?.toString(),
        title: "Test Column",
        order: 0,
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Access denied");
  });

  it("should let admin create a column for any board", async () => {
    const adminUser = await new User({
      username: "admin",
      email: "admin@example.com",
      password: bcrypt.hashSync("AdminPassword123!", bcrypt.genSaltSync(10)),
      isAdmin: true,
    }).save();

    const normalUser = await new User({
      username: "user",
      email: "user@example.com",
      password: bcrypt.hashSync("UserPassword123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: normalUser._id,
      title: "User's Board",
    }).save();

    const adminToken = jwt.sign(
      {
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        isAdmin: adminUser.isAdmin,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .post("/column")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        board_id: board._id?.toString(),
        title: "Admin Column",
        order: 0,
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Admin Column");
  });
});
describe("POST /board", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });
  it("should create a new board successfully", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .post("/board")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Board",
      });
    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Test Board");
  });

  it("should not create a board without token", async () => {
    const response = await request(app).post("/board").send({
      title: "Test Board",
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token not found");
  });

  it("should not create a board with invalid token", async () => {
    const response = await request(app)
      .post("/board")
      .set("Authorization", "Bearer invalidtoken")
      .send({
        title: "Test Board",
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Access denied, bad token");
  });

  it("should not create a board without title", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .post("/board")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Title is required");
  });

  it("should not create a board for a non-existent user", async () => {
    const token = jwt.sign(
      {
        _id: "nonexistentuserid",
        username: "testuser",
        email: "testuser@example.com",
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .post("/board")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Board",
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("User not found");
  });

  it("should let admin create a board for any user", async () => {
    const adminUser = await new User({
      username: "admin",
      email: "admin@example.com",
      password: bcrypt.hashSync("AdminPassword123!", bcrypt.genSaltSync(10)),
      isAdmin: true,
    }).save();

    const normalUser = await new User({
      username: "user",
      email: "user@example.com",
      password: bcrypt.hashSync("UserPassword123!", bcrypt.genSaltSync(10)),
    }).save();

    const adminToken = jwt.sign(
      {
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        isAdmin: adminUser.isAdmin,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .post("/board")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Admin Created Board",
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Admin Created Board");
  });
});
describe("PUT /board", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });
  it("should update a board's title successfully", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Old Title",
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/board")
      .set("Authorization", `Bearer ${token}`)
      .send({ board_id: board._id?.toString(), title: "New Title" });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("New Title");
  });

  it("should not update a board without token", async () => {
    const response = await request(app)
      .put("/board")
      .send({ board_id: "someboardid", title: "New Title" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token not found");
  });

  it("should not update a board with invalid token", async () => {
    const response = await request(app)
      .put("/board")
      .set("Authorization", "Bearer invalidtoken")
      .send({ board_id: "someboardid", title: "New Title" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Access denied, bad token");
  });

  it("should not update a board without board_id or title", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/board")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "New Title" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("board_id and title are required");
  });

  it("should not update a non-existent board", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/board")
      .set("Authorization", `Bearer ${token}`)
      .send({ board_id: "nonexistentboardid", title: "New Title" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Board not found");
  });

  it("should not update a board if user has no access", async () => {
    const user1 = await new User({
      username: "user1",
      email: "user1@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const user2 = await new User({
      username: "user2",
      email: "user2@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user2._id,
      title: "User2's Board",
    }).save();

    const token = jwt.sign(
      {
        _id: user1._id,
        username: user1.username,
        email: user1.email,
        isAdmin: false,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/board")
      .set("Authorization", `Bearer ${token}`)
      .send({ board_id: board._id?.toString(), title: "New Title" });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Access denied");
  });

  it("should let admin update any board's title", async () => {
    const adminUser = await new User({
      username: "admin",
      email: "admin@example.com",
      password: bcrypt.hashSync("AdminPassword123!", bcrypt.genSaltSync(10)),
      isAdmin: true,
    }).save();

    const normalUser = await new User({
      username: "user",
      email: "user@example.com",
      password: bcrypt.hashSync("UserPassword123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: normalUser._id,
      title: "User's Board",
    }).save();

    const adminToken = jwt.sign(
      {
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        isAdmin: adminUser.isAdmin,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .put("/board")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ board_id: board._id?.toString(), title: "Admin Updated Title" });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Admin Updated Title");
  });
});

describe("GET /user/all", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });
  it("should fetch all users for admin", async () => {
    const adminUser = await new User({
      username: "admin",
      email: "admin@example.com",
      password: bcrypt.hashSync("AdminPassword123!", bcrypt.genSaltSync(10)),
      isAdmin: true,
    }).save();

    const normalUser = await new User({
      username: "user",
      email: "user@example.com",
      password: bcrypt.hashSync("UserPassword123!", bcrypt.genSaltSync(10)),
    }).save();

    const adminToken = jwt.sign(
      {
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        isAdmin: adminUser.isAdmin,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/user/all")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.users[0]).toBeDefined();
  });

  it("should not fetch users without token", async () => {
    const response = await request(app).get("/user/all");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token not found");
  });

  it("should not fetch users with invalid token", async () => {
    const response = await request(app)
      .get("/user/all")
      .set("Authorization", "Bearer invalidtoken");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Access denied, bad token");
  });

  it("should not fetch users for non-admin user", async () => {
    const normalUser = await new User({
      username: "user",
      email: "user@example.com",
      password: bcrypt.hashSync("UserPassword123!", bcrypt.genSaltSync(10)),
    }).save();

    const userToken = jwt.sign(
      {
        _id: normalUser._id,
        username: normalUser.username,
        email: normalUser.email,
        isAdmin: normalUser.isAdmin,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/user/all")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Access denied");
  });

  it("should return 404 if no users found", async () => {
    const adminUser = await new User({
      username: "admin",
      email: "admin@example.com",
      password: bcrypt.hashSync("AdminPassword123!", bcrypt.genSaltSync(10)),
      isAdmin: true,
    }).save();

    await User.deleteOne({ email: adminUser.email });

    const adminToken = jwt.sign(
      {
        _id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        isAdmin: adminUser.isAdmin,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/user/all")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("No users found");
  });
});

describe("GET /user", () => {
  beforeEach(async () => {
    await Card.deleteMany({});
    await Column.deleteMany({});
    await Board.deleteMany({});
    await User.deleteMany({});
  });
  it("should fetch own user info", async () => {
    const normalUser = await new User({
      username: "user",
      email: "user@example.com",
      password: bcrypt.hashSync("UserPassword123!", bcrypt.genSaltSync(10)),
    }).save();

    const userToken = jwt.sign(
      {
        _id: normalUser._id,
        username: normalUser.username,
        email: normalUser.email,
        isAdmin: normalUser.isAdmin,
      },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/user")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(normalUser.email);
  });

  it("should not fetch user info without token", async () => {
    const response = await request(app).get("/user");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Token not found");
  });

  it("should not fetch user info with invalid token", async () => {
    const response = await request(app)
      .get("/user")
      .set("Authorization", "Bearer invalidtoken");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Access denied, bad token");
  });
});
