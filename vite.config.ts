
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
    server: {
        host: "::",
        port: 8080,
        proxy: {
            '/zapsign-api': {
                target: 'https://api.zapsign.com.br',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/zapsign-api/, '/api'),
            }
        }
    },
    plugins: [
        react(),
        mode === 'development' &&
        componentTagger(),
    ].filter(Boolean),
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
}));
