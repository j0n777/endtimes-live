import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MonitorEvent } from '../types';

interface TacticalRadarProps {
  events: MonitorEvent[];
}

const TacticalRadar: React.FC<TacticalRadarProps> = ({ events }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const timerRef = useRef<d3.Timer | null>(null); // ⭐ CRITICAL FIX: Track timer

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

    // Scanner Sweep (CSS Animation handled via class on GROUP)
    // We use a group centered at 0,0 to ensure perfect rotation origin
    const scannerGroup = g.append("g")
      .attr("class", "animate-[spin_4s_linear_infinite]"); // Use Tailwind JIT directly to be safe

    scannerGroup.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", -radius)
      .attr("stroke", "#c19a6b")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.8);

    // NO JS TIMER - Pure CSS Animation (Zero CPU)

    // Plot Events (Limit to 100 for radar performance)
    const limitedEvents = events.slice(0, 100);
    limitedEvents.forEach(event => {
      const angleDeg = (event.coordinates.lng + 180) % 360;
      const angleRad = (angleDeg - 90) * (Math.PI / 180);
      const dist = radius * (0.3 + (Math.abs(event.coordinates.lat) / 90) * 0.7);

      const x = Math.cos(angleRad) * dist;
      const y = Math.sin(angleRad) * dist;

      const color = event.severity === 'HIGH' ? '#ef4444' : event.severity === 'ELEVATED' ? '#f59e0b' : '#c19a6b';

      g.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 3)
        .attr("fill", color)
        .attr("opacity", 0.8);
    });

    // No cleanup needed for CSS animations
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

export default React.memo(TacticalRadar);
