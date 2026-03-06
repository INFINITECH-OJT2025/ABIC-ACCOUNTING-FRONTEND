"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TriangleAlert } from "lucide-react"
import { useRef } from "react"
import { buttonTokens, modalTokens } from "@/lib/ui/tokens"

type UnsavedChangesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStay: () => void
  onProceedWithoutSaving: () => void
  onSaveAndContinue: () => void
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onStay,
  onProceedWithoutSaving,
  onSaveAndContinue,
}: UnsavedChangesDialogProps) {
  const titleRef = useRef<HTMLHeadingElement | null>(null)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={modalTokens.container}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          titleRef.current?.focus()
        }}
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        <AlertDialogHeader>
          <div className={modalTokens.iconWrap}>
            <TriangleAlert className="h-6 w-6" />
          </div>
          <AlertDialogTitle ref={titleRef} tabIndex={-1} className={modalTokens.title}>
            Unsaved Changes Detected
          </AlertDialogTitle>
          <AlertDialogDescription className={modalTokens.description}>
            You have unsaved changes. You can save first, or continue without saving.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={modalTokens.footer}>
          <AlertDialogCancel className={buttonTokens.neutral} onClick={onStay}>
            Stay
          </AlertDialogCancel>
          <AlertDialogAction className={buttonTokens.primary} onClick={onProceedWithoutSaving}>
            Proceed Without Saving
          </AlertDialogAction>
          <AlertDialogAction className={buttonTokens.danger} onClick={onSaveAndContinue}>
            Save and Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

type DeleteTaskDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancel: () => void
  onDelete: () => void
}

export function DeleteTaskDialog({
  open,
  onOpenChange,
  onCancel,
  onDelete,
}: DeleteTaskDialogProps) {
  const titleRef = useRef<HTMLHeadingElement | null>(null)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className={modalTokens.container}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          titleRef.current?.focus()
        }}
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        <AlertDialogHeader>
          <div className={modalTokens.iconWrap}>
            <TriangleAlert className="h-6 w-6" />
          </div>
          <AlertDialogTitle ref={titleRef} tabIndex={-1} className={modalTokens.title}>
            Delete this task?
          </AlertDialogTitle>
          <AlertDialogDescription className={modalTokens.description}>
            This task will be removed from the current checklist.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={modalTokens.footer}>
          <AlertDialogCancel onClick={onCancel} className={buttonTokens.neutral}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction className={buttonTokens.danger} onClick={onDelete}>
            Delete Task
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
