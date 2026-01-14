
import {
    AlertTriangle,
    Skull,
    Flame,
    Zap,
    Anchor,
    Plane,
    Activity,
    ShieldAlert,
    Globe,
    CreditCard,
    BookOpen,
    Radio,
    Eye,
    Cross
} from 'lucide-react';
import { EventCategory } from '../types';

export const getCategoryIcon = (category: EventCategory) => {
    switch (category) {
        case EventCategory.CONFLICT: return ShieldAlert;
        case EventCategory.NATURAL_DISASTER: return Globe; // or ClouRain
        case EventCategory.FIRES: return Flame;
        case EventCategory.EPIDEMIC: return Skull;
        case EventCategory.ECONOMIC: return CreditCard; // or TrendingDown
        case EventCategory.CYBER: return Zap; // or Cpu
        case EventCategory.HUMANITARIAN: return Activity;
        case EventCategory.AVIATION: return Plane;
        case EventCategory.MARITIME: return Anchor;
        case EventCategory.INFRASTRUCTURE: return Radio; // or Building
        case EventCategory.ENVIRONMENTAL: return Globe;
        case EventCategory.PROPHETIC: return BookOpen;
        case EventCategory.PERSECUTION: return Cross;
        case EventCategory.POLITICAL: return Eye; // or Landmark
        case EventCategory.OTHER: return AlertTriangle;
        default: return AlertTriangle;
    }
};
