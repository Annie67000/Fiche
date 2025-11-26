import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, Box } from '@mantine/core';
import LoginPage from './components/Login.jsx';
import Sidebar from './components/sidebar.jsx';
import Home from './page/home.jsx';

// VERSION JAVASCRIPT PUR (pas de TypeScript)
function PrivateRoute({ children }) {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" replace />;
}

function Layout() {
  return (
    <Box style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box
        ml={280}
        w="calc(100% - 280px)"
        bg="#f8f9fa"
        p="xl"
        style={{ minHeight: '100vh' }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <MantineProvider theme={{ colorScheme: 'light' }} withGlobalStyles withNormalizeCSS>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<PrivateRoute><Layout /></PrivateRoute>} />
        </Routes>
      </Router>
    </MantineProvider>
  );
}