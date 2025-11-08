import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function TermsAndConditions() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container max-w-4xl py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Terms of Use & Company Benefit Policy
            </h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              1. Introduction
            </h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                <strong>1.1</strong> Sharekte.com ("the Site") is a digital
                platform providing ready-made companies for temporary use and
                related legal, administrative, and banking services, including:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Apostille and embassy certifications</li>
                <li>Financial statement preparation</li>
                <li>Bank account setup</li>
                <li>
                  Business services including nominee directors, virtual
                  offices, and KYC services
                </li>
              </ul>
              <p>
                <strong>1.2</strong> By using the Site or any services offered,
                the client ("Client" or "Beneficiary") agrees fully and legally
                to these Terms and Conditions.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              2. Definitions
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong>Ready-made Company:</strong> A legally registered
                company provided for temporary benefit/use only, not for
                permanent sale or transfer of ownership.
              </p>
              <p>
                <strong>Benefit/Use:</strong> The Client's right to utilize the
                company for legal and business transactions during a specified
                period.
              </p>
              <p>
                <strong>Benefit Period:</strong> Normally one year from the date
                of company transfer to the Client.
              </p>
              <p>
                <strong>Client / Beneficiary:</strong> The natural or legal
                person receiving the right to use the company.
              </p>
              <p>
                <strong>Accompanying Services:</strong> Any legal,
                administrative, or banking services provided alongside the
                company, such as apostille, financial statements, bank account
                opening, etc.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              3. Nature of the Companies
            </h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                <strong>3.1</strong> All companies listed on the Site are for
                temporary use only and not for final sale.
              </p>
              <p>
                <strong>3.2</strong> Temporary use does not confer ownership to
                the Client.
              </p>
              <p>
                <strong>3.3</strong> The Site reserves the right to re-list or
                reassign the company to other clients after the benefit period
                expires or is not renewed.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              4. Terms of Use / Benefit Period
            </h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                <strong>4.1</strong> The benefit period is one year unless
                otherwise agreed in writing.
              </p>
              <p>
                <strong>4.2</strong> The Client must renew the benefit before
                the period ends.
              </p>
              <p>
                <strong>4.3</strong> Failure to renew entitles the Site to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Reclaim the company and offer it to other clients</li>
                <li>
                  Dispose of the company without the Client's prior consent
                </li>
                <li>
                  Deny any claims or compensation from the Client after
                  expiration
                </li>
              </ul>
              <p>
                <strong>4.4</strong> If the company remains unsold, the Client
                can reactivate the benefit after paying all due fees.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              5. Client Rights and Obligations
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground mb-2">
                  5.1. Client Rights:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    Use the company for legal and administrative transactions
                    only
                  </li>
                  <li>
                    Access any accompanying legal or administrative services
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-2">
                  5.2. Client Obligations:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    Comply with all applicable local and international laws
                  </li>
                  <li>
                    Not alter any company records, official documents, or data
                    without written consent from the Site
                  </li>
                  <li>Pay all fees on time</li>
                  <li>Not sell, lease, or transfer the company</li>
                  <li>Maintain confidentiality of all company information</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              6. Company Data Modification
            </h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                <strong>6.1</strong> Clients may not change any official company
                data, including:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Company name</li>
                <li>Shareholders or directors</li>
                <li>Legal address</li>
                <li>Official documents</li>
              </ul>
              <p>
                <strong>6.2</strong> Any legal modification must be requested
                through the Site to ensure compliance with the law.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              7. Payment Methods
            </h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                <strong>7.1</strong> Accepted payment methods include:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Credit/Debit cards (Visa, MasterCard, AmEx)</li>
                <li>Bank transfers</li>
                <li>
                  Approved digital wallets or other payment methods integrated
                  with the Site
                </li>
              </ul>
              <p>
                <strong>7.2</strong> All payments must be made prior to company
                transfer or service activation.
              </p>
              <p>
                <strong>7.3</strong> Clients are responsible for providing
                accurate payment information.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              8. Refund Policy
            </h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                <strong>8.1</strong> No refunds are allowed after the benefit is
                activated or services begin, except in cases where the Site
                cannot deliver the service due to legal or technical reasons
                outside the Client's control.
              </p>
              <p>
                <strong>8.2</strong> Approved refunds are processed within 14
                business days to the original payment method.
              </p>
              <p>
                <strong>8.3</strong> Administrative or processing fees may be
                deducted if previously agreed.
              </p>
              <p>
                <strong>8.4</strong> Cancellation before activation allows a
                full refund minus any administrative fees.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              9. Customer Support
            </h2>
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <p className="text-muted-foreground leading-relaxed">
                For inquiries or support, contact:{" "}
                <a
                  href="mailto:support@sharekte.com"
                  className="text-primary hover:underline font-semibold"
                >
                  support@sharekte.com
                </a>
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>
                  Clients may use this email to request assistance, cancel
                  subscriptions, or resolve disputes
                </li>
                <li>
                  The Site will respond to support inquiries within a reasonable
                  timeframe
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              10. Privacy and Data Protection
            </h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                <strong>10.1</strong> The Site is committed to protecting Client
                data according to the Privacy Policy.
              </p>
              <p>
                <strong>10.2</strong> Personal and company data is used solely
                to provide the agreed services.
              </p>
              <p>
                <strong>10.3</strong> Data will not be shared with third parties
                without consent, except as required by law.
              </p>
              <p>
                <strong>10.4</strong> The Site may use anonymized data for
                marketing and internal purposes.
              </p>
              <p>
                <strong>10.5</strong> Clients can request access, correction, or
                deletion of their personal data in accordance with applicable UK
                data protection laws (including GDPR).
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              11. Marketing and Communication
            </h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                <strong>11.1</strong> The Site may send marketing messages to
                Clients who have opted in.
              </p>
              <p>
                <strong>11.2</strong> Clients may opt out anytime by contacting{" "}
                <a
                  href="mailto:support@sharekte.com"
                  className="text-primary hover:underline font-semibold"
                >
                  support@sharekte.com
                </a>{" "}
                or using the provided unsubscribe links.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              12. Termination of Benefit
            </h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                <strong>12.1</strong> The Site may terminate the benefit if:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>The Client fails to renew</li>
                <li>The Client breaches terms or applicable laws</li>
                <li>
                  The company is used illegally or contrary to these Terms
                </li>
              </ul>
              <p>
                <strong>12.2</strong> After termination, the Site may reclaim
                the company and reassign or resell it.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              13. Liability Disclaimer
            </h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                <strong>13.1</strong> The Site is not responsible for any
                illegal use of the company by the Client.
              </p>
              <p>
                <strong>13.2</strong> The Client bears full responsibility for
                all activities conducted under the company during the benefit
                period.
              </p>
              <p>
                <strong>13.3</strong> The Site is not liable for financial
                losses, legal obligations, taxes, or penalties arising from the
                Client's use of the company.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              14. Dispute Resolution and Arbitration
            </h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                <strong>14.1</strong> Clients must first attempt to resolve
                disputes amicably by contacting{" "}
                <a
                  href="mailto:support@sharekte.com"
                  className="text-primary hover:underline font-semibold"
                >
                  support@sharekte.com
                </a>
                .
              </p>
              <p>
                <strong>14.2</strong> If unresolved, disputes will be settled
                via arbitration under UK law.
              </p>
              <p>
                <strong>14.3</strong> Arbitration decisions are final and
                binding.
              </p>
              <p>
                <strong>14.4</strong> If arbitration is not possible, UK courts
                have exclusive jurisdiction.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              15. Governing Law
            </h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                <strong>15.1</strong> All Terms, services, and Client
                obligations are governed by the laws of the United Kingdom.
              </p>
              <p>
                <strong>15.2</strong> All disputes must be addressed exclusively
                in UK courts.
              </p>
              <p>
                <strong>15.3</strong> Clients agree that UK law is the sole
                governing law for the Site and related services.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              16. Amendments
            </h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                <strong>16.1</strong> The Site reserves the right to amend these
                Terms at any time.
              </p>
              <p>
                <strong>16.2</strong> Continued use of the Site after amendments
                constitutes acceptance of the revised Terms.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              17. Additional Provisions
            </h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>
                All company documents remain the property of the Site or
                original owner
              </li>
              <li>
                Benefit does not grant intellectual property or permanent
                ownership rights
              </li>
              <li>
                Clients may not claim compensation if the company is sold or
                reassigned after benefit expiration
              </li>
              <li>
                Breaches of terms may lead to full legal action in UK courts
              </li>
            </ul>
          </section>

          <section className="space-y-4 border-t border-border/40 pt-8 mt-8">
            <h2 className="text-xl font-semibold text-foreground">
              Need Help?
            </h2>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-muted-foreground">
                If you have any questions about these Terms and Conditions,
                please contact us at:
              </p>
              <p className="text-foreground font-semibold">
                <a
                  href="mailto:support@sharekte.com"
                  className="text-primary hover:underline"
                >
                  support@sharekte.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
