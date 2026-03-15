/**
 * StaticLocationService — backwards-compatible shim.
 * Delegates to LocationResolver which provides comprehensive coverage:
 * 195 countries + demonyms, 500+ cities, US/BR/IN/CN/RU/AU/CA states.
 */
export { extractStaticLocation } from './LocationResolver';
