# Advanced Web Project Backend

This is the backend for the Advanced Web Project. It is built using Node.js, Express, and MongoDB. The backend provides APIs for user authentication, board management, column management, and card management.

## Table of Contents

- [Advanced Web Project Backend](#advanced-web-project-backend)
  - [Table of Contents](#table-of-contents)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
  - [API Endpoints](#api-endpoints)
    - [User Routes](#user-routes)
    - [Board Routes](#board-routes)
    - [Column Routes](#column-routes)
    - [Card Routes](#card-routes)
  - [Testing](#testing)
  - [Error Handling](#error-handling)

## Environment Variables

Create a `.env` file in the root directory and add the following environment variables:

```
MONGODB_URL=mongodb://127.0.0.1:27017/your_database_name
PORT=3000
JWT_SECRET=your_jwt_secret
ADMIN_PASS=your_admin_password bcrypt hashed
```

## Running the Application

To start the application, run:
```bash
npm start
```

The server will start on the port specified in the `.env` file.

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

### Board Routes

- **GET /board/**
  - Retrieves boards for a user.
  - Required in request headers: `{ Authorization: Bearer <token> }`
  - Required in request query: `{ email }`

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
  - Required in request body: `{ column_id, title, description, color (optional), order }`

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

## Testing

To run the tests, use:
```bash
npm run test
```

## Error Handling

Errors are handled using a middleware that checks for validation errors and sends appropriate responses. Validation errors are returned with a 400 status code, and other errors are logged and returned with a 500 status code.
