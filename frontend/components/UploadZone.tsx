"use client";

import { useState, useCallback, DragEvent, ChangeEvent } from "react";
import { FileUp, CheckCircle2 } from "lucide-react";

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
      className={`relative card border-2 border-dashed rounded-xl p-16 text-center transition-all duration-300 ${
        isDragOver
          ? "border-vigil-400 bg-vigil-50/50 shadow-glow-green"
          : "border-slate-200 hover:border-slate-300 bg-white"
      } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
    >
      {isLoading ? (
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-2 border-vigil-200 border-t-vigil-600 animate-spin mb-4" />
          <p className="text-base font-semibold text-slate-700">
            Processing receipt...
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Running 14-agent analysis pipeline
          </p>
        </div>
      ) : (
        <>
          {fileName ? (
            <CheckCircle2 className="w-12 h-12 text-vigil-500 mx-auto mb-4" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FileUp className="w-8 h-8 text-slate-400" />
            </div>
          )}
          <p className="text-lg font-medium text-slate-700">
            {fileName
              ? `Selected: ${fileName}`
              : "Drop your healthcare receipt here"}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Supports PNG, JPG, PDF (dental bills, pharmacy receipts)
          </p>
          <label className="mt-6 inline-block cursor-pointer">
            <span className="btn-primary">Choose File</span>
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
