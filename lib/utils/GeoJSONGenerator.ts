
// Utility to generate simple rectangular bounding boxes (GeoJSON Polygons)
// Used for highlighting conflict zones on the map

export const getCountryBoundingBox = (countryName: string): any | null => {
    if (!countryName) return null;
    const name = countryName.toLowerCase();

    // Simplified Bounding Boxes (approximate)
    // Format: [MinLng, MinLat, MaxLng, MaxLat] converted to GeoJSON Polygon
    // Coordinates: [[ [minLng, minLat], [maxLng, minLat], [maxLng, maxLat], [minLng, maxLat], [minLng, minLat] ]]

    let bbox: [number, number, number, number] | null = null;

    if (name.includes('sudan')) bbox = [21.8, 8.7, 38.6, 22.2];
    else if (name.includes('yemen')) bbox = [41.8, 12.1, 54.5, 19.0];
    else if (name.includes('ukraine')) bbox = [22.1, 44.3, 40.2, 52.4];
    else if (name.includes('israel') || name.includes('gaza')) bbox = [34.2, 29.5, 35.9, 33.3];
    else if (name.includes('taiwan')) bbox = [119.3, 21.9, 122.0, 25.3];
    else if (name.includes('lebanon')) bbox = [35.1, 33.0, 36.6, 34.7];
    else if (name.includes('iran')) bbox = [44.0, 25.0, 63.3, 39.8];
    else if (name.includes('syria')) bbox = [35.7, 32.3, 42.4, 37.3];
    else if (name.includes('north korea')) bbox = [124.3, 37.6, 130.7, 43.0];
    else if (name.includes('russia')) bbox = [28.0, 41.0, 180.0, 81.0]; // Massive approximation

    if (!bbox) return null;

    const [minLng, minLat, maxLng, maxLat] = bbox;

    return {
        type: "Feature",
        properties: {},
        geometry: {
            type: "Polygon",
            coordinates: [[
                [minLng, minLat],
                [maxLng, minLat],
                [maxLng, maxLat],
                [minLng, maxLat],
                [minLng, minLat]
            ]]
        }
    };
};
