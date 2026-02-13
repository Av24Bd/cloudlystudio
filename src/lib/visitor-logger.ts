import { supabase } from './supabase';

interface IPInfo {
    ip: string;
    city: string;
    region: string;
    country: string;
    org: string;
}

export const logVisit = async () => {
    if (import.meta.env.DEV) return; // Don't log localhost dev traffic

    try {
        // 1. Get IP Info (Free API)
        // In production, you might want to proxy this or use a more robust service,
        // but ipapi.co/json is a great free start (rate limits apply).
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        const ipInfo: IPInfo = {
            ip: data.ip || 'unknown',
            city: data.city || 'unknown',
            region: data.region || 'unknown',
            country: data.country_name || 'unknown',
            org: data.org || 'unknown', // This often contains the ISP or Company Name
        };

        // 2. Log to Supabase
        const { error } = await supabase.from('visitors').insert({
            ip_address: ipInfo.ip,
            city: ipInfo.city,
            region: ipInfo.region,
            country: ipInfo.country,
            org: ipInfo.org,
            path: window.location.pathname + window.location.search,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
        });

        if (error) {
            console.error('Error logging visit:', error);
        }

    } catch (err) {
        console.error('Failed to log visit:', err);
    }
};
