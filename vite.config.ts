import { execSync } from 'node:child_process'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// A short build stamp, shown in Settings, so you can tell which build is installed.
function buildStamp(): string {
  const sha = process.env.GITHUB_SHA?.slice(0, 7) ?? (() => {
    try { return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch { return 'dev' }
  })()
  return `${sha} · ${new Date().toISOString().slice(0, 10)}`
}

// Relative base so the build works from any static host path (e.g. GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [react()],
  define: { __BUILD__: JSON.stringify(buildStamp()) },
})
