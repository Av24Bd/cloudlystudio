import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, RefreshCw } from 'lucide-react';

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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-light text-white">Live Traffic Intelligence</h3>
                <button
                    onClick={fetchVisitors}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Refresh Data"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    Failed to load data: {error}. Make sure you have run the migration SQL.
                </div>
            )}

            <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-zinc-400 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4 font-medium">Time</th>
                                <th className="p-4 font-medium">Location</th>
                                <th className="p-4 font-medium">Organization / Network</th>
                                <th className="p-4 font-medium">Page</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading && visitors.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-zinc-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading traffic data...
                                    </td>
                                </tr>
                            ) : visitors.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-zinc-500">
                                        No visitors recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                visitors.map((visitor) => (
                                    <tr key={visitor.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-zinc-300 whitespace-nowrap">
                                            <div className="font-mono text-xs text-white">{formatTime(visitor.timestamp)}</div>
                                            <div className="text-[10px] text-zinc-500">{formatDate(visitor.timestamp)}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-white font-medium">{visitor.city}</div>
                                            <div className="text-xs text-zinc-500">{visitor.region}, {visitor.country}</div>
                                        </td>
                                        <td className="p-4">
                                            {visitor.org !== 'unknown' && !visitor.org.includes('AS') ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                                    {visitor.org}
                                                </span>
                                            ) : (
                                                <span className="text-zinc-500 text-xs truncate max-w-[200px] block" title={visitor.org}>
                                                    {visitor.org}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-zinc-300 font-mono text-xs">
                                            {visitor.path}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-white/5 border border-white/5">
                    <h4 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Top Cities</h4>
                    {/* Simple aggregation visualization could go here */}
                    <p className="text-xs text-zinc-500">Aggregation coming soon...</p>
                </div>
                <div className="p-6 rounded-xl bg-white/5 border border-white/5">
                    <h4 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Top Companies</h4>
                    {/* Simple aggregation visualization could go here */}
                    <p className="text-xs text-zinc-500">Aggregation coming soon...</p>
                </div>
            </div>
        </div>
    );
}
