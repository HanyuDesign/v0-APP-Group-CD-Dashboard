/**
 * Builds a single self-contained HTML file of the war-gaming tool.
 *
 * Output opens straight from `file://` with NO server and NO network: every
 * stylesheet, font and script is inlined, and routing is done with hash
 * fragments so nothing has to resolve against a base URL.
 *
 * Run AFTER `next build` (see the `build:offline` script). The build is not
 * optional — this script reuses the production CSS chunks and the font files
 * that `next/font` downloads at build time, so the offline stylesheet is
 * provably the same sheet the deployed app ships.
 */

import { build } from 'esbuild'
import { readFile, writeFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const NEXT_STATIC = path.join(ROOT, '.next/static')
const OUT = path.join(ROOT, 'public/app-war-gaming-offline.html')

const log = (...a) => console.log('[offline]', ...a)

/** Fail loudly. A half-built offline file looks fine until a client opens it. */
function must(condition, message) {
  if (!condition) throw new Error(`offline build: ${message}`)
}

// ---------------------------------------------------------------------------
// 1. Bundle the real app
// ---------------------------------------------------------------------------

async function bundleApp() {
  const result = await build({
    entryPoints: [path.join(HERE, 'offline-entry.tsx')],
    bundle: true,
    minify: true,
    format: 'iife',
    platform: 'browser',
    target: ['chrome110', 'firefox110', 'safari16'],
    jsx: 'automatic',
    write: false,
    absWorkingDir: ROOT,
    logLevel: 'warning',
    define: {
      'process.env.NODE_ENV': '"production"',
      // Some libraries probe this; keep it defined so nothing touches a real
      // `process` object that does not exist in a browser.
      'process.env.NEXT_PUBLIC_VERCEL_ENV': '""',
    },
    alias: {
      // Next.js runtime pieces that cannot exist in a static file.
      'next/link': path.join(HERE, 'shims/link.tsx'),
      'next/navigation': path.join(HERE, 'shims/navigation.ts'),
    },
    loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.svg': 'dataurl' },
  })

  const js = result.outputFiles.map((f) => f.text).join('\n')
  must(js.length > 100_000, `bundle looks too small (${js.length} bytes)`)
  log(`bundled app: ${(js.length / 1024).toFixed(1)} KB`)
  return js
}

// ---------------------------------------------------------------------------
// 2. Collect the production CSS and inline the fonts it references
// ---------------------------------------------------------------------------

async function collectCss() {
  must(existsSync(NEXT_STATIC), 'no .next/static — run `next build` first')

  const chunkDir = path.join(NEXT_STATIC, 'chunks')
  const files = (await readdir(chunkDir)).filter((f) => f.endsWith('.css'))
  must(files.length > 0, 'no CSS chunk found in .next/static/chunks')

  // Sort so the smaller @font-face sheet lands before the big Tailwind sheet,
  // matching the order Next emits them in the document head.
  const sheets = []
  for (const f of files) {
    const p = path.join(chunkDir, f)
    sheets.push({ name: f, size: (await stat(p)).size, css: await readFile(p, 'utf8') })
  }
  sheets.sort((a, b) => a.size - b.size)

  let css = sheets.map((s) => s.css).join('\n')
  log(`css chunks: ${sheets.map((s) => `${s.name} (${(s.size / 1024).toFixed(1)} KB)`).join(', ')}`)

  // Inline every url(...) the stylesheets reference. The Tailwind sheet has
  // none; the font sheet references the woff2 files next/font downloaded.
  const refs = [...new Set([...css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1].replace(/['"]/g, '')))]
  let inlined = 0
  for (const ref of refs) {
    if (ref.startsWith('data:')) continue
    // Refs look like `../media/<hash>.woff2` relative to the chunks dir.
    const file = path.join(chunkDir, ref)
    must(existsSync(file), `stylesheet asset not found on disk: ${ref}`)
    const bytes = await readFile(file)
    const mime = ref.endsWith('.woff2')
      ? 'font/woff2'
      : ref.endsWith('.woff')
        ? 'font/woff'
        : ref.endsWith('.svg')
          ? 'image/svg+xml'
          : 'application/octet-stream'
    const dataUri = `data:${mime};base64,${bytes.toString('base64')}`
    css = css.split(`url(${ref})`).join(`url(${dataUri})`)
    inlined++
  }
  log(`inlined ${inlined} stylesheet asset(s) of ${refs.length} ref(s)`)

  const leftover = [...css.matchAll(/url\((?!['"]?data:)([^)]+)\)/g)].map((m) => m[1])
  must(leftover.length === 0, `unresolved url() refs remain: ${leftover.join(', ')}`)

  // The app declares fonts by FAMILY NAME (`--font-sans: 'Geist'`) rather than
  // through a hashed next/font CSS-module class, so no extra class is needed on
  // <html>. Assert the families are actually present, because a missing
  // @font-face silently falls back to system sans and still looks plausible.
  for (const family of ['Geist', 'Geist Mono']) {
    must(
      new RegExp(`@font-face\\{[^}]*font-family:\\s*['"]?${family}['"]?[;,}]`).test(css.replace(/\s*\n\s*/g, '')),
      `no @font-face for "${family}" — offline text would fall back to system sans`,
    )
  }
  log('verified @font-face for Geist + Geist Mono')

  return css
}

// ---------------------------------------------------------------------------
// 3. Favicon, inlined so the document requests nothing at all
// ---------------------------------------------------------------------------

async function faviconTag() {
  const svg = path.join(ROOT, 'public/icon.svg')
  if (!existsSync(svg)) return ''
  const data = (await readFile(svg)).toString('base64')
  return `<link rel="icon" href="data:image/svg+xml;base64,${data}">`
}

// ---------------------------------------------------------------------------
// 4. Emit
// ---------------------------------------------------------------------------

const [js, css, icon] = await Promise.all([bundleApp(), collectCss(), faviconTag()])

// `<meta charset>` is load-bearing for a file:// deliverable: with no HTTP
// Content-Type header the browser guesses the encoding, and a wrong guess
// mangles every non-ASCII glyph on the recipient's machine.
const html = `<!DOCTYPE html>
<html lang="en" class="bg-background">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>APP Strategic War-Gaming Tool</title>
<meta name="description" content="AI-powered pulp &amp; paper industry war-gaming and scenario planning platform">
${icon}
<style>${css}</style>
</head>
<body class="font-sans antialiased min-h-screen">
<div id="root"></div>
<script>${js}</script>
</body>
</html>
`

await writeFile(OUT, html, 'utf8')

const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1)
log(`wrote ${path.relative(ROOT, OUT)} — ${kb} KB`)
log('opens from file:// with no server and no network')
