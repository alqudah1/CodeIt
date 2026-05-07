import { useEffect } from 'react';

/**
 * useFAQSchema — injects a FAQPage JSON-LD script into <head> for the current page.
 *
 * Usage (define faqs as a module-level constant — NOT inline — to keep it stable):
 *
 *   const FAQS = [
 *     { q: 'Is Python hard for kids?', a: 'No — Python reads like plain English...' },
 *   ];
 *   function MyPage() {
 *     useFAQSchema(FAQS);
 *   }
 *
 * The schema is removed on unmount so stale data never bleeds across routes.
 */
export function useFAQSchema(faqs) {
  useEffect(() => {
    if (!faqs || faqs.length === 0) return;

    // Remove any existing FAQ schema injected by a previous page visit
    const existing = document.getElementById('faq-schema-ld');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id   = 'faq-schema-ld';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type':    'FAQPage',
      mainEntity: faqs.map(({ q, a }) => ({
        '@type': 'Question',
        name:    q,
        acceptedAnswer: {
          '@type': 'Answer',
          text:    a,
        },
      })),
    });

    document.head.appendChild(script);

    return () => {
      const el = document.getElementById('faq-schema-ld');
      if (el) el.remove();
    };
    // faqs are module-level constants — no runtime changes, empty dep array is correct
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
