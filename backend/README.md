# Advanced Web Project Backend

This is the backend for the Advanced Web Project. It is built using Node.js, Express, and MongoDB. The backend provides APIs for user authentication, board management, column management, and card management.

## Table of Contents

- [Advanced Web Project Backend](#advanced-web-project-backend)
  - [Table of Contents](#table-of-contents)
  - [Running the Application](#running-the-application)
  - [Running the Application in Development Mode](#running-the-application-in-development-mode)
  - [API Endpoints](#api-endpoints)
    - [User Routes](#user-routes)
    - [Board Routes](#board-routes)
    - [Column Routes](#column-routes)
    - [Card Routes](#card-routes)
  - [Middlewares](#middlewares)
  - [Environment Variables](#environment-variables)
  - [Scripts](#scripts)
  - [Dependencies](#dependencies)
  - [Testing](#testing)
  - [Error Handling](#error-handling)
  - [Models](#models)

## Running the Application

To start the application, run:
```bash
npm start
```

The server will start on the port specified in the `.env` file.

## Running the Application in Development Mode

To start the application in development mode, run:
```bash
npm run dev
```

The server will start with Nodemon, which will automatically restart it when file changes are detected.

## API Endpoints

### User Routes

- **POST /user/register**
  - Registers a new user.
  - Required in request body: `{ username, email, password, adminPass (optional) }`

- **POST /user/login**
  - Logs in a user.
  - Required in request body: `{ email, password }`

- **GET /user/all**
  - Retrieves all users (admin only).
  - Required in request headers: `{ Authorization: Bearer <token> }`

- **GET /user/**
  - Retrieves information about the logged-in user.
  - Required in request headers: `{ Authorization: Bearer <token> }`

- **PUT /user/**
  - Updates user information.
  - Required in request headers: `{ Authorization: Bearer <token> }`
  - Required in request body: `{ user_id (optional, for admin), username (optional), password (optional) }`

- **DELETE /user/**
  - Deletes a user account.
  - Required in request headers: `{ Authorization: Bearer <token> }`
  - Required in request body: `{ user_id (optional, for admin) }`

### Board Routes

- **GET /board/**
  - Retrieves boards for a user.
  - Required in request headers: `{ Authorization: Bearer <token> }`
  - Required in request query: `{ email (optional) }`

- **POST /board/**
  - Creates a new board.
  - Required in request headers: `{ Authorization: Bearer <token> }`
  - Required in request body: `{ title }`

- **PUT /board/**
  - Updates a board's title.
  - Required in request headers: `{ Authorization: Bearer <token> }`
  - Required in request body: `{ board_id, title }`

- **DELETE /board/**
  - Deletes a board and its associated columns and cards.
  - Required in request headers: `{ Authorization: Bearer <token> }`
  - Required in request body: `{ board_id }`

### Column Routes

- **GET /column/**
  - Retrieves columns for a board.
  - Required in request headers: `{ Authorization: Bearer <token> }`
  - Required in request query: `{ board_id }`

- **POST /column/**
  - Creates a new column.
  - Required in request headers: `{ Authorization: Bearer <token> }`
  - Required in request body: `{ board_id, title, order (optional) }`

- **PUT /column/modify**
  - Updates a column.
  - Required in request headers: `{ Authorization: Bearer <token> }`
  - Required in request body: `{ column_id, title (optional), order (optional) }`

- **DELETE /column/**
  - Deletes a column and its associated cards.
  - Required in request headers: `{ Authorization: Bearer <token> }`
  - Required in request body: `{ column_id }`

### Card Routes

- **GET /card/by_column**
  - Retrieves cards for a column.
  - Required in request headers: `{ Authorization: Bearer <token> }`
  - Required in request query: `{ column_id }`

- **POST /card/**
  - Creates a new card.
  - Required in request headers: `{ Authorization: Bearer <token> }`
  - Required in request body: `{ column_id, title, description, color (optional), order (optional) }`

- **PUT /card/modify**
  - Updates a card.
  - Required in request headers: `{ Authorization: Bearer <token> }`
  - Required in request body: `{ card_id, title (optional), color (optional), description (optional), order (optional) }`

- **PUT /card/move**
  - Moves a card to a different column.
  - Required in request headers: `{ Authorization: Bearer <token> }`
  - Required in request body: `{ card_id, column_id }`

- **DELETE /card/**
  - Deletes a card.
  - Required in request headers: `{ Authorization: Bearer <token> }`
  - Required in request body: `{ card_id }`

## Middlewares

The project includes the following custom middlewares:

- **validateUserToken**: Validates the JWT token in the request headers.
- **validateAdmin**: Checks if the authenticated user is an admin.
- **checkAccess**: Checks if the user has access to the requested resource.
- **validateUserRegister**: Validates the user registration data.
- **validateUserLogin**: Validates the user login data.
- **validateUserUpdate**: Validates the user update data.
- **errorHandler**: Handles validation and other errors.

## Environment Variables

An example `.env` file is provided as `.env.example`:

```
JWT_SECRET=secret-here
ADMIN_PASS=admin-pass
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/db_name
TEST_MONGO_URI=mongodb://127.0.0.1:27017/test_db
```

## Scripts

The following scripts are available in the `package.json` file:

- **test**: Runs the tests using Jest.
- **dev**: Compiles TypeScript and starts the server with Nodemon.
- **start**: Starts the server using the compiled JavaScript files.
- **build**: Compiles the TypeScript files to JavaScript.

## Dependencies

The project has the following dependencies:

- **bcrypt**: For hashing passwords.
- **compression**: For compressing HTTP responses.
- **cors**: For enabling Cross-Origin Resource Sharing.
- **express**: For building the web server.
- **express-validator**: For validating request data.
- **helmet**: For securing HTTP headers.
- **jsonwebtoken**: For creating and verifying JSON Web Tokens.
- **mongoose**: For interacting with MongoDB.
- **morgan**: For logging HTTP requests.
- **multer**: For handling file uploads.
- **dotenv**: For loading environment variables from a `.env` file.

The project has the following development dependencies:

- **@babel/core**: Babel compiler core.
- **@babel/preset-env**: Babel preset for compiling ES2015+ syntax.
- **@babel/preset-typescript**: Babel preset for TypeScript.
- **@shelf/jest-mongodb**: Jest preset for MongoDB.
- **@types/...**: TypeScript type definitions for various packages.
- **babel-jest**: Jest transformer for Babel.
- **jest**: JavaScript testing framework.
- **mongodb-memory-server**: In-memory MongoDB server for testing.
- **nodemon**: For automatically restarting the server during development.
- **supertest**: For testing HTTP endpoints.
- **ts-node**: For running TypeScript files directly.
- **tsc-watch**: For watching and recompiling TypeScript files.
- **typescript**: TypeScript language.

## Testing

To run the tests, use:
```bash
npm run test
```

The tests are written using Jest and Supertest. The MongoDB database is mocked using `mongodb-memory-server` to ensure tests do not affect the real database.

## Error Handling

Errors are handled using a middleware that checks for validation errors and sends appropriate responses. Validation errors are returned with a 400 status code, and other errors are logged and returned with a 500 status code.

## Models

The project includes the following models:

- **User**: Represents a user in the system.
- **Board**: Represents a board created by a user.
- **Column**: Represents a column within a board.
- **Card**: Represents a card within a column.