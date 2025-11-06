import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
              <AppWithFade />
            </ConversationsProvider>
          </Router>
        </RegistrationProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );


function AppWithFade() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      {/* Pet Owner Routes */}
      <Route path="/login" element={<FadeWrapper><Login /></FadeWrapper>} />
      <Route path="/register" element={<FadeWrapper><Login /></FadeWrapper>} />
      <Route path="/register/step2" element={<FadeWrapper><RegisterStep2 /></FadeWrapper>} />
      <Route 
        path="/ai-diagnosis" 
        element={
          <ProtectedRoute>
            <FadeWrapper><AIDiagnosis /></FadeWrapper>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/pet-health-records" 
        element={
          <ProtectedRoute>
            <FadeWrapper><PetHealthRecords /></FadeWrapper>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/pet-profile/:petId" 
        element={
          <ProtectedRoute>
            <FadeWrapper><PetProfile /></FadeWrapper>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/chat" 
        element={
          <ProtectedRoute>
            <FadeWrapper><Chat /></FadeWrapper>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile-settings" 
        element={
          <ProtectedRoute>
            <FadeWrapper><ProfileSettings /></FadeWrapper>
          </ProtectedRoute>
        } 
      />
      {/* Admin Routes */}
      <Route path="/admin/login" element={<FadeWrapper><AdminLogin /></FadeWrapper>} />
      <Route 
        path="/admin/dashboard" 
        element={
          <AdminProtectedRoute>
            <FadeWrapper><AdminDashboard /></FadeWrapper>
          </AdminProtectedRoute>
        } 
      />
      <Route 
        path="/admin/reports" 
        element={
          <AdminProtectedRoute>
            <FadeWrapper><AdminReports /></FadeWrapper>
          </AdminProtectedRoute>
        } 
      />
      <Route 
        path="/admin/clients" 
        element={
          <AdminProtectedRoute>
            <FadeWrapper><AdminClients /></FadeWrapper>
          </AdminProtectedRoute>
        } 
      />
      <Route 
        path="/admin/pets" 
        element={
          <AdminProtectedRoute>
            <FadeWrapper><AdminPets /></FadeWrapper>
          </AdminProtectedRoute>
        } 
      />
      <Route 
        path="/admin/roles" 
        element={
          <AdminProtectedRoute requiredRole="MASTER">
            <FadeWrapper><AdminRoles /></FadeWrapper>
          </AdminProtectedRoute>
        } 
      />
      <Route 
        path="/admin/announcements" 
        element={
          <AdminProtectedRoute>
            <FadeWrapper><AdminAnnouncements /></FadeWrapper>
          </AdminProtectedRoute>
        } 
      />
      <Route 
        path="/admin/profile" 
        element={
          <AdminProtectedRoute>
            <FadeWrapper><AdminProfile /></FadeWrapper>
          </AdminProtectedRoute>
        } 
      />
      {/* Default Routes */}
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function FadeWrapper({ children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
}

export default App;