'use client';

import { useRef } from 'react';

interface FileInputProps {
  accept?: string;
  onChange: (file: File | null) => void;
  required?: boolean;
  className?: string;
  buttonText: string;
  selectedFileName?: string;
}

export default function FileInput({ 
  accept, 
  onChange, 
  required = false, 
  className = '',
  buttonText,
  selectedFileName
}: FileInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  return (
    <div className="space-y-2">
      <div className="file-input-wrapper">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          required={required}
          className="hidden"
        />
        <button
          type="button"
          onClick={handleButtonClick}
          className={`file-input-button ${className}`}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {buttonText}
        </button>
      </div>
      
      {selectedFileName && (
        <p className="text-sm text-gray-600">
          {selectedFileName}
        </p>
      )}
    </div>
  );
}
