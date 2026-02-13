import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, RefreshCw, Activity, MapPin, Building2, Globe, Clock, ArrowUpRight } from 'lucide-react';

interface Visitor {
    id: string;
    ip_address: string;
    city: string;
    region: string;
    country: string;
    org: string;
    path: string;
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

export default function AnalyticsDashboard() {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVisitors = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('visitors')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(100);

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

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('visitors_channel')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'visitors' },
                (payload) => {
                    setVisitors((prev) => [payload.new as Visitor, ...prev].slice(0, 100));
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

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
                    onClick={fetchVisitors}
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
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                            <Globe className="w-4 h-4 text-indigo-400" />
                            Incoming Signals
                        </h3>
                        <span className="text-xs text-zinc-500 font-mono bg-black/40 px-2 py-1 rounded">LAST 100 VISITORS</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-black/40 text-zinc-400 uppercase text-[10px] tracking-widest font-bold">
                                <tr>
                                    <th className="px-6 py-4">Time (UTC)</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Organization / Network</th>
                                    <th className="px-6 py-4 text-right">Page View</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading && visitors.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-24 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                                <p className="text-zinc-500">Connecting to satellite feed...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : visitors.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-24 text-center text-zinc-500">
                                            No signal detected recently.
                                        </td>
                                    </tr>
                                ) : (
                                    visitors.map((visitor) => (
                                        <tr key={visitor.id} className="group hover:bg-white/[0.03] transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-white group-hover:bg-zinc-700 transition-all border border-white/5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-mono font-medium text-xs">{formatTime(visitor.timestamp)}</div>
                                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">{formatDate(visitor.timestamp)}</div>
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
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <a href={visitor.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-xs bg-black/40 hover:bg-zinc-800 border border-white/5 hover:border-white/20 px-3 py-1.5 rounded-md font-mono">
                                                    {visitor.path === '/' ? '/home' : visitor.path}
                                                    <ArrowUpRight className="w-3 h-3 opacity-50" />
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Insight Card 1 */}
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden group shadow-lg flex flex-col items-center text-center justify-center min-h-[200px]">
                    <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 text-zinc-400">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <h4 className="text-white font-medium mb-1">Top Active Regions</h4>
                    <p className="text-sm text-zinc-500">Live heatmap generation in progress...</p>
                </div>

                {/* Insight Card 2 */}
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden group shadow-lg flex flex-col items-center text-center justify-center min-h-[200px]">
                    <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 text-zinc-400">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-white font-medium mb-1">Company Identification</h4>
                    <p className="text-sm text-zinc-500">Categorizing incoming busines traffic...</p>
                </div>

                {/* Insight Card 3 */}
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden group shadow-lg flex flex-col items-center text-center justify-center min-h-[200px]">
                    <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 text-zinc-400">
                        <Activity className="w-6 h-6" />
                    </div>
                    <h4 className="text-white font-medium mb-1">Engagement Metrics</h4>
                    <p className="text-sm text-zinc-500">Calculating session duration...</p>
                </div>

            </div>
        </div>
    );
}
