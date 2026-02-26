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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[520px] rounded-2xl border border-[#E9B8C4] bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.18)]">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-[#E11D48]">
            <TriangleAlert className="h-6 w-6" />
          </div>
          <AlertDialogTitle className="text-left text-3xl font-semibold tracking-tight text-slate-900">Unsaved Changes Detected</AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-left text-lg text-slate-500">
            You have unsaved changes. You can save first, or continue without saving.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-8 flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AlertDialogCancel
            className="h-12 rounded-none border border-slate-300 px-6 font-semibold text-slate-700 hover:bg-slate-100"
            onClick={onStay}
          >
            Stay
          </AlertDialogCancel>
          <AlertDialogAction
            className="h-12 rounded-none bg-[#A4163A] px-6 font-semibold text-white hover:bg-[#8C1231]"
            onClick={onProceedWithoutSaving}
          >
            Proceed Without Saving
          </AlertDialogAction>
          <AlertDialogAction
            className="h-12 rounded-none bg-[#B10F1F] px-6 font-semibold text-white hover:bg-[#950D1A]"
            onClick={onSaveAndContinue}
          >
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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[520px] rounded-2xl border border-[#E9B8C4] bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.18)]">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-[#E11D48]">
            <TriangleAlert className="h-6 w-6" />
          </div>
          <AlertDialogTitle className="text-left text-3xl font-semibold tracking-tight text-slate-900">Delete this task?</AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-left text-lg text-slate-500">
            This task will be removed from the current checklist.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-8 flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AlertDialogCancel onClick={onCancel} className="h-12 rounded-none border border-slate-300 px-6 font-semibold text-slate-700 hover:bg-slate-100">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction className="h-12 rounded-none bg-[#B10F1F] px-6 font-semibold text-white hover:bg-[#950D1A]" onClick={onDelete}>
            Delete Task
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
