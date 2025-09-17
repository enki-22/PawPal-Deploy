import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RegistrationProvider } from './context/RegistrationContext';
import { ConversationsProvider } from './context/ConversationsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import RegisterStep1 from './components/RegisterStep1';
import RegisterStep2 from './components/RegisterStep2';
import Chat from './components/Chat';
import AIDiagnosis from './components/AIDiagnosis';
import PetHealthRecords from './components/PetHealthRecords';
import PetProfile from './components/PetProfile';
import ProfileSettings from './components/ProfileSettings';

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