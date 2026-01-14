/**
 * Simple calculation of the sun terminator (day/night line)
 * Adapted for efficiency in React/Leaflet
 */

// Constants
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

function getJulian(date: Date): number {
    return (date.getTime() / 86400000) - (date.getTimezoneOffset() / 1440) + 2440587.5;
}

function getGMST(julian: number): number {
    const d = julian - 2451545.0;
    return 18.697374558 + 24.06570982441908 * d;
}

function getSunEclipticPosition(julian: number) {
    const d = julian - 2451545.0;
    const g = 357.529 + 0.98560028 * d;
    const q = 280.459 + 0.98564736 * d;
    const L = q + 1.915 * Math.sin(g * D2R) + 0.020 * Math.sin(2 * g * D2R);
    const R = 1.00014 - 0.01671 * Math.cos(g * D2R) - 0.00014 * Math.cos(2 * g * D2R);
    const e = 23.439 - 0.00000036 * d;

    const ra = Math.atan2(Math.cos(e * D2R) * Math.sin(L * D2R), Math.cos(L * D2R)) * R2D;
    const dec = Math.asin(Math.sin(e * D2R) * Math.sin(L * D2R)) * R2D;

    return { ra, dec };
}

export function getTerminatorLatLngs(date: Date = new Date()): [number, number][] {
    const julian = getJulian(date);
    const gmst = getGMST(julian);
    const sunPos = getSunEclipticPosition(julian);

    const sunEqPos = {
        lat: sunPos.dec,
        lng: -15 * (gmst - sunPos.ra)
    };

    const latLngs: [number, number][] = [];
    const sunLatRad = sunEqPos.lat * D2R;
    const sunLngRad = sunEqPos.lng * D2R;

    // Compute terminator points
    for (let i = 0; i <= 360; i += 2) { // Resolution: 2 degrees
        const lng = i - 180;
        const lngRad = lng * D2R;
        const latRad = Math.atan(-Math.cos(lngRad - sunLngRad) / Math.tan(sunLatRad));
        latLngs.push([latRad * R2D, lng]);
    }

    // Close the polygon to cover the night side
    // We need to determine if the sun is north or south to close via North or South pole
    const sunIsNorth = sunEqPos.lat > 0;
    const latLimit = sunIsNorth ? -90 : 90;

    // Add closure points
    latLngs.push([latLimit, 180]);
    latLngs.push([latLimit, -180]);

    return latLngs;
}
