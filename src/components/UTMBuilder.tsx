import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Copy, Link as LinkIcon, ExternalLink, ArrowRight, Save, Trash2, Check, RefreshCw } from 'lucide-react';

interface SavedLink {
    id: string;
    label: string;
    original_url: string;
    utm_campaign: string;
    utm_source: string;
    utm_medium: string;
    full_url: string;
    short_url?: string; // Optional if we integrate bitly later
    created_at: string;
}

export default function UTMBuilder() {
    const [baseUrl, setBaseUrl] = useState('https://cloudly.studio');
    const [source, setSource] = useState('');
    const [medium, setMedium] = useState('');
    const [campaign, setCampaign] = useState('');
    const [label, setLabel] = useState(''); // User-friendly name for this link
    const [savedLinks, setSavedLinks] = useState<SavedLink[]>([]);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    // Initial load of saved links
    useState(() => {
        loadLinks();
    });

    async function loadLinks() {
        setLoading(true);
        const { data } = await supabase.from('utm_links').select('*').order('created_at', { ascending: false });
        if (data) setSavedLinks(data);
        setLoading(false);
    }

    const generatedUrl = `${baseUrl}?utm_source=${encodeURIComponent(source)}&utm_medium=${encodeURIComponent(medium)}&utm_campaign=${encodeURIComponent(campaign)}`;

    const handleSave = async () => {
        if (!source || !medium || !campaign || !label) {
            alert('Please fill in all fields (Source, Medium, Campaign, and Link Name)');
            return;
        }

        const newLink = {
            label,
            original_url: baseUrl,
            utm_source: source,
            utm_medium: medium,
            utm_campaign: campaign,
            full_url: generatedUrl
        };

        const { data, error } = await supabase.from('utm_links').insert(newLink).select();

        if (error) {
            alert('Error saving link: ' + error.message);
        } else if (data) {
            setSavedLinks([data[0], ...savedLinks]);
            // Reset form partly
            setLabel('');
            setCampaign('');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this tracking link?')) return;
        await supabase.from('utm_links').delete().eq('id', id);
        setSavedLinks(savedLinks.filter(l => l.id !== id));
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const shortenUrl = async (id: string, longUrl: string) => {
        // NOTE: This requires a Bitly Access Token.
        // For now, we will simulate a "shortener" or just alert the user that they need an API key.
        // Since we can't easily add a secret key without user input, we'll prompt for it or mock it.

        const token = prompt("Enter your Bitly Access Token (or generic 'shorten' to mock):");
        if (!token) return;

        if (token === 'shorten') {
            // Mock
            const mockShort = `https://bit.ly/${Math.random().toString(36).substring(7)}`;
            await supabase.from('utm_links').update({ short_url: mockShort }).eq('id', id);
            setSavedLinks(savedLinks.map(l => l.id === id ? { ...l, short_url: mockShort } : l));
            return;
        }

        try {
            const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ long_url: longUrl, domain: "bit.ly" })
            });

            if (!response.ok) throw new Error('Bitly API Error');
            const data = await response.json();

            await supabase.from('utm_links').update({ short_url: data.link }).eq('id', id);
            setSavedLinks(savedLinks.map(l => l.id === id ? { ...l, short_url: data.link } : l));

        } catch (err) {
            alert('Failed to shorten link. Check your token.');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Builder Section */}
            <div className="space-y-6">
                <div className="p-6 bg-zinc-900 border border-white/10 rounded-2xl shadow-xl">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <LinkIcon className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-white">Campaign Link Builder</h3>
                            <p className="text-sm text-zinc-500">Create trackable URLs for your marketing.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Destination URL</label>
                            <input
                                type="text"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Source (e.g. linkedin)</label>
                                <input
                                    type="text"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    placeholder="linkedin"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Medium (e.g. post, email)</label>
                                <input
                                    type="text"
                                    value={medium}
                                    onChange={(e) => setMedium(e.target.value)}
                                    placeholder="social-post"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Campaign Name</label>
                            <input
                                type="text"
                                value={campaign}
                                onChange={(e) => setCampaign(e.target.value)}
                                placeholder="launch-v2"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                            />
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <label className="block text-xs font-medium text-emerald-400 mb-1.5 uppercase tracking-wider">Link Label (For Admin Reference)</label>
                            <input
                                type="text"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="e.g. Q1 LinkedIn Launch"
                                className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                            />
                        </div>

                        {/* Preview */}
                        <div className="pt-4">
                            <div className="bg-black/40 rounded-lg p-3 border border-white/5 flex items-center justify-between gap-3 group">
                                <code className="text-xs text-zinc-400 break-all">{generatedUrl}</code>
                                <button
                                    onClick={() => copyToClipboard(generatedUrl, 'preview')}
                                    className="p-2 hover:bg-white/10 rounded transition-colors text-zinc-500 hover:text-white"
                                >
                                    {copied === 'preview' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={!source || !medium || !campaign || !label}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            Save to Library
                        </button>
                    </div>
                </div>
            </div>

            {/* Library Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white">Tracking Library</h3>
                    <button onClick={loadLinks} className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="grid gap-4">
                    {savedLinks.length === 0 ? (
                        <div className="p-12 border border-white/5 rounded-2xl bg-white/[0.02] text-center">
                            <p className="text-zinc-500 text-sm">No tracking links created yet.</p>
                        </div>
                    ) : (
                        savedLinks.map(link => (
                            <div key={link.id} className="p-4 bg-zinc-900 border border-white/10 rounded-xl group hover:border-white/20 transition-all shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="text-white font-medium text-sm mb-0.5">{link.label}</h4>
                                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-zinc-500 font-mono">
                                            <span className="bg-white/5 px-1.5 py-0.5 rounded text-zinc-400">{link.utm_source}</span>
                                            <span>/</span>
                                            <span className="bg-white/5 px-1.5 py-0.5 rounded text-zinc-400">{link.utm_medium}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(link.id)}
                                        className="text-zinc-600 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {/* Full URL */}
                                    <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/5">
                                        <div className="text-xs text-zinc-400 truncate flex-1 font-mono">{link.full_url}</div>
                                        <button
                                            onClick={() => copyToClipboard(link.full_url, link.id)}
                                            className="text-zinc-500 hover:text-white transition-colors p-1"
                                            title="Copy Full URL"
                                        >
                                            {copied === link.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>

                                    {/* Short URL Action */}
                                    <div className="flex items-center gap-2">
                                        {link.short_url ? (
                                            <div className="flex items-center gap-2 bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 flex-1">
                                                <LinkIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                                <div className="text-xs text-indigo-200 truncate flex-1 font-mono font-bold">{link.short_url}</div>
                                                <button
                                                    onClick={() => copyToClipboard(link.short_url!, link.id + 'short')}
                                                    className="text-indigo-400 hover:text-white transition-colors p-1"
                                                    title="Copy Short URL"
                                                >
                                                    {copied === link.id + 'short' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => shortenUrl(link.id, link.full_url)}
                                                className="flex-1 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors border border-dashed border-zinc-700 hover:border-zinc-500 flex items-center justify-center gap-2"
                                            >
                                                <LinkIcon className="w-3 h-3" />
                                                Generate Bit.ly Link
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
