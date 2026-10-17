"use client"

import { useEffect, useLayoutEffect, useRef } from "react"
import type { ClipboardEvent, FormEvent, KeyboardEvent } from "react"
import { cn } from "@/lib/utils"
import {
  createPlaceholderBadge,
  getPlaceholderImmediatelyBeforeCaret,
  renderTemplateValue,
  serializeTemplateNodes,
  truncateTemplateText,
} from "@/components/organization/order-email-template-field-helpers"
import type {
  OrderEmailPlaceholderKey,
  OrderEmailTemplateFieldProps,
} from "@/types/order-email-settings"

export function OrderEmailTemplateField({
  field,
  id,
  label,
  value,
  placeholderLabels,
  multiline,
  maxLength,
  disabled,
  insertRequest,
  onChange,
  onFocusField,
  onInsertLimit,
}: OrderEmailTemplateFieldProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const syncedValueRef = useRef<string | null>(null)
  const handledInsertRequestRef = useRef(0)

  function captureSelection() {
    const editor = editorRef.current
    const selection = window.getSelection()

    if (
      !editor ||
      !selection?.rangeCount ||
      !selection.anchorNode ||
      !selection.focusNode ||
      !editor.contains(selection.anchorNode) ||
      !editor.contains(selection.focusNode)
    )
      return

    savedRangeRef.current = selection.getRangeAt(0).cloneRange()
  }

  function moveCaretToEnd(editor: HTMLDivElement) {
    const range = document.createRange()
    const selection = window.getSelection()

    range.selectNodeContents(editor)
    range.collapse(false)
    selection?.removeAllRanges()
    selection?.addRange(range)
    savedRangeRef.current = range.cloneRange()
  }

  function updateFromDom() {
    const editor = editorRef.current

    if (!editor) return

    const serialized = serializeTemplateNodes(editor)
    const nextValue = truncateTemplateText(serialized, maxLength)

    if (nextValue !== serialized) {
      renderTemplateValue(editor, nextValue, placeholderLabels)
      moveCaretToEnd(editor)
    } else {
      captureSelection()
    }

    syncedValueRef.current = nextValue
    onChange(nextValue)
  }

  function getCurrentOrSavedRange(editor: HTMLDivElement) {
    const selection = window.getSelection()

    if (
      selection?.rangeCount &&
      selection.anchorNode &&
      selection.focusNode &&
      editor.contains(selection.anchorNode) &&
      editor.contains(selection.focusNode)
    )
      return selection.getRangeAt(0).cloneRange()

    const savedRange = savedRangeRef.current

    if (savedRange && editor.contains(savedRange.commonAncestorContainer))
      return savedRange.cloneRange()

    const range = document.createRange()

    range.selectNodeContents(editor)
    range.collapse(false)

    return range
  }

  function replaceSelectionWithText(text: string) {
    const editor = editorRef.current
    const selection = window.getSelection()

    if (!editor || !selection) return

    const range = getCurrentOrSavedRange(editor)
    const currentValue = serializeTemplateNodes(editor)
    const selectedValue = serializeTemplateNodes(range.cloneContents())
    const availableLength =
      maxLength - currentValue.length + selectedValue.length
    const insertedText = text.slice(0, Math.max(0, availableLength))

    if (!insertedText) return

    range.deleteContents()

    const textNode = document.createTextNode(insertedText)

    range.insertNode(textNode)
    range.setStartAfter(textNode)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)

    updateFromDom()
  }

  function handleInput() {
    updateFromDom()
  }

  function handleBeforeInput(event: FormEvent<HTMLDivElement>) {
    const inputEvent = event.nativeEvent as InputEvent

    if (!inputEvent.inputType.startsWith("insert") || inputEvent.data === null)
      return

    const editor = editorRef.current

    if (!editor) return

    const range = getCurrentOrSavedRange(editor)
    const currentValue = serializeTemplateNodes(editor)
    const selectedValue = serializeTemplateNodes(range.cloneContents())
    const insertedValue = multiline
      ? inputEvent.data
      : inputEvent.data.replace(/[\r\n]+/g, " ")

    if (
      currentValue.length - selectedValue.length + insertedValue.length >
      maxLength
    )
      event.preventDefault()
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault()

    const pastedText = event.clipboardData
      .getData("text/plain")
      .replace(/\r\n?/g, "\n")
    const plainText = multiline ? pastedText : pastedText.replace(/\n/g, " ")

    replaceSelectionWithText(plainText)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter") {
      event.preventDefault()

      if (multiline) replaceSelectionWithText("\n")

      return
    }

    if (event.key !== "Backspace" || event.nativeEvent.isComposing) return

    const editor = editorRef.current
    const selection = window.getSelection()

    if (!editor || !selection?.rangeCount) return

    const range = selection.getRangeAt(0)
    const badge = getPlaceholderImmediatelyBeforeCaret(editor, range)

    if (!badge) return

    event.preventDefault()

    const parent = badge.parentNode

    if (!parent) return

    const badgeIndex = Array.prototype.indexOf.call(parent.childNodes, badge)

    badge.remove()

    const caret = document.createRange()

    caret.setStart(parent, Math.min(badgeIndex, parent.childNodes.length))
    caret.collapse(true)
    selection.removeAllRanges()
    selection.addRange(caret)
    savedRangeRef.current = caret.cloneRange()

    updateFromDom()
  }

  const insertRef = useRef<(placeholder: OrderEmailPlaceholderKey) => void>(
    () => {}
  )

  useLayoutEffect(() => {
    insertRef.current = (placeholder) => {
      const editor = editorRef.current
      const selection = window.getSelection()

      if (!editor || !selection || disabled) return

      editor.focus({ preventScroll: true })

      const range = savedRangeRef.current
      const insertionRange =
        range && editor.contains(range.commonAncestorContainer)
          ? range.cloneRange()
          : document.createRange()

      if (!range || !editor.contains(range.commonAncestorContainer)) {
        insertionRange.selectNodeContents(editor)
        insertionRange.collapse(false)
      }

      const currentValue = serializeTemplateNodes(editor)
      const selectedValue = serializeTemplateNodes(
        insertionRange.cloneContents()
      )
      const token = `{{${placeholder}}}`

      if (
        currentValue.length - selectedValue.length + token.length >
        maxLength
      ) {
        onInsertLimit()

        return
      }

      insertionRange.deleteContents()

      const badge = createPlaceholderBadge(placeholder, placeholderLabels)

      insertionRange.insertNode(badge)
      insertionRange.setStartAfter(badge)
      insertionRange.collapse(true)
      selection.removeAllRanges()
      selection.addRange(insertionRange)
      savedRangeRef.current = insertionRange.cloneRange()

      const serialized = serializeTemplateNodes(editor)
      const nextValue = truncateTemplateText(serialized, maxLength)

      if (nextValue !== serialized) {
        renderTemplateValue(editor, nextValue, placeholderLabels)

        const endRange = document.createRange()

        endRange.selectNodeContents(editor)
        endRange.collapse(false)
        selection.removeAllRanges()
        selection.addRange(endRange)
        savedRangeRef.current = endRange.cloneRange()
      }

      syncedValueRef.current = nextValue
      onChange(nextValue)
    }
  }, [disabled, maxLength, onChange, onInsertLimit, placeholderLabels])

  useLayoutEffect(() => {
    const editor = editorRef.current

    if (!editor || syncedValueRef.current === value) return

    renderTemplateValue(editor, value, placeholderLabels)
    syncedValueRef.current = value
    savedRangeRef.current = null
  }, [placeholderLabels, value])

  useLayoutEffect(() => {
    if (
      insertRequest.id === 0 ||
      insertRequest.field !== field ||
      handledInsertRequestRef.current === insertRequest.id
    )
      return

    handledInsertRequestRef.current = insertRequest.id
    insertRef.current(insertRequest.placeholder)
  }, [field, insertRequest.field, insertRequest.id, insertRequest.placeholder])

  useEffect(() => {
    const handleSelectionChange = () => {
      const editor = editorRef.current
      const selection = window.getSelection()

      if (
        !editor ||
        !selection?.rangeCount ||
        !selection.anchorNode ||
        !selection.focusNode ||
        !editor.contains(selection.anchorNode) ||
        !editor.contains(selection.focusNode)
      )
        return

      savedRangeRef.current = selection.getRangeAt(0).cloneRange()
    }

    document.addEventListener("selectionchange", handleSelectionChange)

    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange)
  }, [])

  return (
    <div
      ref={editorRef}
      id={id}
      role="textbox"
      aria-label={label}
      aria-multiline={multiline}
      aria-disabled={disabled}
      contentEditable={!disabled}
      suppressContentEditableWarning
      spellCheck
      tabIndex={0}
      className={cn(
        "min-h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground transition-colors duration-(--duration-feedback) outline-none focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid aria-disabled:cursor-not-allowed aria-disabled:bg-muted aria-disabled:text-muted-foreground",
        multiline
          ? "min-h-40 whitespace-pre-wrap"
          : "overflow-x-auto whitespace-nowrap"
      )}
      onInput={handleInput}
      onBeforeInput={handleBeforeInput}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      onFocus={() => onFocusField(field)}
      onBlur={captureSelection}
    />
  )
}
