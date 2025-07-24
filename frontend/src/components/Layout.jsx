import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Layout = ({ children, title = "PawPal Veterinary Assistant", showLogout = false }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-5">
      <div className="container">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold text-gray-800 m-0">
            {title}
          </h1>
          {showLogout && (
            <button 
              onClick={handleLogout} 
              className="btn float-right"
            >
              Logout
            </button>
          )}
        </div>
        
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;