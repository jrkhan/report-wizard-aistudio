
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

// The ChartSpec interface has been defined here to resolve a compilation error
// as it is no longer part of the main application types. This component is unused.
interface ChartSpec {
  data: any[];
  x_axis: { key: string; label?: string };
  y_axis: { key: string; label?: string };
  title?: string;
}

interface ChartRendererProps {
  spec: ChartSpec;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ spec }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!spec || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const { data, x_axis, y_axis, title } = spec;

    const margin = { top: 50, right: 30, bottom: 70, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const chart = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X axis
    const x = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => d[x_axis.key]))
      .padding(0.2);

    chart.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")
      .style("fill", "#9ca3af");

    // Y axis
    const yMax = d3.max(data, d => d[y_axis.key] as number) || 0;
    const y = d3.scaleLinear()
      .domain([0, yMax * 1.1]) // Add 10% padding to top
      .range([height, 0]);

    chart.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "#9ca3af");
      
    // Title
    if (title) {
        chart.append("text")
            .attr("x", width / 2)
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("fill", "#e5e7eb")
            .text(title);
    }
    
    // X-axis label
    chart.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .style("fill", "#d1d5db")
      .text(x_axis.label || x_axis.key);

    // Y-axis label
    chart.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 20)
      .attr("x", -height / 2)
      .style("fill", "#d1d5db")
      .text(y_axis.label || y_axis.key);


    // Bars
    chart.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => x(d[x_axis.key])!)
      .attr("width", x.bandwidth())
      .attr("fill", "#22d3ee")
      .attr("y", d => y(0))
      .attr("height", d => height - y(0))
      .transition()
      .duration(800)
      .attr("y", d => y(d[y_axis.key]))
      .attr("height", d => height - y(d[y_axis.key]));

  }, [spec]);

  return <svg ref={svgRef}></svg>;
};

export default ChartRenderer;
