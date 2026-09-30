export function isThemeShortcutKey(key: unknown) {
  return typeof key === "string" && key.toLowerCase() === "d"
}
