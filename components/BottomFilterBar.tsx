
import React from 'react';
import { EventCategory } from '../types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../categoryColors';
import { getCategoryIcon } from '../utils/categoryIcons';

interface BottomFilterBarProps {
    selectedCategories: Set<EventCategory>;
    onToggleCategory: (category: EventCategory) => void;
    eventCounts: Record<EventCategory, number>;
}

// Order of appearance in the bar
const ORDERED_CATEGORIES: EventCategory[] = [
    EventCategory.CONFLICT,
    EventCategory.POLITICAL,
    EventCategory.NATURAL_DISASTER,
    // EventCategory.FIRES, // Trimmed for space
    EventCategory.EPIDEMIC,
    EventCategory.ECONOMIC,
    EventCategory.CYBER,
    // EventCategory.HUMANITARIAN,
    EventCategory.AVIATION,
    EventCategory.MARITIME,
    // EventCategory.INFRASTRUCTURE,
    // EventCategory.ENVIRONMENTAL,
    EventCategory.PROPHETIC,
    EventCategory.PERSECUTION,
    // EventCategory.OTHER
] as EventCategory[];

export const BottomFilterBar: React.FC<BottomFilterBarProps> = ({
    selectedCategories,
    onToggleCategory,
    eventCounts
}) => {
    return (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
            <div className="flex items-center gap-0 bg-tactical-900/95 backdrop-blur-md border border-tactical-500/50 shadow-2xl overflow-hidden px-2 py-1 font-mono">

                {ORDERED_CATEGORIES.map((category, index) => {
                    const isSelected = selectedCategories.has(category);
                    const count = eventCounts[category] || 0;
                    const color = CATEGORY_COLORS[category] || '#9ca3af';
                    const Icon = getCategoryIcon(category);
                    const label = CATEGORY_LABELS[category] || category;

                    return (
                        <div key={category} className="flex items-center">
                            {/* Divider */}
                            {index > 0 && <div className="h-8 w-px bg-tactical-700 mx-1" />}

                            <button
                                onClick={() => onToggleCategory(category)}
                                className={`
                                    group flex flex-col items-center justify-center w-20 py-2 transition-all duration-200 relative
                                    ${isSelected ? 'opacity-100 bg-tactical-800/30' : 'opacity-40 hover:opacity-70'}
                                    hover:bg-tactical-800/20
                                `}
                            >
                                {/* Top Label (Count) */}
                                <span
                                    className="text-lg font-bold leading-none mb-1 transition-colors font-mono"
                                    style={{ color: isSelected ? 'white' : '#6b7280' }}
                                >
                                    {count}
                                </span>

                                {/* Bottom Label (Icon + Text) */}
                                <div className="flex items-center gap-1.5">
                                    <Icon
                                        className="w-3 h-3 transition-colors"
                                        style={{ color: isSelected ? color : '#6b7280' }}
                                    />
                                    <span
                                        className="text-[9px] font-bold uppercase tracking-wider"
                                        style={{ color: isSelected ? color : '#6b7280' }}
                                    >
                                        {label.split(' ')[0]} {/* First word only for compactness */}
                                    </span>
                                </div>

                                {/* Active Indicator Bar (Square now) */}
                                {isSelected && (
                                    <div
                                        className="absolute bottom-0 left-0 w-full h-0.5 shadow-[0_0_4px_rgba(255,255,255,0.3)]"
                                        style={{ backgroundColor: color }}
                                    />
                                )}
                            </button>
                        </div>
                    );
                })}


                {/* Total Widget */}
                <div className="h-8 w-px bg-tactical-700 mx-1" />
                <div className="flex flex-col items-center justify-center w-16 opacity-70">
                    <span className="text-xs font-mono text-tactical-500">TOTAL</span>
                    <span className="text-xs font-bold text-white font-mono">
                        {Object.values(eventCounts).reduce((a, b) => a + b, 0)}
                    </span>
                </div>
            </div>
        </div>
    );
};
