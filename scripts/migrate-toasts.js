const fs = require("fs")
const path = require("path")

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "__pycache__") continue
      walk(p, out)
    } else if (/\.(tsx|ts|jsx|js)$/.test(ent.name)) out.push(p)
  }
  return out
}

function toNotifyImport(file) {
  let rel = path.relative(path.dirname(file), path.join("src", "utils", "notify.ts"))
  rel = rel.split(path.sep).join("/")
  if (!rel.startsWith(".")) rel = "./" + rel
  return `import { toast } from "${rel}";\n`
}

const files = walk("src")
let changed = 0

for (const file of files) {
  if (file.includes("notify.ts") || file.includes("App.test")) continue
  let src = fs.readFileSync(file, "utf8")
  const orig = src

  src = src.replace(/import\s+\{\s*toast\s*\}\s+from\s+['"]react-toastify['"]\s*;?/g, () =>
    toNotifyImport(file),
  )

  // Remove trailing pastel style option objects
  src = src.replace(
    /,\s*\{\s*style:\s*\{\s*background:\s*"#[^"]+"\s*,\s*color:\s*"#[^"]+"\s*\}\s*,?\s*\}/g,
    "",
  )
  src = src.replace(
    /,\s*\{\s*style:\s*\{\s*background:\s*"#[^"]+"\s*,\s*color:\s*"#[^"]+"\s*\}\s*,\s*hideProgressBar:\s*(?:true|false)\s*,?\s*\}/g,
    "",
  )
  src = src.replace(
    /,\s*\{\s*hideProgressBar:\s*(?:true|false)\s*,\s*style:\s*\{\s*background:\s*"#[^"]+"\s*,\s*color:\s*"#[^"]+"\s*\}\s*,?\s*\}/g,
    "",
  )

  if (src !== orig) {
    fs.writeFileSync(file, src)
    changed += 1
    console.log("updated", file)
  }
}

console.log("files changed", changed)
