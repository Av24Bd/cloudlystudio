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

    // Initialize with defaults in case IP fetch fails
    let ipInfo: IPInfo = {
        ip: 'unknown',
        city: 'unknown',
        region: 'unknown',
        country: 'unknown',
        org: 'unknown',
    };

    // 1. Try to get IP Info (Free API)
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
            const data = await response.json();
            ipInfo = {
                ip: data.ip || 'unknown',
                city: data.city || 'unknown',
                region: data.region || 'unknown',
                country: data.country_name || 'unknown',
                org: data.org || 'unknown',
            };
        }
    } catch (err) {
        // If IP fetch fails (ad blocker, rate limit), we silence this or dev log it 
        // to ensure we still log the visit to Supabase.
        console.warn('IP fetch blocked/failed, logging anonymously:', err);
    }

    try {
        // 2. Log to Supabase regardless of whether IP fetch succeeded
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
            console.error('Error logging visit to Supabase:', error);
        }
    } catch (err) {
        console.error('Failed to save visit:', err);
    }
};
