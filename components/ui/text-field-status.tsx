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

  return (
    <div className={cn("mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold", className)}>
      <span className={cn(isTooLong ? "text-rose-600" : "text-slate-500")}>
        Length: {length}{typeof max === "number" ? `/${max}` : ""}
      </span>
      {typeof min === "number" ? (
        <span className={cn(isTooShort ? "text-rose-600" : "text-emerald-600")}>
          Min {min}: {isTooShort ? "Not met" : "Met"}
        </span>
      ) : null}
      <span className={cn(hasForbiddenChars ? "text-rose-600" : "text-emerald-600")}>
        {hasForbiddenChars ? `Forbidden chars: ${forbiddenChars.join(" ")}` : "Forbidden chars: none"}
      </span>
      <span className={cn(isValid ? "text-emerald-600" : "text-amber-600")}>
        Status: {isValid ? "Looks good" : "Needs attention"}
      </span>
    </div>
  )
}
