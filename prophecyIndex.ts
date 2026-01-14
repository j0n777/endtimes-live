/**
 * PROPHECY SYSTEM INDEX
 * English Version
 */

// Export everything from prophecyData.ts
export {
    BIBLICAL_PROPHECIES,
    ISLAMIC_PROPHECIES,
    PROPHECY_STATS,
    PROPHECY_CATEGORIES,
    getPropheciesByCategory,
    getPropheciesByStatus,
    getPropheciesByWarningLevel,
    getIslamicPropheciesByStatus,
    type ExtendedProphecyEvent,
    type IslamProphecyEvent,
    type ProphecyCategory
} from './prophecyData';

// Export ProphecyEvent from types (legacy)
export { type ProphecyEvent } from './types';

// Export component
export { default as ProphecyIntel } from './components/ProphecyIntel';

// Category Labels (English)
export const CATEGORY_LABELS: Record<string, string> = {
    DANIEL: '📜 Daniel',
    ISAIAH: '📖 Isaiah',
    EZEKIEL: '⚔️ Ezekiel',
    ZECHARIAH: '🏛️ Zechariah',
    JOEL: '🔥 Joel',
    JESUS_OLIVET: '⛰️ Jesus (Olivet)',
    REVELATION: '📯 Revelation',
    MINOR_PROPHETS: '📚 Minor Prophets',
    ISLAM_WARNING: '⚠️ Islam (Deception)'
};

// Status Labels (English)
export const STATUS_LABELS: Record<string, string> = {
    FULFILLED: '✅ Fulfilled',
    IN_PROGRESS: '🔄 In Progress',
    PENDING: '⏸ Pending'
};

// Warning Level Labels (English)
export const WARNING_LABELS: Record<string, string> = {
    CRITICAL: '🔴 CRITICAL',
    HIGH: '🟠 HIGH',
    MEDIUM: '🟡 MEDIUM',
    LOW: '⚪ LOW'
};
