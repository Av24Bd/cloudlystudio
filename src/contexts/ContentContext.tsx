import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { kv } from '../lib/kv-storage';

// --- Configuration ---
// "Golden Path" Setup: Hardcoded connection to the Cloud Truth.
// This ensures that even on mobile devices with no local storage, the app fetches the latest config.
const PROJECT_URL = import.meta.env.VITE_SUPABASE_URL;

// We hardcode the path structure as per the user's requirements to ensure stability.
// The user can also replace this string entirely with their specific public URL if preferred.
const CONFIG_URL = PROJECT_URL
    ? `${PROJECT_URL}/storage/v1/object/public/assets/config/content.json`
    : '';

type ContentMap = Record<string, any>;

interface ContentContextType {
    content: ContentMap;
    loading: boolean;
    hasUnsavedChanges: boolean;
    lastSaved: Date | null;
    getContent: (key: string, defaultValue?: any) => any;
    updateContent: (key: string, value: any) => void;
    uploadImage: (file: File, path?: string) => Promise<string>;
    saveDraft: () => Promise<void>;
    publishLive: () => Promise<void>;
    discardDraft: () => Promise<void>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export function ContentProvider({ children }: { children: ReactNode }) {
    const [content, setContent] = useState<ContentMap>({});
    const [loading, setLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // 1. Load Content on Mount (The "Truth" Fetch)
    useEffect(() => {
        let isMounted = true;

        async function loadContent() {
            if (!CONFIG_URL) {
                console.warn("[ContentContext] VITE_SUPABASE_URL is missing. Content fetching disabled.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // A. Fetch Cloud Truth (Pipeline B)
                // We fetch this FIRST to ensure we have the latest deployed content.
                // The '?t=' params prevents aggressive browser/CDN caching.
                let cloudContent = {};
                try {
                    const res = await fetch(`${CONFIG_URL}?t=${Date.now()}`);
                    if (res.ok) {
                        cloudContent = await res.json();
                        console.log("[ContentContext] Cloud 'Truth' loaded successfully.");
                    } else {
                        // This is expected if the file doesn't exist yet (first run)
                        console.log("[ContentContext] Content file not found (404). Using defaults.");
                    }
                } catch (err) {
                    console.error("[ContentContext] Failed to fetch cloud content:", err);
                }

                if (!isMounted) return;

                // B. Check Local Draft (The "Editor" State)
                // If we are in "Admin mode" (conceptually), we might have unsaved local changes.
                const localDraft = await kv.get<ContentMap>('content_draft');

                // C. Merge Strategy
                // If there is a local draft, it overrides Cloud Truth (until published or discarded).
                if (localDraft) {
                    console.log("[ContentContext] Local draft found. Overriding cloud content.");
                    setContent({ ...cloudContent, ...localDraft });
                    setHasUnsavedChanges(true);
                } else {
                    setContent(cloudContent);
                }

            } catch (err) {
                console.error('[ContentContext] Critical error loading content:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadContent();

        return () => { isMounted = false; };
    }, []);

    // 2. Get Helper
    const getContent = (key: string, defaultValue?: any) => {
        const keys = key.split('.');
        let result: any = content;
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return defaultValue;
            }
        }
        return result ?? defaultValue;
    };

    // 3. Update Helper (Local State)
    const updateContent = (key: string, value: any) => {
        setContent((prev) => {
            const next = { ...prev };
            const keys = key.split('.');
            let current: any = next;

            for (let i = 0; i < keys.length - 1; i++) {
                const k = keys[i];
                if (!current[k] || typeof current[k] !== 'object') {
                    current[k] = {};
                }
                current = current[k];
            }

            current[keys[keys.length - 1]] = value;
            return next;
        });
        setHasUnsavedChanges(true);
    };

    // Effect: Auto-save Draft to Local Storage
    useEffect(() => {
        if (Object.keys(content).length > 0 && hasUnsavedChanges) {
            const timer = setTimeout(() => {
                kv.set('content_draft', content).then(() => {
                    setLastSaved(new Date());
                });
            }, 500); // 500ms debounce
            return () => clearTimeout(timer);
        }
    }, [content, hasUnsavedChanges]);

    // 4. Upload Helper
    const uploadImage = async (file: File, pathPrefix = 'marketing'): Promise<string> => {
        if (!supabase) throw new Error("Supabase client not initialized");

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        // Clean filename to be safe
        const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '');
        const filePath = `${pathPrefix}/${cleanFileName}`;

        const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            throw new Error(uploadError.message || "Upload failed");
        }

        const { data } = supabase.storage
            .from('assets')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    // 5. Publish Helper (Make it "Live")
    const publishLive = async () => {
        try {
            // This is Pipeline B: Update content.json in Supabase
            const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
            const file = new File([blob], 'content.json', { type: 'application/json' });

            const { error } = await supabase.storage
                .from('assets')
                .upload('config/content.json', file, {
                    upsert: true,
                    contentType: 'application/json',
                    cacheControl: '0' // Prevent caching of the config file itself
                });

            if (error) throw error;

            // Clear local draft since it matches live now
            await kv.set('content_draft', null);
            setHasUnsavedChanges(false);
            setLastSaved(new Date());
            alert('Published successfully! Changes are now live on all devices.');

        } catch (err: any) {
            console.error('Failed to publish:', err);
            alert(`Failed to publish: ${err.message}`);
        }
    };

    // 6. Discard Draft
    const discardDraft = async () => {
        if (confirm('Are you sure? This will revert your local editor to the currently live version.')) {
            await kv.set('content_draft', null);
            window.location.reload();
        }
    }

    const saveDraft = async () => {
        await kv.set('content_draft', content);
        setLastSaved(new Date());
    };

    return (
        <ContentContext.Provider value={{
            content,
            loading,
            hasUnsavedChanges,
            lastSaved,
            getContent,
            updateContent,
            uploadImage,
            saveDraft,
            publishLive,
            discardDraft
        }}>
            {children}
        </ContentContext.Provider>
    );
}

export function useContent() {
    const context = useContext(ContentContext);
    if (context === undefined) {
        throw new Error('useContent must be used within a ContentProvider');
    }
    return context;
}
