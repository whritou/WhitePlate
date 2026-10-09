export const jsxBlockSpacing = {
  meta: {
    type: "layout",
    fixable: "whitespace",
    schema: [],
    messages: { spacing: "Separate JSX blocks with a blank line." },
  },
  create(context) {
    const source = context.sourceCode

    // Translation wrappers containing only text are inline prose, like JSXText.
    function isInlineCopy(child) {
      if (child.type !== "JSXElement" || child.openingElement.name.name !== "Copy")
        return false

      const containsElement = (value) => {
        if (!value || typeof value !== "object") return false
        if (Array.isArray(value)) return value.some(containsElement)
        if (value.type === "JSXElement" || value.type === "JSXFragment") return true

        return Object.entries(value).some(([key, entry]) =>
          key !== "parent" && key !== "loc" && key !== "range" && containsElement(entry)
        )
      }

      return !child.children.some(containsElement)
    }

    function checkChildren(node) {
      const children = node.children.filter(
        (child) => child.type !== "JSXText" || child.value.trim() !== ""
      )

      for (let index = 1; index < children.length; index += 1) {
        const previous = children[index - 1]
        const current = children[index]

        // Preserve inline text, spaces and controls on the same line.
        if (previous.type === "JSXText" || current.type === "JSXText") continue
        if (isInlineCopy(previous) || isInlineCopy(current)) continue
        if (
          previous.type === "JSXExpressionContainer" &&
          previous.expression.type === "Literal" &&
          typeof previous.expression.value === "string" &&
          previous.expression.value.trim() === ""
        )
          continue
        if (current.loc.start.line - previous.loc.end.line !== 1) continue

        const range = [previous.range[1], current.range[0]]
        const gap = source.text.slice(...range)

        if (gap.trim() !== "") continue

        context.report({
          node: current,
          messageId: "spacing",
          fix: (fixer) => fixer.replaceTextRange(range, `\n${gap}`),
        })
      }
    }

    return { JSXElement: checkChildren, JSXFragment: checkChildren }
  },
}
