// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';


import '@mantine/dates/styles.css';

import { MantineProvider } from '@mantine/core';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mantine/core';
import { Notifications } from '@mantine/notifications';        // ← AJOUTÉ
import LoginPage from './components/login.jsx';
import Sidebar from './components/sidebar.jsx';  // ← vérifie que ce chemin est bon
import Home from './page/home.jsx';
import Employes from './page/Employes.jsx';
import { PaySlip } from './components/pay-slip.jsx';

export default function App() {
  function PrivateRoute({ children }) {
    const token = localStorage.getItem('access_token');
    return token ? children : <Navigate to="/login" replace />;
  }


  return (
    <MantineProvider>
      <Notifications position="top-right" />                {/* ← AJOUTÉ (les notifications apparaissent en haut à droite) */}
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Box style={{ display: 'flex', minHeight: '100vh' }}>
                  {/* Sidebar */}
                  <Sidebar />
                  {/* Contenu principal */}
                  <Box
                    ml={280}
                    w="calc(100% - 280px)"
                    bg="#f8f9fa"        // ← fond gris clair
                    p="xl"
                    style={{ minHeight: '100vh' }}
                  >
                    <Routes>
                      <Route path="/" element={<Home />} />
                      {/* Tu ajouteras les autres pages ici plus tard */}
                      <Route path="/employes" element={<Employes />} />
                    </Routes>
                  </Box>
                </Box>
              </PrivateRoute>
            }
          />
          <Route path="/fiches" element={<PaySlip />} />
        </Routes>
      </Router>
    </MantineProvider>
  );
}