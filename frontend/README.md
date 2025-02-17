# Advanced Web Project Frontend

This is the frontend part of the Advanced Web Project. It is built using React, Vite, and TypeScript.

## Table of Contents

- [Advanced Web Project Frontend](#advanced-web-project-frontend)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Getting Started](#getting-started)
  - [Scripts](#scripts)
  - [Frontend Logic](#frontend-logic)
  - [Proxy Configuration](#proxy-configuration)
  - [Authentication](#authentication)
  - [Frontend Routes](#frontend-routes)

## Prerequisites

- Node.js
- npm

## Getting Started

1. Install dependencies:
    ```sh
    npm install
    ```

2. Start the development server:
    ```sh
    npm run dev
    ```

3. Open your browser and navigate to `http://localhost:1234`.

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the project for production.
- `npm run lint`: Runs ESLint to check for linting errors.
- `npm run preview`: Previews the production build.

## Frontend Logic

- **User Authentication:**
  - Users can register or log in.
  - Admin accounts can be created during registration using a backend-stored admin password.

- **Regular User Capabilities:**
  - Modify or delete their profiles.
  - Manage boards: add, modify, or delete.
  - Manage columns within boards: add, modify, or delete.
  - Manage cards within columns: add, modify, or delete.
  - Drag and drop functionality for moving cards and columns.

- **Admin User Capabilities:**
  - Access an admin dashboard.
  - Modify or delete any user.
  - Access and manage any user's boards.


## Proxy Configuration

The development server is configured to proxy API requests to `http://localhost:3000`. You can change this configuration in `vite.config.ts`.

## Authentication

The application uses JWT for authentication. Protected routes are implemented to ensure only authenticated users can access certain pages. Admin routes are also implemented to restrict access to admin users.

## Frontend Routes

- `/login`: Login page.
- `/register`: Registration page.
- `/boards`: View all boards (protected route).
- `/board/:board_id/:board_title`: View a specific board (protected route).
- `/admin`: Admin dashboard (admin route).
- `/profile`: User profile page (protected route).
