// Fontes de dados e créditos exigidos pelas licenças (07/10/2026). Mostrado no painel
// "Fontes" da barra inferior. Ao adicionar uma fonte, registre aqui licença e link.

export type CreditGroup = 'maps' | 'signs' | 'layers' | 'events' | 'method';

/** Licenças que precisam de tradução; o resto (ODbL, CC BY…) é exibido como está. */
export type LicenseKey = 'publicDomainUS' | 'publicDomainNASA' | 'govBR' | 'imfTerms' | 'celestrak' | 'gdelt' | 'outletTerms' | 'credited';

export interface Credit {
    group: CreditGroup;
    name: string;          // nome próprio da fonte; 'newsOutlets' usa o texto traduzido
    license: string | { key: LicenseKey };
    url?: string;
}

export const CREDITS: Credit[] = [
    { group: 'maps', name: 'OpenFreeMap · OpenMapTiles · © OpenStreetMap contributors', license: 'ODbL 1.0', url: 'https://www.openstreetmap.org/copyright' },
    { group: 'maps', name: 'NASA GIBS — Blue Marble, VIIRS, GPM IMERG', license: { key: 'publicDomainNASA' }, url: 'https://www.earthdata.nasa.gov/engage/open-data-services-software-policies/data-use-guidance' },
    { group: 'maps', name: 'Safecast', license: 'CC0', url: 'https://safecast.org/data/' },

    { group: 'signs', name: 'USGS Earthquake Hazards Program', license: { key: 'publicDomainUS' }, url: 'https://www.usgs.gov/information-policies-and-instructions/copyrights-and-credits' },
    { group: 'signs', name: 'Our World in Data', license: 'CC BY 4.0', url: 'https://ourworldindata.org/faqs' },
    { group: 'signs', name: 'World Bank Commodity Price Data (Pink Sheet)', license: 'CC BY 4.0', url: 'https://www.worldbank.org/en/research/commodity-markets' },
    { group: 'signs', name: 'Office of Financial Research — Financial Stress Index', license: { key: 'publicDomainUS' }, url: 'https://www.financialresearch.gov/financial-stress-index/' },
    { group: 'signs', name: 'GFZ Potsdam — Kp index (Matzka et al., 2021)', license: 'CC BY 4.0', url: 'https://kp.gfz-potsdam.de/' },
    { group: 'signs', name: 'NOAA Global Monitoring Laboratory — Mauna Loa CO₂', license: { key: 'publicDomainUS' }, url: 'https://gml.noaa.gov/ccgg/trends/' },

    { group: 'layers', name: 'adsb.lol contributors', license: 'ODbL 1.0', url: 'https://adsb.lol/' },
    { group: 'layers', name: 'International Monetary Fund, PortWatch', license: { key: 'imfTerms' }, url: 'https://portwatch.imf.org/' },
    { group: 'layers', name: 'NASA FIRMS', license: { key: 'publicDomainNASA' }, url: 'https://firms.modaps.eosdis.nasa.gov/' },
    { group: 'layers', name: 'CelesTrak', license: { key: 'celestrak' }, url: 'https://celestrak.org/usage-policy.php' },

    { group: 'events', name: 'GDELT Project', license: { key: 'gdelt' }, url: 'https://www.gdeltproject.org/about.html' },
    { group: 'events', name: 'NOAA / National Weather Service, Space Weather Prediction Center', license: { key: 'publicDomainUS' }, url: 'https://www.weather.gov/disclaimer' },
    { group: 'events', name: 'NASA EONET', license: { key: 'publicDomainNASA' }, url: 'https://eonet.gsfc.nasa.gov/' },
    { group: 'events', name: 'INMET', license: { key: 'govBR' }, url: 'https://alertas2.inmet.gov.br/' },
    { group: 'events', name: 'newsOutlets', license: { key: 'outletTerms' } },

    { group: 'method', name: 'Apocalypse Early Warning System — Kyle McDonald', license: { key: 'credited' }, url: 'https://ews.kylemcdonald.net/' },
];
