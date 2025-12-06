import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  fetchSocialMediaLinks,
  type SocialMediaLink,
} from "@/lib/social-media";

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([]);

  useEffect(() => {
    loadSocialLinks();
  }, []);

  async function loadSocialLinks() {
    try {
      const links = await fetchSocialMediaLinks();
      setSocialLinks(
        links.filter((link) => link.isActive).sort((a, b) => a.order - b.order),
      );
    } catch (error) {
      console.error("Error loading social media links:", error);
    }
  }

  return (
    <footer className="w-full border-t border-border/40 bg-muted/30 py-12">
      <div className="container max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link
              to="/"
              className="flex items-center font-bold text-lg text-primary mb-4"
            >
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F752b1abf9cc241c993361e9dcaee5153%2F708a794c15c645db8aef3926ec307c64?format=webp&width=800"
                alt="Sharekte"
                className="h-[100px] w-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              Sharekte is a global marketplace for buying and selling
              established, revenue-generating companies. Skip the startup phase
              and step into profitability.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-foreground">
              {t("footer.company")}
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("companies.availableCompanies")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-foreground">
              {t("footer.company")}
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("footer.about")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("footer.blog")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-foreground">
              {t("footer.legal")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-and-conditions"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t("footer.cookies")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Sharekte. {t("common.all")} {t("common.search")}.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {socialLinks.length > 0 ? (
              <>
                {socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200 transform hover:scale-110 group"
                    title={link.displayText || link.platform}
                  >
                    {link.icon ? (
                      <span className="text-2xl group-hover:scale-125 transition-transform duration-200">
                        {link.icon}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary-foreground">
                        {link.platform.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </a>
                ))}
                <span className="text-muted-foreground/30">•</span>
              </>
            ) : (
              <>
                <a
                  href="#"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200 transform hover:scale-110"
                  title="Twitter"
                >
                  <span className="text-2xl">𝕏</span>
                </a>
                <a
                  href="#"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200 transform hover:scale-110"
                  title="LinkedIn"
                >
                  <span className="text-2xl">in</span>
                </a>
                <a
                  href="#"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200 transform hover:scale-110"
                  title="Facebook"
                >
                  <span className="text-2xl">f</span>
                </a>
                <span className="text-muted-foreground/30">•</span>
              </>
            )}
            <Link
              to="/secure-admin-access-7k9m2q"
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
              title="Administration Access"
            >
              Extranet
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
