import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import { JSX } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Board from './components/BoardView';
import Boards from './components/BoardsView'

function App() {
  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem('jwt');
    return token ? children : <Navigate to="/login" />;
  };

  return (
  <Router>
      <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/boards" element={
              <ProtectedRoute>
                  <Boards />
              </ProtectedRoute>
          } />
          <Route path="/board/:board_id/:board_title" element={
                <ProtectedRoute>
                  <Board />
                </ProtectedRoute>
          } /> 
      </Routes>
  </Router>
  )
}

export default App