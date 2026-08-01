import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../../utils/trackEvent';
import { captureCampaignCode } from '../../utils/journey';

const SESSION_KEY = 'codeit_acquisition_visit_recorded';
const OWN_HOSTS = new Set(['codeitlearn.com', 'www.codeitlearn.com']);
const INTERNAL_PATHS = [
  '/admin',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/MainPage',
  '/profile',
  '/character',
  '/leaderboard',
  '/creator-brief',
  '/investor-brief',
];

function namedChannel(value = '') {
  const source = value.trim().toLowerCase();
  if (!source) return null;
  if (source.includes('google')) return 'google';
  if (source === 'project-share') return 'project';
  if (source.includes('youtube')) return 'youtube';
  if (source.includes('instagram') || source === 'ig') return 'instagram';
  if (source.includes('tiktok')) return 'tiktok';
  if (source.includes('facebook') || source === 'fb') return 'facebook';
  if (source.includes('linkedin')) return 'linkedin';
  if (source === 'referral') return 'referral';
  if (source.includes('bing') || source.includes('duckduckgo') || source.includes('yahoo')) return 'search';
  return 'other';
}

export function getAcquisitionSource(search = '', referrer = '') {
  try {
    const params = new URLSearchParams(search);
    const taggedSource = namedChannel(params.get('utm_source') || '');
    if (taggedSource) return taggedSource;
  } catch (_) {
    // Invalid query strings fall through to the privacy-safe referrer buckets.
  }

  if (!referrer) return 'direct';
  try {
    const hostname = new URL(referrer).hostname.toLowerCase();
    if (!hostname || OWN_HOSTS.has(hostname)) return 'direct';
    const recognized = namedChannel(hostname);
    return recognized === 'other' ? 'referral' : recognized;
  } catch (_) {
    return 'direct';
  }
}

export function shouldTrackAcquisition(pathname = '/') {
  return !INTERNAL_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default function AcquisitionTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      if (!shouldTrackAcquisition(pathname)) return;
      if (sessionStorage.getItem(SESSION_KEY) === 'yes') return;
      captureCampaignCode(window.location.search);
      const source = getAcquisitionSource(window.location.search, document.referrer);
      sessionStorage.setItem(SESSION_KEY, 'yes');
      void trackEvent('acquisition_visit', source);
    } catch (_) {
      // Analytics must never interrupt the product.
    }
  }, [pathname]);

  return null;
}
