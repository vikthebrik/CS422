import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Palette } from 'lucide-react';
import { Button } from './ui/button';

const PALETTES = [
  {
    id: 'original',
    name: 'MCC',
    swatch: ['#004F35', '#FEE123'],
  },
  {
    id: 'analog',
    name: 'Analog',
    swatch: ['#5E7C6E', '#C99A6E'],
  },
  {
    id: 'slate',
    name: 'Slate',
    swatch: ['#2D4E8A', '#4A84C4'],
  },
  {
    id: 'dusk',
    name: 'Dusk',
    swatch: ['#6B4A9E', '#A8729A'],
  },
] as const;

type PaletteId = (typeof PALETTES)[number]['id'];

function getStoredPalette(): PaletteId {
  return (localStorage.getItem('mcc_palette') as PaletteId) ?? 'original';
}

export function ThemePicker() {
  const { resolvedTheme, setTheme } = useTheme();
  const [palette, setPalette] = useState<PaletteId>('original');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync from localStorage on mount
  useEffect(() => {
    const stored = getStoredPalette();
    setPalette(stored);
    document.documentElement.dataset.palette = stored;
  }, []);

  // Close panel on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selectPalette = (id: PaletteId) => {
    setPalette(id);
    document.documentElement.dataset.palette = id;
    localStorage.setItem('mcc_palette', id);
  };

  const toggleDark = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(v => !v)}
        title="Change theme"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Palette className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-xl z-50 p-3 space-y-3">
          {/* Palette rows */}
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Palette
          </p>
          <div className="space-y-1">
            {PALETTES.map(p => (
              <button
                key={p.id}
                onClick={() => selectPalette(p.id)}
                className={`
                  w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-sm text-left transition-colors
                  ${palette === p.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted text-foreground'}
                `}
              >
                {/* Two-tone swatch */}
                <span className="w-4 h-4 rounded-full shrink-0 border border-black/10 overflow-hidden flex">
                  <span className="flex-1" style={{ backgroundColor: p.swatch[0] }} />
                  <span className="flex-1" style={{ backgroundColor: p.swatch[1] }} />
                </span>
                {p.name}
                {palette === p.id && (
                  <span className="ml-auto text-[10px] text-primary">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Light / Dark toggle */}
          <div className="border-t border-border pt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={toggleDark}
              title={resolvedTheme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            >
              {resolvedTheme === 'dark'
                ? <Sun className="h-3.5 w-3.5" />
                : <Moon className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
