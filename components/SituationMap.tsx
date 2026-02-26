import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MonitorEvent, ConflictLevel } from '../types';
import { CATEGORY_COLORS } from '../categoryColors';
import { getIconHtml } from '../utils/icons';
import { CURATED_CAMS, LiveCam } from '../lib/camsData';
import LiveCameraFeed from './LiveCameraFeed';

// Fix for missing types for leaflet.markercluster
const L_any = L as any;

interface SituationMapProps {
  events: MonitorEvent[];
}

// Helper for Popup Content
const createPopupContent = (event: MonitorEvent, color: string) => {
  const date = new Date(event.timestamp).toLocaleString();
  return `
    <div class="p-3 min-w-[250px]">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-3 h-3 rounded-full" style="background-color: ${color}"></span>
        <span class="text-xs font-bold text-gray-400">${event.category}</span>
        <span class="ml-auto text-xs text-gray-500">${date}</span>
      </div>
      <h3 class="font-bold text-white text-sm mb-1">${event.title}</h3>
      <p class="text-xs text-gray-300 mb-2">${event.description || ''}</p>
      <div class="text-xs text-emerald-500 font-mono">
        ${event.location || 'Unknown Location'}
      </div>
    </div>
  `;
};

const SituationMap: React.FC<SituationMapProps> = ({ events }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  // Re-added clusterGroupRef
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const vectorLayersRef = useRef<L.Layer[]>([]);
  const camMarkersRef = useRef<L.Marker[]>([]);
  const [activeCam, setActiveCam] = React.useState<LiveCam | null>(null);

  // 1. Initialize Map
  useEffect(() => {
    console.log('SituationMap v2.1 Loaded - Smart Clustering');
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

        const baseLatLngs = getTerminatorLatLngs(new Date());

        // Create 3 copies for seamless world wrapping (Center, Left, Right)
        const polygons = [
          baseLatLngs,
          baseLatLngs.map(([lat, lng]) => [lat, lng - 360]),
          baseLatLngs.map(([lat, lng]) => [lat, lng + 360])
        ];

        // MultiPolygon structure
        const combinedLatLngs = polygons as any;

        // Find existing terminator layer or create new
        if ((window as any).terminatorLayer) {
          (window as any).terminatorLayer.setLatLngs(combinedLatLngs);
        } else {
          (window as any).terminatorLayer = L.polygon(combinedLatLngs, {
            color: '#000',
            opacity: 0, // No border
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

      // Update every minute
      const interval = setInterval(updateTerminator, 60000);
      return () => clearInterval(interval);
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
      markersRef.current = [];
    };
  }, []);

  // 2. Handle Markers (WITH SMART CLUSTERING)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (L_any.markerClusterGroup && !clusterGroupRef.current) {
      const clusterGroup = L_any.markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        removeOutsideVisibleBounds: true,
        animate: true,
        // ⭐ SMART CLUSTERING & ANTI-COLLISION: 
        // We removed disableClusteringAtZoom so that markers sharing the exact same coordinate 
        // will ALWAYS cluster and therefore Spiderfy when clicked, preventing stacking.
        maxClusterRadius: 25, // Small radius: only strongly overlapping markers will cluster

        // ⭐ Spiderfy settings to forcefully separate stacked markers
        spiderfyDistanceMultiplier: 2.5, // Expands the spider web much further out
        spiderLegPolylineOptions: { weight: 1.5, color: '#34d399', opacity: 0.5 }, // Tactical green legs

        // Custom Cluster Icon (Tactical Style)
        iconCreateFunction: function (cluster: any) {
          const childCount = cluster.getChildCount();
          let c = ' marker-cluster-';
          let size = 40;

          if (childCount < 10) {
            c += 'small';
          } else if (childCount < 100) {
            c += 'medium';
            size = 50;
          } else {
            c += 'large';
            size = 60;
          }

          return L.divIcon({
            html: `<div><span>${childCount}</span></div>`,
            className: 'marker-cluster' + c + ' tactical-cluster',
            iconSize: new L.Point(size, size)
          });
        }
      });

      map.addLayer(clusterGroup);
      clusterGroupRef.current = clusterGroup;
    }

    const clusterGroup = clusterGroupRef.current;

    // Clear existing vector layers
    if (vectorLayersRef.current) {
      vectorLayersRef.current.forEach(layer => map.removeLayer(layer));
      vectorLayersRef.current = [];
    }

    // Clear clusters
    if (clusterGroup) {
      clusterGroup.clearLayers();
    }

    // Also clear individual markers array (used for auto-open lookup)
    markersRef.current = [];

    const newMarkers: L.Marker[] = [];
    const newVectors: L.Layer[] = [];

    // Identify Top 5 Recent Events for GLOW effect
    const sortedEvents = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentEventIds = new Set(sortedEvents.slice(0, 5).map(e => e.id));

    // Reset Jitter Cache
    // @ts-ignore
    window.coordCache = {};

    // 1. Render Cameras (Only visible on Zoom >= 5)
    // Clear existing cameras
    if (camMarkersRef.current) {
      camMarkersRef.current.forEach(m => map.removeLayer(m));
      camMarkersRef.current = [];
    }

    const renderCameras = async () => {
      const currentZoom = map.getZoom();

      camMarkersRef.current.forEach(m => map.removeLayer(m));
      camMarkersRef.current = [];

      if (currentZoom >= 5) {
        // Fetch dynamic cameras from local disk mapped volume
        let dynamicCams: any[] = [];
        try {
          const res = await fetch('/data/cams.json?t=' + Date.now());
          if (res.ok) {
            dynamicCams = await res.json();
          }
        } catch (e) { /* ignore if not exist yet */ }

        // Merge curated ones with dynamic ones
        const allCams = [...CURATED_CAMS];
        dynamicCams.forEach(dc => {
          // We adapt MonitorEvent format back to LiveCam format on the fly
          allCams.push({
            id: dc.id,
            name: dc.title,
            location: dc.location,
            coordinates: dc.coordinates,
            embedUrl: dc.mediaUrl,
            type: 'youtube'
          });
        });

        allCams.forEach(cam => {
          const camIconHtml = `
            <div class="relative flex items-center justify-center p-2 rounded-full border-2 border-emerald-500 bg-black shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-pulse cursor-pointer hover:scale-125 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
            </div>
          `;

          const camIcon = L.divIcon({
            className: 'bg-transparent',
            html: camIconHtml,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });

          const marker = L.marker([cam.coordinates.lat, cam.coordinates.lng], { icon: camIcon, zIndexOffset: 1000 }).addTo(map);

          marker.on('click', () => {
            setActiveCam(cam);
          });

          camMarkersRef.current.push(marker);
        });
      }
    };

    // Initial render and attach zoom event
    renderCameras();
    map.on('zoomend', renderCameras);

    // JITTER LOGIC: Check for Generic Country Names to distribute better
    const GENERIC_LOCATIONS = new Set([
      'BRAZIL', 'BRASIL', 'RUSSIA', 'RÚSSIA', 'IRAN', 'IRÃ', 'ISRAEL',
      'UKRAINE', 'UCRÂNIA', 'USA', 'UNITED STATES', 'CHINA', 'TAIWAN',
      'SYRIA', 'SÍRIA', 'LEBANON', 'LÍBANO', 'INDIA', 'ÍNDIA',
      'AFRICA', 'SOUTH AMERICA', 'EUROPE', 'NORTH AMERICA'
    ]);

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

      const baseLat = event.coordinates.lat;
      const baseLng = event.coordinates.lng;

      // FILTER: Skip Null Island events
      if (Math.abs(baseLat) < 0.1 && Math.abs(baseLng) < 0.1) return;

      // 2. Handle POINT events (Markers)

      const isCritical = event.severity === 'CRITICAL' || event.severity === 'HIGH' || event.category === 'PROPHETIC' || event.category === 'PERSECUTION';
      const isWar = event.conflictLevel === ConflictLevel.STATE_WAR || event.conflictLevel === ConflictLevel.CIVIL_WAR;

      let html = getIconHtml(event.category, event.severity, isWar);

      // ROTATION LOGIC FOR PLANES/SHIPS
      const heading = (event as any).heading;
      if (event.category === 'TRANSPORT' && typeof heading === 'number') {
        html = `<div style="transform: rotate(${heading}deg); transform-origin: center; transition: transform 0.5s ease-out;">${html}</div>`;
      }

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

      // JITTER: 
      // 1. Group events by exact coordinates to apply spiral jitter
      const key = `${baseLat.toFixed(4)},${baseLng.toFixed(4)}`;
      // @ts-ignore
      if (!window.coordCache) window.coordCache = {};
      // @ts-ignore
      if (!window.coordCache[key]) window.coordCache[key] = 0;
      // @ts-ignore
      const count = window.coordCache[key]++;

      let offsetLat = 0;
      let offsetLng = 0;

      const locName = (event.location || '').toUpperCase();
      const isGeneric = GENERIC_LOCATIONS.has(locName) || GENERIC_LOCATIONS.has(locName.split(',')[0]);

      if (isGeneric) {
        // LARGE JITTER for generic country-level tags (e.g. USA, Russia) to spread them across the country
        const seed = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const pseudoRandom1 = Math.sin(seed) * 10000 - Math.floor(Math.sin(seed) * 10000);
        const pseudoRandom2 = Math.cos(seed) * 10000 - Math.floor(Math.cos(seed) * 10000);

        offsetLat = (pseudoRandom1 - 0.5) * 8.0; // +/- 4 degrees
        offsetLng = (pseudoRandom2 - 0.5) * 8.0; // +/- 4 degrees
      }
      // ⭐ If not generic, we do NOT manually jitter overlapping coordinates anymore.
      // Exact overlapping pins will now be gracefully handled by MarkerCluster Spiderfying.

      const marker = L.marker([baseLat + offsetLat, baseLng + offsetLng], { icon: divIcon });

      // Bind popup - Allow MULTIPLE popups (autoClose: false)
      marker.bindPopup(createPopupContent(event, color), {
        closeButton: false,
        autoClose: false,   // Allow multiple popups
        closeOnClick: false,
        className: 'tactical-popup',
        autoPan: false // Disable autoPan when opening multiple
      });

      // Attach ID for auto-open lookup
      (marker as any)._eventId = event.id;

      // START CHANGE: Add to cluster instead of map directly
      // marker.addTo(map); 
      if (clusterGroup) {
        clusterGroup.addLayer(marker);
      } else {
        marker.addTo(map); // Fallback
      }
      // END CHANGE

      newMarkers.push(marker);
    });

    newVectors.forEach(v => v.addTo(map));
    vectorLayersRef.current = newVectors;
    markersRef.current = newMarkers;

    // AUTO-OPEN POPUP for the TOP 3 EVENTS
    setTimeout(() => {
      const topEvents = sortedEvents.slice(0, 3);
      topEvents.forEach((event, index) => {
        const targetMarker = newMarkers.find((m: any) => (m as any)._eventId === event.id);
        if (targetMarker) {
          setTimeout(() => {
            targetMarker.openPopup();
          }, index * 400 + 1000);
        }
      });
    }, 2000);

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

      {/* Live Camera Feed Overlay */}
      <LiveCameraFeed cam={activeCam} onClose={() => setActiveCam(null)} />
    </div>
  );
};

export default React.memo(SituationMap);