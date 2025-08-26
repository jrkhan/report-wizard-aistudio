
import React, { useState, useEffect, useCallback } from 'react';
import { ChatMessage, Report, ChatRole, ToolCall } from '../types';
import * as geminiService from '../services/geminiService';
import * as dbService from '../services/databaseService';
import ChatMessageComponent from './ChatMessage';
import ReportRenderer from './ReportRenderer';
import ParameterForm from './ParameterForm';
import { SendIcon, LoadingSpinner, SaveIcon } from './icons';

interface ReportEditorProps {
    initialMessage: ChatMessage | null;
    onSave: (message: ChatMessage) => void;
}

const EMPTY_REPORT: Report = {
    markdown: "### New Report\n\nYour report will appear here. Start by giving the AI a prompt below.",
    charts: [],
    queries: [],
};

const EMPTY_MESSAGE: ChatMessage = {
    id: 'draft',
    role: ChatRole.BOT,
    report: EMPTY_REPORT,
    toolCalls: [],
};

type EditorTab = 'markdown' | 'charts' | 'queries';

const ReportEditor: React.FC<ReportEditorProps> = ({ initialMessage, onSave }) => {
    const [draftMessage, setDraftMessage] = useState<ChatMessage>(initialMessage || EMPTY_MESSAGE);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<EditorTab>('markdown');
    
    // State for live preview data
    const [queryData, setQueryData] = useState<Record<string, any[]> | null>(
        initialMessage?.toolCalls?.find(tc => tc.status === 'success')?.result ?? null
    );
    // State for interactive parameter values
    const [paramValues, setParamValues] = useState<Record<string, any>>({});

    // Effect to initialize parameters when the report definition changes
    useEffect(() => {
        const initialParams: Record<string, any> = {};
        draftMessage.report?.queries?.forEach(q => {
            q.params.forEach(p => {
                if (p.defaultValue !== undefined) {
                    initialParams[p.name] = p.defaultValue;
                }
            });
        });
        setParamValues(initialParams);
    }, [draftMessage.report?.queries]);

    const handleRunReport = useCallback(async () => {
        const queries = draftMessage.report?.queries;
        if (!queries || queries.length === 0) return;
        
        setIsLoading(true);
        try {
            const hasParams = queries.some(q => q.params && q.params.length > 0);
            let data;
            if (hasParams) {
                data = await dbService.executeParameterizedQueries(queries, paramValues);
            } else {
                const rawQueries = queries.map(q => ({ name: q.name, query: q.sql }));
                data = await dbService.executeRawQueries(rawQueries);
            }
            setQueryData(data);
        } catch(e) {
            console.error("Failed to run report in editor", e);
        } finally {
            setIsLoading(false);
        }
    }, [draftMessage.report?.queries, paramValues]);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        const userMessage: ChatMessage = { id: Date.now().toString(), role: ChatRole.USER, text };
        setChatHistory(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const isCreating = chatHistory.length === 0 && (!initialMessage || initialMessage.report?.markdown.includes("New Report"));

            if (isCreating) {
                const loadingMessage: ChatMessage = { id: 'loading', role: ChatRole.BOT, isLoading: true, toolCalls: [] };
                setChatHistory(prev => [...prev, loadingMessage]);

                const handleStatusUpdate: geminiService.StatusUpdateCallback = (update) => {
                    setChatHistory(prev => prev.map(msg => msg.id === 'loading' ? { ...msg, toolCalls: update.toolCalls } : msg));
                };

                const response = await geminiService.getBotResponse([userMessage], handleStatusUpdate);
                
                const botMessage: ChatMessage = { id: Date.now().toString(), role: ChatRole.BOT, text: response.text, toolCalls: response.toolCalls };
                setChatHistory(prev => [...prev.filter(m => m.id !== 'loading'), botMessage]);

                if (response.report) {
                    const newDraftMessage = { ...draftMessage, report: response.report, toolCalls: response.toolCalls ?? [] };
                    setDraftMessage(newDraftMessage);
                    const resultData = response.toolCalls?.find(tc => tc.status === 'success')?.result;
                    if (resultData) setQueryData(resultData);
                }
            } else {
                const currentReport = draftMessage.report;
                if (!currentReport) return;

                const newReport = await geminiService.getAiAssistedEdit(currentReport, text);
                const botMessage: ChatMessage = { id: Date.now().toString(), role: ChatRole.BOT, text: "I've updated the report definition based on your request." };
                setChatHistory(prev => [...prev, botMessage]);
                setDraftMessage(prev => ({ ...prev, report: newReport }));
            }
        } catch (e) {
            console.error("Failed to get response in editor", e);
            const errorMsg: ChatMessage = { id: Date.now().toString(), role: ChatRole.BOT, text: "Sorry, I encountered an error." };
            setChatHistory(prev => prev.filter(m => m.id !== 'loading'));
            setChatHistory(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    }, [chatHistory, draftMessage, initialMessage]);
    
    // Manual Code Editing Handlers
    const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!draftMessage.report) return;
        const newReport = { ...draftMessage.report, markdown: e.target.value };
        setDraftMessage({ ...draftMessage, report: newReport });
    };

    const handleD3CodeChange = (index: number, code: string) => {
        if (!draftMessage.report) return;
        const newCharts = [...draftMessage.report.charts];
        newCharts[index] = { ...newCharts[index], code };
        const newReport = { ...draftMessage.report, charts: newCharts };
        setDraftMessage({ ...draftMessage, report: newReport });
    };

    const handleQueryChange = (index: number, field: 'sql' | 'name', value: string) => {
         if (!draftMessage.report?.queries) return;
         const newQueries = [...draftMessage.report.queries];
         newQueries[index] = { ...newQueries[index], [field]: value };
         const newReport = { ...draftMessage.report, queries: newQueries };
         setDraftMessage({ ...draftMessage, report: newReport });
    };

    const isInteractive = !!draftMessage.report?.queries?.some(q => q.params.length > 0);

    return (
        <div className="flex h-full bg-gray-900 text-sm">
            {/* Left Panel: Chat */}
            <div className="w-1/3 flex flex-col border-r border-gray-700">
                <div className="p-3 border-b border-gray-700 bg-gray-800/50">
                    <h2 className="font-bold text-white">AI Assistant</h2>
                    <p className="text-xs text-gray-400">Prompt the AI to create or edit the report.</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {chatHistory.map(msg => <ChatMessageComponent key={msg.id} message={msg} />)}
                </div>
                <ChatInput onSubmit={sendMessage} isLoading={isLoading} />
            </div>

            {/* Middle Panel: Code Editor */}
            <div className="w-1/3 flex flex-col border-r border-gray-700">
                <div className="flex items-center p-2 border-b border-gray-700 bg-gray-800/50 space-x-1">
                    <TabButton name="Markdown" activeTab={activeTab} onClick={() => setActiveTab('markdown')} />
                    <TabButton name="Charts" activeTab={activeTab} onClick={() => setActiveTab('charts')} />
                    <TabButton name="Queries" activeTab={activeTab} onClick={() => setActiveTab('queries')} />
                </div>
                <div className="flex-1 overflow-y-auto p-2 bg-gray-900/50">
                    {activeTab === 'markdown' && draftMessage.report && (
                        <CodeTextArea value={draftMessage.report.markdown} onChange={handleMarkdownChange} />
                    )}
                    {activeTab === 'charts' && draftMessage.report?.charts.map((chart, i) => (
                        <div key={i} className="mb-2">
                           <label className="block text-xs font-medium text-gray-400 mb-1">Chart: {chart.id} (data: {chart.dataKey})</label>
                           <CodeTextArea value={chart.code} onChange={e => handleD3CodeChange(i, e.target.value)} />
                        </div>
                    ))}
                    {activeTab === 'queries' && draftMessage.report?.queries?.map((query, i) => (
                        <div key={i} className="mb-2">
                            <label className="block text-xs font-medium text-gray-400 mb-1">Query: {query.name}</label>
                            <CodeTextArea value={query.sql} onChange={e => handleQueryChange(i, 'sql', e.target.value)} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel: Preview & Actions */}
            <div className="w-1/3 flex flex-col">
                <div className="p-3 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
                    <div>
                        <h2 className="font-bold text-white">Live Preview</h2>
                        <p className="text-xs text-gray-400">Updates as you edit.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                         <button
                            onClick={handleRunReport}
                            disabled={isLoading}
                            className="px-3 py-1 bg-indigo-600 rounded text-white text-xs font-semibold hover:bg-indigo-500 disabled:bg-gray-600"
                        >
                            {isLoading ? 'Running...' : 'Run Report'}
                        </button>
                        <button
                            onClick={() => onSave(draftMessage)}
                            className="flex items-center gap-2 px-3 py-1 bg-cyan-600 rounded text-white text-xs font-semibold hover:bg-cyan-500"
                        >
                            <SaveIcon className="w-3 h-3" />
                            Save
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 bg-gray-800/30">
                    {isInteractive && draftMessage.report?.queries && (
                        <div className="mb-4 p-3 bg-gray-900/50 rounded-lg">
                            <h3 className="text-sm font-semibold mb-2 text-gray-200">Report Parameters</h3>
                            <ParameterForm queries={draftMessage.report.queries} values={paramValues} onChange={setParamValues} />
                        </div>
                    )}
                    {draftMessage.report && (
                        <ReportRenderer report={draftMessage.report} data={queryData} />
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Sub-components ---

const ChatInput = ({ onSubmit, isLoading }: { onSubmit: (text: string) => void, isLoading: boolean }) => {
    const [text, setText] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(text);
        setText('');
    };
    return (
        <div className="p-2 border-t border-gray-700">
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                <input
                    type="text"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Describe a change..."
                    className="flex-1 p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 text-gray-100 placeholder-gray-400"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !text.trim()}
                    className="p-2 bg-cyan-600 rounded-md text-white hover:bg-cyan-500 disabled:bg-gray-600"
                >
                    {isLoading ? <LoadingSpinner/> : <SendIcon className="w-5 h-5" />}
                </button>
            </form>
        </div>
    );
};

const TabButton = ({ name, activeTab, onClick }: { name: string, activeTab: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1 text-xs rounded-md ${activeTab === name.toLowerCase() ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
    >
        {name}
    </button>
);

const CodeTextArea = ({ value, onChange }: { value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }) => (
    <textarea
        value={value}
        onChange={onChange}
        className="w-full h-32 p-2 bg-gray-900/80 text-gray-200 font-mono text-xs rounded-md border border-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        spellCheck="false"
    />
);


export default ReportEditor;
