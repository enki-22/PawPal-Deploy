import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AIDiagnosis from './components/AIDiagnosis';
import Chat from './components/Chat';
import Login from './components/Login';
import PetHealthRecords from './components/PetHealthRecords';
import PetProfile from './components/PetProfile';
import ProfileSettings from './components/ProfileSettings';
import ProtectedRoute from './components/ProtectedRoute';
import RegisterStep1 from './components/RegisterStep1';
import RegisterStep2 from './components/RegisterStep2';
import { AuthProvider } from './context/AuthContext';
import { ConversationsProvider } from './context/ConversationsContext';
import { RegistrationProvider } from './context/RegistrationContext';

function App() {
  return (
    <AuthProvider>
      <RegistrationProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ConversationsProvider>
            <div className="App">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register/step1" element={<RegisterStep1 />} />
                <Route path="/register/step2" element={<RegisterStep2 />} />
                <Route path="/register" element={<Navigate to="/register/step1" replace />} />
                
                <Route 
                  path="/ai-diagnosis" 
                  element={
                    <ProtectedRoute>
                      <AIDiagnosis />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/pet-health-records" 
                  element={
                    <ProtectedRoute>
                      <PetHealthRecords />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/pet-profile/:petId" 
                  element={
                    <ProtectedRoute>
                      <PetProfile />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/chat" 
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/profile-settings" 
                  element={
                    <ProtectedRoute>
                      <ProfileSettings />
                    </ProtectedRoute>
                  } 
                />
                
                <Route path="/" element={<Navigate to="/chat" replace />} />
              </Routes>
            </div>
          </ConversationsProvider>
        </Router>
      </RegistrationProvider>
    </AuthProvider>
  );
}

export default App;