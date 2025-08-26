
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SavedReport } from '../types';
import ReportRenderer from './ReportRenderer';
import ParameterForm from './ParameterForm';
import { executeParameterizedQueries } from '../services/databaseService';
import { LoadingSpinner } from './icons';
import DbActivityDisplay, { DbActivityInvocation } from './DbActivityDisplay';

interface ReportViewerProps {
  report: SavedReport;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ report }) => {
  const { message } = report;
  const isInteractive = useMemo(() => !!message.report?.queries && message.report.queries.length > 0, [message.report]);
  
  // State for interactive reports
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [reportData, setReportData] = useState<Record<string, any[]> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastInvocation, setLastInvocation] = useState<DbActivityInvocation | null>(null);

  // Initialize parameter values from their defaults in the report definition
  useEffect(() => {
    if (isInteractive && message.report?.queries) {
      const initialParams: Record<string, any> = {};
      message.report.queries.forEach(q => {
        q.params.forEach(p => {
          if (p.defaultValue !== undefined) {
            initialParams[p.name] = p.defaultValue;
          }
        });
      });
      setParamValues(initialParams);
    }
    // Reset state when report changes
    setReportData(null); 
    setIsLoading(false);
    setLastInvocation(null);
  }, [report.id, isInteractive, message.report?.queries]);

  const handleRunReport = useCallback(async () => {
    if (!message.report?.queries) return;
    setIsLoading(true);

    const invocation: DbActivityInvocation = {
        queries: message.report.queries,
        paramValues,
        status: 'running',
        result: null,
    };
    setLastInvocation(invocation);

    try {
      const data = await executeParameterizedQueries(message.report.queries, paramValues);
      setReportData(data);
      setLastInvocation({ ...invocation, status: 'success', result: data });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      console.error("Failed to run parameterized report", error);
      const errorResult = message.report.queries.reduce((acc, query) => {
        acc[query.name] = { error: errorMessage };
        return acc;
      }, {} as Record<string, { error: string }>);
      setLastInvocation({ ...invocation, status: 'error', result: errorResult });
    } finally {
      setIsLoading(false);
    }
  }, [message.report?.queries, paramValues]);

  // Use the newly fetched data if available, otherwise fall back to the original data from the tool call
  const dataForRenderer = reportData ?? message.toolCalls?.find(tc => tc.status === 'success')?.result;

  return (
    <div className="flex flex-col h-full bg-gray-900 overflow-y-auto">
      <div className="p-4 border-b border-gray-700 bg-gray-800/70 sticky top-0 z-10">
        <h2 className="text-xl font-bold text-white">{report.title}</h2>
        <p className="text-sm text-gray-400">Saved on {new Date(report.createdAt).toLocaleString()}</p>
      </div>
      <div className="flex-1 p-4 space-y-4">
        {isInteractive && message.report?.queries && (
            <div className="bg-gray-800/50 p-4 rounded-lg ring-1 ring-gray-700">
                <h3 className="text-lg font-semibold mb-3 text-gray-200">Report Parameters</h3>
                <ParameterForm queries={message.report.queries} values={paramValues} onChange={setParamValues} />
                <div className="mt-4">
                    <button 
                        onClick={handleRunReport}
                        disabled={isLoading}
                        className="px-4 py-2 bg-cyan-600 rounded-md text-white font-semibold hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-wait transition-colors"
                    >
                        {isLoading ? <div className="flex items-center gap-2"><LoadingSpinner/> Running...</div> : 'Run Report'}
                    </button>
                </div>
            </div>
        )}

        {lastInvocation && (
            <DbActivityDisplay invocation={lastInvocation} />
        )}
        
        {message.report && (
          <div className="bg-gray-800/50 p-4 rounded-lg ring-1 ring-gray-700">
            <ReportRenderer report={message.report} data={dataForRenderer} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportViewer;