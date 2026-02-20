import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout.jsx';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Labs from './pages/Labs';
import LabDetail from './pages/LabDetail';
import PCs from './pages/PCs';
import Equipment from './pages/Equipment';
import Software from './pages/Software';
import Maintenance from './pages/Maintenance';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import Account from './pages/Account';
import { useAuth } from './contexts/AuthContext';

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'student') return <Navigate to="/maintenance" replace />;
  return children;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminRoute>
                    <Dashboard />
                  </AdminRoute>
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pcs"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminRoute>
                    <PCs />
                  </AdminRoute>
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/equipment"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminRoute>
                    <Equipment />
                  </AdminRoute>
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/software"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminRoute>
                    <Software />
                  </AdminRoute>
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/maintenance"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Maintenance />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminRoute>
                    <Inventory />
                  </AdminRoute>
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/labs"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminRoute>
                    <Labs />
                  </AdminRoute>
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/labs/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminRoute>
                    <LabDetail />
                  </AdminRoute>
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminRoute>
                    <Account />
                  </AdminRoute>
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
