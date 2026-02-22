"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { Search, X } from "lucide-react";

const BORDER = "rgba(0,0,0,0.12)";

type Owner = {
  id: number;
  name: string;
  owner_type?: string;
};

type OwnerSelectModalProps = {
  open: boolean;
  onClose: () => void;
  owners: Owner[];
  loading: boolean;
  title: string;
  placeholder?: string;
  onSelect: (owner: Owner) => void;
  fuzzyMatch?: (text: string, query: string) => boolean;
};

const defaultFuzzyMatch = (text: string, query: string): boolean => {
  if (!text || !query) return false;
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) queryIndex++;
  }
  return queryIndex === queryLower.length;
};

export function OwnerSelectModal({
  open,
  onClose,
  owners,
  loading,
  title,
  placeholder = "Search...",
  onSelect,
  fuzzyMatch = defaultFuzzyMatch,
}: OwnerSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [panelClosing, setPanelClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOwners = useMemo(() => {
    if (!searchQuery.trim()) return owners;
    return owners.filter((owner) => fuzzyMatch(owner.name, searchQuery));
  }, [owners, searchQuery, fuzzyMatch]);

  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setPanelClosing(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const handleClose = () => {
    setPanelClosing(true);
    setTimeout(() => {
      onClose();
      setPanelClosing(false);
    }, 350);
  };

  const handleSelect = (owner: Owner) => {
    onSelect(owner);
    handleClose();
  };

  if (!open && !panelClosing) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-[350ms] ${
          panelClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Side Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 w-full max-w-md h-screen bg-white z-50 flex flex-col rounded-md overflow-hidden shadow-xl"
        style={{
          animation: panelClosing
            ? "slideOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards"
            : "slideIn 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.15)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`Select ${title}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - matches page gradient */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] text-white">
          <h2 className="text-lg font-bold">Select {title}</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-md hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: BORDER }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border bg-white px-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7a0f1f]/20"
              style={{ borderColor: BORDER }}
            />
          </div>
        </div>

        {/* Owner list - scrollable */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Loading...
            </div>
          ) : filteredOwners.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              {searchQuery.trim()
                ? "No matches found"
                : `No ${title.toLowerCase()}s available`}
            </div>
          ) : (
            <div className="py-2">
              {filteredOwners.map((owner) => (
                <button
                  key={owner.id}
                  onClick={() => handleSelect(owner)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b last:border-b-0"
                  style={{ borderColor: BORDER }}
                >
                  <div className="font-medium text-neutral-900">{owner.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(100%);
          }
        }
      `}</style>
    </>
  );
}
