import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BigStat, BigStatRibbon } from '../../components/BigStat';
import { Eyebrow } from '../../components/Eyebrow';
import SectionHeader from '../../components/SectionHeader';
import CopyableBlock from '../../components/CopyableBlock';
import CiteFormatTabs from '../../components/CiteFormatTabs';
import DownloadCard from '../../components/DownloadCard';
import { RWASCOPE_CONTACT, RWASCOPE_BOILERPLATE } from '../../data/contact';

interface Counts {
  projects: number;
  incidents: number;
  issuers: number;
  assets: number;
}

const BIBTEX = `@misc{rwascope2026,
  author    = {{RWAscope Research}},
  title     = {{RWAscope: Structural Intelligence for Tokenized Real-World Assets}},
  year      = {2026},
  publisher = {HKUST Crypto-Fintech Lab},
  url       = {https://rwa-index.com}
}`;

const APA = `RWAscope Research. (2026). RWAscope: Structural intelligence for tokenized real-world assets. HKUST Crypto-Fintech Lab. https://rwa-index.com`;

const CHICAGO = `RWAscope Research. "RWAscope: Structural Intelligence for Tokenized Real-World Assets." HKUST Crypto-Fintech Lab, 2026. https://rwa-index.com.`;

export default function Press() {
  const [counts, setCounts] = useState<Counts>({ projects: 0, incidents: 0, issuers: 0, assets: 0 });

  useEffect(() => {
    Promise.all([
      fetch('/data/projects/projects.json').then(r => r.json()),
      fetch('/data/incidents/incidents.json').then(r => r.json()),
      fetch('/data/licenses/issuers.json').then(r => r.json()),
      fetch('/data/assets/assets.json').then(r => r.json()),
    ]).then(([projects, incidents, issuers, assets]) => {
      setCounts({
        projects: Array.isArray(projects) ? projects.length : 0,
        incidents: Array.isArray(incidents) ? incidents.length : 0,
        issuers: Array.isArray(issuers) ? issuers.length : 0,
        assets: Array.isArray(assets) ? assets.length : 0,
      });
    }).catch(() => {});
  }, []);

  return (
    <>
      <Helmet>
        <title>Press Kit — RWAscope</title>
        <meta
          name="description"
          content="Press resources for RWAscope: structured RWA risk research from HKUST Crypto-Fintech Lab. Boilerplate, statistics, brand assets, citation guide."
        />
        <meta property="og:title" content="RWAscope Press Kit" />
        <meta
          property="og:description"
          content="Press resources for RWAscope: structured RWA risk research from HKUST Crypto-Fintech Lab. Boilerplate, statistics, brand assets, citation guide."
        />
        <link rel="canonical" href="https://rwa-index.com/press" />
      </Helmet>

      <div className="max-w-[1400px] mx-auto px-8">

        {/* Hero */}
        <section className="pt-ed-section-md pb-ed-section-sm">
          <Eyebrow>Press &amp; Media</Eyebrow>
          <h1 className="text-4xl md:text-ed-page-h1 text-ed-ink mt-ed-section-sm">
            Press Kit
          </h1>
          <p className="text-ed-lede text-ed-text-secondary max-w-[720px] mt-ed-section-sm">
            Resources for journalists, researchers, and analysts covering
            real-world asset tokenization and stablecoin risk.
          </p>
        </section>

      </div>

      {/* Key facts ribbon — full-width breakout */}
      <BigStatRibbon cols={5}>
        <BigStat value={counts.projects || '45+'} label="RWA projects" />
        <BigStat value={counts.incidents || '27'} label="Indexed incidents" />
        <BigStat value={counts.issuers || '29'} label="Stablecoin issuers" />
        <BigStat value={7} label="Jurisdictions" />
        <BigStat value={2} label="Academic frameworks" />
      </BigStatRibbon>

      <div className="max-w-[1400px] mx-auto px-8">

        {/* About / Boilerplate */}
        <section className="mt-ed-section">
          <SectionHeader>About RWAscope</SectionHeader>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-ed-section-sm">
            <div className="md:col-span-8">
              <p className="text-ed-body-lg text-ed-ink leading-relaxed">
                {RWASCOPE_BOILERPLATE.long}
              </p>
            </div>
            <aside className="md:col-span-4 space-y-ed-section-sm">
              <CopyableBlock label="Short (1 sentence)" content={RWASCOPE_BOILERPLATE.short} />
              <CopyableBlock label="Medium (1 paragraph)" content={RWASCOPE_BOILERPLATE.medium} />
            </aside>
          </div>
        </section>

        {/* Citation guide */}
        <section className="mt-ed-section border-t border-ed-hairline pt-ed-section-sm">
          <SectionHeader>Citation guide</SectionHeader>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-ed-section-sm">
            <div className="md:col-span-6">
              <h3 className="text-ed-block-h3 text-ed-ink">Citing the platform</h3>
              <p className="text-ed-body text-ed-text-secondary mt-3">
                When referencing RWAscope as an information source.
              </p>
              <CiteFormatTabs bibtex={BIBTEX} apa={APA} chicago={CHICAGO} />
            </div>
            <div className="md:col-span-6">
              <h3 className="text-ed-block-h3 text-ed-ink">Citing individual incidents</h3>
              <p className="text-ed-body text-ed-text-secondary mt-3">
                Each incident in the registry has a permanent identifier (RWAI-YYYY-NNN) and a
                one-click citation widget on its own page.
              </p>
              <Link
                to="/incidents"
                className="inline-block mt-ed-section-sm text-ed-item-h4 text-ed-ink border-b border-ed-ink hover:border-b-2 transition-all"
              >
                Browse Incident Registry →
              </Link>
            </div>
          </div>
        </section>

        {/* Downloads */}
        <section className="mt-ed-section border-t border-ed-hairline pt-ed-section-sm">
          <SectionHeader>Downloads</SectionHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 border border-ed-hairline mt-ed-section-sm">
            <DownloadCard
              eyebrow="Brand"
              title="Logo pack"
              description="SVG mark, wordmark, and dark/light variants. No ZIP yet — individual files available at /press/."
              href="/press/logo-mark.svg"
              size="SVG"
            />
            <DownloadCard
              eyebrow="Data"
              title="Key statistics"
              description="Current coverage, incident counts, and asset class breakdown. Updated each release."
              href="/press/rwascope-key-stats.csv"
              size="CSV"
            />
            <DownloadCard
              eyebrow="Research"
              title="Working papers"
              description="SARM and RARM working papers on SSRN. URL to be confirmed by maintainer."
              href="#"
              size="External — URL pending"
              external
            />
          </div>

          {/* RSS feeds */}
          <div className="border border-t-0 border-ed-hairline px-8 py-ed-section-sm">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-8">
              <div>
                <div className="text-ed-eyebrow uppercase tracking-[0.18em] text-ed-text-muted">Subscribe</div>
                <h3 className="text-ed-block-h3 text-ed-ink mt-3">RSS feeds</h3>
                <p className="text-ed-body text-ed-text-secondary mt-2 max-w-[480px]">
                  Get new incidents and weekly briefs delivered to your RSS reader. Atom 1.0 format, compatible with Feedly, NetNewsWire, Inoreader, and all standard readers.
                </p>
              </div>
              <div className="shrink-0 flex flex-col gap-3 mt-1">
                <a
                  href="/feeds/incidents.xml"
                  className="flex items-center gap-3 border border-ed-hairline px-4 py-3 hover:border-ed-ink transition-colors group"
                >
                  <span className="material-symbols-outlined text-[18px] text-ed-text-muted group-hover:text-ed-ink transition-colors">rss_feed</span>
                  <div>
                    <div className="text-ed-meta text-ed-ink">Incident Registry</div>
                    <div className="text-[11px] text-ed-text-faint font-mono mt-0.5">/feeds/incidents.xml</div>
                  </div>
                </a>
                <a
                  href="/feeds/weekly-brief.xml"
                  className="flex items-center gap-3 border border-ed-hairline px-4 py-3 hover:border-ed-ink transition-colors group"
                >
                  <span className="material-symbols-outlined text-[18px] text-ed-text-muted group-hover:text-ed-ink transition-colors">rss_feed</span>
                  <div>
                    <div className="text-ed-meta text-ed-ink">Weekly Brief</div>
                    <div className="text-[11px] text-ed-text-faint font-mono mt-0.5">/feeds/weekly-brief.xml</div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Logo previews */}
          <div className="mt-ed-section-md grid grid-cols-2 sm:grid-cols-4 gap-0 border border-ed-hairline">
            {[
              { file: 'logo-mark.svg', label: 'Mark (accent)', bg: 'bg-white' },
              { file: 'logo-mark-dark.svg', label: 'Mark (white / dark bg)', bg: 'bg-[#1A1A2E]' },
              { file: 'logo-mark-light.svg', label: 'Mark (dark / light bg)', bg: 'bg-ed-surface-cool' },
              { file: 'logo-wordmark.svg', label: 'Wordmark', bg: 'bg-white' },
            ].map(({ file, label, bg }) => (
              <a
                key={file}
                href={`/press/${file}`}
                download
                className={`group flex flex-col items-center justify-center p-6 border-r border-ed-hairline last:border-r-0 ${bg} hover:opacity-90 transition-opacity`}
              >
                <img src={`/press/${file}`} alt={label} className="h-12 object-contain" />
                <span className="text-ed-meta text-ed-text-muted mt-3">{label}</span>
                <span className="text-[10px] text-ed-text-faint mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to download
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="mt-ed-section border-t border-ed-hairline pt-ed-section-sm pb-ed-section">
          <SectionHeader>Media contact</SectionHeader>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-ed-section-sm">
            <div className="md:col-span-6">
              <div className="text-ed-eyebrow uppercase tracking-[0.18em] text-ed-text-muted">
                Press inquiries
              </div>
              <Link
                to="/contact"
                className="text-ed-block-h3 text-ed-ink mt-3 inline-block border-b border-ed-ink hover:border-b-2 transition-all"
              >
                Open contact form →
              </Link>
              <p className="text-ed-body text-ed-text-secondary mt-3">
                For press inquiries, use the contact form. We respond within 3 business days.
              </p>
            </div>
            <div className="md:col-span-6">
              <div className="text-ed-eyebrow uppercase tracking-[0.18em] text-ed-text-muted">
                Affiliation
              </div>
              <address className="not-italic text-ed-body text-ed-ink mt-3 leading-relaxed">
                {RWASCOPE_CONTACT.affiliation.lab}<br />
                {RWASCOPE_CONTACT.affiliation.department}<br />
                {RWASCOPE_CONTACT.affiliation.institution}<br />
                {RWASCOPE_CONTACT.affiliation.city}
              </address>
            </div>
          </div>
        </section>

        {/* In the media (placeholder) */}
        <section className="border-t border-ed-hairline pt-ed-section-sm pb-ed-section">
          <SectionHeader>In the media</SectionHeader>
          <p className="text-ed-body text-ed-text-muted mt-ed-section-sm">
            Coverage and citations will be listed here as they appear.
          </p>
        </section>

      </div>
    </>
  );
}
