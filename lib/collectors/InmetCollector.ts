import { BaseCollector, CollectorConfig } from './BaseCollector';
import { SupabaseClient } from '@supabase/supabase-js';
import { MonitorEvent, EventCategory, Severity, SourceType } from '../../types';

export class InmetCollector extends BaseCollector {
    constructor(supabase: SupabaseClient) {
        const config: CollectorConfig = {
            name: 'INMET_WEATHER',
            cacheDurationSeconds: 1800, // 30 mins (Weather alerts don't change every minute)
            rateLimitPerMinute: 10,
            maxRetries: 3,
            circuitBreakerThreshold: 5,
            circuitBreakerTimeout: 300
        };
        super(config, supabase);
    }

    protected async fetchData(): Promise<MonitorEvent[]> {
        const allEvents: MonitorEvent[] = [];
        try {
            // INMET API for active alerts in Brazil
            const url = 'https://apiprevmet3.inmet.gov.br/avisos/ativos';
            const response = await fetch(url, { signal: AbortSignal.timeout(15000) });

            if (!response.ok) {
                console.warn(`[InmetCollector] HTTP ${response.status} from INMET API`);
                return [];
            }

            const data = await response.json();

            // The API returns today's and future alerts. We focus on "hoje" (today).
            const activeAlerts = data?.hoje || [];

            // INMET returns an entry for EACH municipality affected by the same alert. 
            // We need to group them by id_aviso to prevent creating 500 identical events.
            const uniqueAlertsMap = new Map<number, any>();
            for (const alert of activeAlerts) {
                if (!uniqueAlertsMap.has(alert.id_aviso)) {
                    uniqueAlertsMap.set(alert.id_aviso, alert);
                }
            }

            const uniqueAlerts = Array.from(uniqueAlertsMap.values());

            for (const alert of uniqueAlerts) {
                // We only care about SEVERE/CRITICAL alerts for the map (Red alerts = Grande Perigo)
                // INMET id_severidade: 1=Perigo Potencial(Amarelo), 2=Perigo(Laranja), 3=Grande Perigo(Vermelho)
                // To avoid spamming, we only collect "Grande Perigo" (3) or "Perigo" (2)
                const severidadeId = parseInt(alert.id_severidade);
                if (severidadeId < 2) continue; // Skip Amarelo

                const isCritical = severidadeId === 3;

                // Parse coordinates from Polygon if available
                let lat = -15.7801; // Default Brazil center
                let lng = -47.9292;
                let alertGeometry = undefined;

                if (alert.poligono) {
                    try {
                        const polyConfig = JSON.parse(alert.poligono);
                        alertGeometry = polyConfig;
                        // Use the first coordinate of the first polygon ring as a centroid approximation
                        if (polyConfig.coordinates && polyConfig.coordinates[0] && polyConfig.coordinates[0][0]) {
                            const [lonGeo, latGeo] = polyConfig.coordinates[0][0];
                            lat = latGeo;
                            lng = lonGeo;
                        }
                    } catch (e) {
                        // Fallback safely
                    }
                }

                allEvents.push({
                    id: `inmet_${alert.id_aviso}`,
                    title: `[ALERTA BRASIL] ${alert.aviso || 'Alerta Meteorológico Severo'}`,
                    description: `${alert.descricao || ''}. RISCOS: ${alert.riscos?.join(', ') || 'Não especificado'}.`,
                    category: EventCategory.NATURAL_DISASTER,
                    severity: isCritical ? 'CRITICAL' : 'HIGH',
                    sourceType: SourceType.OFFICIAL,
                    sourceName: 'INMET/Defesa Civil (Brasil)',
                    location: `Brasil (Alerta Oficial)`,
                    coordinates: { lat, lng },
                    timestamp: new Date().toISOString(),
                    sourceUrl: `https://alertas2.inmet.gov.br/`,
                    alertGeometry: alertGeometry,
                    eventType: alert.aviso || 'Alerta Meteorológico'
                });
            }

            return allEvents;
        } catch (error) {
            console.error('[InmetCollector] Error fetching INMET API:', error);
            return [];
        }
    }
}
