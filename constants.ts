
import { Type } from "@google/genai";
import { ChatMessage, ChatRole, Report } from "./types";

export const GEMINI_MODEL_NAME = "gemini-2.5-flash";

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'init-1',
    role: ChatRole.BOT,
    text: "Hello! I'm a data visualization assistant. I can generate reports with multiple charts from our mock database. For example: 'Show me total sales per region and a breakdown of current inventory'."
  }
];

const EXAMPLE_REPORT_OBJECT: Report = {
  markdown: "<h1>Sales and Inventory Report</h1><p>Here is a summary of the latest sales and inventory data.</p><h2>Sales by Region</h2><p>Asia is currently the top-performing region.</p><div id=\"chart-1\"></div><h2>Current Inventory Levels</h2><p>This chart displays the current stock for our main product categories.</p><div id=\"chart-2\"></div>",
  charts: [
    {
      id: "chart-1",
      dataKey: "regional_sales",
      code: "const margin = {top: 40, right: 30, bottom: 60, left: 60}; const width = 460 - margin.left - margin.right; const height = 350 - margin.top - margin.bottom; const chart = svg.append('g').attr('transform', `translate(\\${margin.left},\\${margin.top})`); const x = d3.scaleBand().range([0, width]).domain(data.map(d => d.region)).padding(0.2); chart.append('g').attr('transform', `translate(0, \\${height})`).call(d3.axisBottom(x)).selectAll('text').style('fill', '#9ca3af'); const y = d3.scaleLinear().domain([0, d3.max(data, d => d.total_sales)]).range([height, 0]); chart.append('g').call(d3.axisLeft(y)).selectAll('text').style('fill', '#9ca3af'); chart.selectAll('rect').data(data).enter().append('rect').attr('x', d => x(d.region)).attr('y', d => y(d.total_sales)).attr('height', d => height - y(d.total_sales)).attr('width', x.bandwidth()).attr('fill', '#22d3ee'); chart.append('text').attr('x', width / 2).attr('y', -(margin.top / 2)).attr('text-anchor', 'middle').style('font-size', '16px').style('fill', '#e5e7eb').text('Total Sales by Region');"
    },
    {
      id: "chart-2",
      dataKey: "inventory_levels",
      code: "const margin = {top: 40, right: 30, bottom: 60, left: 60}; const width = 460 - margin.left - margin.right; const height = 350 - margin.top - margin.bottom; const chart = svg.append('g').attr('transform', `translate(\\${margin.left},\\${margin.top})`); const x = d3.scaleBand().range([0, width]).domain(data.map(d => d.name)).padding(0.2); chart.append('g').attr('transform', `translate(0, \\${height})`).call(d3.axisBottom(x)).selectAll('text').style('fill', '#9ca3af'); const y = d3.scaleLinear().domain([0, d3.max(data, d => d.stock)]).range([height, 0]); chart.append('g').call(d3.axisLeft(y)).selectAll('text').style('fill', '#9ca3af'); chart.selectAll('rect').data(data).enter().append('rect').attr('x', d => x(d.name)).attr('y', d => y(d.stock)).attr('height', d => height - y(d.stock)).attr('width', x.bandwidth()).attr('fill', '#818cf8'); chart.append('text').attr('x', width / 2).attr('y', -(margin.top / 2)).attr('text-anchor', 'middle').style('font-size', '16px').style('fill', '#e5e7eb').text('Inventory Levels');"
    }
  ],
  queries: [
      { name: "regional_sales", sql: "SELECT region, SUM(total_sales) as total_sales FROM sales GROUP BY 1", params: [] },
      { name: "inventory_levels", sql: "SELECT name, stock FROM inventory", params: [] }
  ]
};

export const SYSTEM_INSTRUCTION = `
You are an expert data visualization assistant who creates reports using D3.js.

Your workflow is as follows:
1.  The user will make a request for data or visualizations.
2.  You will determine ALL the data you need and call the \`execute_queries\` tool to run multiple SQL queries at once. Provide a unique 'name' for each query. The SQL queries you generate will be stored for later use.
3.  The tool will return an object where the keys are the query names and the values are the data results.
4.  After receiving the data, your FINAL output MUST be a single JSON object that defines the complete report.
5.  This object must contain 'markdown', 'charts', and 'queries' keys.
    - "markdown": A string containing the report's text and narrative. You MUST embed placeholder divs where charts should go, for example: \`<div id="chart-sales"></div>\`.
    - "charts": An array of chart objects. Each object must have "id", "dataKey", and "code" keys. The "code" is a string of executable D3.js code.
    - "queries": An array of query objects that you used. Each object must have "name", "sql", and an empty "params" array.

D3.js Code Generation Best Practices:
- **Execution Context**: Your D3 code will be executed within a function that is passed a pre-created D3 selection of an SVG element called \`svg\`. The SVG has a viewBox of "0 0 500 350".
- **Mandatory Appending**: YOU MUST append all your chart elements (groups, shapes, axes, text, etc.) directly to this provided \`svg\` variable. Do NOT try to create your own \`<svg>\` element. The examples provided correctly follow this rule by starting with \`svg.append('g')\`.
- **Styling**: The application has a dark theme. Use light colors (e.g., '#e5e7eb', '#9ca3af') for all text, axes, and labels to ensure they are readable.
- **Margin Convention**: Use the standard D3 margin convention to create space for axes and labels.

For example, if the user asks "Show me total sales per region and the current stock levels for each product.", you would first call the \`execute_queries\` tool with queries for 'regional_sales' and 'inventory_levels'. After receiving the data, your final generated JSON output would look like this:

\`\`\`json
${JSON.stringify(EXAMPLE_REPORT_OBJECT, null, 2)}
\`\`\`
The final output you provide MUST be a single JSON object that conforms to the following JSON schema.
`;

const reportQuerySchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        sql: { type: Type.STRING },
        params: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['string', 'number', 'date', 'boolean'] },
                    label: { type: Type.STRING },
                    defaultValue: { oneOf: [{ type: Type.STRING }, { type: Type.NUMBER }, { type: Type.BOOLEAN }] }
                },
                required: ['name', 'type', 'label']
            }
        }
    },
    required: ['name', 'sql', 'params']
};

export const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    markdown: {
      type: Type.STRING,
      description: 'The markdown content for the report, including placeholder divs for charts, e.g., <div id="chart-1"></div>.'
    },
    charts: {
      type: Type.ARRAY,
      description: "An array of chart objects to be rendered.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "The ID of the placeholder div in the markdown." },
          dataKey: { type: Type.STRING, description: "The key for the data from the tool call results to be used for this chart." },
          code: { type: Type.STRING, description: "The D3.js code to render the chart as a single-line string." }
        },
        required: ["id", "dataKey", "code"]
      }
    },
    queries: {
        type: Type.ARRAY,
        description: "An array of the SQL queries used to generate this report. Params array should be empty unless they are defined.",
        items: reportQuerySchema,
    }
  },
  required: ["markdown", "charts", "queries"]
};


export const EDIT_REPORT_PROMPT = `
You are an AI assistant that modifies an existing data visualization report based on a user's request.
You will be given the current report's definition as a JSON object and a prompt from the user asking for a change.
Your task is to return a new, complete JSON object for the report that incorporates the user's requested changes.

You can modify any part of the report:
- **Markdown**: Change text, add or remove chart placeholders.
- **Charts**: Change a chart's D3 code, add new charts, or remove existing ones.
- **Queries**: Add new queries, modify existing SQL, or add/remove parameters to make the report interactive.
  - When adding parameters, use the ':paramName' syntax in the SQL and define the parameter in the 'params' array.

D3.js Code Generation Best Practices:
- **Execution Context**: Your D3 code will be executed within a function that is passed a pre-created D3 selection of an SVG element called \`svg\`. The SVG has a viewBox of "0 0 500 350".
- **Mandatory Appending**: YOU MUST append all your chart elements (groups, shapes, axes, text, etc.) directly to this provided \`svg\` variable. Do NOT try to create your own \`<svg>\` element. The examples provided correctly follow this rule by starting with \`svg.append('g')\`.
- **Styling**: The application has a dark theme. Use light colors (e.g., '#e5e7eb', '#9ca3af') for all text, axes, and labels to ensure they are readable.
- **Margin Convention**: Use the standard D3 margin convention to create space for axes and labels.

Your FINAL output MUST be the complete, updated JSON object for the entire report. Do not omit any fields. The JSON object must conform to the provided schema.
`;

export const EDIT_RESPONSE_SCHEMA = RESPONSE_SCHEMA;
