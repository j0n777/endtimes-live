/**
 * Linha dia/noite (terminador) para o mapa.
 *
 * Corrigido em 05/11/2026. A versão anterior tinha três erros que se compensavam
 * só quando o navegador estava em UTC:
 * - subtraía o fuso do navegador da data juliana (getTime() já é UTC), deslocando o
 *   sol em 3 h para quem abre do Brasil;
 * - subtraía a ascensão reta em graus do tempo sideral em horas;
 * - fechava o polígono da noite pelo polo errado ("invertido com base em feedback").
 * Resultado: no fuso de Brasília o mapa mostrava noite no Brasil de manhã.
 */

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

const julianDay = (date: Date): number => date.getTime() / 86400000 + 2440587.5;

/** Posição do sol: declinação e longitude do ponto subsolar, em graus. */
export function subsolarPoint(date: Date): { lat: number; lng: number } {
    const d = julianDay(date) - 2451545.0;
    // Fórmulas de baixa precisão do Astronomical Almanac (erro < 0,01°).
    const g = (357.529 + 0.98560028 * d) * D2R;
    const q = 280.459 + 0.98564736 * d;
    const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D2R;
    const e = (23.439 - 0.00000036 * d) * D2R;

    const raDeg = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) * R2D;
    const dec = Math.asin(Math.sin(e) * Math.sin(L)) * R2D;
    const gmstDeg = 280.46061837 + 360.98564736629 * d; // tempo sideral de Greenwich, em graus

    const lng = ((raDeg - gmstDeg) % 360 + 540) % 360 - 180;
    return { lat: dec, lng };
}

/** Polígono do lado noturno, de −180° a 180° de longitude. */
export function getTerminatorLatLngs(date: Date = new Date()): [number, number][] {
    const sun = subsolarPoint(date);
    // Evita divisão por zero nos equinócios (declinação exatamente 0).
    const dec = Math.abs(sun.lat) < 1e-6 ? 1e-6 : sun.lat;
    const tanDec = Math.tan(dec * D2R);

    const latLngs: [number, number][] = [];
    for (let lng = -180; lng <= 180; lng += 2) {
        const lat = Math.atan(-Math.cos((lng - sun.lng) * D2R) / tanDec) * R2D;
        latLngs.push([lat, lng]);
    }

    // A noite fica do lado oposto ao sol: com o sol no hemisfério sul, o polo norte
    // está no escuro e o polígono fecha por cima; com o sol no norte, por baixo.
    const darkPole = dec > 0 ? -90 : 90;
    latLngs.push([darkPole, 180], [darkPole, -180]);
    return latLngs;
}
