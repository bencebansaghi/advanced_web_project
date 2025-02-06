import request from "supertest";
import { app, db } from "./index";
import { User } from "./src/models/User";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Board } from "./src/models/Board";
import dotenv from "dotenv";
import { Column } from "./src/models/Column";
import { Card } from "./src/models/Card";
dotenv.config();
process.env.MONGODB_URL = 'mongodb://127.0.0.1:27017/db_for_test';
process.env.PORT = '3001';
process.env.JWT_SECRET = 'test';

beforeAll(async () => {
  await db.dropDatabase();
});

beforeEach(async () => {
  await db.dropDatabase();
});

afterEach(async () => {
  await db.dropDatabase();
});

afterAll(async () => {
  await db.close();
});

it("should respond with a 404 status code for an unknown path", async () => {
  const response = await request(app).get("/unknown");
  expect(response.statusCode).toBe(404);
});

describe("POST /user/register", () => {
it("should handle user registration", async () => {
  const response = await request(app)
    .post("/user/register")
    .send({
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
    password: "Password123!",
  }).save();

  const response = await request(app)
    .post("/user/register")
    .send({
      username: "newuser",
      email: "existinguser@example.com",
      password: "Password123!",
    });

  expect(response.status).toBe(403);
  expect(response.body.error).toBe("Email already in use");
  await User.deleteOne({ email: "existinguser@example.com" });
  });

  it("should not register a user with an invalid email", async () => {
    const response = await request(app)
      .post("/user/register")
      .send({
        username: "testuser",
        email: "invalid-email",
        password: "Password123!",
      });
    expect(response.status).toBe(400);
    expect(response.body.error[0].msg).toBe("Please enter a valid email address");
  });
  
  it("should not register a user with a short password", async () => {
    const response = await request(app)
      .post("/user/register")
      .send({
        username: "testuser",
        email: "testuser@example.com",
        password: "A0!",
      });
    expect(response.status).toBe(400);
    expect(response.body.error[0].msg).toBe("Password must be at least 8 characters long");
  });
  
  it("should not register a user with a password missing an uppercase letter", async () => {
    const response = await request(app)
      .post("/user/register")
      .send({
        username: "testuser",
        email: "testuser@example.com",
        password: "password123!",
      });
    expect(response.status).toBe(400);
    expect(response.body.error[0].msg).toBe("Password must contain at least one uppercase letter");
  });
  
  it("should not register a user with a password missing a number", async () => {
    const response = await request(app)
      .post("/user/register")
      .send({
        username: "testuser",
        email: "testuser@example.com",
        password: "Password!",
      });
    expect(response.status).toBe(400);
    expect(response.body.error[0].msg).toBe("Password must contain at least one number");
  });
  
  it("should not register a user with a password missing a special character", async () => {
    const response = await request(app)
      .post("/user/register")
      .send({
        username: "testuser",
        email: "testuser@example.com",
        password: "Password123",
      });
    expect(response.status).toBe(400);
    expect(response.body.error[0].msg).toBe("Password must contain at least one special character");
  });
});

describe("POST /user/login", () => {
  it("should not login a user with incorrect email", async () => {
    const response = await request(app)
      .post("/user/login")
      .send({
        email: "wrongemail",
        password: "Password123!",
      });
    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body.error)).toContain("Please enter a valid email address");
  });
  
  it("should handle user login", async () => {
    await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();
  
    const response = await request(app)
      .post("/user/login")
      .send({
        email: "testuser@example.com",
        password: "Password123!",
      });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });
  
  it("should not login a user with incorrect email", async () => {

    const response = await request(app)
      .post("/user/login")
      .send({
        email: "testuser@example.com",
        password: "Password123!",
      });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Incorrect email or password")
  });
  
  it("should not login a user with incorrect password", async () => {
    await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();
  
    const response = await request(app)
      .post("/user/login")
      .send({
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
  
    const response = await request(app)
      .post("/user/login")
      .send({
        email: "testuser@example.com",
        password: "Password123!",
      });
  
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  
    const decodedToken = jwt.verify(response.body.token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
    expect(decodedToken._id.toString()).toBe(user._id?.toString());
    expect(decodedToken.username).toBe("testuser");
  });
});

describe("GET /board/by_user", () => {
  it("should fetch boards for a user", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();
    const payload: JwtPayload = { _id: user._id, username: user.username, email: user.email, isAdmin: false }
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET as string
    );
  
    await new Board({
      userID: user._id,
      title: "Test Board",
    }).save();
  
    const response = await request(app)
      .get("/board/by_user")
      .set("Authorization", `Bearer ${token}`)
      .send({email: user.email});
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe("Test Board");
  });

  it("should show that user has no boards", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();
    const payload: JwtPayload = { _id: user._id, username: user.username, email: user.email, isAdmin: false }
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET as string
    );
  
    const response = await request(app)
      .get("/board/by_user")
      .set("Authorization", `Bearer ${token}`)
      .send({email: user.email});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("No boards found");

  });
  
  it("should not fetch boards for a user with invalid token", async () => {
    const response = await request(app)
      .get("/board/by_user")
      .set("Authorization", "Bearer invalidtoken");
  
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Access denied, bad token");
  });
  
  it("should not fetch boards for a user without token", async () => {
    const response = await request(app).get("/board/by_user");
  
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
      { _id: user1._id, username: user1.username, email: user1.email, isAdmin: user1.isAdmin },
      process.env.JWT_SECRET as string
    );

    await new Board({
      userID: user2._id,
      title: "User2's Board",
    }).save();

    const response = await request(app)
      .get("/board/by_user")
      .set("Authorization", `Bearer ${token}`)
      .send({email: user2.email});
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
      { _id: adminUser._id, username: adminUser.username, email: normalUser.email, isAdmin: adminUser.isAdmin },
      process.env.JWT_SECRET as string
    );

    await new Board({
      userID: normalUser._id,
      title: "User's Board",
    }).save();

    const response = await request(app)
      .get("/board/by_user")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({email: normalUser.email});

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe("User's Board");
  });
});

describe("GET /column/by_board", () => {
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
      order: 0
    }).save();

    const token = jwt.sign(
      { _id: user._id, username: user.username, email: user.email, isAdmin: false },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/column/by_board")
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
      { _id: user._id, username: user.username, email: user.email, isAdmin: false },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/column/by_board")
      .set("Authorization", `Bearer ${token}`)
      .query({ board_id: "nonexistentboardid" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Board not found");
  });

  it("should not fetch columns for a board without token", async () => {
    const response = await request(app)
      .get("/column/by_board")
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
      { _id: user._id, username: user.username, email: user.email, isAdmin: false },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/column/by_board")
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
      { _id: user1._id, username: user1.username, email: user1.email, isAdmin: false },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/column/by_board")
      .set("Authorization", `Bearer ${token}`)
      .query({ board_id: board._id?.toString() });
    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Access denied");
  });

  it("should show that no columns were found for an empty board", async () => {
    const user = await new User({
      username: "testuser",
      email: "testuser@example.com",
      password: bcrypt.hashSync("Password123!", bcrypt.genSaltSync(10)),
    }).save();

    const board = await new Board({
      userID: user._id,
      title: "Empty Board",
    }).save();

    const token = jwt.sign(
      { _id: user._id, username: user.username, email: user.email, isAdmin: false },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/column/by_board")
      .set("Authorization", `Bearer ${token}`)
      .query({ board_id: board._id?.toString() });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe("No columns found");
  });
});

describe("GET /card/by_column", () => {
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
      order: 0
    }).save();

    const token = jwt.sign(
      { _id: user._id, username: user.username, email: user.email, isAdmin: false },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/card/by_column")
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
      { _id: user._id, username: user.username, email: user.email, isAdmin: false },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/card/by_column")
      .set("Authorization", `Bearer ${token}`)
      .query({ column_id: "nonexistentcolumnid" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Column not found");
  });

  it("should not fetch cards for a column without token", async () => {
    const response = await request(app)
      .get("/card/by_column")
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
      { _id: user._id, username: user.username, email: user.email, isAdmin: false },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/card/by_column")
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
      { _id: user1._id, username: user1.username, email: user1.email, isAdmin: false },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/card/by_column")
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
      { _id: user._id, username: user.username, email: user.email, isAdmin: false },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .get("/card/by_column")
      .set("Authorization", `Bearer ${token}`)
      .query({ column_id: column._id?.toString() });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("No cards found");
  });
});

describe("DELETE /card", () => {
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
      { _id: user._id, username: user.username, email: user.email, isAdmin: false },
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
      { _id: user._id, username: user.username, email: user.email, isAdmin: false },
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
      { _id: user._id, username: user.username, email: user.email, isAdmin: false },
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
      { _id: user1._id, username: user1.username, email: user1.email, isAdmin: false },
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
      { _id: user._id, username: user.username, email: user.email, isAdmin: false },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .delete("/column")
      .set("Authorization", `Bearer ${token}`)
      .send({ column_id: column._id?.toString() });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Column and associated cards deleted successfully");

    const deletedColumn = await Column.findById(column._id);
    const deletedCard = await Card.findById(card._id);

    expect(deletedColumn).toBeNull();
    expect(deletedCard).toBeNull();
  });

  it("should not delete a column without token", async () => {
    const response = await request(app)
      .delete("/column")
      .send({ column_id: "somecolumnid" });
    console.log(response.body)
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
      { _id: user._id, username: user.username, email: user.email, isAdmin: false },
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
      { _id: user._id, username: user.username, email: user.email, isAdmin: false },
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
      { _id: user1._id, username: user1.username, email: user1.email, isAdmin: false },
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
      { _id: user._id, username: user.username, email: user.email, isAdmin: false },
      process.env.JWT_SECRET as string
    );

    const response = await request(app)
      .delete("/board")
      .set("Authorization", `Bearer ${token}`)
      .send({ board_id: board._id?.toString() });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Board and associated columns and cards deleted successfully");

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
      { _id: user._id, username: user.username, email: user.email, isAdmin: false },
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
      { _id: user._id, username: user.username, email: user.email, isAdmin: false },
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
      { _id: user1._id, username: user1.username, email: user1.email, isAdmin: false },
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
