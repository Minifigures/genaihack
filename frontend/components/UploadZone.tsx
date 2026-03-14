"use client";

import { useState, useCallback, DragEvent, ChangeEvent } from "react";

interface UploadZoneProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

export function UploadZone({ onUpload, isLoading }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        setFileName(file.name);
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFileName(file.name);
        onUpload(file);
      }
    },
    [onUpload]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
        isDragOver
          ? "border-vigil-500 bg-vigil-50"
          : "border-gray-300 hover:border-gray-400 bg-white"
      } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
    >
      {isLoading ? (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vigil-600 mb-4" />
          <p className="text-lg font-medium text-gray-700">
            Processing receipt...
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Running 14-agent analysis pipeline
          </p>
        </div>
      ) : (
        <>
          <div className="text-4xl mb-4">
            {fileName ? "\u2705" : "\uD83D\uDCC4"}
          </div>
          <p className="text-lg font-medium text-gray-700">
            {fileName
              ? `Selected: ${fileName}`
              : "Drop your healthcare receipt here"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Supports PNG, JPG, PDF (dental bills, pharmacy receipts)
          </p>
          <label className="mt-4 inline-block cursor-pointer">
            <span className="bg-vigil-600 text-white px-6 py-2 rounded-lg hover:bg-vigil-700 transition-colors text-sm font-medium">
              Choose File
            </span>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </>
      )}
    </div>
  );
}
