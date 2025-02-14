# advanced_web_project

This project is a Kanban board application built using Node.js for the backend and React for the frontend. It allows users to manage tasks using a visual board with columns representing different stages of the workflow.

## Table of Contents
- [advanced\_web\_project](#advanced_web_project)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Technologies Used](#technologies-used)
    - [Backend](#backend)
    - [Frontend](#frontend)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Running in Development](#running-in-development)
    - [Running in Production](#running-in-production)
    - [Testing](#testing)
  - [Usage](#usage)
  - [AI Usage during the project](#ai-usage-during-the-project)

## Features

- Create, update, and delete tasks
- Drag and drop tasks between columns
- User authentication and authorization
- Real-time updates with WebSockets

## Technologies Used

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JWT for authentication
- Jest for testing

### Frontend
- React
- Vite
- Material-UI for styling

## Getting Started

### Prerequisites
- Node.js
- npm
- MongoDB

### Installation

1. Navigate to the project directory:
    ```sh
    cd advanced_web_project
    ```
2. Install dependencies for both backend and frontend using the postinstall script:
    ```sh
    npm run postinstall
    ```
3. Set up the environment variables in backend
4. Start the backend and frontend servers concurrently:
    ```sh
    npm start
    ```

Alternatively, you can manually install dependencies and start the servers:

1. Navigate to the backend directory and install dependencies:
    ```sh
    cd backend
    npm install
    ```
2. Set up the environment variables:
    ```sh
    cp .env.example .env
    ```
3. Start the backend server:
    ```sh
    npm start
    ```
4. Navigate to the frontend directory and install dependencies:
    ```sh
    cd ../frontend
    npm install
    ```
5. Start the frontend development server:
    ```sh
    npm start
    ```

For more detailed information, refer to the README files in the `backend` and `frontend` directories.

### Running in Development

To run the project in development mode:

1. Ensure you have set up the environment variables as described in the Installation section.
2. Start the backend and frontend servers concurrently in development mode:
    ```sh
    npm run dev
    ```

### Running in Production

To run the project in production mode:

1. Ensure you have set up the environment variables as described in the Installation section.
2. Build the frontend:
    ```sh
    npm run build
    ```
3. Start the backend and frontend servers concurrently in production mode:
    ```sh
    npm start
    ```

### Testing

To run tests for the backend:

1. Navigate to the project directory:
    ```sh
    cd advanced_web_project
    ```
2. Run the backend tests:
    ```sh
    npm run test
    ```

## Usage

1. Open your browser and go to `http://localhost:1234`.
2. Register a new account or log in with an existing account.
3. Start managing your tasks on the Kanban board.

## AI Usage during the project

- Gemini for help setting up jest with prod and dev environments
- Github Copilot for generating documentation such as README files and working with Materialize UI
- Github Copilot Edits for generating test cases in the backend

I have reviewed all of the code produced by these tools.