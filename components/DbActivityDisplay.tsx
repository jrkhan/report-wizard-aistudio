
import React from 'react';
import { ReportQuery } from '../types';
import { LoadingSpinner, CheckCircleIcon, XCircleIcon, CogIcon } from './icons';

export interface DbActivityInvocation {
  queries: ReportQuery[];
  paramValues: Record<string, any>;
  status: 'running' | 'success' | 'error';
  result: Record<string, any[] | { error: string }> | null;
}

interface DbActivityDisplayProps {
  invocation: DbActivityInvocation;
}

const DbActivityDisplay: React.FC<DbActivityDisplayProps> = ({ invocation }) => {
  if (!invocation) return null;

  return (
    <details open className="text-sm bg-gray-800/60 rounded-lg p-3 ring-1 ring-gray-700">
      <summary className="cursor-pointer text-gray-400 hover:text-white transition-colors flex items-center gap-2 font-medium">
        <CogIcon className="w-5 h-5" />
        <span>DB Activity</span>
      </summary>
      <div className="mt-3 pl-4 border-l-2 border-gray-600 space-y-3">
        {invocation.queries.map((query, index) => (
          <div key={index} className="bg-gray-900/50 p-3 rounded-md">
            <div className="flex items-center font-semibold text-gray-200">
                {invocation.status === 'running' && <div className="w-5 h-5 mr-2 flex items-center justify-center"><LoadingSpinner /></div>}
                <span className="font-mono text-cyan-400">{query.name}</span>
            </div>

            <div className="mt-2 pl-2 space-y-2">
                <div>
                    <strong className="text-gray-400">Query Template:</strong>
                    <pre className="text-sm text-yellow-300 overflow-x-auto bg-gray-900 p-2 rounded"><code>{query.sql}</code></pre>
                </div>
                <div>
                    <strong className="text-gray-400">Parameters Used:</strong>
                    <pre className="text-sm text-gray-300 overflow-x-auto bg-gray-900 p-2 rounded"><code>{JSON.stringify(
                        query.params.reduce((acc, p) => ({ ...acc, [p.name]: invocation.paramValues[p.name] }), {}),
                        null, 2
                    )}</code></pre>
                </div>
                {invocation.status !== 'running' && invocation.result && (
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <strong className="text-gray-400">Result</strong>
                            {invocation.status === 'success' && <CheckCircleIcon className="w-4 h-4"/>}
                            {invocation.status === 'error' && <XCircleIcon className="w-4 h-4"/>}
                        </div>
                        <pre className="bg-gray-900 p-2 rounded text-sm text-gray-300 max-h-40 overflow-y-auto"><code>{JSON.stringify(invocation.result[query.name] ?? invocation.result, null, 2)}</code></pre>
                    </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
};

export default DbActivityDisplay;
