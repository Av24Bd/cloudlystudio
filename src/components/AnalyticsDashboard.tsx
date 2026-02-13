import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, RefreshCw, Activity, MapPin, Building2, Globe, Clock, ArrowUpRight, User, Edit3, Filter, X, Link, Search } from 'lucide-react';

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
    let keyphrase: string | null = null;
    let sourceName = 'Direct / Bookmark';
    let sourceType = 'direct';

    // 1. Check UTM params first (most specific)
    try {
        const url = new URL('http://dummy.com' + visitor.path);
        const utmSource = url.searchParams.get('utm_source');
        const utmTerm = url.searchParams.get('utm_term');

        if (utmTerm) keyphrase = utmTerm;

        if (utmSource) {
            sourceName = utmSource;
            sourceType = 'campaign';
            return { name: sourceName, type: sourceType, keyphrase };
        }
    } catch (e) { /* ignore */ }

    // 2. Check Referrer
    if (!visitor.referrer || visitor.referrer === '' || visitor.referrer.includes(window.location.host)) {
        return { name: sourceName, type: sourceType, keyphrase };
    }

    try {
        const url = new URL(visitor.referrer);
        const domain = url.hostname.replace('www.', '');
        const q = url.searchParams.get('q') || url.searchParams.get('query');

        if (q) keyphrase = q;

        if (domain.includes('google')) return { name: 'Google Search', type: 'search', keyphrase };
        if (domain.includes('linkedin')) return { name: 'LinkedIn', type: 'social', keyphrase };
        if (domain.includes('twitter') || domain.includes('t.co') || domain.includes('x.com')) return { name: 'X / Twitter', type: 'social', keyphrase };
        if (domain.includes('facebook')) return { name: 'Facebook', type: 'social', keyphrase };
        if (domain.includes('instagram')) return { name: 'Instagram', type: 'social', keyphrase };
        if (domain.includes('bing')) return { name: 'Bing Search', type: 'search', keyphrase };

        return { name: domain, type: 'referral', keyphrase };
    } catch (e) {
        return { name: 'Unknown', type: 'unknown', keyphrase };
    }
};

export default function AnalyticsDashboard() {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [identities, setIdentities] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<{ type: 'city' | 'org' | 'source' | 'phrase', value: string } | null>(null);

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
        const phraseCounts: Record<string, number> = {};

        visitors.forEach(v => {
            // City
            const location = v.city ? `${v.city}, ${v.country}` : 'Unknown Location';
            cityCounts[location] = (cityCounts[location] || 0) + 1;

            // Org
            const label = identities[v.ip_address] || (v.org === 'unknown' ? 'Anonymous / ISP' : v.org);
            orgCounts[label] = (orgCounts[label] || 0) + 1;

            // Source & Keyphrase
            const { name: source, keyphrase } = getTrafficSource(v);
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;

            if (keyphrase) {
                phraseCounts[keyphrase] = (phraseCounts[keyphrase] || 0) + 1;
            }
        });

        return {
            topCities: Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
            topOrgs: Object.entries(orgCounts).sort((a, b) => b[1] - a[1]).slice(0, 7),
            topSources: Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
            topPhrases: Object.entries(phraseCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
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
            if (activeFilter.type === 'phrase') return getTrafficSource(v).keyphrase === activeFilter.value;
            return true;
        });
    }, [visitors, activeFilter, identities]);


    return (
        <div className="space-y-8">
            {/* Controls Section */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Live</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600 hidden md:block">Real-time monitoring</span>
                </div>
                <button
                    onClick={() => { fetchVisitors(); fetchIdentities(); setActiveFilter(null); }}
                    className="group flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    <span className="text-sm">Refresh</span>
                </button>
            </div>

            {error && (
                <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl flex items-center gap-3 shadow-sm">
                    <Activity className="w-5 h-5 shrink-0 text-red-600" />
                    <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
            )}

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Live Feed Panel */}
                <div className="lg:col-span-4 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                                <Globe className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Visitor Feed</h3>
                                <p className="text-xs text-gray-500 font-medium">Live traffic monitoring</p>
                            </div>
                            {activeFilter && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-sm font-semibold shadow-sm">
                                    <Filter className="w-3.5 h-3.5" />
                                    {activeFilter.value}
                                    <button onClick={() => setActiveFilter(null)} className="ml-1 hover:text-blue-900 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                </div>
                            )}
                        </div>
                        <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 shadow-md">
                            <span className="text-xs font-bold text-white tracking-wide">{filteredVisitors.length} visitors</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200 backdrop-blur-sm">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Identity / Network</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider">Source</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-700 uppercase tracking-wider text-right">Page</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading && visitors.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                                <p className="text-gray-500 font-semibold">Loading visitor data...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredVisitors.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-24 text-center text-gray-500 font-semibold">
                                            No visitors match the current filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVisitors.map((visitor) => {
                                        const source = getTrafficSource(visitor);
                                        return (
                                            <tr key={visitor.id} className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-indigo-100 transition-all shadow-sm">
                                                            <Clock className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-900 font-bold text-sm">{formatTime(visitor.timestamp)}</div>
                                                            <div className="text-xs text-gray-500 mt-0.5">{formatDate(visitor.timestamp)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <div className="text-gray-900 font-bold text-sm">{visitor.city || 'Unknown City'}</div>
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 font-medium">
                                                            <MapPin className="w-3 h-3" />
                                                            {visitor.region}, {visitor.country}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {identities[visitor.ip_address] ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm">
                                                                    <User className="w-3.5 h-3.5 text-emerald-600" />
                                                                    <span className="font-bold text-xs text-emerald-700 truncate max-w-[200px]">{identities[visitor.ip_address]}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleIdentify(visitor.ip_address, identities[visitor.ip_address])}
                                                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                                    title="Edit Label"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                {visitor.org !== 'unknown' && !visitor.org.includes('AS') ? (
                                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
                                                                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                                                        <span className="font-bold text-xs text-blue-700 truncate max-w-[250px]">{visitor.org}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200">
                                                                        <Activity className="w-3.5 h-3.5 text-gray-500" />
                                                                        <span className="text-xs font-semibold text-gray-600 truncate max-w-[250px]" title={visitor.org}>
                                                                            {visitor.org || 'Anonymous'}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <button
                                                                    onClick={() => handleIdentify(visitor.ip_address)}
                                                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                                    title="Tag this IP"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2" title={`Referrer: ${visitor.referrer || '(none)'}`}>
                                                            <Link className="w-3.5 h-3.5 text-gray-400" />
                                                            <span className={`text-sm font-semibold truncate max-w-[150px] ${source.type === 'direct' ? 'text-gray-500 italic' : 'text-gray-900'}`}>
                                                                {source.name}
                                                            </span>
                                                        </div>
                                                        {source.keyphrase && (
                                                            <div className="flex items-center gap-1.5 ml-6">
                                                                <Search className="w-3 h-3 text-amber-600" />
                                                                <span className="text-xs font-bold text-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 px-2 py-1 rounded-md border border-amber-200 shadow-sm">
                                                                    {source.keyphrase}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <a href={visitor.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-gray-700 hover:text-gray-900 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md group/link">
                                                        <span className="truncate max-w-[120px]">{visitor.path === '/' ? '/home' : visitor.path}</span>
                                                        <ArrowUpRight className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
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
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h4 className="text-gray-900 font-bold text-base">Top Regions</h4>
                            <p className="text-xs text-gray-500 font-medium">Most active locations</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {stats.topCities.length > 0 ? stats.topCities.map(([location, count]) => (
                            <div
                                key={location}
                                onClick={() => setActiveFilter({ type: 'city', value: location })}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer group transition-all border border-transparent hover:border-blue-200 hover:shadow-sm"
                            >
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate font-semibold">{location}</span>
                                <span className="text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-gray-800 px-2.5 py-1 rounded-lg shadow-sm">
                                    {count}
                                </span>
                            </div>
                        )) : (
                            <p className="text-sm text-gray-400 p-4 text-center font-medium">Not enough data</p>
                        )}
                    </div>
                </div>

                {/* Insight Card: Top Companies */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h4 className="text-gray-900 font-bold text-base">Top Entities</h4>
                            <p className="text-xs text-gray-500 font-medium">Most active networks</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {stats.topOrgs.length > 0 ? stats.topOrgs.map(([org, count]) => (
                            <div
                                key={org}
                                onClick={() => setActiveFilter({ type: 'org', value: org })}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 cursor-pointer group transition-all border border-transparent hover:border-emerald-200 hover:shadow-sm"
                            >
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate font-semibold">{org}</span>
                                <span className="text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-gray-800 px-2.5 py-1 rounded-lg shadow-sm">
                                    {count}
                                </span>
                            </div>
                        )) : (
                            <p className="text-sm text-gray-400 p-4 text-center font-medium">Not enough data</p>
                        )}
                    </div>
                </div>

                {/* Insight Card: Top Traffic Sources */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <Link className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h4 className="text-gray-900 font-bold text-base">Traffic Sources</h4>
                            <p className="text-xs text-gray-500 font-medium">Where visitors come from</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {stats.topSources.length > 0 ? stats.topSources.map(([source, count]) => (
                            <div
                                key={source}
                                onClick={() => setActiveFilter({ type: 'source', value: source })}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 cursor-pointer group transition-all border border-transparent hover:border-purple-200 hover:shadow-sm"
                            >
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate font-semibold">{source}</span>
                                <span className="text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-gray-800 px-2.5 py-1 rounded-lg shadow-sm">
                                    {count}
                                </span>
                            </div>
                        )) : (
                            <p className="text-sm text-gray-400 p-4 text-center font-medium">Not enough data</p>
                        )}
                    </div>
                </div>

                {/* Insight Card: Top Keywords */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <Search className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h4 className="text-gray-900 font-bold text-base">Keywords</h4>
                            <p className="text-xs text-gray-500 font-medium">Search terms (limited)</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {stats.topPhrases.length > 0 ? stats.topPhrases.map(([phrase, count]) => (
                            <div
                                key={phrase}
                                onClick={() => setActiveFilter({ type: 'phrase', value: phrase })}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 cursor-pointer group transition-all border border-transparent hover:border-amber-200 hover:shadow-sm"
                            >
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate font-semibold capitalize">{phrase}</span>
                                <span className="text-xs font-bold text-white bg-gradient-to-r from-gray-900 to-gray-800 px-2.5 py-1 rounded-lg shadow-sm">
                                    {count}
                                </span>
                            </div>
                        )) : (
                            <div className="p-4 text-center">
                                <p className="text-sm text-gray-400 font-medium italic mb-1">No terms detected</p>
                                <p className="text-xs text-gray-400">(Google encrypts searches)</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
