import request from "supertest";
import { app } from "./index";
import { Server } from "http";

let server: Server;

beforeAll((done) => {
  server = app.listen(0, () => {
    console.log(`Test server is running`);
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

describe("The app", () => {
  it("should respond with a 200 status code on the root path", async () => {
    const response = await request(server).get("/");
    expect(response.status).toBe(200);
  });
});