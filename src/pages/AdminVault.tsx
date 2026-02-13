import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../contexts/ContentContext';
import { ChevronDown, ChevronRight, Upload, Save, Eye, Loader2, LogOut, FileImage, Type, BarChart2, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import UTMBuilder from '../components/UTMBuilder';

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
                                <p className="text-xs text-zinc-500">Drop file anywhere on field or click icon</p>
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
            {helperText && <p className="text-xs text-zinc-500">{helperText}</p>}
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
                            contentKey="hero.heading"
                            defaultValue="Photorealistic 3D Product Visualization"
                            type="textarea"
                        />
                        <ContentField
                            label="Tagline"
                            contentKey="hero.tagline"
                            defaultValue="Systematic. Consistent. Scalable."
                        />
                        <ContentField
                            label="Subheading"
                            contentKey="hero.sub"
                            defaultValue="We turn engineering CAD, technical drawings, and reference images into launch-ready visuals, without shipping samples or slowing R&D."
                            type="textarea"
                        />
                        <ContentField
                            label="CTA Label"
                            contentKey="hero.cta"
                            defaultValue="Request a pilot"
                        />
                    </div>
                    <div className="space-y-4">
                        <ContentField
                            label="Hero Image"
                            contentKey="hero.image"
                            defaultValue="https://xncoveowbfxpewldreyz.supabase.co/storage/v1/object/public/assets/marketing/Hero%20Image%20Top1.png"
                            type="image"
                            helperText="High-res image recommended"
                        />
                    </div>
                </div>
            </SectionAccordion>

            <SectionAccordion title="Promise (Work)">
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/5 rounded">
                        <h4 className="text-sm font-bold text-gray-500 mb-2">Card 1: Speed</h4>
                        <ContentField label="Title" contentKey="promise.card1.title" defaultValue="Faster launches" />
                        <ContentField label="Description" contentKey="promise.card1.desc" defaultValue="Marketing assets delivered in parallel with engineering. First outputs in days once inputs are cleared, not weeks of sample logistics." type="textarea" />
                    </div>
                    <div className="p-4 bg-white/5 rounded">
                        <h4 className="text-sm font-bold text-gray-500 mb-2">Card 2: Consistency</h4>
                        <ContentField label="Title" contentKey="promise.card2.title" defaultValue="Consistency at scale" />
                        <ContentField label="Description" contentKey="promise.card2.desc" defaultValue="A repeatable virtual studio. Standardized lighting, angles, and materials across every SKU and every region." type="textarea" />
                    </div>
                    <div className="p-4 bg-white/5 rounded">
                        <h4 className="text-sm font-bold text-gray-500 mb-2">Card 3: Cost</h4>
                        <ContentField label="Title" contentKey="promise.card3.title" defaultValue="Lower marginal cost" />
                        <ContentField label="Description" contentKey="promise.card3.desc" defaultValue="Reuse components, materials, and file logic. Variants and configurations get faster and cheaper over time." type="textarea" />
                    </div>
                </div>
            </SectionAccordion>

            <SectionAccordion title="Why Switch">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <ContentField label="Section Heading" contentKey="why.heading" defaultValue="Why Physical Photography Fails Engineering-Led Brands" />
                        <ContentField label="Lead Text" contentKey="why.lead" defaultValue="Photography breaks when variants multiply. Samples, shipping, studio scheduling, and approvals turn into a queue that grows with your catalog." type="textarea" />
                        <ContentField label="Description" contentKey="why.desc" defaultValue="We replace the bottleneck with a digital pipeline. Marketing moves in parallel with engineering, and often ahead of manufacturing, with a consistent look across all products." type="textarea" />
                    </div>
                    <ContentField
                        label="Visual Image"
                        contentKey="why.image"
                        defaultValue="https://xncoveowbfxpewldreyz.supabase.co/storage/v1/object/public/assets/marketing/Category%20Variations%201.png"
                        type="image"
                    />
                </div>
            </SectionAccordion>

            <SectionAccordion title="Protocol (How it Works)">
                <div className="space-y-4">
                    <ContentField label="Section Heading" contentKey="protocol.heading" defaultValue="Zero Ping-Pong Protocol" />
                    <ContentField label="Lead Text" contentKey="protocol.lead" defaultValue="Most vendors create chaos. Our workflow is batch-native." />

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-4 bg-white/5 rounded">
                            <h4 className="text-sm font-bold text-gray-500 mb-2">Step 1</h4>
                            <ContentField label="Title" contentKey="protocol.card1.title" defaultValue="1. Consolidated feedback windows" />
                            <ContentField label="Description" contentKey="protocol.card1.desc" defaultValue="We work in defined review windows. Your team aligns internally, then sends one consolidated set of changes. No contradictory threads. No drip-feed corrections." type="textarea" />
                        </div>
                        <div className="p-4 bg-white/5 rounded">
                            <h4 className="text-sm font-bold text-gray-500 mb-2">Step 2</h4>
                            <ContentField label="Title" contentKey="protocol.card2.title" defaultValue="2. Single source of truth" />
                            <ContentField label="Description" contentKey="protocol.card2.desc" defaultValue="A live status sheet tracks every asset. You always know what is in draft, what is in review, what is approved, and what is ready to export." type="textarea" />
                        </div>
                        <div className="p-4 bg-white/5 rounded">
                            <h4 className="text-sm font-bold text-gray-500 mb-2">Step 3</h4>
                            <ContentField label="Title" contentKey="protocol.card3.title" defaultValue="3. Stopper list protocol" />
                            <ContentField label="Description" contentKey="protocol.card3.desc" defaultValue="We flag blockers early (missing views, unclear CAD, unknown materials). Nothing stalls silently. If we can gap-fill safely, we do." type="textarea" />
                        </div>
                    </div>
                </div>
            </SectionAccordion>

            <SectionAccordion title="Deliverables (Output)">
                <div className="space-y-4">
                    <ContentField label="Section Heading" contentKey="deliverables.heading" defaultValue="Output." />
                    <ContentField label="Lead Text" contentKey="deliverables.lead" defaultValue="High-fidelity assets ready for your entire marketing stack." />

                    <div className="grid md:grid-cols-3 gap-6 mt-4">
                        {/* 01 Still Renders */}
                        <div className="p-4 bg-white/5 rounded border border-white/5">
                            <ContentField label="Image 01" contentKey="deliverables.card1.image" defaultValue="https://xncoveowbfxpewldreyz.supabase.co/storage/v1/object/public/assets/marketing/Still%20Renders.png" type="image" />
                            <div className="h-4"></div>
                            <ContentField label="Title 01" contentKey="deliverables.card1.title" defaultValue="01 Still renders" />
                            <ContentField label="Description 01" contentKey="deliverables.card1.desc" defaultValue="Photoreal product visuals with clean isolation. 4K+ standard. Typical handover supports layered files, separate shadow, and editable screen areas." type="textarea" />
                        </div>

                        {/* 02 360 Spins */}
                        <div className="p-4 bg-white/5 rounded border border-white/5">
                            <ContentField label="Image 02" contentKey="deliverables.card2.image" defaultValue="https://xncoveowbfxpewldreyz.supabase.co/storage/v1/object/public/assets/marketing/360%20Spins.png" type="image" />
                            <div className="h-4"></div>
                            <ContentField label="Title 02" contentKey="deliverables.card2.title" defaultValue="02 360 spins" />
                            <ContentField label="Description 02" contentKey="deliverables.card2.desc" defaultValue="Smooth rotation, stationary lighting, single axis motion. Delivered as web-ready video formats for e-commerce and sales tools." type="textarea" />
                        </div>

                        {/* 03 Asset Lib */}
                        <div className="p-4 bg-white/5 rounded border border-white/5">
                            <ContentField label="Image 03" contentKey="deliverables.card3.image" defaultValue="https://xncoveowbfxpewldreyz.supabase.co/storage/v1/object/public/assets/marketing/Component%20Library.png" type="image" />
                            <div className="h-4"></div>
                            <ContentField label="Title 03" contentKey="deliverables.card3.title" defaultValue="03 Asset library" />
                            <ContentField label="Description 03" contentKey="deliverables.card3.desc" defaultValue="A modular system of reusable components and materials that compounds value with every new SKU. Options available for source handover or fully managed maintenance." type="textarea" />
                        </div>
                    </div>
                </div>
            </SectionAccordion>

            <SectionAccordion title="Quality Assurance">
                <div className="space-y-4">
                    <ContentField label="Section Heading" contentKey="quality.heading" defaultValue="Quality you can audit" />
                    <ContentField label="Lead Text" contentKey="quality.lead" defaultValue="Accuracy is a deliverable, not an assumption." />

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-4 bg-white/5 rounded">
                            <ContentField label="Gate 1 Title" contentKey="quality.gate1.title" defaultValue="Technical gate" />
                            <ContentField label="Gate 1 Desc" contentKey="quality.gate1.desc" defaultValue="Geometry, ports, labels, and dimensions match your engineering intent across CAD, drawings, and references." type="textarea" />
                        </div>
                        <div className="p-4 bg-white/5 rounded">
                            <ContentField label="Gate 2 Title" contentKey="quality.gate2.title" defaultValue="Aesthetic gate" />
                            <ContentField label="Gate 2 Desc" contentKey="quality.gate2.desc" defaultValue="Lighting, camera standards, and material definition aligned to your brand look and feel." type="textarea" />
                        </div>
                        <div className="p-4 bg-white/5 rounded">
                            <ContentField label="Gate 3 Title" contentKey="quality.gate3.title" defaultValue="File logic gate" />
                            <ContentField label="Gate 3 Desc" contentKey="quality.gate3.desc" defaultValue="Verified naming, layer structure, specs, and handover readiness so your team can ship fast." type="textarea" />
                        </div>
                    </div>
                </div>
            </SectionAccordion>

            <SectionAccordion title="Process & Audience">
                <div className="space-y-8">
                    <div className="p-4 bg-white/5 rounded border border-white/5">
                        <h4 className="text-zinc-400 font-medium mb-4">Process</h4>
                        <ContentField label="Heading" contentKey="process.heading" defaultValue="The 3-step start" />
                        <div className="grid md:grid-cols-3 gap-4 mt-2">
                            <ContentField label="Step 1" contentKey="process.step1.desc" defaultValue="We review inputs, confirm scope, and lock output specs. Any missing details are flagged upfront - one source of truth, zero ambiguity." type="textarea" />
                            <ContentField label="Step 2" contentKey="process.step2.desc" defaultValue="End-to-end build of 1-2 products (or a small batch). You validate quality, specs, and collaboration rhythm before we scale." type="textarea" />
                            <ContentField label="Step 3" contentKey="process.step3.desc" defaultValue="Feedback applied, QA gates locked, and batch rollout begins (typically 5-15 units per batch for consistency and speed)." type="textarea" />
                        </div>
                        <div className="mt-4">
                            <ContentField label="Bottom CTA" contentKey="process.cta_text" defaultValue="Validate quality first. Scale with confidence." />
                            <ContentField label="Button Label" contentKey="process.cta_btn" defaultValue="Start your pilot" />
                        </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded border border-white/5">
                        <h4 className="text-zinc-400 font-medium mb-4">Target Audience</h4>
                        <ContentField label="Label" contentKey="audience.label" defaultValue="WHO THIS IS FOR" />
                        <ContentField label="Lead" contentKey="audience.lead" defaultValue="Engineering-led brands shipping complex products." />
                        <ContentField label="Description" contentKey="audience.desc" defaultValue="Lab, industrial, medical, and premium hardware teams with growing catalogs, multiplying variants, and marketing blocked by sample logistics." type="textarea" />
                    </div>
                </div>
            </SectionAccordion>

            <SectionAccordion title="FAQ">
                <div className="space-y-6">
                    <ContentField label="Section Heading" contentKey="faq.heading" defaultValue="Q&A" />
                    {/* FAQ Items */}
                    <div className="space-y-4">
                        <div className="p-3 bg-white/5 rounded">
                            <ContentField label="Question 1" contentKey="faq.q1" defaultValue="Do you need perfect CAD?" />
                            <ContentField label="Answer 1" contentKey="faq.a1" defaultValue="No. We work from CAD, technical drawings, and reference photos. We expect gaps and we close them during modeling when it is safe and verifiable." type="textarea" />
                        </div>
                        <div className="p-3 bg-white/5 rounded">
                            <ContentField label="Question 2" contentKey="faq.q2" defaultValue="Can you match our brand style?" />
                            <ContentField label="Answer 2" contentKey="faq.a2" defaultValue="Yes. We standardize lighting, camera angles, and materials so the look stays consistent across your entire catalog, present and future." type="textarea" />
                        </div>
                        <div className="p-3 bg-white/5 rounded">
                            <ContentField label="Question 3" contentKey="faq.q3" defaultValue="Do we get model ownership?" />
                            <ContentField label="Answer 3" contentKey="faq.a3" defaultValue="Options are available. Choose final asset handover, partial source delivery, or a fully managed library where we maintain and extend the source files over time." type="textarea" />
                        </div>
                        <div className="p-3 bg-white/5 rounded">
                            <ContentField label="Question 4" contentKey="faq.q4" defaultValue="Why don’t you show client logos?" />
                            <ContentField label="Answer 4" contentKey="faq.a4" defaultValue="Confidentiality is part of the service. We operate under strict NDAs and protect unreleased products, workflows, and internal pipelines." type="textarea" />
                        </div>
                    </div>
                </div>
            </SectionAccordion>

            <SectionAccordion title="Social Proof">
                <div className="space-y-4">
                    <ContentField label="Label" contentKey="proof.label" defaultValue="Quality approved by Swiss teams" />
                    <ContentField label="Quote" contentKey="proof.quote" defaultValue="“Top in terms of quality standards. Rocket speed without jeopardizing output quality.”" type="textarea" />
                    <ContentField label="Cite" contentKey="proof.cite" defaultValue="- Swiss manufacturer" />
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
    const [activeTab, setActiveTab] = useState<'editor' | 'analytics' | 'links'>('editor');

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
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'editor' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <Type className="w-4 h-4" />
                                    Site Editor
                                </button>
                                <button
                                    onClick={() => setActiveTab('analytics')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <BarChart2 className="w-4 h-4" />
                                    Traffic Intelligence
                                </button>
                                <button
                                    onClick={() => setActiveTab('links')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'links' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <LinkIcon className="w-4 h-4" />
                                    Campaign Links
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
                                {activeTab === 'editor' && 'Site Configuration'}
                                {activeTab === 'analytics' && 'Traffic Intelligence'}
                                {activeTab === 'links' && 'Campaign Manager'}
                            </h2>
                            <p className="text-zinc-500">
                                {activeTab === 'editor' && 'Manage your landing page content and assets.'}
                                {activeTab === 'analytics' && 'Live visitor tracking and company identification.'}
                                {activeTab === 'links' && 'Create and track UTM links for your marketing campaigns.'}
                            </p>
                        </div>
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                            {activeTab === 'editor' && <SiteEditor />}
                            {activeTab === 'analytics' && <AnalyticsDashboard />}
                            {activeTab === 'links' && <UTMBuilder />}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
