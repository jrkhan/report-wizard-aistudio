
import React, { useState, useEffect } from 'react';

interface SaveReportModalProps {
  isOpen: boolean;
  onSave: (title: string) => void;
  onCancel: () => void;
  isEditing: boolean;
  initialTitle?: string;
}

const SaveReportModal: React.FC<SaveReportModalProps> = ({ isOpen, onSave, onCancel, isEditing, initialTitle }) => {
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(isEditing ? initialTitle ?? '' : 'My New Report');
    }
  }, [isOpen, isEditing, initialTitle]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    if (title.trim()) {
      onSave(title.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };
  
  const modalTitle = isEditing ? "Update Report Title" : "Save Report";
  const buttonText = isEditing ? "Update" : "Save";

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md ring-1 ring-gray-700"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <h2 className="text-xl font-bold text-white mb-4">{modalTitle}</h2>
        <p className="text-gray-400 mb-4">Enter a title for your report.</p>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full p-3 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-100 placeholder-gray-400"
          autoFocus
          onFocus={e => e.target.select()}
        />
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 rounded-md text-white hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-4 py-2 bg-cyan-600 rounded-md text-white hover:bg-cyan-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveReportModal;
