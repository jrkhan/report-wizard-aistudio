
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

interface D3CodeRunnerProps {
  code: string;
  data: any[];
}

const D3CodeRunner: React.FC<D3CodeRunnerProps> = ({ code, data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !code || !data) return;
    
    // Reset state for re-renders
    setError(null);
    const container = d3.select(containerRef.current);
    container.selectAll("*").remove(); // Clear previous render

    // Set up the SVG container for the chart
    const svg = container.append("svg")
      .attr("width", "100%")
      .attr("height", 350) 
      .attr("viewBox", `0 0 500 350`) // Standard viewbox for consistent scaling
      .style("background", "transparent")
      .style("color", "#d1d5db");

    try {
      // Safely create and execute the function from the AI-generated code string.
      // The function is provided with the D3 selection of the SVG element and the relevant data.
      const renderChart = new Function('svg', 'data', code);
      renderChart(svg, data);
    } catch (e) {
      console.error("Error executing AI-generated D3 code:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(errorMessage);
      container.selectAll("*").remove(); // Clear any partially rendered chart on error
    }
  // We only want to re-run this effect if the code or data changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, JSON.stringify(data)]); // Deep compare data to avoid unnecessary re-renders

  return (
    <div className="w-full h-full min-h-[350px]">
      {error && (
        <div className="p-4 h-full flex flex-col justify-center bg-red-900/50 rounded-lg text-red-200">
          <p className="font-bold mb-2">Error Rendering Chart</p>
          <pre className="text-sm whitespace-pre-wrap font-mono bg-red-800/50 p-2 rounded">{error}</pre>
        </div>
      )}
      <div ref={containerRef} style={{ display: error ? 'none' : 'block' }}></div>
    </div>
  );
};

export default D3CodeRunner;
