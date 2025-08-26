
import React, { useState, useEffect, useCallback } from 'react';
import SavedReportsSidebar from './components/SavedReportsSidebar';
import SaveReportModal from './components/SaveReportModal';
import ConfirmModal from './components/ConfirmModal';
import { BotIcon, MenuIcon } from './components/icons';
import { ChatMessage, SavedReport, Report } from './types';
import * as db from './services/reportDb';
import ReportViewer from './components/ReportViewer';
import ReportEditor from './components/ReportEditor';
import { SEED_REPORTS } from './services/seedData';

type ViewMode = 'editor' | 'viewer';

const App: React.FC = () => {
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  
  // State for which report is being viewed or edited
  const [activeReport, setActiveReport] = useState<SavedReport | null>(null);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modal states
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [reportToSave, setReportToSave] = useState<{ message: ChatMessage, isEditing: boolean } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reportIdToDelete, setReportIdToDelete] = useState<number | null>(null);

  const refreshReports = useCallback(async () => {
    try {
      const reports = await db.getAllReports();
      setSavedReports(reports);
    } catch (error) {
      console.error("Could not refresh reports:", error);
    }
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const reports = await db.getAllReports();
        if (reports.length === 0) {
          console.log("Database is empty. Seeding with example reports...");
          for (const reportSeed of SEED_REPORTS) {
            await db.addReport(reportSeed.title, reportSeed.message);
          }
        }
      } catch (error) {
        console.error("Error during database check/seed:", error);
      } finally {
        refreshReports();
      }
    };
    initializeApp();
  }, [refreshReports]);

  const handleCreateNewReport = useCallback(() => {
    setActiveReport(null);
    setViewMode('editor');
  }, []);

  const handleEditReport = useCallback((report: SavedReport) => {
    setActiveReport(report);
    setViewMode('editor');
  }, []);
  
  const handleLoadReport = useCallback((report: SavedReport) => {
    setActiveReport(report);
    setViewMode('viewer');
  }, []);

  // --- Save/Update Report Logic ---
  const handleSaveRequest = useCallback((message: ChatMessage) => {
    setReportToSave({ message, isEditing: !!activeReport });
    setIsSaveModalOpen(true);
  }, [activeReport]);

  const handleConfirmSaveReport = useCallback(async (title: string) => {
    if (reportToSave) {
      if (activeReport && reportToSave.isEditing) {
        // This is an update
        await db.updateReport(activeReport.id, title, reportToSave.message);
      } else {
        // This is a new report
        await db.addReport(title, reportToSave.message);
      }
      await refreshReports();
    }
    setIsSaveModalOpen(false);
    setReportToSave(null);
  }, [reportToSave, activeReport, refreshReports]);

  const handleCancelSave = useCallback(() => {
    setIsSaveModalOpen(false);
    setReportToSave(null);
  }, []);
  
  // --- Delete Report Logic ---
  const handleDeleteReport = useCallback((id: number) => {
    setReportIdToDelete(id);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDeleteReport = useCallback(async () => {
    if (reportIdToDelete !== null) {
      await db.deleteReport(reportIdToDelete);
      await refreshReports();
      if (activeReport?.id === reportIdToDelete) {
        handleCreateNewReport();
      }
    }
    setIsDeleteModalOpen(false);
    setReportIdToDelete(null);
  }, [reportIdToDelete, refreshReports, activeReport, handleCreateNewReport]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteModalOpen(false);
    setReportIdToDelete(null);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 flex items-center shadow-lg z-30">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="mr-3 p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors">
            <MenuIcon className="w-6 h-6" />
        </button>
        <BotIcon className="w-8 h-8 mr-3 text-cyan-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Gemini SQL Charting Chatbot</h1>
          <p className="text-sm text-gray-400">Powered by Gemini 2.5 Flash & D3.js</p>
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden relative">
        <SavedReportsSidebar 
            isOpen={isSidebarOpen}
            reports={savedReports} 
            onLoadReport={handleLoadReport} 
            onDeleteReport={handleDeleteReport}
            onCreateNew={handleCreateNewReport}
            onEditReport={handleEditReport}
        />
        <main className={`flex-1 overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-72' : 'ml-0'}`}>
          {viewMode === 'editor' ? (
             <ReportEditor
                key={activeReport?.id ?? 'new-report'}
                initialMessage={activeReport?.message ?? null}
                onSave={handleSaveRequest}
              />
          ) : activeReport ? (
            <ReportViewer report={activeReport} />
          ) : (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                <p>Select a report to view, or create a new one.</p>
            </div>
          )}
        </main>
      </div>

      <SaveReportModal 
        isOpen={isSaveModalOpen}
        onSave={handleConfirmSaveReport}
        onCancel={handleCancelSave}
        isEditing={reportToSave?.isEditing ?? false}
        initialTitle={activeReport?.title}
      />
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Report"
        message="Are you sure you want to permanently delete this report?"
        onConfirm={handleConfirmDeleteReport}
        onCancel={handleCancelDelete}
        confirmText="Delete"
      />
    </div>
  );
};

export default App;
