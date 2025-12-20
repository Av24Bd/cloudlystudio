import React from 'react';
import { useContent } from '../contexts/ContentContext';

export default function Home() {
    const { getContent } = useContent();
    // Mock getContent until context is ready
    // const getContent = (key: string, fallback: string) => fallback;

    return (
        <>
            <header className="site-header">
                <div className="container header-container">
                    <a href="#" className="logo">Cloudly Studi<span style={{ color: '#0052FF' }}>o</span></a>
                    <nav className="main-nav">
                        <ul>
                            <li><a href="#about">About</a></li>
                            <li><a href="#products">Products</a></li>
                            <li><a href="#industries">Industries</a></li>
                            <li><a href="#technology">Technology</a></li>
                            <li><a href="#contact" className="cta-button">Talk to us</a></li>
                        </ul>
                    </nav>
                </div>
            </header>

            <main>
                <section className="hero">
                    <div className="hero-bg">
                        <img src={getContent('studio.hero.image', '/assets/hero.png')} alt="Abstract Tech Background" />
                    </div>
                    <div className="container hero-content">
                        <h1>{getContent('studio.hero.heading', 'Digital twins + generative AI for scalable product content.')}</h1>
                        <p className="hero-sub">
                            {getContent('studio.hero.subheading', 'Cloudly Studio is a Warsaw-based R&D company specialising in applied generative AI and 3D pipelines for brands. We design digital-twin, virtual photography and technical visualisation tools.')}
                        </p>
                        <a href="#contact" className="primary-btn">{getContent('studio.hero.cta', 'Talk to us')}</a>
                    </div>
                </section>

                <section className="deliver section-padding" id="products">
                    <div className="container">
                        <h2 className="section-title">What we deliver</h2>
                        <div className="grid-3">
                            <div className="card">
                                <h3>{getContent('studio.deliver.card1.title', 'Digital twins')}</h3>
                                <p>{getContent('studio.deliver.card1.desc', 'Of products and people for repeatable content creation.')}</p>
                            </div>
                            <div className="card">
                                <h3>{getContent('studio.deliver.card2.title', 'Virtual photography')}</h3>
                                <p>{getContent('studio.deliver.card2.desc', 'For catalogs, campaigns, variants and localisation.')}</p>
                            </div>
                            <div className="card">
                                <h3>{getContent('studio.deliver.card3.title', 'Technical visualisation')}</h3>
                                <p>{getContent('studio.deliver.card3.desc', 'From CAD + drawings for complex equipment.')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="platforms section-padding">
                    <div className="container">
                        <h2 className="section-title">Platforms</h2>
                        <div className="platform-grid">
                            <div className="platform-item">
                                <div className="platform-text">
                                    <h3>{getContent('studio.platforms.fashion.title', 'Cloudly Fashion')}</h3>
                                    <p>{getContent('studio.platforms.fashion.desc', 'Model digital twins + garment-aware look generation.')}</p>
                                </div>
                                <div className="platform-visual">
                                    <img src={getContent('studio.platforms.fashion.image', '/assets/fashion.png')} alt="Cloudly Fashion Digital Twin" />
                                </div>
                            </div>
                            <div className="platform-item reverse">
                                <div className="platform-text">
                                    <h3>{getContent('studio.platforms.content.title', 'Cloudly Content')}</h3>
                                    <p>{getContent('studio.platforms.content.desc', 'Automated social media images + post copy, on-brand.')}</p>
                                </div>
                                <div className={`platform-visual ${getContent('studio.platforms.content.image') ? '' : 'social-grid-visual'}`}>
                                    {/* Optional override for the grid visual if an image is provided */}
                                    {getContent('studio.platforms.content.image') ? (
                                        <img src={getContent('studio.platforms.content.image')} className="w-full h-full object-cover" alt="Cloudly Content" />
                                    ) : (
                                        <>
                                            <div className="social-post"></div>
                                            <div className="social-post"></div>
                                            <div className="social-post"></div>
                                            <div className="social-post"></div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="industries section-padding" id="industries">
                    <div className="container">
                        <h2 className="section-title">Industries</h2>
                        <div className="grid-3">
                            <div className="industry-card">
                                <div className="industry-img">
                                    <img src={getContent('studio.industries.fashion.image', '/assets/fashion.png')} alt="Fashion Industry" style={{ objectPosition: 'top' }} />
                                </div>
                                <div className="industry-content">
                                    <h3>{getContent('studio.industries.fashion.title', 'Fashion')}</h3>
                                    <ul>
                                        <li>{getContent('studio.industries.fashion.li1', 'Digital twins of real models')}</li>
                                        <li>{getContent('studio.industries.fashion.li2', 'Virtual lookbooks & drops')}</li>
                                        <li>{getContent('studio.industries.fashion.li3', 'Brand-consistent output')}</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="industry-card">
                                <div className="industry-img cpg-visual">
                                    {getContent('studio.industries.cpg.image') ? (
                                        <img src={getContent('studio.industries.cpg.image')} className="w-full h-full object-cover" alt="CPG" />
                                    ) : (
                                        <div className="cpg-shape"></div>
                                    )}
                                </div>
                                <div className="industry-content">
                                    <h3>{getContent('studio.industries.cpg.title', 'CPG')}</h3>
                                    <ul>
                                        <li>{getContent('studio.industries.cpg.li1', 'Packshots and variants')}</li>
                                        <li>{getContent('studio.industries.cpg.li2', 'Faster iteration')}</li>
                                        <li>{getContent('studio.industries.cpg.li3', 'E-commerce consistency')}</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="industry-card">
                                <div className="industry-img">
                                    <img src={getContent('studio.industries.industrial.image', '/assets/industrial.png')} alt="Industrial Visualization" />
                                </div>
                                <div className="industry-content">
                                    <h3>{getContent('studio.industries.industrial.title', 'Laboratory & Industrial')}</h3>
                                    <ul>
                                        <li>{getContent('studio.industries.industrial.li1', 'CAD-to-visual pipelines')}</li>
                                        <li>{getContent('studio.industries.industrial.li2', 'Technical renders')}</li>
                                        <li>{getContent('studio.industries.industrial.li3', 'Imperfect source files ok')}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="technology section-padding" id="technology">
                    <div className="container">
                        <div className="tech-intro">
                            <h2 className="section-title">Technology</h2>
                            <p className="lead">3D + AI, built for production and governance.</p>
                        </div>

                        <div className="pipeline-flow">
                            <h3 className="subsection-title">Pipeline</h3>
                            <div className="steps-grid">
                                <div className="step">
                                    <span className="step-label">Inputs</span>
                                    <p>Photos, CAD, drawings, specs</p>
                                </div>
                                <div className="step">
                                    <span className="step-label">Build</span>
                                    <p>Geometry cleanup, PBR materials, lighting templates</p>
                                </div>
                                <div className="step">
                                    <span className="step-label">Generate</span>
                                    <p>Virtual photography and controlled variations</p>
                                </div>
                                <div className="step">
                                    <span className="step-label">QC</span>
                                    <p>Consistency checks, versioning, traceability</p>
                                </div>
                                <div className="step">
                                    <span className="step-label">Deliver</span>
                                    <p>E-commerce assets, campaign sets, DAM/PIM-ready exports</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="principles section-padding">
                    <div className="container">
                        <h2 className="section-title">Principles</h2>
                        <div className="principles-list">
                            <div className="principle-item">
                                <span className="p-num">01</span>
                                <div className="p-content">
                                    <h3>Practical over hype</h3>
                                </div>
                            </div>
                            <div className="principle-item">
                                <span className="p-num">02</span>
                                <div className="p-content">
                                    <h3>Repeatable templates over one-off outputs</h3>
                                </div>
                            </div>
                            <div className="principle-item">
                                <span className="p-num">03</span>
                                <div className="p-content">
                                    <h3>Quality and control at scale</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="about section-padding" id="about">
                    <div className="container">
                        <h2 className="section-title">About</h2>
                        <div className="about-content">
                            <p className="large-text">Cloudly Studio builds systems that make product content scalable.</p>
                            <p>We combine 3D pipelines with applied generative AI so teams can produce more content with less
                                time, less cost, and lower carbon impact.</p>
                        </div>
                    </div>
                </section>

                <footer id="contact">
                    <div className="container footer-content">
                        <div className="contact-info">
                            <h2>Contact</h2>
                            <a href="mailto:hello@cloudly.studio" className="email-link">hello@cloudly.studio</a>
                            <address>
                                CLOUDLY STUDIO sp. z o.o.<br />
                                Ul. Żelazna 51/53<br />
                                00-841, Warsaw, Poland
                            </address>
                        </div>
                        <div className="footer-links">
                            <h3>Links</h3>
                            <a href="https://www.linkedin.com/company/cloudly-studio/" target="_blank" rel="noopener noreferrer">LinkedIn: Cloudly Studio</a>
                            <a href="https://www.linkedin.com/showcase/cloudly-fashion/" target="_blank" rel="noopener noreferrer">LinkedIn: Cloudly Fashion</a>
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
