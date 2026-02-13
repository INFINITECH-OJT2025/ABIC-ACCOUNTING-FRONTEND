"use client";

import React from "react";

interface LoadingModalProps {
  isOpen: boolean;
  title: string;
  message: string;
}

const BORDER = "rgba(0,0,0,0.12)";

export default function LoadingModal({ 
  isOpen, 
  title, 
  message
}: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: "rgba(0,0,0,0.45)" }}
      >
        <div className="relative">
          {/* Loading Circle - positioned above the card */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
            <div className="w-16 h-16 bg-[#7a0f1f] rounded-full flex items-center justify-center shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          </div>

          {/* Card */}
          <div
            className="w-full max-w-sm rounded-lg bg-white p-6 pt-12 shadow-xl border"
            style={{ borderColor: BORDER }}
          >
            <div className="flex flex-col items-center">
              <div className="text-lg font-bold text-[#5f0c18] text-center">{title}</div>
              <div className="mt-2 text-sm text-neutral-800 text-center">{message}</div>

              <div className="mt-4 text-xs text-gray-500 text-center">
                Please wait while we process your request...
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
