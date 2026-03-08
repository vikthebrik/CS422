/**
 * @file useClubs.ts
 * @description Data-fetching hook that retrieves all clubs from the backend.
 *
 * ## Data Flow
 * ```
 * GET /clubs (via Vite proxy → /api/clubs)
 *   └─► ApiClub[] (snake_case DB fields)
 *         └─► mapApiClub() → Club[] (camelCase frontend types)
 *               └─► AppContext.clubs
 * ```
 *
 * ## Color Assignment
 * DB clubs carry no color column. Colors are assigned deterministically by
 * array index from CLUB_COLORS, so club colors remain stable across re-fetches
 * as long as the order from the API doesn't change.
 * If `metadata_tags.color` is set on a DB row, that value takes precedence.
 *
 * ## API → Frontend Field Map
 * | API field              | Club field       |
 * |------------------------|------------------|
 * | `logo_url`             | `logo`           |
 * | `ics_source_url`       | `outlookLink`    |
 * | `org_type`             | `orgType`        |
 * | `admin_email`          | `adminEmail`     |
 * | `social_links.instagram` | `instagram`    |
 * | `social_links.linktree`  | `linktree`     |
 * | `social_links.engage`    | `engage`       |
 * | `metadata_tags.description` | `description` |
 * | `metadata_tags.color`  | `color`          |
 * | `metadata_tags.section_labels` | `sectionLabels` |
 */

import { useState, useEffect } from 'react';
import { Club } from '../types';

// Deterministic color palette for clubs — muted, analog pastels
// Each is distinct enough to tell apart while staying calm on the page.
const CLUB_COLORS = [
  '#7D9E8E', // sage
  '#8DA3BC', // dusty blue
  '#BC9870', // warm amber
  '#A87D9E', // dusty plum
  '#7D9EA8', // slate
  '#BC7D7D', // dusty rose
  '#9EBC8D', // soft moss
  '#BC9D7D', // tan
  '#7D8DAA', // periwinkle
  '#A89B7D', // khaki
  '#BC8D9E', // mauve
  '#7DAA9E', // teal
];

function getClubColor(index: number): string {
  return CLUB_COLORS[index % CLUB_COLORS.length];
}

interface ApiClub {
  id: string;
  name: string;
  org_type: 'union' | 'department' | null;
  logo_url: string | null;
  ics_source_url: string | null;
  admin_email: string | null;
  social_links: {
    instagram?: string;
    linktree?: string;
    engage?: string;
    contact_email?: string;
  } | null;
  metadata_tags: {
    description?: string;
    color?: string;
    section_labels?: { exec?: string; board?: string; intern?: string };
    meeting_schedule?: Array<{ day: string; time: string; location: string; notes?: string }>;
  } | null;
}

function mapApiClub(apiClub: ApiClub, index: number): Club {
  return {
    id: apiClub.id,
    name: apiClub.name,
    orgType: apiClub.org_type ?? 'union',
    color: apiClub.metadata_tags?.color ?? getClubColor(index),
    logo: apiClub.logo_url ?? undefined,
    outlookLink: apiClub.ics_source_url ?? undefined,
    description: apiClub.metadata_tags?.description ?? undefined,
    sectionLabels: apiClub.metadata_tags?.section_labels ?? undefined,
    meetingSchedule: apiClub.metadata_tags?.meeting_schedule ?? undefined,
    instagram: (apiClub.social_links as any)?.instagram ?? undefined,
    linktree: (apiClub.social_links as any)?.linktree ?? undefined,
    engage: (apiClub.social_links as any)?.engage ?? undefined,
    adminEmail: apiClub.admin_email ?? undefined,
    contactEmail: (apiClub.social_links as any)?.contact_email ?? undefined,
  };
}

export interface UseClubsResult {
  clubs: Club[];
  loading: boolean;
  error: string | null;
}

export function useClubs(): UseClubsResult {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const baseUrl = '/api';

    fetch(`${baseUrl}/clubs`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load clubs`);
        return res.json();
      })
      .then((data: ApiClub[]) => {
        setClubs(data.map(mapApiClub));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch clubs:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { clubs, loading, error };
}
