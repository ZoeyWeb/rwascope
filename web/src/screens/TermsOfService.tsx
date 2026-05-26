/**
 * Terms of Use / Disclaimer page.
 * Accessible at /terms — linked from Disclaimer modal and footer.
 */
import { useNavigate } from 'react-router-dom';

const EFFECTIVE_DATE = '21 April 2026';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto thin-scrollbar bg-surface p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="border-b border-outline-variant/20 pb-6 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white mb-4 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </button>
          <div className="text-[10px] font-label font-bold text-primary tracking-widest uppercase mb-2">
            Legal
          </div>
          <h1 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight mb-2">
            Terms of Use & Disclaimer
          </h1>
          <p className="text-xs text-on-surface-variant">
            Effective date: {EFFECTIVE_DATE} · Last reviewed: {EFFECTIVE_DATE}
          </p>
        </div>

        <div className="prose-dark space-y-8">
          {/* Section 1 */}
          <Section title="1. Nature of the Platform">
            <p>
              RWA-Index ("the Platform", "we", "us") is an academic research tool that makes the
              RARM (RWA Asset Risk Matrix) methodology available to registered users for the
              purpose of conducting their own structured due diligence on tokenized real-world
              asset protocols.
            </p>
            <p>
              The Platform does <strong>not</strong>:
            </p>
            <ul>
              <li>Provide credit ratings, credit scores, or credit assessments of any kind;</li>
              <li>Issue investment advice, investment recommendations, or solicitations;</li>
              <li>
                Publish, broadcast, or distribute any ratings or assessments of protocols to
                third parties;
              </li>
              <li>Hold or purport to hold any regulated financial services licence.</li>
            </ul>
          </Section>

          {/* Section 2 */}
          <Section title="2. Regulatory Status">
            <p>
              RWA-Index does not hold a Type 10 (Providing Credit Rating Services) licence
              issued by the Hong Kong Securities and Futures Commission (SFC), nor an equivalent
              licence or authorisation in any other jurisdiction.
            </p>
            <p>
              Users located in Hong Kong, the European Union, the United Kingdom, the United
              States, Singapore, or any other jurisdiction with regulated credit rating or
              financial advisory services are solely responsible for ensuring that their use of
              this Platform complies with applicable local laws and regulations.
            </p>
          </Section>

          {/* Section 3 */}
          <Section title="3. User Scores Are Private and User-Generated">
            <p>
              Any scores, assessments, or analyses produced through the RARM due diligence
              workbook tool are:
            </p>
            <ul>
              <li>
                Generated entirely by the registered user using their own professional judgment;
              </li>
              <li>Stored privately and accessible only to the user who created them;</li>
              <li>
                Not shared with, aggregated by, or attributed to RWA-Index or any third party;
              </li>
              <li>
                Not published, ranked, displayed publicly, or used to derive any platform-level
                rating.
              </li>
            </ul>
            <p>
              The RARM Score displayed in a user's private workbook is a mathematical output of
              the user's own sub-indicator scores applied to the RARM framework weightings. It
              is an analytical aid for the user's internal purposes only and does not constitute
              a rating, opinion, or endorsement by RWA-Index.
            </p>
          </Section>

          {/* Section 4 */}
          <Section title="4. AI Research Assistant">
            <p>
              The Platform offers an optional AI-assisted due diligence checklist feature
              (powered by DeepSeek). This feature generates:
            </p>
            <ul>
              <li>Verification questions the user should consider researching;</li>
              <li>Pointers to publicly available data sources;</li>
              <li>Common red flags relevant to the protocol's asset class and risk layer.</li>
            </ul>
            <p>
              The AI assistant does <strong>not</strong> generate numeric scores, ratings,
              risk grades, or investment opinions. Its output is a research checklist only.
              Users should independently verify all information and exercise their own judgment.
            </p>
          </Section>

          {/* Section 5 */}
          <Section title="5. Market Data">
            <p>
              The Protocol Directory and Market Dashboard display data sourced from DeFiLlama
              (api.llama.fi) and are provided for informational purposes only. RWA-Index does
              not verify, endorse, or take responsibility for the accuracy of third-party data.
              TVL figures and other metrics may be inaccurate, delayed, or incomplete.
            </p>
          </Section>

          {/* Section 6 */}
          <Section title="6. No Warranties; Limitation of Liability">
            <p>
              The Platform is provided "as is" without warranty of any kind, express or implied.
              RWA-Index makes no representation as to the accuracy, completeness, or fitness for
              purpose of any information on the Platform.
            </p>
            <p>
              To the maximum extent permitted by applicable law, RWA-Index shall not be liable
              for any direct, indirect, incidental, special, or consequential damages arising
              from use of the Platform, including but not limited to losses arising from
              investment decisions made in reliance on any content herein.
            </p>
          </Section>

          {/* Section 7 */}
          <Section title="7. Intellectual Property">
            <p>
              The RARM framework methodology, software, and all original content on the Platform
              are the intellectual property of RWA-Index. Users may use the framework for their
              own internal due diligence purposes but may not reproduce, redistribute, or
              commercialise the methodology without written permission.
            </p>
          </Section>

          {/* Section 8 */}
          <Section title="8. Governing Law">
            <p>
              These Terms of Use are governed by and construed in accordance with the laws of
              Hong Kong SAR, without regard to conflict of law principles. Any disputes shall
              be subject to the exclusive jurisdiction of the courts of Hong Kong SAR.
            </p>
          </Section>

          {/* Section 9 */}
          <Section title="9. Changes to These Terms">
            <p>
              We reserve the right to update these Terms at any time. Material changes will be
              notified to registered users via the Platform. Continued use of the Platform
              after changes constitutes acceptance of the revised Terms.
            </p>
          </Section>

          {/* Contact */}
          <div className="p-4 bg-surface-container border border-outline-variant/20 rounded text-sm text-on-surface-variant">
            <p className="font-semibold text-on-surface mb-1">Questions?</p>
            <p>
              If you have questions about these Terms or the Platform's regulatory status,
              please contact us at{' '}
              <a
                href="mailto:legal@rwa-index.io"
                className="text-primary hover:underline"
              >
                legal@rwa-index.io
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-3 pb-2 border-b border-outline-variant/20">
        {title}
      </h2>
      <div className="space-y-3 text-sm text-on-surface-variant leading-relaxed [&_strong]:text-on-surface [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
