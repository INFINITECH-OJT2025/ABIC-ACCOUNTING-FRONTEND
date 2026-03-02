"use client"

import { cn } from "@/lib/utils"

const DEFAULT_FORBIDDEN_PATTERN = /[<>`{}[\]\\|^~]/g

type TextFieldStatusProps = {
  value: string
  min?: number
  max?: number
  allowEmpty?: boolean
  forbiddenPattern?: RegExp
  className?: string
}

const getUniqueForbiddenChars = (value: string, pattern: RegExp): string[] => {
  const matches = value.match(pattern) ?? []
  return [...new Set(matches)]
}

export function TextFieldStatus({
  value,
  min,
  max,
  allowEmpty = true,
  forbiddenPattern = DEFAULT_FORBIDDEN_PATTERN,
  className,
}: TextFieldStatusProps) {
  const text = String(value ?? "")
  const length = text.length
  const forbiddenChars = getUniqueForbiddenChars(text, forbiddenPattern)
  const hasForbiddenChars = forbiddenChars.length > 0

  const isTooShort = typeof min === "number"
    ? (allowEmpty ? length > 0 && length < min : length < min)
    : false
  const isTooLong = typeof max === "number" ? length > max : false

  const isValid = !isTooShort && !isTooLong && !hasForbiddenChars
  const shouldShow = !isValid && (!allowEmpty || length > 0)

  if (!shouldShow) return null

  const issues: string[] = []
  if (isTooShort && typeof min === "number") {
    issues.push(`Must be at least ${min} characters (currently ${length}).`)
  }
  if (isTooLong && typeof max === "number") {
    issues.push(`Must be ${max} characters or fewer (currently ${length}).`)
  }
  if (hasForbiddenChars) {
    issues.push(`Contains unsupported characters: ${forbiddenChars.join(" ")}.`)
  }

  return (
    <div
      className={cn(
        "mt-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {issues.map((issue) => (
        <p key={issue}>{issue}</p>
      ))}
    </div>
  )
}
