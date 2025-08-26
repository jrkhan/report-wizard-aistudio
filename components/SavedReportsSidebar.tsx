
import React from 'react';
import { SavedReport } from '../types';
import { TrashIcon } from './icons';

interface SavedReportsSidebarProps {
  isOpen: boolean;
  reports: SavedReport[];
  onLoadReport: (report: SavedReport) => void;
  onDeleteReport: (id: number) => void;
  onCreateNew: () => void;
  onEditReport: (report: SavedReport) => void;
}

const SavedReportsSidebar: React.FC<SavedReportsSidebarProps> = ({ isOpen, reports, onLoadReport, onDeleteReport, onCreateNew, onEditReport }) => {
  return (
    <aside className={`absolute md:fixed top-0 left-0 h-full w-72 bg-gray-800/70 backdrop-blur-md border-r border-gray-700 flex flex-col flex-shrink-0 z-20 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-4 border-b border-gray-700 mt-16">
        <button
          onClick={onCreateNew}
          className="w-full px-4 py-2 bg-cyan-600 rounded-md text-white font-semibold hover:bg-cyan-500 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75"
        >
          + Create New Report
        </button>
      </div>
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Saved Reports</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {reports.length === 0 ? (
          <p className="p-4 text-gray-400 text-sm italic">No reports saved yet.</p>
        ) : (
          <ul className="divide-y divide-gray-700">
            {reports.map((report) => (
              <li key={report.id} className="p-3 hover:bg-gray-700/50 group transition-colors duration-150">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <h3 className="font-semibold text-gray-200 text-sm truncate">{report.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteReport(report.id); }}
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    aria-label="Delete report"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-3 flex items-center space-x-2">
                   <button 
                    onClick={() => onLoadReport(report)}
                    className="flex-1 text-left text-sm text-cyan-400 hover:text-cyan-300 font-medium"
                   >
                    View Report
                   </button>
                   <button 
                    onClick={() => onEditReport(report)}
                    className="flex-1 text-right text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                   >
                    Edit
                   </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default SavedReportsSidebar;
