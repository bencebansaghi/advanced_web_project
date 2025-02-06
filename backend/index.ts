import express, { Express } from "express";
import path from "path";
import router from "./src/routes/router";
import morgan from "morgan";
import cors from "cors";
import mongoose, { Connection } from 'mongoose';
import dotenv from "dotenv";

dotenv.config()

const app: Express = express();
const port = Number(process.env.PORT) || 3000;

const mongoDB: string = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/testdb";
mongoose.connect(mongoDB);
mongoose.Promise = Promise;
const db: Connection = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error"));
db.once("open", () => {
  console.log("MongoDB connected successfully");
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

app.use(express.static(path.join(__dirname, "../public")));
app.use("/", router);

export { app, db };

// for tests
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
