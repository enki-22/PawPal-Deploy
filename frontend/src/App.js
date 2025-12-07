import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import AIDiagnosis from './components/AIDiagnosis';
import Chat from './components/Chat';
import CreateNewPassword from './components/CreateNewPassword';
import ForgotPassword from './components/ForgotPassword';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import PetHealthRecords from './components/PetHealthRecords';
import PetProfile from './components/PetProfile';
import ProfileSettings from './components/ProfileSettings';
import ProtectedRoute from './components/ProtectedRoute';
import RegisterStep2 from './components/RegisterStep2';
import SymptomLogger from './components/SymptomLogger';
import SymptomTimeline from './components/SymptomTimeline';
import VerifyEmail from './components/VerifyEmail';
import VerifyResetCode from './components/VerifyResetCode';

// Admin Components
import AdminAnnouncements from './components/admin/AdminAnnouncements';
import AdminClients from './components/admin/AdminClients';
import AdminCreateNewPassword from './components/admin/AdminCreateNewPassword';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminForgotPassword from './components/admin/AdminForgotPassword';
import AdminLogin from './components/admin/AdminLogin';
import AdminPetProfile from './components/admin/AdminPetProfile';
import AdminPets from './components/admin/AdminPets';
import AdminProfile from './components/admin/AdminProfile';
import AdminProfileSettings from './components/admin/AdminProfileSettings';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import AdminReports from './components/admin/AdminReports';
import AdminRoles from './components/admin/AdminRoles';
import AdminVerifyResetCode from './components/admin/AdminVerifyResetCode';

import LegalModal from './components/LegalModal';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { AuthProvider } from './context/AuthContext';
import { ConversationsProvider } from './context/ConversationsContext';
import { RegistrationProvider } from './context/RegistrationContext';

function App() {
  const [showLegalModal, setShowLegalModal] = React.useState(false);

  React.useEffect(() => {
    const openModal = () => setShowLegalModal(true);
    window.addEventListener('open-legal-modal', openModal);
    return () => window.removeEventListener('open-legal-modal', openModal);
  }, []);

  return (
    <AuthProvider>
      <AdminAuthProvider>
        <RegistrationProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ConversationsProvider>
              <AppWithFade />
              {showLegalModal && (
                <LegalModal onClose={() => setShowLegalModal(false)} />
              )}
            </ConversationsProvider>
          </Router>
        </RegistrationProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

function AppWithFade() {
  const location = useLocation();
  
  // MODIFIED: AnimatePresence must wrap Routes to detect page exit correctly
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Pet Owner Routes */}
        {/* Redirect legacy /login to /petowner/login */}
        <Route path="/login" element={<Navigate to="/petowner/login" replace />} />
      <Route path="petowner/login" element={<FadeWrapper><Login /></FadeWrapper>} />
      <Route path="petowner/register" element={<FadeWrapper><Login /></FadeWrapper>} />
      <Route path="petowner/register/step2" element={<FadeWrapper><RegisterStep2 /></FadeWrapper>} />
      <Route path="/verify-email" element={<FadeWrapper><VerifyEmail /></FadeWrapper>} />
      <Route path="/forgot-password" element={<FadeWrapper><ForgotPassword /></FadeWrapper>} />
      <Route path="/verify-reset-code" element={<FadeWrapper><VerifyResetCode /></FadeWrapper>} />
      <Route path="/create-new-password" element={<FadeWrapper><CreateNewPassword /></FadeWrapper>} />
      <Route 
        path="/ai-assessments" 
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
        path="/chat/:conversationId" 
        element={
          <ProtectedRoute>
            <FadeWrapper><Chat /></FadeWrapper>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/symptom-tracker" 
        element={
          <ProtectedRoute>
            <FadeWrapper><SymptomTimeline /></FadeWrapper>
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
      <Route path="/admin/forgot-password" element={<FadeWrapper><AdminForgotPassword /></FadeWrapper>} />
      <Route path="/admin/verify-reset-code" element={<FadeWrapper><AdminVerifyResetCode /></FadeWrapper>} />
      <Route path="/admin/create-new-password" element={<FadeWrapper><AdminCreateNewPassword /></FadeWrapper>} />
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
        path="/admin/pets/:petId"
        element={
          <AdminProtectedRoute>
            <FadeWrapper><AdminPetProfile /></FadeWrapper>
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
      <Route 
        path="/admin/profile-settings" 
        element={
          <AdminProtectedRoute>
            <FadeWrapper><AdminProfileSettings /></FadeWrapper>
          </AdminProtectedRoute>
        } 
      />
        {/* Default Routes */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/" element={<FadeWrapper><LandingPage /></FadeWrapper>} />
        {/* /login route removed, use /petowner/login only */}
      </Routes>
    </AnimatePresence>
  );
}

// MODIFIED: Simplified to a clean opacity fade without movement
function FadeWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ 
        duration: 0.25, 
        ease: "easeInOut" 
      }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

export default App;