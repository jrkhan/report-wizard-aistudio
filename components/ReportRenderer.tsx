
import React from 'react';
import { Report } from '../types';
import D3CodeRunner from './D3CodeRunner';

interface ReportRendererProps {
  report: Report;
  data: Record<string, any[]> | null | undefined;
}

// A simple markdown-to-HTML converter for basic formatting
const renderMarkdownToHTML = (text: string) => {
    return text
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-3 mt-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-2 mt-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mb-2 mt-2">$1</h3>')
      .replace(/<\/p><p>/g, '<br/>')
      .replace(/\n/g, '<br />');
};

const ReportRenderer: React.FC<ReportRendererProps> = ({ report, data: toolData }) => {
  const { markdown, charts } = report;
  
  const placeholderRegex = /<div id="([^"]+)"><\/div>/g;
  const parts = markdown.split(placeholderRegex);

  const content = parts.map((part, index) => {
    if (index % 2 === 1) { // This part is a chart ID
      const chartId = part;
      const chart = charts.find(c => c.id === chartId);
      
      if (!chart) {
        return <div key={index} className="p-4 bg-yellow-900/50 rounded-lg text-yellow-300">Configuration error: Chart with ID '{chartId}' was specified in markdown but not provided in the chart data.</div>;
      }

      if (!toolData) {
        return <div key={index} className="p-4 bg-red-900/50 rounded-lg text-red-300">Error: Could not find data for chart '{chartId}'. The data query may have failed.</div>;
      }
      
      const dataForChart = toolData[chart.dataKey];
      if (!dataForChart) {
        return <div key={index} className="p-4 bg-yellow-900/50 rounded-lg text-yellow-300">Configuration error: Data key '{chart.dataKey}' for chart '{chartId}' was not found in the query results.</div>;
      }
      
      return (
        <div key={index} className="mt-4 mb-4 bg-gray-900 rounded-lg p-2 ring-1 ring-gray-700">
          <D3CodeRunner code={chart.code} data={dataForChart} />
        </div>
      );
    } else { // This is a text part
      if (!part.trim()) return null;
      return <div key={index} dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML(part) }} />;
    }
  });

  return (
    <div className="prose prose-invert max-w-none">
      {content}
    </div>
  );
};

export default ReportRenderer;
