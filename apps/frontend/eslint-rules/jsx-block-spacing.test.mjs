import { expect, test } from "vitest"
import { Linter } from "eslint"
import { jsxBlockSpacing } from "./jsx-block-spacing.mjs"

const lint = (source) => new Linter().verify(source, [{
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
  plugins: { whiteplate: { rules: { spacing: jsxBlockSpacing } } },
  rules: { "whiteplate/spacing": "error" },
}])

test("translated inline prose does not demand blanks that Prettier removes", () => {
  expect(lint("const text = <p><Copy>Total:</Copy>\n<strong>{total}</strong></p>")).toEqual([])
})

test("translated layout blocks still require separation", () => {
  expect(lint("const view = <div><Copy><section /></Copy>\n<section /></div>")).toHaveLength(1)
})

test("ordinary layout blocks still require separation", () => {
  expect(lint("const view = <div><section />\n<section /></div>")).toHaveLength(1)
})
