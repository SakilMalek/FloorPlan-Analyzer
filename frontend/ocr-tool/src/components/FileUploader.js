
// frontend/src/components/FileUploader.js

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

const FileUploader = ({ onFileSelect, file }) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg'], 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors duration-200 ease-in-out
      ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center">
        <UploadCloud className="h-12 w-12 text-gray-400 mb-4" />
        {file ? (
          <>
            <p className="font-semibold text-gray-700">File selected:</p>
            <p className="text-sm text-blue-600">{file.name}</p>
          </>
        ) : (
          <>
            <p className="font-semibold text-gray-700">Drag & drop a floorplan here, or click to select</p>
            <p className="text-sm text-gray-500">Supports: JPG, PNG, PDF</p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUploader;