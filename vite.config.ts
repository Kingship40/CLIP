import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { handleApiRoute } from './src/services/backend/apiRoutes';

function backendApiPlugin(): Plugin {
  return {
    name: 'backend-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleApiRoute(req, res);
          if (!handled) {
            next();
          }
        } catch (e: any) {
          console.error('API middleware error:', e);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e.message || 'Internal server error' }));
        }
      });
    },
  };
}

// Stub plugin: replaces Node-only backend modules with no-op browser shims
// during BOTH the dev server (serve) and the production build so that the
// browser JS bundle never tries to execute fs/path/child_process/util/crypto.
// The real Node modules still run server-side via the configureServer hook.
function nodeBackendStubPlugin(): Plugin {
  // Absolute path fragments that identify Node-only server modules.
  // These must never be bundled into the browser JS.
  const NODE_ONLY_SUFFIXES = [
    'services/backend/backgroundJobQueue',
    'services/backend/privateStorageManager',
    'services/backend/apiRoutes',
    'services/ffmpegService',
    'services/import/mediaVerifier',
    // npm packages that use Node built-ins — must never reach the browser
    'ffmpeg-static',
    'ffprobe-static',
  ];

  const STUB_CODE = `
export const backgroundJobQueueInstance = {
  submitJob: () => Promise.resolve({ id: '' }),
  getJob: () => undefined,
  getAllJobs: () => [],
  subscribe: () => () => {},
  cancelJob: () => false,
  deleteJobResults: () => false,
};
export const privateStorageManagerInstance = {};
export const ffmpegServiceInstance = {};
export const mediaVerifierInstance = {};
export async function handleApiRoute() { return false; }
export default '';
`;

  function isNodeOnlyModule(id: string): boolean {
    const norm = id.replace(/\\/g, '/').replace(/\.tsx?$/, '');
    return NODE_ONLY_SUFFIXES.some(
      (suffix) => norm.endsWith(suffix) || norm.includes(`/${suffix}`) || norm.includes(suffix)
    );
  }

  return {
    name: 'node-backend-stub',
    // Use transform hook — fires AFTER the file is resolved to an absolute path.
    // This catches both relative and absolute imports in dev and build.
    transform(_code, id) {
      if (isNodeOnlyModule(id)) {
        return { code: STUB_CODE, map: null };
      }
      return null;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), backendApiPlugin(), nodeBackendStubPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
  },
  optimizeDeps: {
    // Exclude Node-only packages from Vite's browser pre-bundling step.
    // Without this, Vite tries to bundle them for the browser and crashes
    // because they import 'os', 'path', 'child_process', etc.
    exclude: ['ffmpeg-static', 'ffprobe-static'],
  },
  build: {
    rollupOptions: {
      external: (id) =>
        ['fs', 'path', 'child_process', 'util', 'crypto', 'os', 'net', 'http', 'https', 'stream', 'buffer', 'events'].includes(id),
    },
  },
});
