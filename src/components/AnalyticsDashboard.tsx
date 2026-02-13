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
            {/* Header Section */}
            <div className="flex items-end justify-between border-b border-white/10 pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-light text-white tracking-tight">Traffic Intelligence</h2>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Live</span>
                        </div>
                    </div>
                    <p className="text-zinc-400 text-sm">Real-time visitor processing and entity identification.</p>
                </div>
                <button
                    onClick={fetchVisitors}
                    className="group flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-all border border-white/5 hover:border-white/10"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    <span className="text-xs font-medium uppercase tracking-wider">Refresh</span>
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
                <div className="lg:col-span-3 bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                            <Globe className="w-4 h-4 text-indigo-400" />
                            Recent Visitors
                        </h3>
                        <span className="text-xs text-zinc-500 font-mono">LAST 100 RECORDS</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/[0.02] text-zinc-500 uppercase text-[10px] tracking-widest font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Entity / Network</th>
                                    <th className="px-6 py-4 text-right">Activity</th>
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
                                        <tr key={visitor.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400 group-hover:text-white group-hover:bg-zinc-800 transition-all">
                                                        <Clock className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-mono font-medium">{formatTime(visitor.timestamp)}</div>
                                                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">{formatDate(visitor.timestamp)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 text-white font-medium">
                                                        <span>{visitor.city || 'Unknown City'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {visitor.region}, {visitor.country}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {visitor.org !== 'unknown' && !visitor.org.includes('AS') ? (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-sm shadow-indigo-500/5">
                                                        <Building2 className="w-3.5 h-3.5" />
                                                        <span className="font-medium truncate max-w-[250px]">{visitor.org}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-zinc-500">
                                                        <Activity className="w-3.5 h-3.5" />
                                                        <span className="text-xs truncate max-w-[250px]" title={visitor.org}>
                                                            {visitor.org || 'ISP / Anonymous'}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <a href={visitor.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-xs bg-zinc-800/50 hover:bg-zinc-700 px-3 py-1.5 rounded-md font-mono">
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
                <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <h4 className="text-zinc-500 uppercase text-[10px] tracking-widest font-bold mb-4">Top Regions</h4>
                    <div className="flex items-center justify-center h-32 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
                        <p className="text-xs text-zinc-600">Collecting regional data...</p>
                    </div>
                </div>

                {/* Insight Card 2 */}
                <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <h4 className="text-zinc-500 uppercase text-[10px] tracking-widest font-bold mb-4">Entity Breakdown</h4>
                    <div className="flex items-center justify-center h-32 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
                        <p className="text-xs text-zinc-600">Analyzing company types...</p>
                    </div>
                </div>

                {/* Insight Card 3 */}
                <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <h4 className="text-zinc-500 uppercase text-[10px] tracking-widest font-bold mb-4">Engagement</h4>
                    <div className="flex items-center justify-center h-32 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
                        <p className="text-xs text-zinc-600">Calculating session depth...</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
