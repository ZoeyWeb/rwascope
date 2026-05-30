import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Eyebrow } from '../../components/Eyebrow';
import ContactForm from './ContactForm';

interface InquiryBlockProps {
  title: string;
  description: string;
  link?: { to: string; label: string };
  className?: string;
}

function InquiryBlock({ title, description, link, className = '' }: InquiryBlockProps) {
  return (
    <div className={className}>
      <h3 className="text-ed-item-h4 text-ed-ink">{title}</h3>
      <p className="text-ed-body text-ed-text-secondary mt-2 leading-relaxed">{description}</p>
      {link && (
        <Link
          to={link.to}
          className="inline-block mt-3 text-ed-meta text-ed-ink border-b border-ed-ink hover:border-b-2 transition-all"
        >
          {link.label}
        </Link>
      )}
    </div>
  );
}

export default function Contact() {
  return (
    <>
      <Helmet>
        <title>Contact — RWAscope</title>
        <meta
          name="description"
          content="Get in touch with the RWAscope team for press inquiries, research collaboration, data access, or speaking engagements."
        />
        <meta property="og:title" content="Contact — RWAscope" />
        <meta
          property="og:description"
          content="Get in touch with the RWAscope team for press inquiries, research collaboration, data access, or speaking engagements."
        />
        <link rel="canonical" href="https://rwa-index.com/contact" />
      </Helmet>

      <div className="max-w-[1400px] mx-auto px-8">

        {/* Hero */}
        <section className="pt-ed-section-md pb-ed-section-sm">
          <Eyebrow>Contact</Eyebrow>
          <h1 className="text-ed-hero-h1 text-ed-ink mt-ed-section-sm">
            Get in touch with our team
          </h1>
          <p className="text-ed-lede text-ed-text-secondary max-w-[720px] mt-ed-section-sm">
            For press inquiries, research collaboration, data access requests,
            or speaking engagements at conferences and policy forums.
          </p>
        </section>

        {/* Main two-col */}
        <section className="border-t border-ed-hairline pt-ed-section pb-ed-section">
          <div className="grid grid-cols-12 gap-16">

            {/* Left: inquiry type info blocks, col-span-5 */}
            <div className="col-span-5">

              <InquiryBlock
                title="Press & media"
                description="Boilerplate, statistics, brand assets, and citation guide are available in our Press Kit. For interviews and quotes, use the form."
                link={{ to: '/press', label: 'Open Press Kit →' }}
              />

              <InquiryBlock
                className="mt-ed-section"
                title="Research collaboration"
                description="Academic researchers working on stablecoin or RWA risk are welcome to reach out for data access, co-authorship discussions, or framework refinement."
              />

              <InquiryBlock
                className="mt-ed-section"
                title="Data inquiries"
                description="For structured data exports beyond what's publicly available on the platform, or for embedding RARM/SARM assessments in third-party products."
              />

              <InquiryBlock
                className="mt-ed-section"
                title="Speaking & advisory"
                description="Conference panels, regulatory briefings, internal training on RWA risk frameworks."
              />

              {/* Affiliation */}
              <div className="mt-ed-section pt-ed-section-sm border-t border-ed-hairline">
                <div className="text-ed-eyebrow uppercase tracking-[0.18em] text-ed-text-muted">
                  Affiliation
                </div>
                <address className="not-italic text-ed-body text-ed-ink mt-3 leading-relaxed">
                  HKUST Crypto-Fintech Lab<br />
                  Academy of Interdisciplinary Studies<br />
                  The Hong Kong University of Science and Technology<br />
                  Hong Kong SAR
                </address>
              </div>

            </div>

            {/* Right: form, col-span-7 */}
            <div className="col-span-7">
              <ContactForm />
            </div>

          </div>
        </section>

      </div>
    </>
  );
}
