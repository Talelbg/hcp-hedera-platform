import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // Expose REACT_APP_ vars to the client
      envPrefix: 'REACT_APP_',
      // Note: GEMINI_API_KEY should be set via Firebase Cloud Functions secrets
      // Do NOT expose API keys in frontend builds
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
