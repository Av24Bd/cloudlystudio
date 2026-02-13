import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../contexts/ContentContext';
import { ChevronDown, ChevronRight, Upload, Save, Eye, Loader2, LogOut, FileImage, Type, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

// --- Components ---

// 1. Section Accordion
const SectionAccordion = ({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-white/10 rounded-lg overflow-hidden bg-white/5 mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
            >
                <span className="font-medium text-lg text-white">{title}</span>
                {isOpen ? <ChevronDown className="w-5 h-5 opacity-60" /> : <ChevronRight className="w-5 h-5 opacity-60" />}
            </button>
            {isOpen && (
                <div className="p-4 border-t border-white/10 space-y-6">
                    {children}
                </div>
            )}
        </div>
    );
};

// 2. Content Field
interface ContentFieldProps {
    label: string;
    contentKey: string;
    type?: 'text' | 'textarea' | 'image' | 'color';
    defaultValue?: string;
    helperText?: string;
}

const ContentField = ({ label, contentKey, type = 'text', defaultValue = '', helperText }: ContentFieldProps) => {
    const { getContent, updateContent, uploadImage } = useContent();
    const value = getContent(contentKey, defaultValue);
    const [isUploading, setIsUploading] = useState(false);

    // Handle Text Change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        updateContent(contentKey, e.target.value);
    };

    // Handle Image Upload
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                setIsUploading(true);
                const url = await uploadImage(e.target.files[0]);
                updateContent(contentKey, url);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error occurred';
                alert(`Upload failed: ${message}`);
                console.error(err);
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between">
                <label className="text-sm text-gray-400 font-medium block">{label}</label>
                {isUploading && <span className="text-xs text-blue-400 animate-pulse">Uploading...</span>}
            </div>

            {type === 'textarea' ? (
                <textarea
                    value={value}
                    onChange={handleChange}
                    rows={4}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all resize-y placeholder:text-zinc-700 shadow-inner"
                />
            ) : type === 'image' ? (
                <div className="space-y-3">
                    <div className="flex gap-5 items-start">
                        {value && (
                            <div className="w-28 h-28 bg-black rounded-xl border border-white/10 overflow-hidden shrink-0 relative group shadow-lg">
                                <img src={`${value}?t=${Date.now()}`} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Eye className="w-6 h-6 text-white/80" />
                                </div>
                            </div>
                        )}
                        <div className="flex-1 space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={value}
                                    onChange={handleChange}
                                    className="w-full bg-zinc-900/50 border border-white/5 rounded-xl p-3 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all text-xs font-mono text-zinc-400"
                                    placeholder="https://..."
                                />
                                <div className="absolute right-2 top-2">
                                    <label className="cursor-pointer p-1.5 hover:bg-white/10 rounded-lg block transition-colors bg-white/5 border border-white/5">
                                        <Upload className="w-4 h-4 text-zinc-400 hover:text-white" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold bg-white/5 px-2 py-1 rounded">Smart Upload</span>
                                <p className="text-xs text-zinc-600">Drop file anywhere on field or click icon</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all shadow-inner"
                />
            )}
            {helperText && <p className="text-xs text-gray-600">{helperText}</p>}
        </div>
    );
};


// 3. Site Editor (The layout config)
const SiteEditor = () => {
    return (
        <div className="space-y-8 pb-32">
            <SectionAccordion title="Hero Section" defaultOpen>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <ContentField
                            label="Main Heading"
                            contentKey="studio.hero.heading"
                            defaultValue="Digital twins + generative AI for scalable product content."
                            type="textarea"
                        />
                        <ContentField
                            label="Subheading"
                            contentKey="studio.hero.subheading"
                            defaultValue="Cloudly Studio is a Warsaw-based R&D company..."
                            type="textarea"
                        />
                        <ContentField
                            label="CTA Label"
                            contentKey="studio.hero.cta"
                            defaultValue="Talk to us"
                        />
                    </div>
                    <div className="space-y-4">
                        <ContentField
                            label="Hero Background Image"
                            contentKey="studio.hero.image"
                            defaultValue="/assets/hero.png"
                            type="image"
                            helperText="High-res image recommended (1920x1080)"
                        />
                    </div>
                </div>
            </SectionAccordion>

            <SectionAccordion title="Deliverables (Products)">
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/5 rounded">
                        <h4 className="text-sm font-bold text-gray-500 mb-2">Card 1: Digital Twins</h4>
                        <ContentField label="Heading" contentKey="studio.deliver.card1.title" defaultValue="Digital twins" />
                        <ContentField label="Description" contentKey="studio.deliver.card1.desc" defaultValue="Of products and people for repeatable content creation." type="textarea" />
                    </div>
                    <div className="p-4 bg-white/5 rounded">
                        <h4 className="text-sm font-bold text-gray-500 mb-2">Card 2: Virtual Photo</h4>
                        <ContentField label="Heading" contentKey="studio.deliver.card2.title" defaultValue="Virtual photography" />
                        <ContentField label="Description" contentKey="studio.deliver.card2.desc" defaultValue="For catalogs, campaigns, variants and localisation." type="textarea" />
                    </div>
                    <div className="p-4 bg-white/5 rounded">
                        <h4 className="text-sm font-bold text-gray-500 mb-2">Card 3: Visualization</h4>
                        <ContentField label="Heading" contentKey="studio.deliver.card3.title" defaultValue="Technical visualisation" />
                        <ContentField label="Description" contentKey="studio.deliver.card3.desc" defaultValue="From CAD + drawings for complex equipment." type="textarea" />
                    </div>
                </div>
            </SectionAccordion>

            <SectionAccordion title="Platforms">
                <div className="space-y-8">
                    <div className="p-4 bg-white/5 rounded border border-white/5">
                        <h4 className="text-indigo-400 font-medium mb-4">Cloudly Fashion</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <ContentField label="Title" contentKey="studio.platforms.fashion.title" defaultValue="Cloudly Fashion" />
                                <ContentField label="Description" contentKey="studio.platforms.fashion.desc" defaultValue="Model digital twins + garment-aware look generation." type="textarea" />
                            </div>
                            <ContentField label="Visual Image" contentKey="studio.platforms.fashion.image" defaultValue="/assets/fashion.png" type="image" />
                        </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded border border-white/5">
                        <h4 className="text-indigo-400 font-medium mb-4">Cloudly Content</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <ContentField label="Title" contentKey="studio.platforms.content.title" defaultValue="Cloudly Content" />
                                <ContentField label="Description" contentKey="studio.platforms.content.desc" defaultValue="Automated social media images + post copy, on-brand." type="textarea" />
                            </div>
                            {/* Note: In real app this is a CSS grid, but maybe we want to allow an overriding image? */}
                            <ContentField label="Visual Image (Optional Placeholder)" contentKey="studio.platforms.content.image" type="image" helperText="If set, replaces CSS Grid animation" />
                        </div>
                    </div>
                </div>
            </SectionAccordion>

            <SectionAccordion title="Industries">
                <div className="space-y-8">
                    {/* Fashion */}
                    <div className="p-4 bg-white/5 rounded border border-white/5">
                        <h4 className="text-zinc-400 font-medium mb-4">Fashion</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <ContentField label="Title" contentKey="studio.industries.fashion.title" defaultValue="Fashion" />
                                <ContentField label="List Item 1" contentKey="studio.industries.fashion.li1" defaultValue="Digital twins of real models" />
                                <ContentField label="List Item 2" contentKey="studio.industries.fashion.li2" defaultValue="Virtual lookbooks & drops" />
                                <ContentField label="List Item 3" contentKey="studio.industries.fashion.li3" defaultValue="Brand-consistent output" />
                            </div>
                            <ContentField label="Card Image" contentKey="studio.industries.fashion.image" defaultValue="/assets/fashion.png" type="image" />
                        </div>
                    </div>

                    {/* CPG */}
                    <div className="p-4 bg-white/5 rounded border border-white/5">
                        <h4 className="text-zinc-400 font-medium mb-4">CPG</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <ContentField label="Title" contentKey="studio.industries.cpg.title" defaultValue="CPG" />
                                <ContentField label="List Item 1" contentKey="studio.industries.cpg.li1" defaultValue="Packshots and variants" />
                                <ContentField label="List Item 2" contentKey="studio.industries.cpg.li2" defaultValue="Faster iteration" />
                                <ContentField label="List Item 3" contentKey="studio.industries.cpg.li3" defaultValue="E-commerce consistency" />
                            </div>
                            <ContentField label="Card Image (Optional Override)" contentKey="studio.industries.cpg.image" type="image" helperText="Overrides default 3D bottle shape" />
                        </div>
                    </div>

                    {/* Industrial */}
                    <div className="p-4 bg-white/5 rounded border border-white/5">
                        <h4 className="text-zinc-400 font-medium mb-4">Laboratory & Industrial</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <ContentField label="Title" contentKey="studio.industries.industrial.title" defaultValue="Laboratory & Industrial" />
                                <ContentField label="List Item 1" contentKey="studio.industries.industrial.li1" defaultValue="CAD-to-visual pipelines" />
                                <ContentField label="List Item 2" contentKey="studio.industries.industrial.li2" defaultValue="Technical renders" />
                                <ContentField label="List Item 3" contentKey="studio.industries.industrial.li3" defaultValue="Imperfect source files ok" />
                            </div>
                            <ContentField label="Card Image" contentKey="studio.industries.industrial.image" defaultValue="/assets/industrial.png" type="image" />
                        </div>
                    </div>
                </div>
            </SectionAccordion>
        </div>
    )
}


// --- Main Page Component ---

export default function AdminVault() {
    const { user, signOut, loading: authLoading } = useAuth();
    const { hasUnsavedChanges, publishLive, discardDraft } = useContent();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);
    const [activeTab, setActiveTab] = useState<'editor' | 'analytics'>('editor');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoggingIn(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
        setLoggingIn(false);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-indigo-500" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-light tracking-tight text-white mb-2">Cloudly Studio</h1>
                        <div className="h-0.5 w-12 bg-white/20 mx-auto rounded-full"></div>
                        <p className="text-zinc-400 text-sm tracking-wide uppercase pt-2">Admin Vault Access</p>
                    </div>

                    <form onSubmit={handleLogin} className="mt-8 space-y-6 bg-zinc-900/50 p-8 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-black/40 border border-white/10 text-white text-sm rounded-lg focus:ring-2 focus:ring-white/20 focus:border-white/30 block w-full p-3 transition-all placeholder:text-zinc-700"
                                    placeholder="admin@cloudly.studio"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-black/40 border border-white/10 text-white text-sm rounded-lg focus:ring-2 focus:ring-white/20 focus:border-white/30 block w-full p-3 transition-all placeholder:text-zinc-700"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loggingIn}
                            className="w-full text-black bg-white hover:bg-zinc-200 font-semibold rounded-lg text-sm px-5 py-3 text-center transition-all disabled:opacity-50 tracking-wide"
                        >
                            {loggingIn ? 'Authenticating...' : 'Enter Vault'}
                        </button>
                    </form>
                    <div className="text-center mt-4">
                        <Link to="/" className="text-xs text-zinc-500 hover:text-white transition-colors uppercase tracking-widest">← Return to Site</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-white/20">
            {/* Top Bar */}
            <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="font-light text-xl tracking-tight">Cloudly<span className="font-semibold">Vault</span></span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider bg-white/10 text-zinc-300 border border-white/5">Beta v1.0</span>
                    </div>

                    <div className="flex items-center gap-6">
                        {hasUnsavedChanges ? (
                            <span className="flex items-center gap-2 text-xs font-medium text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                Unsaved Changes
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 text-xs font-medium text-zinc-500 px-3 py-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                All saved
                            </span>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                onClick={discardDraft}
                                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                            >
                                Discard
                            </button>
                            <button
                                onClick={publishLive}
                                className="flex items-center gap-2 px-5 py-2 bg-white text-black text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                            >
                                <Save className="w-3.5 h-3.5" />
                                Publish Live
                            </button>
                        </div>

                        <div className="h-6 w-px bg-white/10" />

                        <button onClick={signOut} className="text-zinc-500 hover:text-red-400 transition-colors p-2 hover:bg-white/5 rounded-lg">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-12">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar Navigation */}
                    <aside className="w-full lg:w-72 shrink-0 space-y-6">
                        <div className="p-6 rounded-2xl bg-zinc-900/30 border border-white/5 backdrop-blur-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 shadow-lg flex items-center justify-center text-lg font-bold">
                                    {user.email?.charAt(0).toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-white truncate">{user.email}</p>
                                    <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">Admin Access</p>
                                </div>
                            </div>
                            <nav className="space-y-2">
                                <button
                                    onClick={() => setActiveTab('editor')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'editor' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-600 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <Type className="w-4 h-4" />
                                    Site Editor
                                </button>
                                <button
                                    onClick={() => setActiveTab('analytics')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-600 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <BarChart2 className="w-4 h-4" />
                                    Traffic Intelligence
                                </button>
                                <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white transition-all group">
                                    <Eye className="w-4 h-4 group-hover:text-white transition-colors" />
                                    View Live Site
                                </Link>
                                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-zinc-600 cursor-not-allowed hidden">
                                    <FileImage className="w-4 h-4" />
                                    Media Library (Soon)
                                </button>
                            </nav>
                        </div>

                        <div className="p-6 rounded-2xl bg-blue-900/10 border border-blue-500/10">
                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Cloudly Tips</h4>
                            <p className="text-xs text-blue-300/70 leading-relaxed">
                                Need to update images? Drag and drop files directly onto any image field store them in Supabase.
                            </p>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 min-w-0">
                        <div className="mb-10 pb-6 border-b border-white/5">
                            <h2 className="text-3xl font-light text-white mb-2">
                                {activeTab === 'editor' ? 'Site Configuration' : 'Traffic Intelligence'}
                            </h2>
                            <p className="text-zinc-500">
                                {activeTab === 'editor' ? 'Manage your landing page content and assets.' : 'Live visitor tracking and company identification.'}
                            </p>
                        </div>
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                            {activeTab === 'editor' ? <SiteEditor /> : <AnalyticsDashboard />}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
