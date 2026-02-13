declare global {
    interface Window {
        gtag: (command: string, targetId: string, config?: any) => void;
    }
}

export const trackEvent = (
    action: string,
    { category, label, value }: { category: string; label?: string; value?: number }
) => {
    if (typeof window.gtag === 'function') {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    }
};
