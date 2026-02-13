import { trackEvent } from '../lib/analytics';
// import { useContent } from '../contexts/ContentContext';

export default function Home() {
    // keeping the hook for potential future use or to avoid removing imports if other things depend on it (unlikely here)
    // const { getContent } = useContent();

    return (
        <>
            <header className="site-header">
                <div className="container header-container">
                    <a href="#" className="logo">Cloudly Studi<span style={{ color: '#0052FF' }}>o</span></a>
                    <nav className="main-nav">
                        <ul>
                            <li><a href="#work" onClick={() => trackEvent('click_nav', { category: 'navigation', label: 'work' })}>Work</a></li>
                            <li><a href="#how-it-works" onClick={() => trackEvent('click_nav', { category: 'navigation', label: 'how_it_works' })}>How it works</a></li>
                            <li><a href="#deliverables" onClick={() => trackEvent('click_nav', { category: 'navigation', label: 'deliverables' })}>Deliverables</a></li>
                            <li><a href="#process" onClick={() => trackEvent('click_nav', { category: 'navigation', label: 'process' })}>Process</a></li>
                            <li><a href="#contact" className="cta-button" onClick={() => trackEvent('click_cta', { category: 'navigation', label: 'request_pilot' })}>Request a pilot</a></li>
                        </ul>
                    </nav>
                </div>
            </header>

            <main>
                {/* HERO SECTION */}

                <section className="hero">
                    <div className="container">
                        <div className="hero-grid">
                            <div className="hero-text">
                                <h1>Photorealistic 3D Product Visualization</h1>
                                <p className="hero-tagline">
                                    Systematic. Consistent. Scalable.
                                </p>
                                <p className="hero-sub">
                                    We turn engineering CAD, technical drawings, and reference images into launch-ready visuals, without shipping samples or slowing R&D.
                                </p>
                                <a
                                    href="#contact"
                                    className="primary-btn"
                                    onClick={() => trackEvent('click_cta', { category: 'hero', label: 'request_pilot' })}
                                >
                                    Request a pilot
                                </a>
                            </div>
                            <div className="hero-visual">
                                <img src="https://xncoveowbfxpewldreyz.supabase.co/storage/v1/object/public/assets/marketing/Hero%20Image%20Top1.png" alt="Industrial Visualization" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* PROMISE SECTION (Work) */}
                <section className="deliver section-padding" id="work">
                    <div className="container">
                        <div className="grid-3">
                            <h2 className="sr-only">Our Promise</h2>
                            <div className="card">
                                <h3>Faster launches</h3>
                                <p>Marketing assets delivered in parallel with engineering. First outputs in days once inputs are cleared, not weeks of sample logistics.</p>
                            </div>
                            <div className="card">
                                <h3>Consistency at scale</h3>
                                <p>A repeatable virtual studio. Standardized lighting, angles, and materials across every SKU and every region.</p>
                            </div>
                            <div className="card">
                                <h3>Lower marginal cost</h3>
                                <p>Reuse components, materials, and file logic. Variants and configurations get faster and cheaper over time.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* WHY SWITCH SECTION */}
                <section className="platforms section-padding" id="why-switch">
                    <div className="container">
                        <h2 className="section-title">Why Physical Photography Fails
                            Engineering-Led Brands</h2>
                        <div className="platform-grid">
                            <div className="platform-item">
                                <div className="platform-text">
                                    <p className="lead" style={{ marginBottom: '1.5rem' }}>
                                        Photography breaks when variants multiply. Samples, shipping, studio scheduling, and approvals turn into a queue that grows with your catalog.
                                    </p>
                                    <p className="platform-desc">
                                        We replace the bottleneck with a digital pipeline. Marketing moves in parallel with engineering, and often ahead of manufacturing, with a consistent look across all products.
                                    </p>
                                </div>
                                <div className="platform-visual">
                                    <img src="https://xncoveowbfxpewldreyz.supabase.co/storage/v1/object/public/assets/marketing/Category%20Variations%201.png" alt="Digital Pipeline" style={{ filter: 'grayscale(100%)', opacity: 0.8 }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* HOW IT WORKS */}
                <section className="protocol-section section-padding" id="how-it-works">
                    <div className="container">
                        <div className="protocol-header">
                            <h2 className="section-title">Zero Ping-Pong Protocol</h2>
                            <p className="lead" style={{ marginBottom: '3rem' }}>Most vendors create chaos. Our workflow is batch-native.</p>
                        </div>
                        <div className="protocol-top-line">
                            <div className="protocol-card">
                                <h3>1. Consolidated feedback windows</h3>
                                <p>We work in defined review windows. Your team aligns internally, then sends one consolidated set of changes. No contradictory threads. No drip-feed corrections.</p>
                            </div>
                            <div className="protocol-card">
                                <h3>2. Single source of truth</h3>
                                <p>A live status sheet tracks every asset. You always know what is in draft, what is in review, what is approved, and what is ready to export.</p>
                            </div>
                            <div className="protocol-card">
                                <h3>3. Stopper list protocol</h3>
                                <p>We flag blockers early (missing views, unclear CAD, unknown materials). Nothing stalls silently. If we can gap-fill safely, we do.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* DELIVERABLES */}
                <section className="deliver section-padding" id="deliverables" style={{ backgroundColor: '#f9f9f9' }}>
                    <div className="container">
                        <h2 className="section-title">Output.</h2>
                        <p className="lead" style={{ marginBottom: '3rem' }}>High-fidelity assets ready for your entire marketing stack.</p>

                        <div className="grid-3">
                            <div className="card">
                                <div style={{ height: '200px', marginBottom: '1.5rem', overflow: 'hidden', borderRadius: '4px' }}>
                                    <img src="https://xncoveowbfxpewldreyz.supabase.co/storage/v1/object/public/assets/marketing/Still%20Renders.png" alt="Still Render" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <h3>01 Still renders</h3>
                                <p>Photoreal product visuals with clean isolation. 4K+ standard. Typical handover supports layered files, separate shadow, and editable screen areas.</p>
                            </div>
                            <div className="card">
                                <div style={{ height: '200px', marginBottom: '1.5rem', overflow: 'hidden', borderRadius: '4px' }}>
                                    <img src="https://xncoveowbfxpewldreyz.supabase.co/storage/v1/object/public/assets/marketing/360%20Spins.png" alt="360 Spins" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <h3>02 360 spins</h3>
                                <p>Smooth rotation, stationary lighting, single axis motion. Delivered as web-ready video formats for e-commerce and sales tools.</p>
                            </div>
                            <div className="card">
                                <div style={{ height: '200px', marginBottom: '1.5rem', overflow: 'hidden', borderRadius: '4px' }}>
                                    <img src="https://xncoveowbfxpewldreyz.supabase.co/storage/v1/object/public/assets/marketing/Component%20Library.png" alt="Asset Library" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <h3>03 Asset library</h3>
                                <p>A modular system of reusable components and materials that compounds value with every new SKU. Options available for source handover or fully managed maintenance.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* QUALITY */}
                <section className="quality-section section-padding" id="quality">
                    <div className="container">
                        <div className="quality-header">
                            <h2 className="section-title">Quality you can audit</h2>
                            <p className="lead" style={{ marginBottom: '3rem' }}>Accuracy is a deliverable, not an assumption.</p>
                        </div>

                        <div className="quality-grid">
                            <div className="quality-card">
                                <div className="gate-marker">
                                    <span className="gate-number">01</span>
                                    <span className="gate-status">TECHNICAL PASS</span>
                                </div>
                                <h3>Technical gate</h3>
                                <p>Geometry, ports, labels, and dimensions match your engineering intent across CAD, drawings, and references.</p>
                            </div>
                            <div className="quality-card">
                                <div className="gate-marker">
                                    <span className="gate-number">02</span>
                                    <span className="gate-status">AESTHETIC PASS</span>
                                </div>
                                <h3>Aesthetic gate</h3>
                                <p>Lighting, camera standards, and material definition aligned to your brand look and feel.</p>
                            </div>
                            <div className="quality-card">
                                <div className="gate-marker">
                                    <span className="gate-number">03</span>
                                    <span className="gate-status">LOGIC PASS</span>
                                </div>
                                <h3>File logic gate</h3>
                                <p>Verified naming, layer structure, specs, and handover readiness so your team can ship fast.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* PROCESS */}
                <section className="technology section-padding" id="process">
                    <div className="container">
                        <h2 className="section-title">The 3-step start</h2>
                        <div className="steps-grid">
                            <div className="step">
                                <span className="step-label">01 Alignment</span>
                                <p>We review inputs, confirm scope, and lock output specs. Any missing details are flagged upfront - one source of truth, zero ambiguity.</p>
                            </div>
                            <div className="step">
                                <span className="step-label">02 Pilot</span>
                                <p>End-to-end build of 1-2 products (or a small batch). You validate quality, specs, and collaboration rhythm before we scale.</p>
                            </div>
                            <div className="step">
                                <span className="step-label">03 Scale</span>
                                <p>Feedback applied, QA gates locked, and batch rollout begins (typically 5-15 units per batch for consistency and speed).</p>
                            </div>
                        </div>
                        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Validate quality first. Scale with confidence.</p>
                            <a
                                href="#contact"
                                className="primary-btn"
                                onClick={() => trackEvent('click_cta', { category: 'process', label: 'start_pilot' })}
                            >
                                Start your pilot
                            </a>
                        </div>
                    </div>
                </section>

                {/* WHO IS THIS FOR */}
                <section className="audience-section section-padding">
                    <div className="container">
                        <div className="audience-grid">
                            <h3 className="audience-label">WHO THIS IS FOR</h3>
                            <div className="audience-text">
                                <p className="lead-white">Engineering-led brands shipping complex products.</p>
                                <p className="desc-white">Lab, industrial, medical, and premium hardware teams with growing catalogs, multiplying variants, and marketing blocked by sample logistics.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="faq-section section-padding" id="faq">
                    <div className="container">
                        <div className="faq-grid">
                            <div className="faq-header">
                                <h2 className="section-title">Q&A</h2>
                            </div>
                            <div className="faq-list">
                                <div className="faq-item">
                                    <h3 className="faq-question">Do you need perfect CAD?</h3>
                                    <p className="faq-answer">No. We work from CAD, technical drawings, and reference photos. We expect gaps and we close them during modeling when it is safe and verifiable.</p>
                                </div>
                                <div className="faq-item">
                                    <h3 className="faq-question">Can you match our brand style?</h3>
                                    <p className="faq-answer">Yes. We standardize lighting, camera angles, and materials so the look stays consistent across your entire catalog, present and future.</p>
                                </div>
                                <div className="faq-item">
                                    <h3 className="faq-question">Do we get model ownership?</h3>
                                    <p className="faq-answer">Options are available. Choose final asset handover, partial source delivery, or a fully managed library where we maintain and extend the source files over time.</p>
                                </div>
                                <div className="faq-item">
                                    <h3 className="faq-question">Why don’t you show client logos?</h3>
                                    <p className="faq-answer">Confidentiality is part of the service. We operate under strict NDAs and protect unreleased products, workflows, and internal pipelines.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* PROOF STRIP */}
                <section className="proof-strip section-padding">
                    <div className="container">
                        <div className="proof-header">
                            <span className="swiss-flag" aria-label="Swiss Flag" role="img"></span>
                            <span className="proof-label">Quality approved by Swiss teams</span>
                        </div>
                        <blockquote>
                            “Top in terms of quality standards. Rocket speed without jeopardizing output quality.”
                        </blockquote>
                        <cite>- Swiss manufacturer</cite>
                    </div>
                </section>

                <footer id="contact">
                    <div className="container footer-content">
                        <div className="contact-info">
                            <h2>Contact</h2>
                            <a
                                href="mailto:hello@cloudly.studio"
                                className="email-link"
                                onClick={() => trackEvent('click_contact', { category: 'footer', label: 'email' })}
                            >
                                hello@cloudly.studio
                            </a>
                            <address>
                                CLOUDLY STUDIO sp. z o.o.<br />
                                Ul. Żelazna 51/53<br />
                                00-841, Warsaw, Poland
                            </address>
                        </div>
                        <div className="footer-links">
                            <h3>Links</h3>
                            <a
                                href="https://www.linkedin.com/company/cloudly-studio/"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackEvent('click_social', { category: 'footer', label: 'linkedin' })}
                            >
                                LinkedIn: Cloudly Studio
                            </a>
                        </div>
                    </div>
                    <div className="container text-center copyright">
                        <p>&copy; 2025 Cloudly Studio. All rights reserved.</p>
                    </div>
                </footer>
            </main>
        </>
    );
}
