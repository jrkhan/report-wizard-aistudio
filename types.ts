
export enum ChatRole {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system',
}

export interface D3Chart {
  id: string; // e.g., "chart-1"
  dataKey: string; // e.g., "regional_sales", to map to query results
  code: string; // The raw D3.js code string
}

export type QueryParameterType = 'string' | 'number' | 'date' | 'boolean';

export interface QueryParameter {
    name: string; // e.g., "region" or "start_date"
    type: QueryParameterType;
    label?: string; // User-friendly label, e.g., "Sales Region"
    defaultValue?: string | number | boolean;
}

export interface ReportQuery {
    name: string; // The key used in the tool results, e.g., "regional_sales"
    sql: string; // The parameterized SQL query, e.g., "SELECT * FROM sales WHERE region = ?"
    params: QueryParameter[];
}

export interface Report {
  markdown: string;
  charts: D3Chart[];
  queries?: ReportQuery[]; // Optional array of parameterized queries for interactive reports
}

export interface ToolCall {
  name: string;
  args: any;
  result?: any;
  status: 'running' | 'success' | 'error';
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text?: string; // For user messages or simple bot text responses
  report?: Report; // For complex, structured reports with D3 charts
  isLoading?: boolean;
  toolCalls?: ToolCall[];
}

export interface SavedReport {
  id: number;
  title: string;
  createdAt: number;
  message: ChatMessage;
}
