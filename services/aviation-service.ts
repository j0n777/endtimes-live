import { MonitorEvent } from '../types';
import { AviationCollector } from '../lib/collectors/AviationCollector';
import { supabase } from '../lib/supabaseClient';

export const fetchAviationEvents = async (): Promise<MonitorEvent[]> => {
    try {
        const collector = new AviationCollector(supabase);
        const events = await collector.collect();
        return events;
    } catch (error) {
        console.error('Error fetching Aviation OSINT events:', error);
        return [];
    }
};
