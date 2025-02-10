# advanced_web_project
 
This project is a Kanban board application built using Node.js for the backend and React for the frontend. It allows users to manage tasks using a visual board with columns representing different stages of the workflow.

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
- Axios for API calls
- Material-UI for styling
- Vitest for testing

## Getting Started

### Prerequisites
- Node.js
- npm or yarn
- MongoDB

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/advanced_web_project.git
    ```
2. Navigate to the project directory:
    ```sh
    cd advanced_web_project
    ```
3. Install dependencies for both backend and frontend using the postinstall script:
    ```sh
    npm run postinstall
    ```
4. Start the backend and frontend servers concurrently:
    ```sh
    npm start
    ```

Alternatively, you can manually install dependencies and start the servers:

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/advanced_web_project.git
    ```
2. Navigate to the backend directory and install dependencies:
    ```sh
    cd backend
    npm install
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

## Usage

1. Open your browser and go to `http://localhost:5173`.
2. Register a new account or log in with an existing account.
3. Start managing your tasks on the Kanban board.


## AI Usage during the project

- Gemini for help setting up jest with prod and dev environments
- Github Copilot for generating documentation such as README files
- Github Copilot Edits for generating test cases in the backend

I have reviewed all of the code produced by these tools.