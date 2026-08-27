/** Path helpers for admin sidebar active states. */

/** Module home → additional path prefixes that belong to the same module. */
const MODULE_ALIASES: Record<string, string[]> = {
  "/customer-management": ["/customers"],
  "/employee-management": ["/employees"],
  "/complaint-management": ["/complaints"],
  "/area-zone-management": ["/areas"],
  "/vendor-management": ["/vendors"],
}

export function isPathActive(pathname: string, targetPath: string): boolean {
  if (!targetPath) return false
  if (pathname === targetPath) return true
  if (pathname.startsWith(targetPath + "/")) return true
  const aliases = MODULE_ALIASES[targetPath]
  if (aliases) {
    return aliases.some(
      (alias) => pathname === alias || pathname.startsWith(alias + "/"),
    )
  }
  return false
}

export function isAnyPathActive(pathname: string, paths: string[]): boolean {
  return paths.some((p) => isPathActive(pathname, p))
}
