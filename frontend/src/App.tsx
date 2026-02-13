/**
 * App Component
 * Main application component with routing
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { AircraftList } from './components/aircraft/AircraftList';
import { AircraftDetail } from './components/aircraft/AircraftDetail';
import { LoginPage } from './components/auth/LoginPage';
import { useAuth } from './context/useAuth';

function App() {
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/aircraft" element={<AircraftList />} />
          <Route path="/aircraft/:id" element={<AircraftDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
