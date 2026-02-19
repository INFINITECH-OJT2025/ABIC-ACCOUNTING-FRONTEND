"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, HelpCircle, AlertTriangle } from "lucide-react"

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "success" | "warning"
  isLoading?: boolean
  hideCancel?: boolean
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
  hideCancel = false,
}: ConfirmationModalProps) {
  const getIcon = () => {
    switch (variant) {
      case "destructive":
        return <AlertCircle className="h-6 w-6 text-red-600" />
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-amber-500" />
      case "success":
        return <CheckCircle2 className="h-6 w-6 text-emerald-500" />
      default:
        return <HelpCircle className="h-6 w-6 text-blue-500" />
    }
  }

  const getButtonClass = () => {
    switch (variant) {
      case "destructive":
        return "bg-red-600 hover:bg-red-700 text-white"
      case "success":
        return "bg-emerald-600 hover:bg-emerald-700 text-white"
      case "warning":
        return "bg-amber-500 hover:bg-amber-600 text-white"
      default:
        return "bg-[#630C22] hover:bg-[#4A081A] text-white"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-0 shadow-2xl p-0 overflow-hidden">
        <div className={`h-2 w-full ${variant === 'destructive' ? 'bg-red-600' : variant === 'success' ? 'bg-emerald-600' : variant === 'warning' ? 'bg-amber-500' : 'bg-[#630C22]'}`} />
        
        <div className="p-6">
          <DialogHeader className="flex flex-row items-center gap-4 space-y-0 text-left">
            <div className={`p-2 rounded-full ${variant === 'destructive' ? 'bg-red-50' : variant === 'success' ? 'bg-emerald-50' : variant === 'warning' ? 'bg-amber-50' : 'bg-blue-50'}`}>
              {getIcon()}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">{title}</DialogTitle>
              <DialogDescription className="text-slate-500 mt-1 whitespace-pre-wrap">
                {description}
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogFooter className="mt-8 flex flex-row justify-end gap-3 sm:gap-3">
            {!hideCancel && (
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 sm:flex-none border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl px-6"
              >
                {cancelText}
              </Button>
            )}
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 sm:flex-none rounded-xl px-6 font-bold shadow-md transition-all ${getButtonClass()}`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                confirmText
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
