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

let fixed = 0
for (const file of walk("src")) {
  let src = fs.readFileSync(file, "utf8")
  const orig = src
  // Fix glued imports: ...notify.ts"import -> ...notify.ts"\nimport
  src = src.replace(/(from\s+["'][^"']*notify\.ts["']);?(?=import\s)/g, "$1\n")
  // Also ensure notify import ends with semicolon for consistency
  src = src.replace(/(import\s+\{\s*toast\s*\}\s+from\s+["'][^"']*notify\.ts["'])(?!\s*;)/g, "$1;")
  if (src !== orig) {
    fs.writeFileSync(file, src)
    fixed += 1
    console.log("fixed", file)
  }
}
console.log("files fixed", fixed)
