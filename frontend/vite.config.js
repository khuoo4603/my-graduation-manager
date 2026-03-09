import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, "index.html"),
        grad: resolve(__dirname, "grad/index.html"),
        gradCourses: resolve(__dirname, "grad/courses/index.html"),
        gradStatus: resolve(__dirname, "grad/status/index.html"),
        storage: resolve(__dirname, "storage/index.html"),
        profile: resolve(__dirname, "profile/index.html"),
        error: resolve(__dirname, "error/index.html"),
      },
    },
  },
});
