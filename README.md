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
    - [Running in Production](#running-in-production)
    - [Running in Development](#running-in-development)
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

1. **Clone the repository**:
    ```sh
    git clone https://github.com/bencebansaghi/advanced_web_project
    cd advanced_web_project
    ```

2. **Install dependencies for both backend and frontend**:
    ```sh
    npm run install
    ```

3. **Set up the environment variables**:
    - Copy the example environment file and update it with your configuration:
    ```sh
    cp ./backend/.env.example ./backend/.env
    ```

### Running in Production

1. **Build the application**:
    ```sh
    npm run build
    ```

2. **Start the backend and frontend servers concurrently**:
    ```sh
    npm start
    ```

### Running in Development

1. **Change the NODE_ENV variable in the .env file to _development_**

2. **Start the backend and frontend servers concurrently in development mode**:
    ```sh
    npm run dev
    ```

For more detailed information, refer to the README files in the `backend` and `frontend` directories.

### Testing

To run tests for the backend:

1. Run the backend tests:
    ```sh
    npm run test
    ```

## Usage

1. Open your browser and go to `http://localhost:3000`.
2. Register a new account or log in with an existing account.
3. Start managing your tasks on the Kanban board.

## AI Usage during the project

- Gemini for help setting up jest with prod and dev environments
- Github Copilot Edits for generating documentation such as README files 
- Github Copilot Edits for generating test cases in the backend and working with Materialize UI

I have reviewed all of the code produced by these tools.