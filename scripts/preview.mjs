import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'
import worker from '../worker/site-worker.js'

const root = fileURLToPath(new URL('../dist/', import.meta.url))
const mobilePreview = new URL('./mobile-preview.html', import.meta.url)
const host = '127.0.0.1'
const port = Number(process.env.THESEUS_PREVIEW_PORT || 4178)
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' }

function openInBrowser(url) {
  const options = { stdio: 'ignore', windowsHide: true }
  const child = process.platform === 'win32'
    ? spawn('rundll32.exe', ['url.dll,FileProtocolHandler', url], options)
    : spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], options)
  child.on('error', () => console.error('Open this preview manually: ' + url))
  child.unref()
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://' + host + ':' + port)
    if (url.pathname === '/api/guides' || url.pathname.startsWith('/api/parts/')) {
      const body = req.method === 'POST' ? Readable.toWeb(req) : undefined
      const request = new Request(url, { method: req.method, body, duplex: 'half', headers: req.headers })
      const response = await worker.fetch(request, { ...process.env, THESEUS_LOCAL_PREVIEW: true })
      res.writeHead(response.status, Object.fromEntries(response.headers))
      res.end(Buffer.from(await response.arrayBuffer()))
      return
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405).end()
      return
    }
    if (url.pathname === '/mobile') {
      res.writeHead(200, { 'content-type': types['.html'], 'cache-control': 'no-store' })
      res.end(req.method === 'HEAD' ? undefined : await readFile(mobilePreview))
      return
    }
    const pathname = decodeURIComponent(url.pathname)
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname))
    const relativeFile = relative(root, file)
    const type = types[extname(file)]
    if (!type || isAbsolute(relativeFile) || relativeFile.split(sep).includes('..') || relativeFile.startsWith('server' + sep)) {
      res.writeHead(404).end('Not found')
      return
    }
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' })
    res.end(req.method === 'HEAD' ? undefined : body)
  } catch {
    if (!res.headersSent) res.writeHead(404)
    res.end('Preview file unavailable')
  }
})
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? 'Port ' + port + ' is already in use. Stop the other preview first.' : error.message)
  process.exitCode = 1
})
server.listen(port, host, () => {
  const desktop = 'http://' + host + ':' + port + '/'
  const mobile = desktop + 'mobile'
  console.log('Desktop preview  ' + desktop)
  console.log('Mobile preview   ' + mobile)
  openInBrowser(desktop)
  openInBrowser(mobile)
})

