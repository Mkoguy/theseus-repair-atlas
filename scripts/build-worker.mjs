// Package the WebStorm-editable dist files and the API into one deployable Worker.
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import { join, extname, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const staticRoot = fileURLToPath(new URL('../dist/', import.meta.url))
const out = new URL('../dist/server/index.js', import.meta.url)
const worker = await readFile(new URL('../worker/site-worker.js', import.meta.url), 'utf8')
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' }
const assets = {}
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'server') continue
    const file = join(directory, entry.name)
    if (entry.isDirectory()) { await collect(file); continue }
    const path = '/' + relative(staticRoot, file).split(sep).join('/')
    const type = types[extname(file)] || 'application/octet-stream'
    const binary = type === 'image/png'
    const body = await readFile(file)
    assets[path] = { type, base64: binary, body: binary ? body.toString('base64') : body.toString('utf8') }
  }
}
await collect(staticRoot)
await mkdir(fileURLToPath(new URL('../dist/server/', import.meta.url)), { recursive: true })
await writeFile(out, `const ASSETS = ${JSON.stringify(assets)};\n${worker}`)
console.log(`Built Worker with ${Object.keys(assets).length} site assets`)
