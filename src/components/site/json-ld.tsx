const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://dailydoseofgospels.com").replace(/\/$/, "");

const SITE_NAME = "Daily Dose of Gospels";

const SITE_DESCRIPTION =
  "A quiet, fully anonymous Christian community confessing Jesus Christ as Lord and Savior: share testimonies and prayer requests, talk with an AI counselor grounded in Scripture, hear the Verse and Parable of the Day, and listen to original worship instrumentals.";

/**
 * Structured data (schema.org) for rich Google results:
 * Organization + WebSite + WebApplication, emitted once in the root layout.
 */
export function SiteJsonLd() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/icons/icon-512.png`,
          width: 512,
          height: 512,
        },
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        alternateName: "Daily Gospels",
        description: SITE_DESCRIPTION,
        inLanguage: "en",
        publisher: { "@id": `${SITE_URL}/#organization` },
        copyrightYear: new Date().getFullYear(),
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#app`,
        name: SITE_NAME,
        url: SITE_URL,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        description: SITE_DESCRIPTION,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
