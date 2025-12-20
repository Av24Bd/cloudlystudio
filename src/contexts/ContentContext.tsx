import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { kv } from '../lib/kv-storage';

// --- Configuration ---
// This should point to your public "assets" bucket "config/content.json" file.
// We'll construct it dynamically from the Supabase project URL if possible, 
// or the user can hardcode it in .env.
// For now, let's assume standard Supabase storage URL format:
// https://[project-id].supabase.co/storage/v1/object/public/assets/config/content.json
// But since we have the supabase client, we can also get the public URL from that.

const PROJECT_URL = import.meta.env.VITE_SUPABASE_URL;
// Fallback to a constructed URL or empty if env is missing
const CONTENT_JSON_URL = PROJECT_URL
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

    // 1. Load Content on Mount
    useEffect(() => {
        async function loadContent() {
            try {
                setLoading(true);

                // A. Construct URL reliably using SDK
                const { data } = supabase.storage.from('assets').getPublicUrl('config/content.json');
                const url = data.publicUrl;
                console.log("[ContentContext] derived URL:", url);

                // B. Load live content from Supabase Storage
                let liveContent = {};
                if (url) {
                    try {
                        const res = await fetch(`${url}?t=${Date.now()}`); // Bust cache
                        if (res.ok) {
                            liveContent = await res.json();
                            console.log("[ContentContext] Live content loaded:", Object.keys(liveContent).length, "keys");
                        } else {
                            console.warn("[ContentContext] Content fetch failed:", res.status, res.statusText);
                        }
                    } catch (err) {
                        console.error('[ContentContext] Failed to fetch live content:', err);
                    }
                }

                // C. Load local draft
                const localDraft = await kv.get<ContentMap>('content_draft');
                if (localDraft) console.log("[ContentContext] Local draft found");

                // D. Merge/Decide
                if (localDraft) {
                    setContent({ ...liveContent, ...localDraft });
                    setHasUnsavedChanges(true);
                } else {
                    setContent(liveContent);
                }

            } catch (err) {
                console.error('[ContentContext] Error loading content:', err);
            } finally {
                setLoading(false);
            }
        }

        loadContent();
    }, []);

    // 2. Get Helper
    const getContent = (key: string, defaultValue?: any) => {
        // fast look up for 'foo.bar.baz' strings
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
        // Auto-save to local draft (debounce could be good here, but direct is fine for now)
        saveDraftToLocal(key, value); // We can just dump the whole state
    };

    const saveDraftToLocal = async (triggerKey?: string, triggerValue?: any) => {
        // We need the *latest* content, but setContent is async.
        // So we usually rely on a useEffect to save draft when content changes,
        // OR just save the updated object we calculated.
        // For simplicity, let's use a standard debounce in a useEffect, 
        // but here we just trigger a flag/promise.
    };

    // Effect to sync to IndexedDB
    useEffect(() => {
        if (Object.keys(content).length > 0 && hasUnsavedChanges) {
            const timer = setTimeout(() => {
                kv.set('content_draft', content).then(() => {
                    setLastSaved(new Date());
                });
            }, 1000); // 1s autosave debounce
            return () => clearTimeout(timer);
        }
    }, [content, hasUnsavedChanges]);


    // 4. Upload Helper
    const uploadImage = async (file: File, pathPrefix = 'marketing'): Promise<string> => {
        if (!supabase) throw new Error("Supabase client not initialized");

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${pathPrefix}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(filePath, file);

        if (uploadError) {
            console.error("Upload error details:", uploadError);
            throw new Error(uploadError.message || "Unknown upload error");
        }

        // Get Public URL
        const { data } = supabase.storage
            .from('assets')
            .getPublicUrl(filePath);

        return data.publicUrl;
    };

    // 5. Publish Helper (Save to Supabase JSON)
    const publishLive = async () => {
        try {
            // Upload content as JSON
            const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
            const file = new File([blob], 'content.json', { type: 'application/json' });

            const { error } = await supabase.storage
                .from('assets')
                .upload('config/content.json', file, { upsert: true });

            if (error) throw error;

            // Clear local draft since it's now live
            await kv.set('content_draft', null);
            setHasUnsavedChanges(false);
            setLastSaved(new Date());
            alert('Published successfully! Changes should be live momentarily.');

        } catch (err: any) {
            console.error('Failed to publish:', err);
            const msg = err.message || JSON.stringify(err);
            alert(`Failed to publish changes: ${msg}`);
        }
    };

    // 6. Discard Draft
    const discardDraft = async () => {
        if (confirm('Are you sure you want to discard your unsaved changes? This will revert to the live website version.')) {
            await kv.set('content_draft', null);
            window.location.reload(); // Easiest way to re-fetch clean state
        }
    }

    const saveDraft = async () => {
        // Manual trigger for local save if needed
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
