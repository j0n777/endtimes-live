import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MonitorEvent } from '../types';

interface TacticalRadarProps {
  events: MonitorEvent[];
}

const TacticalRadar: React.FC<TacticalRadarProps> = ({ events }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 20;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Draw Radar Circles
    const circles = [0.2, 0.4, 0.6, 0.8, 1];
    circles.forEach(r => {
      g.append("circle")
        .attr("r", radius * r)
        .attr("fill", "none")
        .attr("stroke", "#c19a6b")
        .attr("stroke-width", 1)
        .attr("opacity", 0.3);
    });

    // Draw Crosshairs
    g.append("line").attr("x1", 0).attr("y1", -radius).attr("x2", 0).attr("y2", radius).attr("stroke", "#c19a6b").attr("opacity", 0.3);
    g.append("line").attr("x1", -radius).attr("y1", 0).attr("x2", radius).attr("y2", 0).attr("stroke", "#c19a6b").attr("opacity", 0.3);

    // Scanner Sweep
    const scanner = g.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", -radius)
      .attr("stroke", "#c19a6b")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.8);

    // Animate Scanner using D3 timer
    d3.timer((elapsed) => {
      const angle = (elapsed / 20) % 360;
      scanner.attr("transform", `rotate(${angle})`);
    });

    // Plot Events (Mock mapping: Lat/Lng to Angle/Radius)
    // Longitude (-180 to 180) maps to Angle (0 to 360)
    // Latitude (-90 to 90) maps to Radius (Center to Edge) - Just for visual distribution
    events.forEach(event => {
      // Simple projection for radar visualization
      const angleDeg = (event.coordinates.lng + 180) % 360;
      const angleRad = (angleDeg - 90) * (Math.PI / 180); // -90 to start at top

      // Map latitude to radius distance (not accurate geologically, but good for distribution)
      // Equator is center, poles are outer, or vice versa. Let's make random-ish distribution based on lat for visual flair
      const dist = radius * (0.3 + (Math.abs(event.coordinates.lat) / 90) * 0.7);

      const x = Math.cos(angleRad) * dist;
      const y = Math.sin(angleRad) * dist;

      const color = event.severity === 'HIGH' ? '#ef4444' : event.severity === 'ELEVATED' ? '#f59e0b' : '#c19a6b';

      g.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 4)
        .attr("fill", color)
        .attr("class", event.severity === 'HIGH' ? "animate-pulse" : "");

      // Label for High severity
      if (event.severity === 'HIGH') {
        g.append("text")
          .attr("x", x + 8)
          .attr("y", y + 4)
          .text(event.id.toUpperCase())
          .attr("fill", color)
          .attr("font-size", "10px")
          .attr("font-family", "monospace");
      }
    });

  }, [events]);

  return (
    <div className="relative flex flex-col items-center justify-center p-4 bg-tactical-800 border border-tactical-700 rounded-lg shadow-lg">
      <h3 className="absolute top-2 left-4 text-xs font-mono text-tactical-500 opacity-70">GLOBAL_THREAT_RADAR_V1</h3>
      <svg ref={svgRef} width={300} height={300} className="w-full max-w-[300px]" />
      <div className="absolute bottom-2 right-4 text-[10px] font-mono text-tactical-500 opacity-50 animate-pulse">
        SCANNING...
      </div>
    </div>
  );
};

export default TacticalRadar;
