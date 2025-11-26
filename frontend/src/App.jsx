import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, Box } from '@mantine/core';
import LoginPage from './components/Login.jsx';
import Sidebar from './components/sidebar.jsx';  // ← vérifie que ce chemin est bon
import Home from './page/home.jsx';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <MantineProvider theme={{ colorScheme: 'light' }} withGlobalStyles withNormalizeCSS>
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
                    </Routes>
                  </Box>
                </Box>
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </MantineProvider>
  );
}