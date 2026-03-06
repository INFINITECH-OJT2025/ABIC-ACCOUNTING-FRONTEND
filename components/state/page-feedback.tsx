"use client"

import { Button } from "@/components/ui/button"
import { pageStateTokens } from "@/lib/ui/tokens"
import { AlertCircle, Inbox, Loader2 } from "lucide-react"

export function PageLoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className={pageStateTokens.wrapper}>
      <div className={pageStateTokens.card}>
        <div className="flex items-center gap-3 text-slate-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className={pageStateTokens.title}>{label}</p>
        </div>
      </div>
    </div>
  )
}

export function PageErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  onBack,
}: {
  title?: string
  description: string
  onRetry?: () => void
  onBack?: () => void
}) {
  return (
    <div className={pageStateTokens.wrapper}>
      <div className={pageStateTokens.card}>
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-rose-600" />
          <div>
            <p className={pageStateTokens.title}>{title}</p>
            <p className={pageStateTokens.description}>{description}</p>
          </div>
        </div>
        {(onRetry || onBack) && (
          <div className="mt-4 flex gap-2">
            {onRetry ? <Button onClick={onRetry}>Retry</Button> : null}
            {onBack ? (
              <Button variant="outline" onClick={onBack}>
                Go Back
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export function PageEmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className={pageStateTokens.wrapper}>
      <div className={pageStateTokens.card}>
        <div className="flex items-start gap-3">
          <Inbox className="mt-0.5 h-5 w-5 text-slate-500" />
          <div>
            <p className={pageStateTokens.title}>{title}</p>
            <p className={pageStateTokens.description}>{description}</p>
          </div>
        </div>
        {actionLabel && onAction ? (
          <div className="mt-4">
            <Button onClick={onAction}>{actionLabel}</Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
