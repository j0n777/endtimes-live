import * as satellite from 'satellite.js';
import { dataUrl } from '../lib/dataUrl';

export interface TrackerSatellite {
    id: string;
    name: string;
    lat: number;
    lng: number;
    alt: number; // km
}

export const FALLBACK_TLES = [
    {
        name: "ISS (ZARYA)",
        tleStr: [
            "1 25544U 98067A   24083.51336049  .00018501  00000-0  33418-3 0  9997",
            "2 25544  51.6416 128.5287 0001889  64.2497  89.5441 15.49841804424610"
        ]
    },
    {
        name: "NOAA 15",
        tleStr: [
            "1 25338U 98030A   24083.89531102  .00000305  00000-0  14120-3 0  9990",
            "2 25338  98.7180 157.0652 0011502 248.8753 111.1099 14.26189582329243"
        ]
    }
];

export async function getSatellitePositions(): Promise<TrackerSatellite[]> {
    const positions: TrackerSatellite[] = [];
    const date = new Date();
    
    let tlesToUse = FALLBACK_TLES;
    
    try {
        const res = await fetch(dataUrl('tles.json'));
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                tlesToUse = data;
            }
        }
    } catch (e) {
        console.log('Using fallback static TLEs');
    }

    for (const sat of tlesToUse) {
        try {
            const satrec = satellite.twoline2satrec(sat.tleStr[0], sat.tleStr[1]);
            const positionAndVelocity = satellite.propagate(satrec, date);

            if (positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
                const positionGd = satellite.eciToGeodetic(
                    positionAndVelocity.position as satellite.EciVec3<number>, 
                    satellite.gstime(date)
                );
                
                const longitude = positionGd.longitude;
                const latitude = positionGd.latitude;
                const height = positionGd.height;

                positions.push({
                    id: sat.name.replace(/\\s/g, '_'),
                    name: sat.name,
                    lat: satellite.degreesLat(latitude),
                    lng: satellite.degreesLong(longitude),
                    alt: height
                });
            }
        } catch(e) {
            console.error('Error calculating pos for sat', sat.name, e);
        }
    }

    return positions;
}
