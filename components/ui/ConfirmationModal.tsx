"use client";

import React from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  darkMode?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  darkMode = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const BORDER = darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onClick={onClose}
      style={{ background: darkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }}
    >
      <div className="relative">
        <div
          className={`w-96 rounded-lg p-6 shadow-xl border transition-colors duration-300 ${
            darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
          }`}
          style={{ borderColor: BORDER }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col">
            <div
              className={`text-lg font-bold transition-colors duration-300 ${
                darkMode ? "text-white" : "text-[#5f0c18]"
              }`}
            >
              {title}
            </div>
            <div
              className={`mt-2 text-sm transition-colors duration-300 ${
                darkMode ? "text-gray-300" : "text-neutral-800"
              }`}
            >
              {message}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: BORDER, color: darkMode ? "#fff" : "#111", height: 40 }}
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#7a0f1f", height: 40 }}
              >
                {isLoading ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 align-middle" />
                    Processing...
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
