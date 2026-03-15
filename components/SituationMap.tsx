import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MonitorEvent, ConflictLevel, EventCategory } from '../types';
import { CATEGORY_COLORS } from '../categoryColors';
import { getIconHtml, getMilitaryAircraftIconHtml } from '../utils/icons';
import { CURATED_CAMS, LiveCam } from '../lib/camsData';
import LiveCameraFeed from './LiveCameraFeed';
import { MilitaryAircraft } from '../services/militaryAircraftService';
import { CONFLICT_TYPE_LABELS, SEVERITY_COLORS } from '../services/conflictZoneService';
import { NuclearAlert, calculateBlastZones, yieldToLabel } from '../services/nuclearAlertService';
import { getCountryBoundingBox } from '../lib/utils/GeoJSONGenerator';
import { countryShapes } from '../lib/utils/countryShapes';
import { COUNTRY_CENTROIDS } from '../lib/utils/countryCentroids';

// Fix for missing types for leaflet.markercluster
const L_any = L as any;

// Definindo o tipo na mão aqui caso queira expandir
export interface ConflictZone {
  id: string;
  name: string;
  type: string;
  severity: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  color: string;
  belligerents: string[];
  description: string;
  start_date: string;
  casualties_estimate: string;
  displaced_estimate: string;
  key_developments: string[];
  is_active: boolean;
}

const ZONE_COUNTRIES: Record<string, string[]> = {
  'Iran War Theater': ['Iran'],
  'Guerra Rússia–Ucrânia': ['Ukraine', 'Russia'],
  'Conflito Gaza–Israel': ['Israel', 'West Bank', 'Lebanon'],
  'Teatro do Líbano': ['Lebanon'],
  'Guerra Civil do Sudão': ['Sudan'],
  'Guerra Civil de Myanmar': ['Myanmar'],
  'RDC Oriental — Conflito M23': ['Democratic Republic of the Congo'],
  'Insurgência no Sahel': ['Mali', 'Niger', 'Burkina Faso']
};
interface SituationMapProps {
  events: MonitorEvent[];
  showAircraft?: boolean;
  militaryAircraft?: MilitaryAircraft[];
  showConflictZones?: boolean;
  conflictZones?: ConflictZone[];
  showNuclearAlerts?: boolean;
  nuclearAlerts?: NuclearAlert[];
}

// Helper: format source label for popup
const formatSourceLabel = (event: MonitorEvent): string => {
  const name = (event.sourceName || '').trim();
  if (!name) return '';

  // Telegram channels: strip brackets/@ from title pattern [channelname]
  if (event.sourceType === 'TELEGRAM') {
    const clean = name.replace(/^@/, '');
    // Capitalize first letter of each word
    const pretty = clean.replace(/(?:^|\s|_)(\w)/g, (_, c) => c.toUpperCase()).replace(/_/g, ' ');
    return `Telegram @${pretty}`;
  }

  if (event.sourceType === 'GOV_OFFICIAL') return `${name} (Official)`;
  return name;
};

// Helper: clean title — remove [channel] prefix from Telegram titles
const cleanTitle = (event: MonitorEvent): string => {
  if (event.sourceType === 'TELEGRAM') {
    return event.title.replace(/^\[[\w\s]+\]\s*/, '').trim();
  }
  return event.title;
};

// Helper for Popup Content
const createPopupContent = (event: MonitorEvent, color: string) => {
  const date = new Date(event.timestamp).toLocaleString();
  // Strip HTML tags from description to prevent embedded <img> tags duplicating the media
  const descText = (event.description || '').replace(/<[^>]*>/g, '').trim().substring(0, 200);
  const imageHtml = event.mediaUrl && event.mediaType !== 'video'
    ? `<img src="${event.mediaUrl}" alt="" style="width:100%;max-height:120px;object-fit:cover;border-radius:4px;margin-top:8px;margin-bottom:4px;" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'" />`
    : '';
  const title = cleanTitle(event);
  const sourceLabel = formatSourceLabel(event);
  const sourceHtml = sourceLabel
    ? `<div class="text-[10px] text-gray-500 mt-2 pt-1.5 border-t border-gray-700/60">
         <span class="text-gray-600">Source:</span> ${sourceLabel.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
       </div>`
    : '';
  const sourceLinkHtml = event.sourceUrl && sourceLabel
    ? `<div class="text-[10px] text-gray-500 mt-2 pt-1.5 border-t border-gray-700/60">
         <span class="text-gray-600">Source:</span> <a href="${event.sourceUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${sourceLabel.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</a>
       </div>`
    : sourceHtml;

  return `
    <div class="p-3 min-w-[250px]">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-3 h-3 rounded-full" style="background-color: ${color}"></span>
        <span class="text-xs font-bold text-gray-400">${event.category}</span>
        <span class="ml-auto text-xs text-gray-500">${date}</span>
      </div>
      <h3 class="font-bold text-white text-sm mb-1">${title}</h3>
      ${imageHtml}
      ${descText ? `<p class="text-xs text-gray-300 mt-2 mb-2">${descText}</p>` : ''}
      <div class="text-xs text-emerald-500 font-mono">
        ${event.location || 'Unknown Location'}
      </div>
      ${sourceLinkHtml}
    </div>
  `;
};

// ── Conflict Zone popup HTML ─────────────────────────────────────────────────
function createConflictZonePopup(zone: ConflictZone): string {
  const sev = zone.severity as keyof typeof SEVERITY_COLORS;
  const sevColor = SEVERITY_COLORS[sev] || '#ea580c';
  const typeLabel = CONFLICT_TYPE_LABELS[zone.type as keyof typeof CONFLICT_TYPE_LABELS] || zone.type;
  const startDate = zone.start_date ? new Date(zone.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const belligerentTags = (zone.belligerents || []).map(b =>
    `<span style="background:rgba(255,255,255,0.08);color:#e5e7eb;font-size:10px;padding:2px 8px;border-radius:2px;white-space:nowrap;">${b}</span>`
  ).join('');
  const developments = (zone.key_developments || []).map((d, i) =>
    `<li style="color:${i === 0 ? '#f87171' : '#9ca3af'};margin-bottom:3px;">${d}</li>`
  ).join('');

  return `
    <div style="min-width:360px;max-width:440px;background:#080d0a;border:1px solid ${sevColor}66;border-radius:4px;font-family:'Courier New',monospace;overflow:hidden;">
      <div style="background:linear-gradient(to right,${sevColor}33,transparent);padding:12px 16px;border-bottom:1px solid ${sevColor}33;display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <div>
          <div style="color:#6b7280;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:2px;">${typeLabel}</div>
          <h2 style="color:#fff;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin:0;">${zone.name}</h2>
        </div>
        <span style="background:${sevColor};color:#fff;font-size:9px;font-weight:700;padding:3px 9px;border-radius:2px;letter-spacing:0.12em;white-space:nowrap;">${zone.severity}</span>
      </div>

      <div style="padding:10px 16px;display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <div>
          <div style="color:#4b5563;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;">DATA DE INÍCIO</div>
          <div style="color:#34d399;font-size:11px;margin-top:2px;">${startDate}</div>
        </div>
        ${zone.casualties_estimate ? `<div>
          <div style="color:#4b5563;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;">VÍTIMAS</div>
          <div style="color:#f87171;font-size:11px;margin-top:2px;">${zone.casualties_estimate}</div>
        </div>` : ''}
        ${zone.displaced_estimate ? `<div>
          <div style="color:#4b5563;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;">DESLOCADOS</div>
          <div style="color:#fb923c;font-size:11px;margin-top:2px;">${zone.displaced_estimate}</div>
        </div>` : ''}
      </div>

      ${zone.description ? `<div style="padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <p style="color:#9ca3af;font-size:11px;line-height:1.6;margin:0;">${zone.description}</p>
      </div>` : ''}

      ${belligerentTags ? `<div style="padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <div style="color:#4b5563;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">BELIGERANTES</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${belligerentTags}</div>
      </div>` : ''}

      ${developments ? `<div style="padding:10px 16px;">
        <div style="color:#4b5563;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">DESENVOLVIMENTOS CHAVE</div>
        <ul style="margin:0;padding-left:14px;font-size:11px;line-height:1.8;">${developments}</ul>
      </div>` : ''}
    </div>
  `;
}

// ── Nuclear Alert popup HTML ─────────────────────────────────────────────────
function createNuclearPopup(alert: NuclearAlert): string {
  const zones = calculateBlastZones(alert.yield_kt);
  const yieldLabel = yieldToLabel(alert.yield_kt);
  const detTime = alert.detonation_time
    ? new Date(alert.detonation_time).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
    : '—';
  const verifiedBadge = alert.verified
    ? `<span style="background:#16a34a;color:#fff;font-size:9px;padding:2px 7px;border-radius:2px;letter-spacing:0.1em;">VERIFICADO</span>`
    : `<span style="background:#b45309;color:#fff;font-size:9px;padding:2px 7px;border-radius:2px;letter-spacing:0.1em;">NÃO VERIFICADO</span>`;

  const zonesTable = zones.map(z => `
    <tr>
      <td style="padding:3px 8px 3px 0;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${z.color};margin-right:5px;"></span></td>
      <td style="color:#e5e7eb;font-size:10px;padding:3px 8px 3px 0;white-space:nowrap;">${z.name}</td>
      <td style="color:#34d399;font-size:10px;font-weight:700;white-space:nowrap;">${z.radius_km >= 1 ? z.radius_km.toFixed(1) + ' km' : (z.radius_km * 1000).toFixed(0) + ' m'}</td>
    </tr>
  `).join('');

  const assessment = alert.ai_assessment;

  return `
    <div style="min-width:380px;max-width:460px;background:#08080f;border:1px solid #7c3aed99;border-radius:4px;font-family:'Courier New',monospace;overflow:hidden;">
      <div style="background:linear-gradient(to right,#7c3aed44,transparent);padding:12px 16px;border-bottom:1px solid #7c3aed33;display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <div>
          <div style="color:#a78bfa;font-size:10px;letter-spacing:0.15em;margin-bottom:2px;">☢ ALERTA NUCLEAR</div>
          <h2 style="color:#fff;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin:0;">${alert.title}</h2>
        </div>
        ${verifiedBadge}
      </div>

      <div style="padding:10px 16px;display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <div>
          <div style="color:#4b5563;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;">POTÊNCIA</div>
          <div style="color:#f87171;font-size:12px;font-weight:700;margin-top:2px;">${yieldLabel}</div>
        </div>
        <div>
          <div style="color:#4b5563;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;">ARMA</div>
          <div style="color:#e5e7eb;font-size:11px;margin-top:2px;">${alert.weapon_name || '—'}</div>
        </div>
        <div>
          <div style="color:#4b5563;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;">ATACANTE</div>
          <div style="color:#f87171;font-size:11px;margin-top:2px;">${alert.attacker || '—'}</div>
        </div>
        <div>
          <div style="color:#4b5563;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;">ALVO</div>
          <div style="color:#a78bfa;font-size:11px;margin-top:2px;">${alert.target_city || alert.target_country || '—'}</div>
        </div>
        <div style="grid-column:span 2;">
          <div style="color:#4b5563;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;">DATA/HORA</div>
          <div style="color:#34d399;font-size:11px;margin-top:2px;">${detTime}</div>
        </div>
      </div>

      <div style="padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <div style="color:#4b5563;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">ZONAS DE IMPACTO</div>
        <table style="border-collapse:collapse;width:100%;">${zonesTable}</table>
      </div>

      ${assessment ? `<div style="padding:10px 16px;">
        <div style="color:#4b5563;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">AVALIAÇÃO ESTRATÉGICA</div>
        ${assessment.immediate_effects ? `<p style="color:#f87171;font-size:10px;margin:0 0 4px 0;"><span style="color:#6b7280;">Efeitos imediatos:</span> ${assessment.immediate_effects}</p>` : ''}
        ${assessment.population_at_risk ? `<p style="color:#fb923c;font-size:10px;margin:0 0 4px 0;"><span style="color:#6b7280;">Risco à população:</span> ${assessment.population_at_risk}</p>` : ''}
        ${assessment.regional_impact ? `<p style="color:#facc15;font-size:10px;margin:0 0 4px 0;"><span style="color:#6b7280;">Impacto regional:</span> ${assessment.regional_impact}</p>` : ''}
        ${assessment.strategic_implications ? `<p style="color:#a78bfa;font-size:10px;margin:0 0 4px 0;"><span style="color:#6b7280;">Implicações estratégicas:</span> ${assessment.strategic_implications}</p>` : ''}
        ${assessment.recommended_actions ? `<p style="color:#34d399;font-size:10px;margin:0;"><span style="color:#6b7280;">Ações recomendadas:</span> ${assessment.recommended_actions}</p>` : ''}
      </div>` : ''}
    </div>
  `;
}

const SituationMap: React.FC<SituationMapProps> = ({
  events,
  showAircraft = false,
  militaryAircraft = [],
  showConflictZones = false,
  conflictZones = [],
  showNuclearAlerts = false,
  nuclearAlerts = [],
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  // Re-added clusterGroupRef
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const vectorLayersRef = useRef<L.Layer[]>([]);
  const camMarkersRef = useRef<L.Marker[]>([]);
  const aircraftMarkersRef = useRef<L.Marker[]>([]);
  const conflictZoneLayersRef = useRef<L.Layer[]>([]);
  const nuclearLayersRef = useRef<L.Layer[]>([]);
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

    // ⭐ Create custom panes upfront (must exist before any layer tries to use them)
    if (!map.getPane('conflictZones')) {
      const pane = map.createPane('conflictZones');
      pane.style.zIndex = '290';
    }
    if (!map.getPane('nuclearAlerts')) {
      const pane = map.createPane('nuclearAlerts');
      pane.style.zIndex = '310';
    }

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
        disableClusteringAtZoom: 8, // Zoom 8+ (city level) → all pins individual

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

      if (currentZoom >= 3) {
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
            <div class="relative flex items-center justify-center p-2 rounded-full border border-emerald-700 bg-black cursor-pointer hover:scale-125 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
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

      // NEW: Draw Flight Trajectory Line if Aviation
      if (event.category === EventCategory.AVIATION && event.description.includes('Origin: ')) {
        const originMatch = event.description.match(/Origin:\s+([^.]+)/);
        if (originMatch) {
          const originCountry = originMatch[1].trim();
          const centroid: [number, number] = (COUNTRY_CENTROIDS as any)[originCountry];
          if (centroid) {
            const trajectoryLine = L.polyline([centroid, [baseLat + offsetLat, baseLng + offsetLng]], {
              color: color,
              weight: 1.5,
              opacity: 0.6,
              dashArray: '4, 6',
              interactive: false
            });
            newVectors.push(trajectoryLine);
          }
        }
      }

      newMarkers.push(marker);
    });

    newVectors.forEach(v => v.addTo(map));
    vectorLayersRef.current = newVectors;
    markersRef.current = newMarkers;

    // AUTO-OPEN POPUP for the TOP 3 EVENTS (exclude aviation)
    setTimeout(() => {
      const topEvents = sortedEvents.filter(e => e.category !== EventCategory.AVIATION).slice(0, 3);
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

  // Military Aircraft Layer — separate from event markers, no clustering
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing aircraft markers
    aircraftMarkersRef.current.forEach(m => m.remove());
    aircraftMarkersRef.current = [];

    if (!showAircraft || militaryAircraft.length === 0) return;

    const newMarkers: L.Marker[] = [];
    militaryAircraft.forEach(ac => {
      if (!ac.lat || !ac.lng) return;

      const iconHtml = getMilitaryAircraftIconHtml(ac.heading, ac.isEmergency);
      const icon = L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([ac.lat, ac.lng], { icon, zIndexOffset: 500 });

      const altFt = ac.altitude ? `${ac.altitude.toLocaleString()} ft` : 'N/A';
      const spdKts = ac.speed ? `${ac.speed} kts` : 'N/A';
      const typeStr = ac.type ? `<span class="text-gray-400">${ac.type}</span> · ` : '';
      const countryStr = ac.country ? `<span class="text-gray-400">${ac.country}</span> · ` : '';
      const regStr = ac.registration ? `<span class="text-gray-500">${ac.registration}</span>` : '';
      const emergBadge = ac.isEmergency
        ? `<span class="text-red-400 font-bold animate-pulse ml-1">⚠ EMERGENCY</span>` : '';

      const popupHtml = `
        <div class="p-2 min-w-[200px]">
          <div class="flex items-center gap-2 mb-1">
            <span style="color:#94a3b8; font-size:16px;">✈</span>
            <span class="font-bold text-white text-sm">${ac.callsign}${emergBadge}</span>
          </div>
          <div class="text-xs text-gray-400 space-y-0.5">
            <div>${typeStr}${countryStr}${regStr}</div>
            <div><span class="text-gray-600">Alt:</span> ${altFt} &nbsp; <span class="text-gray-600">Spd:</span> ${spdKts}</div>
            <div class="text-[10px] text-gray-600 mt-1">Live · via adsb.lol</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { closeButton: false, className: 'tactical-popup' });
      marker.addTo(map);
      newMarkers.push(marker);
    });

    aircraftMarkersRef.current = newMarkers;
  }, [showAircraft, militaryAircraft]);

  // ── Conflict Zones Layer ──────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing conflict zone layers
    conflictZoneLayersRef.current.forEach(l => l.remove());
    conflictZoneLayersRef.current = [];

    if (!showConflictZones || conflictZones.length === 0) return;


    const newLayers: L.Layer[] = [];

    conflictZones.forEach(zone => {
      const color = zone.color || SEVERITY_COLORS[zone.severity as keyof typeof SEVERITY_COLORS] || '#ea580c';
      const radiusM = zone.radius_km * 1000;

      const countriesToDraw = ZONE_COUNTRIES[zone.name] || [];
      const geometries = countriesToDraw.map(c => countryShapes[c]).filter(Boolean);

      let baseLayer: L.Layer;

      if (geometries.length > 0) {
        // Draw country shapes for precise straight borders
        const featureCollection = {
          type: "FeatureCollection",
          features: geometries.map(geom => ({ type: "Feature", properties: {}, geometry: geom }))
        };
        baseLayer = L.geoJSON(featureCollection as any, {
          style: {
            color,
            fillColor: color,
            fillOpacity: 0.12,
            opacity: 0.7,
            weight: 2,
            dashArray: '5, 5'
          },
          pane: 'conflictZones',
          interactive: true,
        });
      } else {
        // Outer dashed ring (fallback) — tactical zone boundary
        baseLayer = L.circle([zone.center_lat, zone.center_lng], {
          radius: radiusM,
          color,
          fillColor: color,
          fillOpacity: 0.12,
          opacity: 0.7,
          weight: 2,
          dashArray: '10, 8',
          pane: 'conflictZones',
          interactive: true,
        });
      }

      baseLayer.bindPopup(createConflictZonePopup(zone), {
        maxWidth: 460,
        className: 'tactical-popup conflict-zone-popup',
        closeButton: true,
        autoPan: true,
      });

      baseLayer.addTo(map);
      newLayers.push(baseLayer);

      // Centre label — DivIcon marker at zone center
      const typeLabel = CONFLICT_TYPE_LABELS[zone.type as keyof typeof CONFLICT_TYPE_LABELS] || zone.type;
      const labelIcon = L.divIcon({
        className: '',
        html: `<div style="
          background:${color}22;
          border:1px solid ${color}66;
          border-radius:3px;
          padding:3px 8px;
          color:${color};
          font-family:'Courier New',monospace;
          font-size:10px;
          font-weight:700;
          text-transform:uppercase;
          letter-spacing:0.08em;
          white-space:nowrap;
          backdrop-filter:blur(4px);
          pointer-events:auto;
          cursor:pointer;
          text-align:center;
          line-height:1.3;
        ">
          ${zone.name}<br>
          <span style="color:${color}99;font-size:8px;font-weight:400;">${typeLabel}</span>
        </div>`,
        iconAnchor: [0, 0],
      });

      const labelMarker = L.marker([zone.center_lat, zone.center_lng], {
        icon: labelIcon,
        interactive: true,
        pane: 'conflictZones',
        zIndexOffset: -100,
      });

      labelMarker.bindPopup(createConflictZonePopup(zone), {
        maxWidth: 460,
        className: 'tactical-popup conflict-zone-popup',
        closeButton: true,
        autoPan: true,
      });

      labelMarker.addTo(map);
      newLayers.push(labelMarker);
    });

    conflictZoneLayersRef.current = newLayers;
  }, [showConflictZones, conflictZones]);

  // ── Nuclear Alert Layer ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    nuclearLayersRef.current.forEach(l => l.remove());
    nuclearLayersRef.current = [];

    if (!showNuclearAlerts || nuclearAlerts.length === 0) return;


    const newLayers: L.Layer[] = [];

    nuclearAlerts.forEach(alert => {
      const zones = calculateBlastZones(alert.yield_kt);
      const popupHtml = createNuclearPopup(alert);

      // Draw zones largest → smallest so inner circles appear on top
      zones.forEach(zone => {
        const circle = L.circle([alert.lat, alert.lng], {
          radius: zone.radius_m,
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: zone.fillOpacity,
          opacity: zone.borderOpacity,
          weight: zone.name === 'Bola de Fogo' ? 3 : 1.5,
          dashArray: zone.name === 'Zona de Fallout' ? '8, 6' : undefined,
          pane: 'nuclearAlerts',
          interactive: true,
        });

        circle.bindPopup(popupHtml, {
          maxWidth: 480,
          className: 'tactical-popup nuclear-alert-popup',
          closeButton: true,
          autoPan: true,
        });

        circle.addTo(map);
        newLayers.push(circle);
      });

      // ☢ Epicentre marker
      const epicentreIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:28px;height:28px;
          display:flex;align-items:center;justify-content:center;
          background:#dc262699;
          border:2px solid #dc2626;
          border-radius:50%;
          font-size:14px;
          animation:pulse 1.5s infinite;
          box-shadow:0 0 12px #dc2626aa;
        ">☢</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const epicentre = L.marker([alert.lat, alert.lng], {
        icon: epicentreIcon,
        zIndexOffset: 1000,
        pane: 'nuclearAlerts',
      });

      epicentre.bindPopup(popupHtml, {
        maxWidth: 480,
        className: 'tactical-popup nuclear-alert-popup',
        closeButton: true,
        autoPan: true,
      });

      epicentre.addTo(map);
      newLayers.push(epicentre);
    });

    nuclearLayersRef.current = newLayers;
  }, [showNuclearAlerts, nuclearAlerts]);

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