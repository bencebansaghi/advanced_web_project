import dotenv from 'dotenv';
dotenv.config();

interface IConfig {
    port:number,
    mongoUri: string,
    env:string
}

// Typescript does not like my solution but works
const config: IConfig = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.NODE_ENV === 'test' ? process.env.TEST_MONGO_URI : process.env.MONGO_URI || 'mongodb://localhost:27017/your_db_name', // Use different DB for testing
  env: process.env.NODE_ENV || 'development'
};

export default config;