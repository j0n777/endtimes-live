import { MonitorEvent } from '../types';
import { TwitterCollector } from '../lib/collectors/TwitterCollector';
import { supabase } from '../lib/supabaseClient';

export const fetchTwitterEvents = async (keywords?: string[]): Promise<MonitorEvent[]> => {
    try {
        const collector = new TwitterCollector(supabase, keywords);
        const events = await collector.collect();
        return events;
    } catch (error) {
        console.error('Error fetching Twitter OSINT events:', error);
        return [];
    }
};
