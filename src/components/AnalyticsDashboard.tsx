import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, RefreshCw, Activity, MapPin, Building2, Globe, Clock, ArrowUpRight, User, Edit3, Filter, X, Link } from 'lucide-react';

interface Visitor {
    id: string;
    ip_address: string;
    city: string;
    region: string;
    country: string;
    org: string;
    path: string;
    referrer: string | null;
    timestamp: string;
}

const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getTrafficSource = (visitor: Visitor) => {
    // 1. Check UTM params first (most specific)
    try {
        if (visitor.path.includes('utm_source=')) {
            const url = new URL('http://dummy.com' + visitor.path); // Hack to parse relative path
            const source = url.searchParams.get('utm_source');
            if (source) return { name: source, type: 'campaign' };
        }
    } catch (e) { /* ignore */ }

    // 2. Check Referrer
    if (!visitor.referrer || visitor.referrer === '' || visitor.referrer.includes(window.location.host)) {
        return { name: 'Direct / Bookmark', type: 'direct' };
    }

    try {
        const url = new URL(visitor.referrer);
        const domain = url.hostname.replace('www.', '');

        if (domain.includes('google')) return { name: 'Google Search', type: 'search' };
        if (domain.includes('linkedin')) return { name: 'LinkedIn', type: 'social' };
        if (domain.includes('twitter') || domain.includes('t.co') || domain.includes('x.com')) return { name: 'X / Twitter', type: 'social' };
        if (domain.includes('facebook')) return { name: 'Facebook', type: 'social' };
        if (domain.includes('instagram')) return { name: 'Instagram', type: 'social' };
        if (domain.includes('bing')) return { name: 'Bing Search', type: 'search' };

        return { name: domain, type: 'referral' };
    } catch (e) {
        return { name: 'Unknown', type: 'unknown' };
    }
};

export default function AnalyticsDashboard() {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [identities, setIdentities] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<{ type: 'city' | 'org' | 'source', value: string } | null>(null);

    const fetchIdentities = async () => {
        try {
            const { data } = await supabase.from('known_identities').select('*');
            if (data) {
                const map = data.reduce((acc: any, curr: any) => ({ ...acc, [curr.ip_address]: curr.label }), {});
                setIdentities(map);
            }
        } catch (err) {
            console.error('Error loading identities:', err);
        }
    };

    const handleIdentify = async (ip: string, currentLabel: string = '') => {
        const label = window.prompt("Name this visitor (e.g., 'My Office', 'Client A'):", currentLabel);
        if (label === null) return;

        if (label.trim() === '') return;

        const { error } = await supabase
            .from('known_identities')
            .upsert({ ip_address: ip, label: label.trim() });

        if (error) {
            alert('Error saving label: ' + error.message);
        } else {
            setIdentities(prev => ({ ...prev, [ip]: label.trim() }));
        }
    };

    const fetchVisitors = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('visitors')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(500);

            if (error) throw error;
            setVisitors(data || []);
        } catch (err: any) {
            console.error('Error fetching analytics:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisitors();
        fetchIdentities();

        const subscription = supabase
            .channel('visitors_channel')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'visitors' },
                (payload) => {
                    setVisitors((prev) => [payload.new as Visitor, ...prev].slice(0, 500));
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // --- Aggregation Logic ---
    const stats = useMemo(() => {
        const cityCounts: Record<string, number> = {};
        const orgCounts: Record<string, number> = {};
        const sourceCounts: Record<string, number> = {};

        visitors.forEach(v => {
            // City
            const location = v.city ? `${v.city}, ${v.country}` : 'Unknown Location';
            cityCounts[location] = (cityCounts[location] || 0) + 1;

            // Org
            const label = identities[v.ip_address] || (v.org === 'unknown' ? 'Anonymous / ISP' : v.org);
            orgCounts[label] = (orgCounts[label] || 0) + 1;

            // Source
            const source = getTrafficSource(v).name;
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });

        return {
            topCities: Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
            topOrgs: Object.entries(orgCounts).sort((a, b) => b[1] - a[1]).slice(0, 7),
            topSources: Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
        };
    }, [visitors, identities]);

    const filteredVisitors = useMemo(() => {
        if (!activeFilter) return visitors;
        return visitors.filter(v => {
            if (activeFilter.type === 'city') return (v.city ? `${v.city}, ${v.country}` : 'Unknown Location') === activeFilter.value;
            if (activeFilter.type === 'org') {
                const label = identities[v.ip_address] || (v.org === 'unknown' ? 'Anonymous / ISP' : v.org);
                return label === activeFilter.value;
            }
            if (activeFilter.type === 'source') return getTrafficSource(v).name === activeFilter.value;
            return true;
        });
    }, [visitors, activeFilter, identities]);


    return (
        <div className="space-y-8 max-w-7xl">
            {/* Controls Section */}
            <div className="flex items-center justify-between pb-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">System Live</span>
                    </div>
                    <span className="text-xs text-zinc-500 hidden md:block">Real-time visitor tracking enabled</span>
                </div>
                <button
                    onClick={() => { fetchVisitors(); fetchIdentities(); setActiveFilter(null); }}
                    className="group flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-all border border-white/5 hover:border-white/10 shadow-lg"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    <span className="text-xs font-medium uppercase tracking-wider">Refresh Data</span>
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                    <Activity className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Live Feed Panel */}
                <div className="lg:col-span-3 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                <Globe className="w-4 h-4 text-indigo-400" />
                                Incoming Signals
                            </h3>
                            {activeFilter && (
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 text-xs font-medium animate-in fade-in slide-in-from-left-4">
                                    <Filter className="w-3 h-3" />
                                    Filtered by {activeFilter.type}: {activeFilter.value}
                                    <button onClick={() => setActiveFilter(null)} className="ml-1 hover:text-white"><X className="w-3 h-3" /></button>
                                </div>
                            )}
                        </div>
                        <span className="text-xs text-zinc-500 font-mono bg-black/40 px-2 py-1 rounded">
                            SHOWING {filteredVisitors.length} RECORDS
                        </span>
                    </div>

                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-zinc-900 z-10 text-zinc-300 uppercase text-[10px] tracking-widest font-bold shadow-sm border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4 bg-zinc-900">Time (UTC)</th>
                                    <th className="px-6 py-4 bg-zinc-900">Location</th>
                                    <th className="px-6 py-4 bg-zinc-900">Identity / Network</th>
                                    <th className="px-6 py-4 bg-zinc-900">Source</th>
                                    <th className="px-6 py-4 text-right bg-zinc-900">Page View</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading && visitors.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                                <p className="text-zinc-500">Connecting to satellite feed...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredVisitors.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-24 text-center text-zinc-500">
                                            No signals match current filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVisitors.map((visitor) => {
                                        const source = getTrafficSource(visitor);
                                        return (
                                            <tr key={visitor.id} className="group hover:bg-white/[0.03] transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-white group-hover:bg-zinc-700 transition-all border border-white/5">
                                                            <Clock className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-mono font-medium text-xs">{formatTime(visitor.timestamp)}</div>
                                                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5 max-w-[80px] truncate">{formatDate(visitor.timestamp)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2 text-white font-medium text-sm">
                                                            <span>{visitor.city || 'Unknown City'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                                                            <MapPin className="w-3 h-3 text-zinc-600" />
                                                            {visitor.region}, {visitor.country}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {identities[visitor.ip_address] ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                                                                    <User className="w-3.5 h-3.5" />
                                                                    <span className="font-bold text-xs truncate max-w-[200px]">{identities[visitor.ip_address]}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleIdentify(visitor.ip_address, identities[visitor.ip_address])}
                                                                    className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                                    title="Edit Label"
                                                                >
                                                                    <Edit3 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 group/id">
                                                                {visitor.org !== 'unknown' && !visitor.org.includes('AS') ? (
                                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 shadow-sm">
                                                                        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                                                                        <span className="font-medium text-xs truncate max-w-[250px]">{visitor.org}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 text-zinc-400 bg-white/5 px-2 py-1 rounded w-fit">
                                                                        <Activity className="w-3.5 h-3.5" />
                                                                        <span className="text-xs truncate max-w-[250px] font-mono" title={visitor.org}>
                                                                            {visitor.org || 'ISP / Anonymous'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <button
                                                                    onClick={() => handleIdentify(visitor.ip_address)}
                                                                    className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100 "
                                                                    title="Tag this IP"
                                                                >
                                                                    <Edit3 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                                                        <Link className="w-3 h-3 text-zinc-500" />
                                                        <span className={`truncate max-w-[150px] ${source.type === 'direct' ? 'text-zinc-400 italic' : 'text-white font-medium'}`}>
                                                            {source.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <a href={visitor.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-xs bg-black/40 hover:bg-zinc-800 border border-white/5 hover:border-white/20 px-3 py-1.5 rounded-md font-mono">
                                                        {visitor.path === '/' ? '/home' : visitor.path}
                                                        <ArrowUpRight className="w-3 h-3 opacity-50" />
                                                    </a>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Insight Card: Top Regions */}
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col h-full hover:border-white/20 transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <MapPin className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h4 className="text-white font-medium">Top Regions</h4>
                            <p className="text-xs text-zinc-500">Most active locations</p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        {stats.topCities.length > 0 ? stats.topCities.map(([location, count]) => (
                            <div
                                key={location}
                                onClick={() => setActiveFilter({ type: 'city', value: location })}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                            >
                                <span className="text-sm text-zinc-300 group-hover:text-white truncate max-w-[200px]">{location}</span>
                                <span className="text-xs font-mono font-medium text-zinc-400 bg-black/40 px-2 py-0.5 rounded group-hover:bg-white/10 group-hover:text-white transition-colors">
                                    {count}
                                </span>
                            </div>
                        )) : (
                            <p className="text-sm text-zinc-600 p-4 text-center italic">Not enough data to cluster.</p>
                        )}
                    </div>
                </div>

                {/* Insight Card: Top Companies */}
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col h-full hover:border-white/20 transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <Building2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="text-white font-medium">Top Entities</h4>
                            <p className="text-xs text-zinc-500">Most active networks/users</p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        {stats.topOrgs.length > 0 ? stats.topOrgs.map(([org, count]) => (
                            <div
                                key={org}
                                onClick={() => setActiveFilter({ type: 'org', value: org })}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                            >
                                <span className="text-sm text-zinc-300 group-hover:text-white truncate max-w-[200px]">{org}</span>
                                <span className="text-xs font-mono font-medium text-zinc-400 bg-black/40 px-2 py-0.5 rounded group-hover:bg-white/10 group-hover:text-white transition-colors">
                                    {count}
                                </span>
                            </div>
                        )) : (
                            <p className="text-sm text-zinc-600 p-4 text-center italic">Not enough data to cluster.</p>
                        )}
                    </div>
                </div>

                {/* Insight Card: Top Traffic Sources */}
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col h-full hover:border-white/20 transition-colors">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Link className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h4 className="text-white font-medium">Traffic Sources</h4>
                            <p className="text-xs text-zinc-500">Where visitors come from</p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        {stats.topSources.length > 0 ? stats.topSources.map(([source, count]) => (
                            <div
                                key={source}
                                onClick={() => setActiveFilter({ type: 'source', value: source })}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                            >
                                <span className="text-sm font-mono text-zinc-300 group-hover:text-white truncate max-w-[200px]">{source}</span>
                                <span className="text-xs font-mono font-medium text-zinc-400 bg-black/40 px-2 py-0.5 rounded group-hover:bg-white/10 group-hover:text-white transition-colors">
                                    {count}
                                </span>
                            </div>
                        )) : (
                            <p className="text-sm text-zinc-600 p-4 text-center italic">Not enough data to cluster.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
