import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function TermsAndConditions() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container max-w-4xl py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Terms and Conditions
            </h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              1. Agreement to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using this website, you accept and agree to be
              bound by the terms and provision of this agreement. If you do not
              agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              2. Use License
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Permission is granted to temporarily download one copy of the
              materials (information or software) on the Sharekte website for
              personal, non-commercial transitory viewing only. This is the
              grant of a license, not a transfer of title, and under this
              license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Modifying or copying the materials</li>
              <li>
                Using the materials for any commercial purpose or for any public
                display
              </li>
              <li>Attempting to decompile or reverse engineer any software</li>
              <li>
                Removing any copyright or other proprietary notations from the
                materials
              </li>
              <li>
                Transferring the materials to another person or "mirroring" the
                materials on any other server
              </li>
              <li>Using the materials for any unlawful purpose</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              3. Disclaimer
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The materials on the Shareket website are provided on an "as is"
              basis. Sharekte makes no warranties, expressed or implied, and
              hereby disclaims and negates all other warranties including,
              without limitation, implied warranties or conditions of
              merchantability, fitness for a particular purpose, or
              non-infringement of intellectual property or other violation of
              rights.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              4. Limitations
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              In no event shall Sharekte or its suppliers be liable for any
              damages (including, without limitation, damages for loss of data
              or profit, or due to business interruption) arising out of the use
              or inability to use the materials on the Sharekte website, even if
              Sharekte or an authorized representative has been notified orally
              or in writing of the possibility of such damage.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              5. Accuracy of Materials
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The materials appearing on the Sharekte website could include
              technical, typographical, or photographic errors. Sharekte does
              not warrant that any of the materials on its website are accurate,
              complete, or current. Sharekte may make changes to the materials
              contained on its website at any time without notice.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              6. Links
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Sharekte has not reviewed all of the sites linked to its website
              and is not responsible for the contents of any such linked site.
              The inclusion of any link does not imply endorsement by Sharekte
              of the site. Use of any such linked website is at the user's own
              risk.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              7. Modifications
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Sharekte may revise these terms of service for its website at any
              time without notice. By using this website, you are agreeing to be
              bound by the then current version of these terms of service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              8. Governing Law
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms and conditions are governed by and construed in
              accordance with the laws of the jurisdiction in which Sharekte
              operates, and you irrevocably submit to the exclusive jurisdiction
              of the courts in that location.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              9. User Responsibilities
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Users are responsible for maintaining the confidentiality of their
              account information and passwords and for restricting access to
              their computer. You agree to accept responsibility for all
              activities that occur under your account or password.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              10. Contact Information
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms and Conditions, please
              contact us at:
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-foreground font-semibold">Sharekte</p>
              <p className="text-muted-foreground">
                Email: legal@sharekte.com
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
