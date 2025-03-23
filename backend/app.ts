import express, { Express, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import router from "./src/routes/router";
import path from "path";
import compression from "compression";

const app: Express = express();

app.use(
  cors(
    process.env.NODE_ENV === "development"
      ? {
          origin: "http://localhost:1234",
          optionsSuccessStatus: 200,
        }
      : undefined
  )
);

app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

const apiPrefix = process.env.NODE_ENV === "production" ? "/api" : "";

app.use(apiPrefix + "/", router);

if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.resolve(
    __dirname,
    "..",
    "..",
    "frontend",
    "dist"
  );

  app.use(express.static(clientBuildPath));

  app.get("*", (req: Request, res: Response) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    }
  });
}

export default app;
