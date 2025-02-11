import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'
import { JSX } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Board from './components/Board';
import Home from './components/Home';

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
          <Route path="/home" element={
              <ProtectedRoute>
                  <Home />
              </ProtectedRoute>
          } />
          {/* ... other routes */}
      </Routes>
  </Router>
  )
}

export default App