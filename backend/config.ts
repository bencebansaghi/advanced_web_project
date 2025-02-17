import dotenv from "dotenv";
dotenv.config();

interface IConfig {
  port: number;
  mongoUri: string;
  env: string;
}

const config: IConfig = {
  port: Number(process.env.PORT) || 3000,
  mongoUri:
    process.env.NODE_ENV === "test"
      ? process.env.TEST_MONGO_URI || "mongodb://localhost:27017/test_db"
      : process.env.MONGO_URI || "mongodb://localhost:27017/db_name",
  env: process.env.NODE_ENV || "development",
};

export default config;
