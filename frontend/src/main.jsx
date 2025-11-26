import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';

import { shadcnTheme } from './theme/theme.js';
import { shadcnCssVariableResolver } from './theme/cssVariableResolver.js';
import './theme/style.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider
      theme={shadcnTheme}
      cssVariablesResolver={shadcnCssVariableResolver}
    >
      <App />
    </MantineProvider>
  </StrictMode>,
);
