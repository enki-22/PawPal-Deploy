import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AIDiagnosis from './components/AIDiagnosis';
import Chat from './components/Chat';
import Login from './components/Login';
import PetHealthRecords from './components/PetHealthRecords';
import PetProfile from './components/PetProfile';
import ProfileSettings from './components/ProfileSettings';
import ProtectedRoute from './components/ProtectedRoute';
import RegisterStep2 from './components/RegisterStep2';

// Admin Components
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminReports from './components/admin/AdminReports';
import AdminClients from './components/admin/AdminClients';
import AdminPets from './components/admin/AdminPets';
import AdminRoles from './components/admin/AdminRoles';
import AdminAnnouncements from './components/admin/AdminAnnouncements';
import AdminProfile from './components/admin/AdminProfile';
import AdminProfileSettings from './components/admin/AdminProfileSettings';
                  <Route 
                    path="/admin/profile-settings" 
                    element={
                      <AdminProtectedRoute>
                        <AdminProfileSettings />
                      </AdminProtectedRoute>
                    } 
                  />
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';

import { AuthProvider } from './context/AuthContext';
import { ConversationsProvider } from './context/ConversationsContext';
import { RegistrationProvider } from './context/RegistrationContext';
import { AdminAuthProvider } from './context/AdminAuthContext';

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <RegistrationProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ConversationsProvider>
              <div className="App">
                <Routes>
                  {/* Pet Owner Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Login />} />
                  <Route path="/register/step2" element={<RegisterStep2 />} />
                  
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

                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  
                  <Route 
                    path="/admin/dashboard" 
                    element={
                      <AdminProtectedRoute>
                        <AdminDashboard />
                      </AdminProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/admin/reports" 
                    element={
                      <AdminProtectedRoute>
                        <AdminReports />
                      </AdminProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/admin/clients" 
                    element={
                      <AdminProtectedRoute>
                        <AdminClients />
                      </AdminProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/admin/pets" 
                    element={
                      <AdminProtectedRoute>
                        <AdminPets />
                      </AdminProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/admin/roles" 
                    element={
                      <AdminProtectedRoute requiredRole="MASTER">
                        <AdminRoles />
                      </AdminProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/admin/announcements" 
                    element={
                      <AdminProtectedRoute>
                        <AdminAnnouncements />
                      </AdminProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/admin/profile" 
                    element={
                      <AdminProtectedRoute>
                        <AdminProfile />
                      </AdminProtectedRoute>
                    } 
                  />
                  
                  {/* Default Routes */}
                  <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
                  <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
              </div>
            </ConversationsProvider>
          </Router>
        </RegistrationProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;