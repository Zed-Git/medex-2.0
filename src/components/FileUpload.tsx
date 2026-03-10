"use client";

import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, FileWarning } from 'lucide-react'; // Uklonjen neiskorišćeni 'X'

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setError(null);
    if (file.size > 10 * 1024 * 1024) {
      setError("File is too large. Maximum size is 10MB.");
      return;
    }
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full space-y-2">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]);
        }}
        className={`
          relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 cursor-pointer
          flex flex-col items-center justify-center gap-3
          ${isDragging ? 'border-[#2E5481] bg-blue-50' : 'border-slate-200 hover:border-[#2E5481] hover:bg-slate-50'}
          ${selectedFile ? 'border-green-500 bg-green-50' : ''}
          ${error ? 'border-red-500 bg-red-50' : ''}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*,application/pdf"
          className="hidden"
        />

        {!selectedFile ? (
          <>
            <div className="p-3 bg-[#2E5481]/10 rounded-full text-[#2E5481]">
              <Upload size={24} />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-700 uppercase italic">Click to Upload Clinical Data</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Images, Videos or PDF Documents</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 animate-in zoom-in duration-300">
            <CheckCircle2 size={32} className="text-green-500" />
            <div className="text-center">
              <p className="text-xs font-bold text-slate-800">{selectedFile.name}</p>
              <p className="text-[10px] text-slate-500 uppercase">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); onFileSelect(null); }}
              className="text-[10px] font-black text-red-500 underline uppercase"
            >
              Remove File
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-[10px] flex items-center gap-1 font-bold uppercase italic"><FileWarning size={12} /> {error}</p>}
    </div>
  );
};