/**
 * Static audit of the offline HTML deliverable.
 *
 * Runs in node (not through shell greps) because shell-quoted regexes silently
 * mis-parse and can report a clean `0` for a check that never executed — a
 * false PASS is worse than a false failure. Every count here is reconciled
 * against an independent figure where one exists.
 *
 * NOTE: this is the static half of verification. The authoritative proof is the
 * runtime one — load the file and assert
 * `performance.getEntriesByType('resource').length === 0`.
 */

import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const FILE = path.join(ROOT, 'public/app-war-gaming-offline.html')

const html = await readFile(FILE, 'utf8')
const bytes = Buffer.byteLength(html, 'utf8')

const count = (re) => [...html.matchAll(re)].length
const fails = []
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) fails.push(label)
}

console.log(`file: ${path.relative(ROOT, FILE)}  (${(bytes / 1024).toFixed(1)} KB)\n`)

// --- embedded assets, grouped by real mime (mimes contain digits + slashes) --
const mimes = [...html.matchAll(/data:([a-zA-Z0-9.+/-]+);base64,/g)].map((m) => m[1])
const byMime = {}
for (const m of mimes) byMime[m] = (byMime[m] || 0) + 1
console.log('embedded data URIs:', byMime, `total=${mimes.length}\n`)

// Reconcile the woff2 count against the font files next/font actually emitted.
const mediaDir = path.join(ROOT, '.next/static/media')
const woff2OnDisk = (await readdir(mediaDir)).filter((f) => f.endsWith('.woff2')).length
check(
  'every build woff2 is embedded',
  (byMime['font/woff2'] || 0) === woff2OnDisk,
  `embedded=${byMime['font/woff2'] || 0} on-disk=${woff2OnDisk}`,
)

// --- nothing may be fetched -------------------------------------------------
const externalUrl = [...html.matchAll(/url\(\s*(?!['"]?(?:data:|#))([^)]*)\)/g)].map((m) => m[1].trim())
check('no external css url() refs', externalUrl.length === 0, externalUrl.slice(0, 5).join(', '))
console.log(`      (same-document url(#...) refs, harmless: ${count(/url\(\s*#/g)})`)

check('no <link rel=stylesheet>', count(/<link[^>]+stylesheet/gi) === 0)
check('no <script src=>', count(/<script[^>]+\ssrc\s*=/gi) === 0)
check('no <img src=> outside data:', count(/<img[^>]+src\s*=\s*["'](?!data:)/gi) === 0)
check('no @import of a remote sheet', count(/@import\s+url\(\s*['"]?https?:/gi) === 0)

// --- document shape --------------------------------------------------------
check('charset declared first', /<head>\s*<meta charset="utf-8">/i.test(html))
check('has #root mount host', /id="root"/.test(html))
check('exactly one inline <style>', count(/<style>/g) === 1, `found ${count(/<style>/g)}`)
// Count only the document's OWN script element. React DOM's minified source
// contains the literal string `"<script><\/script>"` (it builds a detached node
// that way), so a naive `<script>` count reports 2 and looks like a duplicated
// bundle. Anchor to the one that actually opens our tag.
const ownScripts = count(/<div id="root"><\/div>\n<script>/g)
check('exactly one document <script>', ownScripts === 1, `found ${ownScripts}`)
console.log(`      (React DOM embeds the literal "<script>" string: total textual matches ${count(/<script>/g)})`)
check('fonts declared via @font-face', count(/@font-face/g) >= 2, `${count(/@font-face/g)} rules`)
for (const family of ['Geist', 'Geist Mono']) {
  check(`@font-face for "${family}"`, html.includes(`font-family:${family}`) || html.includes(`font-family:'${family}'`))
}

// --- analytics / telemetry must not be present -----------------------------
check('no Vercel analytics beacon', !html.includes('vitals.vercel-insights'))
check('no service worker registration', !/serviceWorker\s*\.\s*register/.test(html))
check('no EventSource / WebSocket use', !/new\s+(EventSource|WebSocket)\s*\(/.test(html))

// `fetch(` appears inside minified library code paths that this app never
// reaches; report rather than fail, since the runtime resource count is the
// real proof that nothing is requested.
console.log(`\nnote: literal "fetch(" occurrences in bundle: ${count(/fetch\(/g)} (unreached library paths)`)
// Route hashes are COMPOSED at runtime (`'#' + route` in toHash), so only the
// bare paths appear as literals. Asserting on "#/results" would fail for the
// wrong reason. Check the route table's paths instead.
check('route table present in bundle', html.includes('/results'), `"/results" literals: ${count(/\/results/g)}`)

console.log(fails.length ? `\n${fails.length} CHECK(S) FAILED` : '\nAll static checks passed.')
process.exit(fails.length ? 1 : 0)
