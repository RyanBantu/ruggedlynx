// @ts-nocheck
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import ebirdHandler from './api/ebird.js'
import movebankHandler from './api/movebank.js'

function readQuery(url) {
  const u = new URL(url, 'http://localhost')
  /** @type {Record<string, string>} */
  const query = {}
  u.searchParams.forEach((value, key) => {
    query[key] = value
  })
  return query
}

function vercelShim(handler) {
  return async (req, res) => {
    req.query = readQuery(req.url ?? '')
    let statusCode = 200
    /** @type {Record<string, string>} */
    const headers = {}

    const fakeRes = {
      setHeader(k, v) {
        headers[k] = v
        res.setHeader(k, v)
      },
      status(code) {
        statusCode = code
        res.statusCode = code
        return fakeRes
      },
      json(body) {
        const payload = JSON.stringify(body)
        res.statusCode = statusCode
        Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v))
        res.setHeader('Content-Type', 'application/json')
        res.end(payload)
      },
      end(body) {
        res.statusCode = statusCode
        res.end(body)
      },
    }

    await handler(req, fakeRes)
  }
}

function apiPlugin() {
  return {
    name: 'ruggedlynx-api',
    configureServer(server) {
      server.middlewares.use('/api/ebird', vercelShim(ebirdHandler))
      server.middlewares.use('/api/movebank', vercelShim(movebankHandler))
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.EBIRD_API_KEY) process.env.EBIRD_API_KEY = env.EBIRD_API_KEY
  if (env.VITE_EBIRD_API_KEY) process.env.VITE_EBIRD_API_KEY = env.VITE_EBIRD_API_KEY

  return {
    plugins: [react(), apiPlugin()],
  }
})
