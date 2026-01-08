import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MonitorEvent, ConflictLevel } from '../types';

interface SituationMapProps {
  events: MonitorEvent[];
}

const SituationMap: React.FC<SituationMapProps> = ({ events }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<any | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent double init

    const map = L.map(mapContainerRef.current, {
      center: [30, 15],
      zoom: 2.5,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true
    });

    // Dark Tactical Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        clusterGroupRef.current = null;
      }
    };
  }, []);

  // 2. Handle Markers & Clustering
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    if (clusterGroupRef.current) {
      clusterGroupRef.current.clearLayers();
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }

    // Prepare Cluster Group
    // Check if Leaflet.markercluster is loaded globally
    const L_any = L as any;
    if (L_any.markerClusterGroup) {
        const clusterGroup = L_any.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 40,
            spiderfyOnMaxZoom: true,
            animate: true,
            iconCreateFunction: function(cluster: any) {
                const childCount = cluster.getChildCount();
                let c = 'marker-cluster-small';
                if (childCount > 10) c = 'marker-cluster-medium';
                if (childCount > 20) c = 'marker-cluster-large';

                return new L.DivIcon({ 
                html: '<div><span>' + childCount + '</span></div>', 
                className: 'marker-cluster ' + c, 
                iconSize: new L.Point(40, 40) 
                });
            }
        });
        clusterGroupRef.current = clusterGroup;
        map.addLayer(clusterGroup);
    } else {
        console.warn("Leaflet MarkerCluster missing. Falling back to standard layer.");
    }

    // Create Markers
    const newMarkers: L.Marker[] = [];

    events.forEach(event => {
      // Validation to ensure lat/lng exists
      if (!event.coordinates || typeof event.coordinates.lat !== 'number') return;

      let color = '#34d399'; // Default Low/Green
      let shapeClass = 'rounded-full'; 
      let animation = '';
      let pulseColor = color;
      
      // Color Logic
      if (event.severity === 'MEDIUM') color = '#fbbf24'; // Yellow
      if (event.severity === 'ELEVATED') color = '#f97316'; // Orange
      if (event.severity === 'HIGH') {
         color = '#ef4444'; // Red
         pulseColor = '#ef4444';
      }

      // Shape/Style Logic
      switch(event.conflictLevel) {
        case ConflictLevel.STATE_WAR:
          animation = 'animate-pulse-fast';
          break;
        case ConflictLevel.MILITIA_ACTION:
          shapeClass = 'rounded-sm rotate-45'; 
          break;
        case ConflictLevel.MILITARY_MOVEMENT:
          shapeClass = 'rounded-none'; 
          color = '#3b82f6';
          pulseColor = '#3b82f6';
          if (event.severity === 'HIGH') color = '#ef4444';
          break;
        case ConflictLevel.RIOT_UNREST:
          color = '#e11d48'; 
          break;
        case ConflictLevel.POLITICAL_THREAT:
          color = '#8b5cf6'; 
          break;
      }

      // Generate Marker HTML
      const html = `
        <div class="relative flex items-center justify-center w-8 h-8 group">
             ${event.severity === 'HIGH' || event.conflictLevel === ConflictLevel.STATE_WAR ? 
               `<div class="absolute w-full h-full rounded-full opacity-50 animate-ping" style="background-color: ${pulseColor}"></div>
                <div class="absolute w-[120%] h-[120%] rounded-full opacity-20 animate-pulse" style="background-color: ${pulseColor}"></div>` 
               : ''}
             <div class="relative w-3 h-3 border border-black shadow-lg transition-transform group-hover:scale-150 ${shapeClass}" style="background-color: ${color}"></div>
        </div>
      `;

      const divIcon = L.divIcon({
        className: 'bg-transparent',
        html: html,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const popupContent = `
        <div style="padding: 6px; min-width: 200px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="font-size: 14px; color: ${color}; text-transform:uppercase;">${event.conflictLevel || 'EVENT'}</strong>
            <span style="font-size:10px; background:#333; padding:1px 3px; border-radius:2px;">${event.sourceType || 'RSS'}</span>
          </div>
          <div style="color: white; font-weight: bold; font-size: 13px; margin-bottom: 2px;">${event.title}</div>
          <div style="color: #9ca3af; font-size: 11px;">${event.location}</div>
          <div style="margin-top: 6px; padding-top:4px; border-top: 1px solid #333; font-size: 10px; color: #6b7280;">
             SOURCE: ${event.sourceName || 'Unknown'}
          </div>
        </div>
      `;

      const marker = L.marker([event.coordinates.lat, event.coordinates.lng], { icon: divIcon });
      marker.bindPopup(popupContent, { closeButton: false, className: 'tactical-popup' });
      newMarkers.push(marker);
    });

    // Add Markers to Layer
    if (clusterGroupRef.current) {
      clusterGroupRef.current.addLayers(newMarkers);
    } else {
      // Fallback if clustering fails
      newMarkers.forEach(m => m.addTo(map));
    }
    
    markersRef.current = newMarkers;

  }, [events]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full bg-[#050505] z-0" />
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10" 
           style={{
             backgroundImage: 'linear-gradient(rgba(52, 211, 153, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(52, 211, 153, 0.1) 1px, transparent 1px)',
             backgroundSize: '100px 100px',
             opacity: 0.15
           }}>
      </div>
    </div>
  );
};

export default SituationMap;