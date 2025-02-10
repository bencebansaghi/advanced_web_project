import app from "./app";
import mongoose from "mongoose";
import config from "./config";

mongoose
  .connect(config.mongoUri)
  .then(() => {
    app.listen(config.port, () => {
      // The app.listen() call is here
      console.log(
        `Server listening on port ${config.port} in ${config.env} mode`
      );
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
