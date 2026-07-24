const fs = require('fs')
const path = require('path')

// Canonical skills live in .agents/skills (shared across agent tools).
// Claude Code only reads .claude/skills, so we expose the same files via a
// link: a relative symlink on macOS/Linux, a junction on Windows (junctions
// need no admin rights / developer mode, unlike real symbolic links).
// Runs automatically through the root `prepare` script on every `pnpm install`;
// can also be invoked directly: `node scripts/link-skills.js`.

const repoRoot = path.resolve(__dirname, '..')
const source = path.join(repoRoot, '.agents', 'skills')
const link = path.join(repoRoot, '.claude', 'skills')

function pathExists(p) {
  try {
    fs.lstatSync(p)
    return true
  } catch {
    return false
  }
}

function createLink() {
  if (!fs.existsSync(source)) {
    console.warn(`[link-skills] source missing, skipping: ${source}`)
    return
  }

  fs.mkdirSync(path.dirname(link), { recursive: true })

  // Remove any existing link/junction so re-runs are idempotent.
  if (pathExists(link)) {
    const stat = fs.lstatSync(link)
    if (stat.isSymbolicLink()) {
      fs.rmSync(link)
    } else if (stat.isDirectory()) {
      if (fs.readdirSync(link).length !== 0) {
        console.warn(`[link-skills] ${link} is a non-empty directory, leaving it untouched`)
        return
      }
      fs.rmSync(link, { recursive: true })
    } else {
      fs.rmSync(link)
    }
  }

  if (process.platform === 'win32') {
    // Junction: absolute target, no admin rights required.
    fs.symlinkSync(source, link, 'junction')
  } else {
    // Relative symlink so the repo stays relocatable.
    fs.symlinkSync(path.relative(path.dirname(link), source), link)
  }
  console.log('[link-skills] linked .claude/skills -> .agents/skills')
}

try {
  createLink()
} catch (err) {
  // Never fail the install: skills simply won't be visible to Claude Code.
  console.warn(`[link-skills] could not create link: ${err.message}`)
}
