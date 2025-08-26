import React from 'react';
import { ToolCall } from '../types';
import { LoadingSpinner, CheckCircleIcon, XCircleIcon, CogIcon } from './icons';

interface ToolCallDisplayProps {
  toolCalls: ToolCall[];
  isExpandedDefault?: boolean;
}

const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({ toolCalls, isExpandedDefault = false }) => {
    if (!toolCalls || toolCalls.length === 0) {
        return null;
    }

    const renderArguments = (args: any) => {
        if (typeof args === 'object' && args !== null && Array.isArray(args.queries)) {
            return (
                <div className="space-y-2">
                    {args.queries.map((q: {name: string, query: string}, index: number) => (
                        <div key={index} className="bg-gray-900 p-2 rounded">
                            <strong className="text-gray-400 font-mono">{q.name}</strong>
                            <pre className="text-sm text-yellow-300 overflow-x-auto"><code>{q.query}</code></pre>
                        </div>
                    ))}
                </div>
            )
        }
        return <pre className="bg-gray-900 p-2 rounded text-sm text-gray-300 overflow-x-auto"><code>{JSON.stringify(args, null, 2)}</code></pre>;
    };
    
    return (
        <details open={isExpandedDefault} className="mt-4 text-sm bg-gray-800/60 rounded-lg p-3 ring-1 ring-gray-700">
            <summary className="cursor-pointer text-gray-400 hover:text-white transition-colors flex items-center gap-2 font-medium">
                <CogIcon className="w-5 h-5" />
                <span>Tool Activity</span>
            </summary>
            <div className="mt-3 pl-4 border-l-2 border-gray-600 space-y-3">
                {toolCalls.map((call, index) => (
                    <div key={index} className="bg-gray-900/50 p-3 rounded-md">
                        <div className="flex items-center font-semibold text-gray-200">
                            {call.status === 'running' && <div className="w-5 h-5 mr-2 flex items-center justify-center"><LoadingSpinner /></div>}
                            <span className="font-mono text-cyan-400">{call.name}</span>
                        </div>
                        <div className="mt-2 pl-2">
                            <strong className="text-gray-400">Arguments:</strong>
                            {renderArguments(call.args)}
                        </div>
                        {call.status !== 'running' && call.result && (
                            <div className="mt-2 pl-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <strong className="text-gray-400">Result</strong>
                                    {call.status === 'success' && <CheckCircleIcon className="w-4 h-4"/>}
                                    {call.status === 'error' && <XCircleIcon className="w-4 h-4"/>}
                                </div>
                                <pre className="bg-gray-900 p-2 rounded text-sm text-gray-300 max-h-40 overflow-y-auto"><code>{JSON.stringify(call.result, null, 2)}</code></pre>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </details>
    );
};

export default ToolCallDisplay;
