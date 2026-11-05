import React, { useEffect, useRef } from 'react';
import { dataUrl } from '../lib/dataUrl';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Supercluster from 'supercluster';
// Só o CSS do markercluster: os ícones de grupo reaproveitam as classes .marker-cluster.
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
import { useLocale } from '../lib/i18n';
import { CHOKEPOINT_COLOR, chokepointLevel, escapeHtml, quakeFeedUrl, quakeStyle, safeUrl } from '../lib/layers/style';
import { DEFAULT_PERIOD, type EventPeriod } from '../lib/events/balance';
import type { ChokepointsPayload } from '../lib/layers/types';

// NASA GIBS (domínio público, sem chave, CORS liberado). Usa o dia UTC anterior: o tempo
// "default" é o dia corrente, ainda com faixas faltando (07/10/2026: ~1/4 dos bytes de ontem).
const GIBS_DATE = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
const gibsLayer = (layer: string, level: number, ext: 'jpg' | 'jpeg' | 'png', opacity: number, time = GIBS_DATE, credit = `VIIRS · ${GIBS_DATE}`) =>
  L.tileLayer(`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${time}/GoogleMapsCompatible_Level${level}/{z}/{y}/{x}.${ext}`, {
    maxNativeZoom: level,
    maxZoom: 18,
    opacity,
    attribution: `Imagery: NASA GIBS / ${credit}`,
  });

// Mapa base (07/10/2026): os tiles da Esri exigem software ou assinatura ArcGIS e vetam uso
// comercial do Living Atlas. OpenFreeMap: grátis, sem chave, uso comercial permitido,
// atribuição obrigatória (openfreemap.org).
const OPENFREEMAP_ATTRIBUTION = '<a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

const fmt = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));

// Zoom mínimo (MapLibre) de cada camada de nomes do estilo escuro do OpenFreeMap.
const LABEL_MIN_ZOOM: Record<string, number> = {
  place_country_major: 1, place_country_minor: 3, place_country_other: 3,
  place_state: 5, place_city_large: 4, place_city: 6, place_town: 8,
  place_village: 10, place_suburb: 11, place_other: 11,
  water_name: 4, highway_name_motorway: 9, highway_name_other: 11,
};

// Acima deste zoom os pinos aparecem separados; pinos no mesmo ponto viram lista.
const CLUSTER_MAX_ZOOM = 9;

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
  
  // Novas Props
  showSatelliteBase?: boolean;
  showRadar?: boolean;
  showWebSDR?: boolean;
  showSatellites?: boolean;
  showSafecast?: boolean;
  // Camadas de dados (07/10/2026)
  showDailySatellite?: boolean;
  showNightLights?: boolean;
  showQuakes?: boolean;
  period?: EventPeriod;
  showChokepoints?: boolean;
  /** Evento a destacar: o mapa aproxima e abre o popup (LIVE WIRE "ver no mapa", ?event=). */
  focusEventId?: string | null;
}

// Helper: format source label for popup
const formatSourceLabel = (event: MonitorEvent): string => {
  const name = (event.sourceName || '').trim();
  if (!name) return '';

  // Telegram channels: strip brackets/@ from title pattern [channelname]
  if (event.sourceType === 'TELEGRAM') {
    if (name.startsWith('@')) return `Telegram ${name}`; // canal próprio: já vem como @canal
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
  const mediaSrc = safeUrl(event.mediaUrl);
  const sourceHref = safeUrl(event.sourceUrl);
  const imageHtml = mediaSrc && event.mediaType !== 'video'
    ? `<img src="${mediaSrc}" alt="" style="width:100%;max-height:120px;object-fit:cover;border-radius:4px;margin-top:8px;margin-bottom:4px;" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'" />`
    : '';
  const title = cleanTitle(event);
  const sourceLabel = formatSourceLabel(event);
  const sourceHtml = sourceLabel
    ? `<div class="text-[10px] text-gray-500 mt-2 pt-1.5 border-t border-gray-700/60">
         <span class="text-gray-600">Source:</span> ${sourceLabel.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
       </div>`
    : '';
  const sourceLinkHtml = sourceHref && sourceLabel
    ? `<div class="text-[10px] text-gray-500 mt-2 pt-1.5 border-t border-gray-700/60">
         <span class="text-gray-600">Source:</span> <a href="${sourceHref}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${sourceLabel.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</a>
       </div>`
    : sourceHtml;

  return `
    <div class="p-3 min-w-[250px]">
      <div class="flex items-center gap-2 mb-2">
        <span class="w-3 h-3 rounded-full" style="background-color: ${color}"></span>
        <span class="text-xs font-bold text-gray-400">${escapeHtml(event.category)}</span>
        <span class="ml-auto text-xs text-gray-500">${date}</span>
      </div>
      <h3 class="font-bold text-white text-sm mb-1">${escapeHtml(title)}</h3>
      ${imageHtml}
      ${descText ? `<p class="text-xs text-gray-300 mt-2 mb-2">${escapeHtml(descText)}</p>` : ''}
      <div class="text-xs text-emerald-500 font-mono">
        ${escapeHtml(event.location || 'Unknown Location')}
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
    `<span style="background:rgba(255,255,255,0.08);color:#e5e7eb;font-size:10px;padding:2px 8px;border-radius:2px;white-space:nowrap;">${escapeHtml(b)}</span>`
  ).join('');
  const developments = (zone.key_developments || []).map((d, i) =>
    `<li style="color:${i === 0 ? '#f87171' : '#9ca3af'};margin-bottom:3px;">${escapeHtml(d)}</li>`
  ).join('');

  return `
    <div style="min-width:360px;max-width:440px;background:#080d0a;border:1px solid ${sevColor}66;border-radius:4px;font-family:'Courier New',monospace;overflow:hidden;">
      <div style="background:linear-gradient(to right,${sevColor}33,transparent);padding:12px 16px;border-bottom:1px solid ${sevColor}33;display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <div>
          <div style="color:#6b7280;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:2px;">${escapeHtml(typeLabel)}</div>
          <h2 style="color:#fff;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin:0;">${escapeHtml(zone.name)}</h2>
        </div>
        <span style="background:${sevColor};color:#fff;font-size:9px;font-weight:700;padding:3px 9px;border-radius:2px;letter-spacing:0.12em;white-space:nowrap;">${escapeHtml(zone.severity)}</span>
      </div>

      <div style="padding:10px 16px;display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <div>
          <div style="color:#4b5563;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;">DATA DE INÍCIO</div>
          <div style="color:#34d399;font-size:11px;margin-top:2px;">${startDate}</div>
        </div>
        ${zone.casualties_estimate ? `<div>
          <div style="color:#4b5563;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;">VÍTIMAS</div>
          <div style="color:#f87171;font-size:11px;margin-top:2px;">${escapeHtml(zone.casualties_estimate)}</div>
        </div>` : ''}
        ${zone.displaced_estimate ? `<div>
          <div style="color:#4b5563;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;">DESLOCADOS</div>
          <div style="color:#fb923c;font-size:11px;margin-top:2px;">${escapeHtml(zone.displaced_estimate)}</div>
        </div>` : ''}
      </div>

      ${zone.description ? `<div style="padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <p style="color:#9ca3af;font-size:11px;line-height:1.6;margin:0;">${escapeHtml(zone.description)}</p>
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
          <h2 style="color:#fff;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin:0;">${escapeHtml(alert.title)}</h2>
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
          <div style="color:#e5e7eb;font-size:11px;margin-top:2px;">${escapeHtml(alert.weapon_name || '—')}</div>
        </div>
        <div>
          <div style="color:#4b5563;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;">ATACANTE</div>
          <div style="color:#f87171;font-size:11px;margin-top:2px;">${escapeHtml(alert.attacker || '—')}</div>
        </div>
        <div>
          <div style="color:#4b5563;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;">ALVO</div>
          <div style="color:#a78bfa;font-size:11px;margin-top:2px;">${escapeHtml(alert.target_city || alert.target_country || '—')}</div>
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
        ${assessment.immediate_effects ? `<p style="color:#f87171;font-size:10px;margin:0 0 4px 0;"><span style="color:#6b7280;">Efeitos imediatos:</span> ${escapeHtml(assessment.immediate_effects)}</p>` : ''}
        ${assessment.population_at_risk ? `<p style="color:#fb923c;font-size:10px;margin:0 0 4px 0;"><span style="color:#6b7280;">Risco à população:</span> ${escapeHtml(assessment.population_at_risk)}</p>` : ''}
        ${assessment.regional_impact ? `<p style="color:#facc15;font-size:10px;margin:0 0 4px 0;"><span style="color:#6b7280;">Impacto regional:</span> ${escapeHtml(assessment.regional_impact)}</p>` : ''}
        ${assessment.strategic_implications ? `<p style="color:#a78bfa;font-size:10px;margin:0 0 4px 0;"><span style="color:#6b7280;">Implicações estratégicas:</span> ${escapeHtml(assessment.strategic_implications)}</p>` : ''}
        ${assessment.recommended_actions ? `<p style="color:#34d399;font-size:10px;margin:0;"><span style="color:#6b7280;">Ações recomendadas:</span> ${escapeHtml(assessment.recommended_actions)}</p>` : ''}
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
  showSatelliteBase = false,
  showRadar = false,
  showWebSDR = false,
  showSatellites = false,
  showSafecast = false,
  showDailySatellite = false,
  showNightLights = false,
  showQuakes = false,
  period = DEFAULT_PERIOD,
  showChokepoints = false,
  focusEventId = null,
}) => {
  const { t, locale } = useLocale();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const eventsLayerRef = useRef<L.LayerGroup | null>(null);
  const markerCacheRef = useRef<Map<string, L.Marker>>(new Map());
  const pointsRef = useRef<Map<string, { event: MonitorEvent; lat: number; lng: number }>>(new Map());
  const markersRef = useRef<L.Marker[]>([]);
  const vectorLayersRef = useRef<L.Layer[]>([]);
  const camMarkersRef = useRef<L.Marker[]>([]);
  const aircraftMarkersRef = useRef<L.Marker[]>([]);
  const conflictZoneLayersRef = useRef<L.Layer[]>([]);
  const nuclearLayersRef = useRef<L.Layer[]>([]);
  const [activeCam, setActiveCam] = React.useState<LiveCam | null>(null);

  // Refs for the new dynamically toggled map layers
  const webSdrGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const satellitesGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  // Chuva em tempo quase real: NASA IMERG a cada 30 min (~6 h de atraso), domínio público.
  // Substitui a RainViewer, que é só para uso pessoal/educacional (e cujo /radar/now já dava 400).
  const radarOverlayRef = useRef<L.TileLayer>(gibsLayer('IMERG_Precipitation_Rate_30min', 6, 'png', 0.7, 'default', 'GPM IMERG'));
  const radiationOverlayRef = useRef<L.TileLayer>(L.tileLayer('https://s3.amazonaws.com/bgeigie.safecast.org/tiles/{z}/{x}/{y}.png', { opacity: 0.7, minZoom: 3, maxZoom: 16 }));
  // 17/09/2026: CARTO passou a exigir API key e o mapa foi para a Esri; 07/10/2026: Esri trocada
  // pelo OpenFreeMap por causa dos termos de uso comercial (ver OPENFREEMAP_ATTRIBUTION).
  // Criado depois do primeiro render: o MapLibre pesa ~290 KB (gzip) e vem em chunk separado.
  const darkTilesRef = useRef<L.Layer | null>(null);
  // Satélite sem nuvens: NASA Blue Marble Next Generation (~500 m/pixel, domínio público).
  const satTilesRef = useRef<L.TileLayer>(gibsLayer('BlueMarble_NextGeneration', 8, 'jpeg', 1, 'default', 'Blue Marble'));
  const dailySatRef = useRef<L.TileLayer>(gibsLayer('VIIRS_NOAA20_CorrectedReflectance_TrueColor', 9, 'jpg', 1));
  // Banda dia/noite do VIIRS: luzes das cidades à noite — apagões aparecem como manchas escuras.
  const nightLightsRef = useRef<L.TileLayer>(gibsLayer('VIIRS_NOAA20_DayNightBand', 7, 'png', 0.9));
  const quakesGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const chokepointsGroupRef = useRef<L.LayerGroup>(L.layerGroup());

  // 1. Initialize Map
  useEffect(() => {
    console.log('SituationMap v2.1 Loaded - Smart Clustering');
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent double init

    const map = L.map(mapContainerRef.current, {
      center: [30, 15],
      zoom: 2.5,
      zoomControl: false,
      attributionControl: true,
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

    // Map Instance Setup
    mapInstanceRef.current = map;
    // Créditos dos mapas (OpenFreeMap/OSM exigem atribuição; NASA pede citação).
    map.attributionControl.setPrefix(false).setPosition('topright');
    Promise.all([
      import('@maplibre/maplibre-gl-leaflet'),
      // @ts-expect-error -- CSS sem declaração de tipos; o Vite injeta a folha de estilo
      import('maplibre-gl/dist/maplibre-gl.css'),
    ])
      .then(([{ maplibreGL }]) => {
        if (mapInstanceRef.current !== map) return;
        darkTilesRef.current = maplibreGL({ style: 'https://tiles.openfreemap.org/styles/dark', attributionControl: { customAttribution: OPENFREEMAP_ATTRIBUTION } });
        if (!map.hasLayer(satTilesRef.current)) darkTilesRef.current.addTo(map);
        // Menos nomes no mapa (05/11/2026): no estilo original cidades e mares aparecem
        // desde a visão do mundo e disputam espaço com os eventos. Cada tipo de nome
        // passa a surgir só a partir de um zoom (zoom do MapLibre = zoom do Leaflet − 1).
        const gl = (darkTilesRef.current as any).getMaplibreMap?.();
        const thinLabels = () => {
          for (const [id, minzoom] of Object.entries(LABEL_MIN_ZOOM)) {
            const layer = gl.getLayer(id);
            if (layer) gl.setLayerZoomRange(id, minzoom, layer.maxzoom ?? 24);
          }
        };
        if (gl) gl.isStyleLoaded() ? thinLabels() : gl.once('styledata', thinLabels);
      })
      .catch(err => console.error('Mapa base (OpenFreeMap) falhou:', err));

    // 4. Fetch and populate WebSDR layer (Layer is isolated in Ref, visibility controlled by showWebSDR check)
    fetch('/data/webSdrData.json')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        data.forEach((sdr: any) => {
          const icon = L.divIcon({
            className: 'bg-transparent',
            html: `<div class="relative flex items-center justify-center p-1.5 rounded-full border border-blue-500 bg-black/80 cursor-pointer shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                     <span style="font-size:12px;">📡</span>
                   </div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          const marker = L.marker([sdr.coordinates.lat, sdr.coordinates.lng], { icon })
            .bindPopup(`
              <div class="p-3 min-w-[200px] font-mono text-xs bg-black text-gray-200">
                <h3 class="font-bold text-blue-400 text-sm mb-1">${escapeHtml(sdr.name)}</h3>
                <div class="text-gray-400 mb-2">${escapeHtml(sdr.location)}</div>
                <div class="text-gray-500 mb-3">Frequências: ${escapeHtml(sdr.frequency_range)}</div>
                <a href="${safeUrl(sdr.url)}" target="_blank" rel="noopener noreferrer" class="block w-full text-center text-white bg-blue-600 px-2 py-1.5 rounded hover:bg-blue-500 transition">ABRIR WEBSDR</a>
              </div>
            `, { className: 'tactical-popup' });
          webSdrGroupRef.current.addLayer(marker);
        });
      })
      .catch(console.error);

    // 5. Setup Satellites Update Loop
    let satMarkers: Record<string, L.Marker> = {};
    const updateSatellites = async () => {
      try {
        const { getSatellitePositions } = await import('../services/satelliteTracker');
        const positions = await getSatellitePositions();
        
        positions.forEach(pos => {
          const icon = L.divIcon({
            className: 'bg-transparent',
            html: `<div class="relative flex items-center justify-center p-1 rounded-full border border-purple-500 bg-black/80 cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-transform duration-500">
                     <span style="font-size:14px;">🛰️</span>
                   </div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          if (satMarkers[pos.id]) {
            satMarkers[pos.id].setLatLng([pos.lat, pos.lng]);
            const popup = satMarkers[pos.id].getPopup();
            if (popup && popup.isOpen()) {
              popup.setContent(`
                <div class="p-2 font-mono text-xs bg-black text-gray-200">
                  <div class="text-purple-400 font-bold mb-1">${escapeHtml(pos.name)}</div>
                  <div class="text-gray-400">Altitude: ${Math.round(pos.alt)} km</div>
                </div>
              `);
            }
          } else {
            const m = L.marker([pos.lat, pos.lng], { icon })
              .bindPopup(`
                <div class="p-2 font-mono text-xs bg-black text-gray-200">
                  <div class="text-purple-400 font-bold mb-1">${escapeHtml(pos.name)}</div>
                  <div class="text-gray-400">Altitude: ${Math.round(pos.alt)} km</div>
                </div>
              `, { className: 'tactical-popup' });
            satMarkers[pos.id] = m;
            satellitesGroupRef.current.addLayer(m);
          }
        });
      } catch (err) {
        console.error('Falha ao atualizar satélites', err);
      }
    };

    updateSatellites();
    (window as any).satInterval = setInterval(updateSatellites, 5000);

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
        if ((window as any).satInterval) {
          clearInterval((window as any).satInterval);
          (window as any).satInterval = null;
        }
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersRef.current = [];
    };
  }, []);

    // Lógica para Troca Base TileLayer
    useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      if (showSatelliteBase) {
        if (darkTilesRef.current) map.removeLayer(darkTilesRef.current);
        satTilesRef.current.addTo(map);
      } else {
        map.removeLayer(satTilesRef.current);
        darkTilesRef.current?.addTo(map);
      }
    }, [showSatelliteBase]);
  
    // Lógica para Layers Auxiliares
    useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      if (showRadar) radarOverlayRef.current.addTo(map); else map.removeLayer(radarOverlayRef.current);
    }, [showRadar]);

    useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      if (showSafecast) radiationOverlayRef.current.addTo(map); else map.removeLayer(radiationOverlayRef.current);
    }, [showSafecast]);

    useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      if (showWebSDR) webSdrGroupRef.current.addTo(map); else map.removeLayer(webSdrGroupRef.current);
    }, [showWebSDR]);

    useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      if (showSatellites) satellitesGroupRef.current.addTo(map); else map.removeLayer(satellitesGroupRef.current);
    }, [showSatellites]);

    useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      if (showDailySatellite) dailySatRef.current.addTo(map); else map.removeLayer(dailySatRef.current);
    }, [showDailySatellite]);

    useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      if (showNightLights) nightLightsRef.current.addTo(map); else map.removeLayer(nightLightsRef.current);
    }, [showNightLights]);

    // Terremotos M4.5+ do período escolhido, direto da USGS (CORS liberado).
    useEffect(() => {
      const map = mapInstanceRef.current;
      const group = quakesGroupRef.current;
      if (!map) return;
      if (!showQuakes) { map.removeLayer(group); return; }
      group.addTo(map);
      let cancelled = false;
      const load = async () => {
        try {
          const res = await fetch(quakeFeedUrl(period));
          if (!res.ok || cancelled) return;
          const data = await res.json();
          group.clearLayers();
          for (const f of data?.features ?? []) {
            const [lon, lat, depth] = f.geometry?.coordinates ?? [];
            const { mag, place, time, url } = f.properties ?? {};
            if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(mag)) continue;
            const { radius, color } = quakeStyle(mag, (Date.now() - time) / 3_600_000);
            L.circleMarker([lat, lon], { radius, color, weight: 1.5, fillColor: color, fillOpacity: 0.35 })
              .bindPopup(`
                <div class="p-3 min-w-[220px] font-mono text-xs bg-black text-gray-200">
                  <div class="text-[10px] text-gray-500 tracking-widest mb-1">${escapeHtml(t.map.quake.kicker)}</div>
                  <h3 class="font-bold text-sm mb-1" style="color:${color}">M${escapeHtml(mag.toFixed(1))} · ${escapeHtml(place)}</h3>
                  <div class="text-gray-400">${escapeHtml(new Date(time).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' }))}</div>
                  <div class="text-gray-500 mb-2">${escapeHtml(fmt(t.map.quake.depth, { d: Number.isFinite(depth) ? Math.round(depth) : '—' }))}</div>
                  <a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer" class="text-gray-400 underline hover:text-white">${escapeHtml(t.map.quake.open)} ↗</a>
                </div>`, { className: 'tactical-popup' })
              .addTo(group);
          }
        } catch { /* mantém a última leitura */ }
      };
      load();
      const interval = setInterval(load, 10 * 60 * 1000);
      return () => { cancelled = true; clearInterval(interval); };
    }, [showQuakes, period, t, locale]);

    // Gargalos marítimos: chokepoints.json publicado pelo worker (FMI PortWatch).
    useEffect(() => {
      const map = mapInstanceRef.current;
      const group = chokepointsGroupRef.current;
      if (!map) return;
      if (!showChokepoints) { map.removeLayer(group); return; }
      group.addTo(map);
      let cancelled = false;
      (async () => {
        try {
          const res = await fetch(dataUrl('chokepoints.json'));
          if (!res.ok || cancelled) return;
          const data: ChokepointsPayload = await res.json();
          group.clearLayers();
          const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
          for (const c of data?.chokepoints ?? []) {
            const level = chokepointLevel(c.changePct, c.baselineAvg);
            const color = CHOKEPOINT_COLOR[level];
            const pct = `${c.changePct > 0 ? '+' : ''}${nf.format(c.changePct)}%`;
            const alarming = level === 'collapse' || level === 'disrupted';
            L.circleMarker([c.lat, c.lon], { radius: alarming ? 9 : 7, color, weight: 2, fillColor: color, fillOpacity: 0.35 })
              .bindTooltip(`${escapeHtml(c.name)} ${level === 'low-traffic' ? '' : pct}`, {
                permanent: alarming,
                direction: 'right',
                className: 'chokepoint-tooltip text-[10px]',
              })
              .bindPopup(`
                <div class="p-3 min-w-[240px] font-mono text-xs bg-black text-gray-200">
                  <div class="text-[10px] text-gray-500 tracking-widest mb-1">${escapeHtml(t.map.chokepoint.kicker)}</div>
                  <h3 class="font-bold text-sm mb-1" style="color:${color}">${escapeHtml(c.name)} · ${escapeHtml(t.map.chokepoint.levels[level])}</h3>
                  ${level === 'low-traffic' ? '' : `<div class="text-lg font-bold mb-1" style="color:${color}">${escapeHtml(pct)}</div>`}
                  <div class="text-gray-300">${escapeHtml(fmt(t.map.chokepoint.recent, { n: data.windowDays, v: nf.format(c.recentAvg) }))}</div>
                  <div class="text-gray-400">${escapeHtml(fmt(t.map.chokepoint.baseline, { span: data.baselineSpan, v: nf.format(c.baselineAvg) }))}</div>
                  ${level === 'low-traffic' ? `<div class="text-gray-500 mt-1">${escapeHtml(t.map.chokepoint.lowTraffic)}</div>` : ''}
                  <div class="text-gray-600 mt-2">${escapeHtml(fmt(t.map.chokepoint.lastDate, { d: c.lastDate }))} · <a href="${escapeHtml(data.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="underline hover:text-white">${escapeHtml(data.source)} ↗</a></div>
                </div>`, { className: 'tactical-popup' })
              .addTo(group);
          }
        } catch { /* mantém a última leitura */ }
      })();
      return () => { cancelled = true; };
    }, [showChokepoints, t, locale]);

  // 2. Marcadores de eventos com Supercluster (05/11/2026).
  // Antes: leaflet.markercluster criava um marcador HTML para CADA evento, visível ou
  // não, e o consumo de memória obrigava a limitar o mapa a 150 eventos. Agora os
  // grupos são calculados pelo Supercluster e só o que está na tela vira marcador
  // (cache por id para não recriar a cada movimento).
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!eventsLayerRef.current) eventsLayerRef.current = L.layerGroup().addTo(map);
    const layer = eventsLayerRef.current;

    // Clear existing vector layers
    if (vectorLayersRef.current) {
      vectorLayersRef.current.forEach(v => map.removeLayer(v));
      vectorLayersRef.current = [];
    }
    layer.clearLayers();
    markerCacheRef.current.clear();
    markersRef.current = [];

    const newVectors: L.Layer[] = [];

    // Identify Top 5 Recent Events for GLOW effect
    const sortedEvents = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentEventIds = new Set(sortedEvents.slice(0, 5).map(e => e.id));

    // 1. Render Cameras (Only visible on Zoom >= 3)
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
          const res = await fetch(dataUrl('cams.json'));
          if (res.ok) {
            dynamicCams = await res.json();
          }
        } catch (e) { /* ignore if not exist yet */ }

        // Merge curated ones with dynamic ones
        const allCams = [...CURATED_CAMS];
        dynamicCams.forEach(dc => {
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
          marker.on('click', () => setActiveCam(cam));
          camMarkersRef.current.push(marker);
        });
      }
    };

    renderCameras();
    map.on('zoomend', renderCameras);

    // Rótulos genéricos (país/região inteiros) ganham um deslocamento fixo por id,
    // para não empilhar dezenas de pinos no centro do país.
    const GENERIC_LOCATIONS = new Set([
      'BRAZIL', 'BRASIL', 'RUSSIA', 'RÚSSIA', 'IRAN', 'IRÃ', 'ISRAEL',
      'UKRAINE', 'UCRÂNIA', 'USA', 'UNITED STATES', 'CHINA', 'TAIWAN',
      'SYRIA', 'SÍRIA', 'LEBANON', 'LÍBANO', 'INDIA', 'ÍNDIA',
      'AFRICA', 'SOUTH AMERICA', 'EUROPE', 'NORTH AMERICA'
    ]);

    const byId = new Map<string, { event: MonitorEvent; lat: number; lng: number }>();
    const features: any[] = [];

    events.forEach(event => {
      const color = CATEGORY_COLORS[event.category] || '#9ca3af';

      // AREA events (Polygons)
      if (event.alertGeometry) {
        const polygon = L.geoJSON(event.alertGeometry as any, {
          style: { color, weight: 1, fillColor: color, fillOpacity: 0.35, stroke: true }
        });
        polygon.bindPopup(createPopupContent(event, color), { closeButton: false, className: 'tactical-popup' });
        newVectors.push(polygon);
      }

      const baseLat = event.coordinates.lat;
      const baseLng = event.coordinates.lng;
      if (Math.abs(baseLat) < 0.1 && Math.abs(baseLng) < 0.1) return; // Null Island

      let lat = baseLat;
      let lng = baseLng;
      const locName = (event.location || '').toUpperCase();
      if (GENERIC_LOCATIONS.has(locName) || GENERIC_LOCATIONS.has(locName.split(',')[0])) {
        const seed = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const r1 = Math.sin(seed) * 10000 - Math.floor(Math.sin(seed) * 10000);
        const r2 = Math.cos(seed) * 10000 - Math.floor(Math.cos(seed) * 10000);
        lat += (r1 - 0.5) * 8.0;
        lng += (r2 - 0.5) * 8.0;
      }

      byId.set(event.id, { event, lat, lng });
      features.push({ type: 'Feature', properties: { id: event.id }, geometry: { type: 'Point', coordinates: [lng, lat] } });

      // Flight trajectory line for aviation
      if (event.category === EventCategory.AVIATION && event.description.includes('Origin: ')) {
        const originMatch = event.description.match(/Origin:\s+([^.]+)/);
        const centroid: [number, number] | undefined = originMatch ? (COUNTRY_CENTROIDS as any)[originMatch[1].trim()] : undefined;
        if (centroid) {
          newVectors.push(L.polyline([centroid, [lat, lng]], { color, weight: 1.5, opacity: 0.6, dashArray: '4, 6', interactive: false }));
        }
      }
    });

    newVectors.forEach(v => v.addTo(map));
    vectorLayersRef.current = newVectors;
    pointsRef.current = byId;

    const index = new Supercluster({ radius: 70, maxZoom: CLUSTER_MAX_ZOOM });
    index.load(features);

    const eventMarker = (id: string): L.Marker => {
      const { event, lat, lng } = byId.get(id)!;
      const color = CATEGORY_COLORS[event.category] || '#9ca3af';
      const isWar = event.conflictLevel === ConflictLevel.STATE_WAR || event.conflictLevel === ConflictLevel.CIVIL_WAR;
      let html = getIconHtml(event.category, event.severity, isWar);

      // ROTATION LOGIC FOR PLANES/SHIPS
      let heading = (event as any).heading ?? (event as any).metadata?.heading;
      if (heading === undefined && event.description) {
        const match = event.description.match(/Heading:\s*([\d.-]+)/i);
        if (match) heading = parseFloat(match[1]);
      }
      if (((event.category as string) === 'TRANSPORT' || event.category === 'AVIATION') && typeof heading === 'number') {
        html = `<div style="transform: rotate(${heading}deg); transform-origin: center; transition: transform 0.5s ease-out;">${html}</div>`;
      }

      const size = isWar ? 42 : 36;
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'bg-transparent' + (recentEventIds.has(event.id) ? ' recent-event-glow' : ''),
          html,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2]
        })
      });
      marker.bindPopup(createPopupContent(event, color), {
        closeButton: false,
        autoClose: false,   // Allow multiple popups
        closeOnClick: false,
        className: 'tactical-popup',
        autoPan: false
      });
      (marker as any)._eventId = event.id;
      return marker;
    };

    const clusterMarker = (c: any): L.Marker => {
      const [lng, lat] = c.geometry.coordinates;
      const n = c.properties.point_count as number;
      const tier = n < 10 ? ['small', 40] : n < 100 ? ['medium', 50] : ['large', 60];
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          html: `<div><span>${c.properties.point_count_abbreviated}</span></div>`,
          className: `marker-cluster marker-cluster-${tier[0]} tactical-cluster`,
          iconSize: new L.Point(tier[1] as number, tier[1] as number)
        })
      });
      marker.on('click', () => {
        const zoom = index.getClusterExpansionZoom(c.properties.cluster_id);
        if (zoom <= CLUSTER_MAX_ZOOM) {
          map.flyTo([lat, lng], zoom, { duration: 0.5 });
          return;
        }
        // Pinos no mesmo ponto exato: lista os eventos em vez de separar.
        const leaves = index.getLeaves(c.properties.cluster_id, 30);
        const items = leaves.map((f: any) => {
          const e = byId.get(f.properties.id)?.event;
          if (!e) return '';
          const color = CATEGORY_COLORS[e.category] || '#9ca3af';
          const title = e.title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return `<li style="border-left:2px solid ${color};padding-left:6px;margin:4px 0">${title}</li>`;
        }).join('');
        marker.bindPopup(`<ul style="max-height:260px;overflow:auto;font-size:11px;margin:0;padding:0;list-style:none">${items}</ul>`, { className: 'tactical-popup', maxWidth: 320 }).openPopup();
      });
      return marker;
    };

    const cache = markerCacheRef.current;
    const render = () => {
      const b = map.getBounds().pad(0.2);
      const wide = b.getEast() - b.getWest() >= 360;
      const bbox: [number, number, number, number] = [
        wide ? -180 : Math.max(-180, b.getWest()), Math.max(-85, b.getSouth()),
        wide ? 180 : Math.min(180, b.getEast()), Math.min(85, b.getNorth()),
      ];
      const items = index.getClusters(bbox, Math.round(map.getZoom()));
      const wanted = new Set<string>();
      const visibleEvents: L.Marker[] = [];

      for (const item of items) {
        const isCluster = !!item.properties.cluster;
        const key = isCluster ? `c${item.properties.cluster_id}` : `e${item.properties.id}`;
        wanted.add(key);
        let marker = cache.get(key);
        if (!marker) {
          marker = isCluster ? clusterMarker(item) : eventMarker(item.properties.id);
          cache.set(key, marker);
        }
        if (!layer.hasLayer(marker)) layer.addLayer(marker);
        if (!isCluster) visibleEvents.push(marker);
      }
      // Remove o que saiu da tela, menos marcadores com popup aberto.
      layer.eachLayer((m: any) => {
        const key = m._eventId ? `e${m._eventId}` : [...cache.entries()].find(([, v]) => v === m)?.[0];
        if (key && !wanted.has(key) && !m.isPopupOpen?.()) layer.removeLayer(m);
      });
      markersRef.current = visibleEvents;
    };

    render();
    map.on('moveend', render);

    // AUTO-OPEN POPUP for the TOP 3 visible EVENTS (exclude aviation)
    const autoOpen = setTimeout(() => {
      sortedEvents.filter(e => e.category !== EventCategory.AVIATION).slice(0, 3).forEach((event, i) => {
        const m: any = markersRef.current.find((mk: any) => mk._eventId === event.id);
        if (m) setTimeout(() => m.openPopup(), i * 400 + 1000);
      });
    }, 2000);

    return () => {
      map.off('moveend', render);
      map.off('zoomend', renderCameras);
      clearTimeout(autoOpen);
    };
  }, [events]); // Only re-render when events list changes

  // Destaque de um evento (05/11/2026): aproxima até o pino sair do grupo e abre o popup
  // (LIVE WIRE "ver no mapa", ?event=).
  useEffect(() => {
    if (!focusEventId) return;
    let tries = 0;
    let step = 0; // 0: ainda não moveu; 1: zoom regional; 2: zoom em que nada agrupa
    const timer = setInterval(() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      const marker: any = markersRef.current.find((m: any) => m._eventId === focusEventId);
      if (marker) {
        clearInterval(timer);
        marker.openPopup();
        return;
      }
      const point = pointsRef.current.get(focusEventId);
      tries++;
      if (point && step === 0) {
        step = 1;
        map.setView([point.lat, point.lng], Math.max(map.getZoom(), 6));
      } else if (point && step === 1 && tries > 6) {
        step = 2; // continua dentro de um grupo: aproxima até separar
        map.setView([point.lat, point.lng], CLUSTER_MAX_ZOOM + 1);
      }
      if (tries > 24) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [focusEventId, events]);

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
      const typeStr = ac.type ? `<span class="text-gray-400">${escapeHtml(ac.type)}</span> · ` : '';
      const countryStr = ac.country ? `<span class="text-gray-400">${escapeHtml(ac.country)}</span> · ` : '';
      const regStr = ac.registration ? `<span class="text-gray-500">${escapeHtml(ac.registration)}</span>` : '';
      const emergBadge = ac.isEmergency
        ? `<span class="text-red-400 font-bold animate-pulse ml-1">⚠ EMERGENCY</span>` : '';

      const popupHtml = `
        <div class="p-2 min-w-[200px]">
          <div class="flex items-center gap-2 mb-1">
            <span style="color:#94a3b8; font-size:16px;">✈</span>
            <span class="font-bold text-white text-sm">${escapeHtml(ac.callsign)}${emergBadge}</span>
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
          ${escapeHtml(zone.name)}<br>
          <span style="color:${color}99;font-size:8px;font-weight:400;">${escapeHtml(typeLabel)}</span>
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