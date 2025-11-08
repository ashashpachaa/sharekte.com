import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function PrivacyPolicy() {

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container max-w-4xl py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Sharekte ("we", "our", or "us") operates the Sharekte website
              (the "Service"). This page informs you of our policies regarding
              the collection, use, and disclosure of personal data when you use
              our Service and the choices you have associated with that data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Information Collection and Use
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect several different types of information for various
              purposes to provide and improve our Service to you.
            </p>
            <div className="space-y-3 ml-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Personal Data:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Email address</li>
                  <li>First name and last name</li>
                  <li>Phone number</li>
                  <li>Address, State, Province, ZIP/Postal code, City</li>
                  <li>Cookies and Usage Data</li>
                  <li>Company information and business details</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Use of Data
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Sharekte uses the collected data for various purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To allow you to participate in interactive features</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Security of Data
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The security of your data is important to us but remember that no
              method of transmission over the Internet or method of electronic
              storage is 100% secure. While we strive to use commercially
              acceptable means to protect your Personal Data, we cannot
              guarantee its absolute security.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Changes to This Privacy Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the "Last updated" date at the top of this Privacy
              Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please
              contact us at:
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-foreground font-semibold">Sharekte</p>
              <p className="text-muted-foreground">
                Email: privacy@sharekte.com
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
