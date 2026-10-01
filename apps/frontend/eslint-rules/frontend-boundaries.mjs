const rawControls = new Set([
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "option",
])

export const frontendBoundaries = {
  rules: {
    "shared-controls": {
      meta: {
        type: "suggestion",
        schema: [],
        messages: {
          shared:
            "Use the shared shadcn control from components/ui instead of <{{name}}> (hidden inputs are allowed).",
        },
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            const name =
              node.name.type === "JSXIdentifier" ? node.name.name : null
            if (!rawControls.has(name)) return
            const hidden =
              name === "input" &&
              node.attributes.some(
                (attribute) =>
                  attribute.type === "JSXAttribute" &&
                  attribute.name.name === "type" &&
                  attribute.value?.value === "hidden"
              )
            if (!hidden)
              context.report({ node, messageId: "shared", data: { name } })
          },
        }
      },
    },
  },
}
