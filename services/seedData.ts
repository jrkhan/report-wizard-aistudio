
import { ChatMessage, ChatRole } from '../types';

interface SeedReport {
    title: string;
    message: ChatMessage;
}

export const SEED_REPORTS: SeedReport[] = [
    {
        title: "Weekly E-commerce Sales & Performance",
        message: {
            id: 'seed-1',
            role: ChatRole.BOT,
            toolCalls: [
                {
                    name: "execute_queries",
                    args: {
                        queries: [
                            { name: "daily_sales", query: "SELECT DATE(order_date) as sale_date, SUM(sale_price) as total_sales FROM sales WHERE order_date >= '2024-05-01' AND order_date <= '2024-05-07' GROUP BY 1 ORDER BY 1" },
                            { name: "category_sales", query: "SELECT category, SUM(sale_price) as total_sales FROM sales WHERE order_date >= '2024-05-01' AND order_date <= '2024-05-07' GROUP BY 1" }
                        ]
                    },
                    status: 'success',
                    result: {
                        daily_sales: [
                            { sale_date: "2024-05-01", total_sales: 1250.75 },
                            { sale_date: "2024-05-02", total_sales: 1980.50 },
                            { sale_date: "2024-05-03", total_sales: 1560.00 },
                            { sale_date: "2024-05-04", total_sales: 2820.90 },
                            { sale_date: "2024-05-05", total_sales: 2345.15 },
                            { sale_date: "2024-05-06", total_sales: 3180.40 },
                            { sale_date: "2024-05-07", total_sales: 2750.60 }
                        ],
                        category_sales: [
                            { category: "Electronics", total_sales: 6890.25 },
                            { category: "Books", total_sales: 3450.75 },
                            { category: "Home Goods", total_sales: 4230.30 },
                            { category: "Apparel", total_sales: 2316.95 }
                        ]
                    }
                }
            ],
            report: {
                markdown: `<h1>E-commerce Dashboard</h1><p>Sales performance for the first week of May.</p><h2>Daily Sales Trend</h2><div id="daily-sales-bar"></div><h2>Sales by Category</h2><p>Electronics are the top-performing category.</p><div id="category-sales-pie"></div>`,
                charts: [
                    {
                        id: "daily-sales-bar",
                        dataKey: "daily_sales",
                        code: "const margin = {top: 40, right: 30, bottom: 60, left: 60}; const width = 500 - margin.left - margin.right; const height = 350 - margin.top - margin.bottom; const chart = svg.append('g').attr('transform', `translate(\\${margin.left},\\${margin.top})`); const x = d3.scaleBand().range([0, width]).domain(data.map(d => new Date(d.sale_date).toLocaleDateString('en-US', {weekday: 'short'}))).padding(0.2); chart.append('g').attr('transform', `translate(0, \\${height})`).call(d3.axisBottom(x)).selectAll('text').style('fill', '#9ca3af'); const y = d3.scaleLinear().domain([0, d3.max(data, d => d.total_sales)]).range([height, 0]); chart.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('$,.0f'))).selectAll('text').style('fill', '#9ca3af'); chart.selectAll('rect').data(data).enter().append('rect').attr('x', d => x(new Date(d.sale_date).toLocaleDateString('en-US', {weekday: 'short'}))).attr('y', d => y(d.total_sales)).attr('height', d => height - y(d.total_sales)).attr('width', x.bandwidth()).attr('fill', '#22d3ee'); chart.append('text').attr('x', width / 2).attr('y', -(margin.top / 2)).attr('text-anchor', 'middle').style('font-size', '16px').style('fill', '#e5e7eb').text('Daily Sales');"
                    },
                    {
                        id: "category-sales-pie",
                        dataKey: "category_sales",
                        code: "const width = 500; const height = 350; const radius = Math.min(width, height) / 2 - 40; const chart = svg.append('g').attr('transform', `translate(\\${width / 2},\\${height / 2})`); const color = d3.scaleOrdinal().range(['#34d399', '#60a5fa', '#f87171', '#fbbf24']); const pie = d3.pie().value(d => d.total_sales); const data_ready = pie(data); const arc = d3.arc().innerRadius(0).outerRadius(radius); chart.selectAll('path').data(data_ready).enter().append('path').attr('d', arc).attr('fill', d => color(d.data.category)).attr('stroke', '#1f2937').style('stroke-width', '2px'); const labelArc = d3.arc().outerRadius(radius * 0.7).innerRadius(radius * 0.7); chart.selectAll('text').data(data_ready).enter().append('text').attr('transform', d => `translate(\\${labelArc.centroid(d)})`).attr('text-anchor', 'middle').text(d => d.data.category).style('fill', '#fff').style('font-size', '12px'); svg.append('text').attr('x', width / 2).attr('y', 20).attr('text-anchor', 'middle').style('font-size', '16px').style('fill', '#e5e7eb').text('Sales by Category');"
                    }
                ],
                queries: [
                    { name: "daily_sales", sql: "SELECT DATE(order_date) as sale_date, SUM(sale_price) as total_sales FROM sales WHERE order_date >= :start_date AND order_date <= :end_date GROUP BY 1 ORDER BY 1", params: [{ name: "start_date", type: "date", label: "Start Date", defaultValue: "2024-05-01" }, { name: "end_date", type: "date", label: "End Date", defaultValue: "2024-05-07" }] },
                    { name: "category_sales", sql: "SELECT category, SUM(sale_price) as total_sales FROM sales WHERE order_date >= :start_date AND order_date <= :end_date GROUP BY 1", params: [{ name: "start_date", type: "date", label: "Start Date", defaultValue: "2024-05-01" }, { name: "end_date", type: "date", label: "End Date", defaultValue: "2024-05-07" }] }
                ]
            }
        }
    },
    {
        title: "Project Task Status Overview",
        message: {
            id: 'seed-2',
            role: ChatRole.BOT,
            toolCalls: [
                {
                    name: "execute_queries",
                    args: {
                        queries: [
                            { name: "status_breakdown", query: "SELECT status, COUNT(*) as task_count FROM tasks WHERE project_name = 'Phoenix Project' GROUP BY 1" },
                            { name: "assignee_workload", query: "SELECT assignee, COUNT(*) as task_count FROM tasks WHERE project_name = 'Phoenix Project' GROUP BY 1" }
                        ]
                    },
                    status: 'success',
                    result: {
                        status_breakdown: [
                            { status: "To Do", task_count: 15 },
                            { status: "In Progress", task_count: 25 },
                            { status: "Done", task_count: 60 }
                        ],
                        assignee_workload: [
                            { assignee: "Alice", task_count: 22 },
                            { assignee: "Bob", task_count: 18 },
                            { assignee: "Charlie", task_count: 35 },
                            { assignee: "Diana", task_count: 25 }
                        ]
                    }
                }
            ],
            report: {
                markdown: `<h1>Project Task Overview</h1><p>Current status of tasks and workload distribution for the selected project.</p><h2>Task Status Breakdown</h2><div id="status-donut"></div><h2>Workload by Assignee</h2><div id="workload-bar"></div>`,
                charts: [
                    {
                        id: "status-donut",
                        dataKey: "status_breakdown",
                        code: "const width = 500; const height = 350; const radius = Math.min(width, height) / 2 - 40; const chart = svg.append('g').attr('transform', `translate(\\${width / 2},\\${height / 2})`); const color = d3.scaleOrdinal().domain(data.map(d => d.status)).range(['#f87171', '#fbbf24', '#34d399']); const pie = d3.pie().value(d => d.task_count); const data_ready = pie(data); const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius); chart.selectAll('path').data(data_ready).enter().append('path').attr('d', arc).attr('fill', d => color(d.data.status)).attr('stroke', '#1f2937').style('stroke-width', '2px'); const labelArc = d3.arc().outerRadius(radius).innerRadius(radius * 0.8); chart.selectAll('text').data(data_ready).enter().append('text').attr('transform', d => `translate(\\${labelArc.centroid(d)})`).attr('text-anchor', 'middle').text(d => d.data.status).style('fill', '#fff').style('font-size', '12px'); svg.append('text').attr('x', width / 2).attr('y', 20).attr('text-anchor', 'middle').style('font-size', '16px').style('fill', '#e5e7eb').text('Task Status');"
                    },
                    {
                        id: "workload-bar",
                        dataKey: "assignee_workload",
                        code: "const margin = {top: 40, right: 30, bottom: 60, left: 60}; const width = 500 - margin.left - margin.right; const height = 350 - margin.top - margin.bottom; const chart = svg.append('g').attr('transform', `translate(\\${margin.left},\\${margin.top})`); const x = d3.scaleBand().range([0, width]).domain(data.map(d => d.assignee)).padding(0.2); chart.append('g').attr('transform', `translate(0, \\${height})`).call(d3.axisBottom(x)).selectAll('text').style('fill', '#9ca3af'); const y = d3.scaleLinear().domain([0, d3.max(data, d => d.task_count)]).range([height, 0]); chart.append('g').call(d3.axisLeft(y).ticks(5)).selectAll('text').style('fill', '#9ca3af'); chart.selectAll('rect').data(data).enter().append('rect').attr('x', d => x(d.assignee)).attr('y', d => y(d.task_count)).attr('height', d => height - y(d.task_count)).attr('width', x.bandwidth()).attr('fill', '#818cf8'); chart.append('text').attr('x', width / 2).attr('y', -(margin.top / 2)).attr('text-anchor', 'middle').style('font-size', '16px').style('fill', '#e5e7eb').text('Tasks per Assignee');"
                    }
                ],
                queries: [
                    { name: "status_breakdown", sql: "SELECT status, COUNT(*) as task_count FROM tasks WHERE project_name = :project_name AND (:include_completed OR status != 'Done') GROUP BY 1", params: [{ name: "project_name", type: "string", label: "Project Name", defaultValue: "Phoenix Project" }, { name: "include_completed", type: "boolean", label: "Include Completed", defaultValue: true }] },
                    { name: "assignee_workload", sql: "SELECT assignee, COUNT(*) as task_count FROM tasks WHERE project_name = :project_name AND (:include_completed OR status != 'Done') GROUP BY 1", params: [{ name: "project_name", type: "string", label: "Project Name", defaultValue: "Phoenix Project" }, { name: "include_completed", type: "boolean", label: "Include Completed", defaultValue: true }] }
                ]
            }
        }
    }
];
