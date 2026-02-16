"use client";

import React from "react";

interface LoadingModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  darkMode?: boolean;
}

export default function LoadingModal({ 
  isOpen, 
  title, 
  message,
  darkMode = false
}: LoadingModalProps) {
  if (!isOpen) return null;

  const BORDER = darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: darkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }}
      >
        <div className="relative">
          {/* Loading Circle - positioned above the card */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 ${
              darkMode ? 'bg-[#7B0F2B]' : 'bg-[#7a0f1f]'
            }`}>
              <div className={`animate-spin rounded-full h-8 w-8 ${
                darkMode ? 'border-b-2 border-gray-200' : 'border-b-2 border-white'
              }`}></div>
            </div>
          </div>

          {/* Card */}
          <div
            className={`w-96 rounded-lg p-6 pt-12 shadow-xl border transition-colors duration-300 ${
              darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
            }`}
            style={{ borderColor: BORDER }}
          >
            <div className="flex flex-col items-center">
              <div className={`text-lg font-bold text-center transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-[#5f0c18]'
              }`}>{title}</div>
              <div className={`mt-2 text-sm text-center transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-neutral-800'
              }`}>{message}</div>

              <div className={`mt-4 text-xs text-center transition-colors duration-300 ${
                darkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                Please wait while we process your request...
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
