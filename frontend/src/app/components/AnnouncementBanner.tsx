/**
 * @file AnnouncementBanner.tsx
 * @description Renders active announcements at three visual weights:
 *   subtle  — small inline notice between tab nav and content
 *   banner  — bold full-width colored bar, impossible to miss
 *   modal   — dialog overlay that must be dismissed before continuing
 *
 * Re-fetches on every navigation (pathname change) so freshly created
 * announcements appear without a hard refresh.
 * Dismissal stored in localStorage per announcement ID.
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { X, ExternalLink, Info, CheckCircle2, AlertTriangle, Megaphone } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.uomcc.org';
const DISMISSED_KEY = 'mcc_dismissed_announcements';

type AnnouncementType = 'info' | 'success' | 'warning';
type AnnouncementWeight = 'subtle' | 'banner';

interface Announcement {
  id: string;
  title: string;
  body: string | null;
  link_url: string | null;
  link_text: string | null;
  type: AnnouncementType;
  weight: AnnouncementWeight;
}

function getDismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]'); } catch { return []; }
}
function addDismissed(id: string) {
  const cur = getDismissed();
  if (!cur.includes(id)) localStorage.setItem(DISMISSED_KEY, JSON.stringify([...cur, id]));
}

// ─── Per-type colour tokens ───────────────────────────────────────────────────
const SUBTLE_STYLES: Record<AnnouncementType, string> = {
  info:    'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-100',
  success: 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-100',
  warning: 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-700 dark:text-rose-100',
};

const BANNER_BG: Record<AnnouncementType, string> = {
  info:    'bg-amber-500 text-white',
  success: 'bg-emerald-800 text-white',
  warning: 'bg-rose-300 text-rose-950',
};

const BANNER_BTN: Record<AnnouncementType, string> = {
  info:    'bg-white/20 hover:bg-white/30 text-white',
  success: 'bg-white/20 hover:bg-white/30 text-white',
  warning: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-900',
};

const TYPE_ICON_SM: Record<AnnouncementType, React.ReactNode> = {
  info:    <Info className="h-4 w-4 shrink-0" />,
  success: <CheckCircle2 className="h-4 w-4 shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 shrink-0" />,
};

// ─── Component ────────────────────────────────────────────────────────────────
export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    fetch(`${API_BASE}/announcements`)
      .then(r => r.json())
      .then((list: Announcement[]) => {
        if (!Array.isArray(list)) return;
        const dismissedIds = getDismissed();
        const visible = list.find(a => !dismissedIds.includes(a.id));
        setAnnouncement(visible ?? null);
      })
      .catch(() => {});
  }, [pathname]);

  function handleDismiss() {
    if (announcement) addDismissed(announcement.id);
    setAnnouncement(null);
  }

  if (!announcement) return null;

  const { type, weight, title, body, link_url, link_text } = announcement;

  // ── Subtle ──────────────────────────────────────────────────────────────────
  if (weight === 'subtle') {
    return (
      <div className={`rounded-lg border px-4 py-3 mb-6 flex items-start gap-3 ${SUBTLE_STYLES[type]}`}>
        <span className="mt-0.5 shrink-0">{TYPE_ICON_SM[type]}</span>
        <div className="flex-1 min-w-0">
          <span className="font-semibold">{title}</span>
          {body && <span className="ml-2 opacity-80 text-sm">{body}</span>}
          {link_url && (
            <a href={link_url} target="_blank" rel="noopener noreferrer"
              className="ml-3 inline-flex items-center gap-1 text-sm font-medium underline underline-offset-2 hover:opacity-70 transition-opacity">
              {link_text ?? 'Learn more'}<ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <button onClick={handleDismiss} aria-label="Dismiss"
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // ── Banner ──────────────────────────────────────────────────────────────────
  if (weight === 'banner') {
    return (
      <div className={`rounded-xl px-5 py-4 mb-6 flex items-center gap-4 shadow-sm ${BANNER_BG[type]}`}>
        <Megaphone className="h-6 w-6 shrink-0 opacity-90" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base leading-snug">{title}</p>
          {body && <p className="text-sm opacity-85 mt-0.5">{body}</p>}
        </div>
        {link_url && (
          <a href={link_url} target="_blank" rel="noopener noreferrer"
            className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${BANNER_BTN[type]}`}>
            {link_text ?? 'Learn more'}<ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <button onClick={handleDismiss} aria-label="Dismiss"
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity ml-1">
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // Fallback — treat any unknown weight as banner
  return (
    <div className={`rounded-xl px-5 py-4 mb-6 flex items-center gap-4 shadow-sm ${BANNER_BG[type]}`}>
      <Megaphone className="h-6 w-6 shrink-0 opacity-90" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-base leading-snug">{title}</p>
        {body && <p className="text-sm opacity-85 mt-0.5">{body}</p>}
      </div>
      {link_url && (
        <a href={link_url} target="_blank" rel="noopener noreferrer"
          className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${BANNER_BTN[type]}`}>
          {link_text ?? 'Learn more'}<ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      <button onClick={handleDismiss} aria-label="Dismiss"
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity ml-1">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
