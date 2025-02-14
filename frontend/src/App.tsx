import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { JSX } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Board from './components/BoardView';
import Boards from './components/BoardsView';
import Header from './components/Header';
import AdminDashboard from './components/admin/AdminDashboard.tsx'; // Assuming you have an AdminDashboard component

function App() {
  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem('jwt');
    return token ? children : <Navigate to="/login" />;
  };

  const AdminRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem('jwt');
    if (token) {
      const decodedToken: any = jwtDecode(token);
      return decodedToken.isAdmin ? children : <Navigate to="/boards" />;
    }
    return <Navigate to="/login" />;
  };

  return (
    <Router>
      <Header />
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
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;