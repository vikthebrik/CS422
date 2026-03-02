import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Settings, Pencil, Trash2, ChevronUp, ChevronDown, Plus, X,
  Upload, ImageIcon, RefreshCw, ExternalLink, Save,
} from 'lucide-react';
import { Link } from 'react-router';
import { useApp } from '../context/AppContext';
import { Block, TextBlock, MediaBlock, LinkContainerBlock, ClubShowcaseBlock, LinkItem } from '../types';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const SETTINGS_KEY = 'about-page';

const DEFAULT_BLOCKS: Block[] = [
  {
    id: 'default-intro',
    type: 'text',
    title: 'About the Multicultural Center',
    content: 'The Multicultural Center (MCC) at the University of Oregon is a welcoming space for all students — a place to gather, learn, and build community across cultures.\n\nWe celebrate diversity and provide resources, programming, and advocacy to support underrepresented student communities at UO.',
  },
];

const BLOCK_META = [
  { type: 'text' as const,  label: 'Text',          icon: '📝', desc: 'Paragraph with optional title' },
  { type: 'media' as const, label: 'Media',         icon: '🖼️', desc: 'Image or video' },
  { type: 'links' as const, label: 'Links',         icon: '🔗', desc: 'Grid of external links' },
  { type: 'clubs' as const, label: 'Organizations', icon: '🏛️', desc: 'Affiliated club showcase' },
];

function genId() {
  return `blk-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

function makeDefaultBlock(type: Block['type']): Block {
  switch (type) {
    case 'text':  return { id: genId(), type: 'text', title: '', content: '' };
    case 'media': return { id: genId(), type: 'media', mediaType: 'image', url: '', caption: '' };
    case 'links': return { id: genId(), type: 'links', title: '', links: [{ label: '', url: '', description: '' }] };
    case 'clubs': return { id: genId(), type: 'clubs', title: '', clubIds: [] };
  }
}

// ---------------------------------------------------------------------------
// Block renderers (read-only)
// ---------------------------------------------------------------------------

function TextRenderer({ block }: { block: TextBlock }) {
  return (
    <div className="space-y-4">
      {block.title && (
        <h2 className="text-3xl font-semibold tracking-tight">{block.title}</h2>
      )}
      <div className="text-muted-foreground leading-relaxed space-y-4">
        {block.content.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </div>
  );
}

function MediaRenderer({ block }: { block: MediaBlock }) {
  if (!block.url) {
    return (
      <div className="h-48 bg-muted rounded-xl flex items-center justify-center text-muted-foreground text-sm">
        No media added yet
      </div>
    );
  }
  return (
    <div className="relative rounded-xl overflow-hidden">
      {block.mediaType === 'video' ? (
        <video src={block.url} controls className="w-full max-h-[480px] object-cover" />
      ) : (
        <img src={block.url} alt={block.caption ?? ''} className="w-full object-cover max-h-[480px]" />
      )}
      {block.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
          <p className="text-white text-sm text-center">{block.caption}</p>
        </div>
      )}
    </div>
  );
}

function LinksRenderer({ block }: { block: LinkContainerBlock }) {
  const validLinks = block.links.filter(l => l.label || l.url);
  return (
    <div className="space-y-4">
      {block.title && <h2 className="text-2xl font-semibold tracking-tight">{block.title}</h2>}
      <div className="grid gap-3 sm:grid-cols-2">
        {validLinks.map((link, i) => (
          <a
            key={i}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors group"
          >
            <ExternalLink className="h-4 w-4 mt-0.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            <div>
              <p className="font-medium">{link.label}</p>
              {link.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{link.description}</p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function ClubsRenderer({ block, clubs }: { block: ClubShowcaseBlock; clubs: ReturnType<typeof useApp>['clubs'] }) {
  const featured = clubs.filter(c => block.clubIds.includes(c.id));
  return (
    <div className="space-y-4">
      {block.title && <h2 className="text-2xl font-semibold tracking-tight">{block.title}</h2>}
      {featured.length === 0 ? (
        <p className="text-muted-foreground text-sm">No organizations selected.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map(club => (
            <Link
              key={club.id}
              to={`/club/${club.id}`}
              className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors"
            >
              {club.logo ? (
                <ImageWithFallback
                  src={club.logo}
                  alt={club.name}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm font-medium shrink-0"
                  style={{ backgroundColor: club.color }}
                >
                  {club.name.substring(0, 2)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium truncate">{club.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {club.orgType === 'department' ? 'Department' : 'Student Union'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function BlockRenderer({ block, clubs }: { block: Block; clubs: ReturnType<typeof useApp>['clubs'] }) {
  switch (block.type) {
    case 'text':  return <TextRenderer block={block} />;
    case 'media': return <MediaRenderer block={block} />;
    case 'links': return <LinksRenderer block={block} />;
    case 'clubs': return <ClubsRenderer block={block} clubs={clubs} />;
  }
}

// ---------------------------------------------------------------------------
// Block editor form (inside Dialog)
// ---------------------------------------------------------------------------

function BlockEditForm({
  draft,
  onChange,
  authToken,
}: {
  draft: Block;
  onChange: (updated: Block) => void;
  authToken: string | null;
}) {
  const { clubs } = useApp();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error('Image must be under 8 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview || draft.type !== 'media') return;
    setUploading(true);
    try {
      const res = await fetch(`${API_BASE}/site-settings/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ dataUrl: preview, filename: 'about-media' }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Upload failed'); return; }
      onChange({ ...draft, url: data.url } as MediaBlock);
      setPreview(null);
      toast.success('Image uploaded');
    } catch { toast.error('Could not reach the server'); }
    finally { setUploading(false); }
  };

  if (draft.type === 'text') {
    return (
      <div className="space-y-4">
        <div>
          <Label>Title <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input
            className="mt-1"
            value={draft.title ?? ''}
            onChange={e => onChange({ ...draft, title: e.target.value })}
            placeholder="Section title…"
          />
        </div>
        <div>
          <Label>Content</Label>
          <Textarea
            className="mt-1 min-h-[180px]"
            value={draft.content}
            onChange={e => onChange({ ...draft, content: e.target.value })}
            placeholder="Write your content here. Separate paragraphs with a blank line."
          />
          <p className="text-xs text-muted-foreground mt-1">Use blank lines between paragraphs.</p>
        </div>
      </div>
    );
  }

  if (draft.type === 'media') {
    return (
      <div className="space-y-4">
        <div>
          <Label>Media Type</Label>
          <div className="flex gap-2 mt-1">
            {(['image', 'video'] as const).map(t => (
              <Button
                key={t}
                type="button"
                size="sm"
                variant={draft.mediaType === t ? 'default' : 'outline'}
                onClick={() => onChange({ ...draft, mediaType: t })}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {draft.mediaType === 'image' ? (
          <div className="space-y-3">
            {(preview ?? draft.url) && (
              <img
                src={preview ?? draft.url}
                alt="Preview"
                className="w-full h-36 object-cover rounded-lg border border-border"
              />
            )}
            {preview ? (
              <Button size="sm" onClick={handleUpload} disabled={uploading}>
                {uploading
                  ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading…</>
                  : <><Upload className="h-3.5 w-3.5 mr-1.5" />Upload Image</>}
              </Button>
            ) : (
              <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                Choose Image
              </Button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            <div>
              <Label>Or paste an image URL</Label>
              <Input
                className="mt-1"
                value={draft.url}
                onChange={e => onChange({ ...draft, url: e.target.value })}
                placeholder="https://…"
              />
            </div>
          </div>
        ) : (
          <div>
            <Label>Video URL</Label>
            <Input
              className="mt-1"
              value={draft.url}
              onChange={e => onChange({ ...draft, url: e.target.value })}
              placeholder="https://… (direct .mp4 or video link)"
            />
          </div>
        )}

        <div>
          <Label>Caption <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input
            className="mt-1"
            value={draft.caption ?? ''}
            onChange={e => onChange({ ...draft, caption: e.target.value })}
            placeholder="Short caption shown below the media…"
          />
        </div>
      </div>
    );
  }

  if (draft.type === 'links') {
    const setLinks = (links: LinkItem[]) => onChange({ ...draft, links });
    return (
      <div className="space-y-4">
        <div>
          <Label>Section Title <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input
            className="mt-1"
            value={draft.title ?? ''}
            onChange={e => onChange({ ...draft, title: e.target.value })}
            placeholder="e.g. Sister Cultural Departments"
          />
        </div>
        <div className="space-y-2">
          <Label>Links</Label>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {draft.links.map((link, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Link {i + 1}</span>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => setLinks(draft.links.filter((_, j) => j !== i))}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  placeholder="Label"
                  value={link.label}
                  onChange={e => { const l = [...draft.links]; l[i] = { ...l[i], label: e.target.value }; setLinks(l); }}
                />
                <Input
                  placeholder="URL (https://…)"
                  value={link.url}
                  onChange={e => { const l = [...draft.links]; l[i] = { ...l[i], url: e.target.value }; setLinks(l); }}
                />
                <Input
                  placeholder="Description (optional)"
                  value={link.description ?? ''}
                  onChange={e => { const l = [...draft.links]; l[i] = { ...l[i], description: e.target.value }; setLinks(l); }}
                />
              </div>
            ))}
          </div>
          <Button
            type="button" size="sm" variant="outline"
            onClick={() => setLinks([...draft.links, { label: '', url: '', description: '' }])}
          >
            <Plus className="h-3 w-3 mr-1" />Add Link
          </Button>
        </div>
      </div>
    );
  }

  // clubs
  if (draft.type === 'clubs') {
    return (
      <div className="space-y-4">
        <div>
          <Label>Section Title <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input
            className="mt-1"
            value={draft.title ?? ''}
            onChange={e => onChange({ ...draft, title: e.target.value })}
            placeholder="e.g. Our Affiliated Organizations"
          />
        </div>
        <div>
          <Label>Select Organizations</Label>
          <div className="mt-2 border border-border rounded-lg divide-y divide-border max-h-64 overflow-y-auto">
            {clubs.map(club => {
              const selected = draft.clubIds.includes(club.id);
              return (
                <label
                  key={club.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-accent/40 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      onChange({
                        ...draft,
                        clubIds: selected
                          ? draft.clubIds.filter(id => id !== club.id)
                          : [...draft.clubIds, club.id],
                      })
                    }
                    className="rounded"
                  />
                  <div
                    className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-medium shrink-0"
                    style={{ backgroundColor: club.color }}
                  >
                    {club.name.substring(0, 2)}
                  </div>
                  <span className="text-sm">{club.name}</span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{draft.clubIds.length} selected</p>
        </div>
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main About page
// ---------------------------------------------------------------------------

export function About() {
  const { clubs, currentUser, authToken } = useApp();
  const isAdmin = currentUser?.role === 'admin';

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Block being edited in the dialog
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editDraft, setEditDraft] = useState<Block | null>(null);

  // Index where the "add block" picker is open (null = closed)
  const [addingAt, setAddingAt] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/site-settings/${SETTINGS_KEY}`)
      .then(r => r.json())
      .then(data => {
        setBlocks(Array.isArray(data) && data.length > 0 ? data : DEFAULT_BLOCKS);
      })
      .catch(() => setBlocks(DEFAULT_BLOCKS))
      .finally(() => setLoading(false));
  }, []);

  // ── mutations ─────────────────────────────────────────────────────────────

  const mutate = useCallback((next: Block[]) => {
    setBlocks(next);
    setDirty(true);
  }, []);

  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...blocks];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    mutate(next);
  };

  const moveDown = (i: number) => {
    if (i >= blocks.length - 1) return;
    const next = [...blocks];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    mutate(next);
  };

  const removeBlock = (i: number) => mutate(blocks.filter((_, idx) => idx !== i));

  const openEdit = (block: Block) => {
    setEditingBlock(block);
    setEditDraft(structuredClone(block));
  };

  const applyEdit = () => {
    if (!editDraft) return;
    mutate(blocks.map(b => (b.id === editDraft.id ? editDraft : b)));
    setEditingBlock(null);
    setEditDraft(null);
  };

  const insertBlock = (type: Block['type'], at: number) => {
    const newBlock = makeDefaultBlock(type);
    const next = [...blocks];
    next.splice(at, 0, newBlock);
    mutate(next);
    setAddingAt(null);
    openEdit(newBlock);
  };

  // ── save ──────────────────────────────────────────────────────────────────

  const savePage = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/site-settings/${SETTINGS_KEY}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ value: blocks }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Save failed'); return; }
      setDirty(false);
      toast.success('About page saved');
    } catch { toast.error('Could not reach the server'); }
    finally { setSaving(false); }
  };

  // ── loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-pulse">
        <div className="h-9 bg-muted rounded w-2/5" />
        <div className="space-y-3">
          {[1, 0.85, 0.7].map((w, i) => (
            <div key={i} className="h-4 bg-muted rounded" style={{ width: `${w * 100}%` }} />
          ))}
        </div>
      </div>
    );
  }

  // ── add-block picker row ──────────────────────────────────────────────────

  const AddBlockRow = ({ at }: { at: number }) => (
    <div className="flex justify-center py-2">
      {addingAt === at ? (
        <div className="flex flex-wrap gap-2 justify-center p-3 rounded-xl bg-muted/50 border border-border w-full">
          {BLOCK_META.map(bm => (
            <button
              key={bm.type}
              onClick={() => insertBlock(bm.type, at)}
              className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-accent/60 transition-colors text-center"
            >
              <span className="text-xl leading-none">{bm.icon}</span>
              <span className="text-xs font-medium">{bm.label}</span>
              <span className="text-xs text-muted-foreground hidden sm:block">{bm.desc}</span>
            </button>
          ))}
          <button
            onClick={() => setAddingAt(null)}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card hover:bg-accent/60 transition-colors self-center"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingAt(at)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded-full border border-dashed border-muted-foreground/30 hover:border-primary/60"
        >
          <Plus className="h-3 w-3" />
          Add block
        </button>
      )}
    </div>
  );

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto">

      {/* Admin toolbar */}
      {isAdmin && (
        <div className="flex items-center justify-between mb-6 px-4 py-3 rounded-xl border border-border bg-card/60">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Page Editor</span>
            {dirty && <Badge variant="secondary" className="text-xs">Unsaved</Badge>}
          </div>
          <div className="flex gap-2">
            {editMode && dirty && (
              <Button size="sm" onClick={savePage} disabled={saving}>
                {saving
                  ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</>
                  : <><Save className="h-3.5 w-3.5 mr-1.5" />Save Page</>}
              </Button>
            )}
            <Button
              size="sm"
              variant={editMode ? 'default' : 'outline'}
              onClick={() => { setEditMode(v => !v); setAddingAt(null); }}
            >
              {editMode ? 'Done Editing' : 'Edit Page'}
            </Button>
          </div>
        </div>
      )}

      {/* Block list */}
      {editMode && <AddBlockRow at={0} />}

      {blocks.map((block, i) => (
        <div key={block.id}>
          <div className={`relative group py-10 ${editMode ? 'border-2 border-dashed border-border rounded-xl px-5' : ''}`}>

            {/* Edit controls — hover-revealed in edit mode */}
            {editMode && (
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button
                  size="sm" variant="outline"
                  className="h-7 w-7 p-0"
                  disabled={i === 0}
                  onClick={() => moveUp(i)}
                  title="Move up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm" variant="outline"
                  className="h-7 w-7 p-0"
                  disabled={i === blocks.length - 1}
                  onClick={() => moveDown(i)}
                  title="Move down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm" variant="outline"
                  className="h-7 w-7 p-0"
                  onClick={() => openEdit(block)}
                  title="Edit block"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm" variant="outline"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => removeBlock(i)}
                  title="Delete block"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            <BlockRenderer block={block} clubs={clubs} />
          </div>

          {/* Separator / add-block row */}
          {editMode
            ? <AddBlockRow at={i + 1} />
            : i < blocks.length - 1 && <div className="border-t border-border my-2" />
          }
        </div>
      ))}

      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="text-center py-24 text-muted-foreground">
          {editMode
            ? <p>No content yet — use <strong>Add block</strong> above to get started.</p>
            : <p>This page is under construction. Check back soon!</p>}
        </div>
      )}

      {/* Block edit dialog */}
      <Dialog
        open={!!editingBlock}
        onOpenChange={open => { if (!open) { setEditingBlock(null); setEditDraft(null); } }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {editDraft ? (BLOCK_META.find(m => m.type === editDraft.type)?.label ?? '') : ''} Block
            </DialogTitle>
            <DialogDescription>
              Changes are staged locally. Click <strong>Save Page</strong> in the toolbar to persist them.
            </DialogDescription>
          </DialogHeader>

          {editDraft && (
            <BlockEditForm
              draft={editDraft}
              onChange={setEditDraft}
              authToken={authToken}
            />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setEditingBlock(null); setEditDraft(null); }}>
              Cancel
            </Button>
            <Button onClick={applyEdit}>Apply</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
