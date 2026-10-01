import { jsxBlockSpacing } from "./jsx-block-spacing.mjs"

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
    "shared-requests": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          shared:
            "Use the shared request clients; raw fetch belongs in lib/api/json-request-client.ts.",
        },
      },
      create(context) {
        return {
          CallExpression(node) {
            const callee = node.callee
            const direct =
              callee.type === "Identifier" && callee.name === "fetch"
            const global =
              callee.type === "MemberExpression" &&
              callee.object.type === "Identifier" &&
              ["globalThis", "window"].includes(callee.object.name) &&
              (callee.computed
                ? callee.property.value
                : callee.property.name) === "fetch"

            if (direct || global) context.report({ node, messageId: "shared" })
          },
        }
      },
    },
    "jsx-block-spacing": jsxBlockSpacing,
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
