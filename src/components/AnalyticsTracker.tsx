import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logVisit } from '../lib/visitor-logger';

declare global {
    interface Window {
        gtag: (command: string, targetId: string, config?: any) => void;
    }
}

const AnalyticsTracker = () => {
    const location = useLocation();

    useEffect(() => {
        // Google Analytics Page View
        if (typeof window.gtag === 'function') {
            window.gtag('config', 'G-JP1SJQMYHB', {
                page_path: location.pathname + location.search,
            });
        }

        // Custom Visitor Logging (Supabase)
        logVisit();
    }, [location]);

    return null;
};

export default AnalyticsTracker;
