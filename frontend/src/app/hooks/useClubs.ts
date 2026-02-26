import { useState, useEffect } from 'react';
import { Club } from '../types';

// Deterministic color palette for clubs (cycles if more clubs than colors)
const CLUB_COLORS = [
  '#FF6B6B', '#4ECDC4', '#95E1D3', '#F3A683',
  '#786FA6', '#F8B500', '#6C5CE7', '#00B894',
  '#E17055', '#0984E3', '#FDCB6E', '#00CEC9',
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
  social_links: {
    instagram?: string;
    linktree?: string;
    engage?: string;
  } | null;
  metadata_tags: {
    description?: string;
    color?: string;
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
    instagram: (apiClub.social_links as any)?.instagram ?? undefined,
    linktree: (apiClub.social_links as any)?.linktree ?? undefined,
    engage: (apiClub.social_links as any)?.engage ?? undefined,
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
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

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
