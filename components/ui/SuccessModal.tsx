"use client";

import React from "react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
  darkMode?: boolean;
}

export default function SuccessModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  buttonText = "OK",
  darkMode = false
}: SuccessModalProps) {
  if (!isOpen) return null;

  const BORDER = darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center px-4"
        onClick={onClose}
        style={{ background: darkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }}
      >
        <div className="relative">
          {/* Checkmark Circle - positioned above the card */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <svg 
                className="w-8 h-8 text-white"
                style={{ 
                  animation: "checkmark 0.5s ease-in-out",
                  animationFillMode: "both"
                }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            </div>
          </div>

          {/* Card */}
          <div
            className={`w-96 rounded-lg p-6 pt-12 shadow-xl border transition-colors duration-300 ${
              darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
            }`}
            style={{ borderColor: BORDER }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center">
              <div className={`text-lg font-bold text-center transition-colors duration-300 ${
                darkMode ? 'text-green-400' : 'text-[#5f0c18]'
              }`}>{title}</div>
              <div className={`mt-2 text-sm text-center transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-neutral-800'
              }`}>{message}</div>

              <button
                onClick={onClose}
                className={`mt-6 rounded-md px-6 py-2 text-sm font-semibold hover:opacity-95 transition-colors duration-300 ${
                  darkMode ? 'bg-green-600 hover:bg-green-700' : ''
                }`}
                style={{ 
                  background: darkMode ? undefined : "#7a0f1f", 
                  height: 40,
                  color: 'white'
                }}
              >
                {buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes checkmark {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes checkPath {
          0% {
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </>
  );
}
