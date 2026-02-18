"use client";

import React from "react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
}

const BORDER = "rgba(0,0,0,0.12)";

export default function SuccessModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  buttonText = "OK" 
}: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        onClick={onClose}
        style={{ background: "rgba(0,0,0,0.45)" }}
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
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M5 13l4 4L19 7"
                  style={{
                    strokeDasharray: "100",
                    strokeDashoffset: "100",
                    animation: "checkPath 0.5s ease-in-out 0.2s forwards"
                  }}
                />
              </svg>
            </div>
          </div>

          {/* Card */}
          <div
            className="w-full max-w-sm rounded-lg bg-white p-6 pt-12 shadow-xl border"
            style={{ borderColor: BORDER }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center">
              <div className="text-lg font-bold text-[#5f0c18] text-center">{title}</div>
              <div className="mt-2 text-sm text-neutral-800 text-center">{message}</div>

              <button
                onClick={onClose}
                className="mt-6 rounded-md px-6 py-2 text-sm font-semibold text-white hover:opacity-95"
                style={{ background: "#7a0f1f", height: 40 }}
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