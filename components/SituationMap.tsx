import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MonitorEvent, ConflictLevel } from '../types';
import { CATEGORY_COLORS } from '../categoryColors';
import { getIconHtml } from '../utils/icons';

interface SituationMapProps {
  events: MonitorEvent[];
}

const SituationMap: React.FC<SituationMapProps> = ({ events }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<any | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const vectorLayersRef = useRef<L.Layer[]>([]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent double init

    const map = L.map(mapContainerRef.current, {
      center: [30, 15],
      zoom: 2.5,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
      // ⭐ PERFORMANCE: Use canvas rendering instead of SVG
      preferCanvas: true,
      renderer: L.canvas({ padding: 0.5, tolerance: 3 }),
      // ⭐ ZOOM LIMITS: Prevent excessive zoom out
      minZoom: 2,    // Prevent zooming out beyond world view
      maxZoom: 18,   // Allow street-level zoom
      // ⭐ MAX BOUNDS: Lock Latitude (Y) but allow infinite Longitude (X)
      // +/- 85 degrees is the limit for Web Mercator projection
      maxBounds: [[-85, -Infinity], [85, Infinity]],
      maxBoundsViscosity: 1.0
    });

    // Dark Tactical Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    // ⭐ DAY/NIGHT TERMINATOR
    import('../utils/sunTerminator').then(({ getTerminatorLatLngs }) => {
      const updateTerminator = () => {
        if (!mapInstanceRef.current) return;

        const latLngs = getTerminatorLatLngs(new Date());

        // Find existing terminator layer or create new
        if ((window as any).terminatorLayer) {
          (window as any).terminatorLayer.setLatLngs(latLngs);
        } else {
          (window as any).terminatorLayer = L.polygon(latLngs, {
            color: '#000',
            opacity: 0.1,
            fillColor: '#000',
            fillOpacity: 0.45, // Night darkness level
            weight: 0,
            interactive: false // Click-through
          }).addTo(mapInstanceRef.current);

          // Push to back so markers sit on top
          (window as any).terminatorLayer.bringToBack();
        }
      };

      updateTerminator();
    });

    // ⭐ MEMORY CLEANUP on unmount
    return () => {
      if (mapInstanceRef.current) {
        if ((window as any).terminatorLayer) {
          (window as any).terminatorLayer.remove();
          (window as any).terminatorLayer = null;
        }

        // Remove all event listeners to prevent memory leaks
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (clusterGroupRef.current) {
        clusterGroupRef.current.clearLayers();
        clusterGroupRef.current = null;
      }
      markersRef.current = [];
    };
  }, []);

  // 2. Handle Markers & Clustering
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Helper: Format titles (Polymarket slug fix)
    const formatTitle = (title: string) => {
      if (title.includes('-') && !title.includes(' ')) {
        return title.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
      return title;
    };

    // Helper for Popup Content
    const createPopupContent = (event: MonitorEvent, color: string) => `
      <div style="padding: 6px; min-width: 240px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <strong style="font-size: 14px; color: ${color}; text-transform:uppercase;">${event.category}</strong>
          <span style="font-size:10px; background:#333; padding:1px 3px; border-radius:2px;">${event.sourceType || 'RSS'}</span>
        </div>
        <div style="color: white; font-weight: bold; font-size: 14px; margin-bottom: 4px; line-height: 1.2;">
          ${formatTitle(event.title)}
        </div>
        ${event.description ? `<div style="color: #d1d5db; font-size: 11px; margin-bottom: 6px; max-height: 100px; overflow-y:auto;">${event.description.substring(0, 150)}${event.description.length > 150 ? '...' : ''}</div>` : ''}
        <div style="color: #9ca3af; font-size: 11px;">${event.location || ''}</div>
        
        <div style="margin-top: 8px; padding-top:6px; border-top: 1px solid #333; font-size: 10px; color: #6b7280; display:flex; justify-content:space-between; align-items:center;">
           <span>SOURCE: ${event.sourceName || 'Unknown'}</span>
           ${event.sourceUrl ? `<a href="${event.sourceUrl}" target="_blank" style="color: ${color}; text-decoration:none; font-weight:bold;">OPEN SOURCE >></a>` : ''}
        </div>
      </div>
    `;

    // Check if Leaflet.markercluster is loaded globally
    const L_any = L as any;
    if (L_any.markerClusterGroup && !clusterGroupRef.current) {
      const clusterGroup = L_any.markerClusterGroup({
        chunkedLoading: true,
        chunkInterval: 200,
        chunkDelay: 50,
        chunkProgress: null,

        // Visual settings
        showCoverageOnHover: false,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        animate: false, // ⚡ PERFORMANCE: Disable animations to prevent lag on zoom
        disableClusteringAtZoom: 16,

        iconCreateFunction: function (cluster: any) {
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
    } else if (!clusterGroupRef.current) {
      console.warn("Leaflet MarkerCluster missing. Falling back to standard layer.");
    }

    // Reuse existing cluster if available
    if (clusterGroupRef.current) {
      clusterGroupRef.current.clearLayers();
    }

    // Clear existing vector layers
    if (vectorLayersRef.current) {
      vectorLayersRef.current.forEach(layer => map.removeLayer(layer));
      vectorLayersRef.current = [];
    }

    const newMarkers: L.Marker[] = [];
    const newVectors: L.Layer[] = [];

    // Identify Top 5 Recent Events for GLOW effect
    const sortedEvents = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentEventIds = new Set(sortedEvents.slice(0, 5).map(e => e.id));

    // Use events directly. MarkerCluster handles optimization.
    events.forEach(event => {
      const color = CATEGORY_COLORS[event.category] || '#9ca3af';

      // 1. Handle AREA events (Polygons)
      if (event.alertGeometry) {
        const polygon = L.geoJSON(event.alertGeometry as any, {
          style: {
            color: color,
            weight: 1,
            fillColor: color,
            fillOpacity: 0.35, // "Marcador de texto" feel
            stroke: true
          }
        });

        const popupContent = createPopupContent(event, color);
        polygon.bindPopup(popupContent, { closeButton: false, className: 'tactical-popup' });

        newVectors.push(polygon);
      }

      const lat = event.coordinates.lat;
      const lng = event.coordinates.lng;

      // FILTER: Skip Null Island events
      if (Math.abs(lat) < 0.1 && Math.abs(lng) < 0.1) return;

      // 2. Handle POINT events (Markers)
      // PERFORMANCE: Use CircleMarkers (Canvas) for lower severity events
      const isCritical = event.severity === 'CRITICAL' || event.severity === 'HIGH' || event.category === 'PROPHETIC' || event.category === 'PERSECUTION';
      const isWar = event.conflictLevel === ConflictLevel.STATE_WAR || event.conflictLevel === ConflictLevel.CIVIL_WAR;

      let marker: L.Marker | L.CircleMarker;

      if (isCritical || isWar) {
        // Heavy DOM Marker for Critical items
        const html = getIconHtml(event.category, event.severity, isWar);
        const divIcon = L.divIcon({
          className: 'bg-transparent',
          html: html,
          iconSize: [isWar ? 42 : 36, isWar ? 42 : 36],
          iconAnchor: [isWar ? 21 : 18, isWar ? 21 : 18]
        });

        // Check for Recent Glow
        if (recentEventIds.has(event.id)) {
          divIcon.options.className += ' recent-event-glow';
        }

        // JITTER: Add tiny deterministic offset to overlapping points only for DOM markers
        // to prevent perfect stacking where z-index fights
        const jitterFactor = 0.00015;
        let idSum = 0;
        for (let i = 0; i < event.id.length; i++) idSum += event.id.charCodeAt(i);
        const offsetLat = ((idSum % 20) - 10) * jitterFactor;
        const offsetLng = ((idSum % 20) - 10) * jitterFactor;

        marker = L.marker([lat + offsetLat, lng + offsetLng], { icon: divIcon });
      } else {
        // Lightweight Canvas Marker for others
        marker = L.circleMarker([lat, lng], {
          radius: 6,
          fillColor: color,
          color: '#000',
          weight: 1,
          opacity: 0.8,
          fillOpacity: 0.8
        });
      }

      // Bind popup
      marker.bindPopup(createPopupContent(event, color), {
        closeButton: false,
        className: 'tactical-popup',
        autoPan: true
      });

      newMarkers.push(marker as any);
    });

    if (clusterGroupRef.current) {
      clusterGroupRef.current.addLayers(newMarkers);
    } else {
      newMarkers.forEach(m => m.addTo(map));
    }

    newVectors.forEach(v => v.addTo(map));
    vectorLayersRef.current = newVectors;
    markersRef.current = newMarkers as any;

  }, [events]); // Only re-render when events list changes

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

export default React.memo(SituationMap);