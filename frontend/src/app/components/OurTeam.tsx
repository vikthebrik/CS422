import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Mail, Check, Upload, ImageIcon, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';

const API_BASE = '/api';
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

export interface ClubMember {
  id: string;
  club_id: string;
  section: 'exec' | 'board' | 'intern';
  name: string;
  title: string;
  email: string | null;
  photo_url: string | null;
  sort_order: number;
}

const SECTION_LABELS: Record<ClubMember['section'], string> = {
  exec: 'Executive Team',
  board: 'Board',
  intern: 'Interns',
};

const SECTIONS: ClubMember['section'][] = ['exec', 'board', 'intern'];

// Compress image to fit within maxBytes. Scales down to maxPx, then reduces
// WebP quality in steps until the base64-encoded size fits.
function compressToFit(file: File, maxBytes = MAX_PHOTO_BYTES, maxPx = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          const ratio = Math.min(maxPx / width, maxPx / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try decreasing quality until encoded size fits
        let quality = 0.85;
        let dataUrl = canvas.toDataURL('image/webp', quality);
        while (quality > 0.1) {
          // base64 chars → ~75% of actual bytes
          const approxBytes = Math.ceil((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
          if (approxBytes <= maxBytes) break;
          quality = Math.round((quality - 0.1) * 10) / 10;
          dataUrl = canvas.toDataURL('image/webp', quality);
        }
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface MemberFormState {
  section: ClubMember['section'];
  name: string;
  title: string;
  email: string;
}

const EMPTY_FORM: MemberFormState = { section: 'exec', name: '', title: '', email: '' };

interface Props {
  clubId: string;
  canEdit: boolean;
  authToken: string | null;
  orgType?: 'union' | 'department';
  sectionLabels?: { exec?: string; board?: string; intern?: string };
  onSectionLabelsChange?: (labels: { exec?: string; board?: string; intern?: string }) => void;
}

export function OurTeam({ clubId, canEdit, authToken, orgType, sectionLabels, onSectionLabelsChange }: Props) {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);

  // dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ClubMember | null>(null);
  const [form, setForm] = useState<MemberFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<ClubMember | null>(null);

  // photo upload state (within dialog)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // inline avatar upload — per-member status: 'compressing' | 'uploading' | undefined
  const [photoStatus, setPhotoStatus] = useState<Record<string, 'compressing' | 'uploading'>>({});
  const inlinePhotoRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // copy-email feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // inline section label editing (departments only)
  const [editingLabel, setEditingLabel] = useState<ClubMember['section'] | null>(null);
  const [labelDraft, setLabelDraft] = useState('');
  const [savingLabel, setSavingLabel] = useState(false);

  // ── fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/clubs/${clubId}/members`)
      .then(r => r.json())
      .then(data => { setMembers(Array.isArray(data) ? data : []); })
      .catch(() => toast.error('Could not load team members'))
      .finally(() => setLoading(false));
  }, [clubId]);

  // ── helpers ────────────────────────────────────────────────────────────────
  const authHeaders = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };

  const openAdd = (section: ClubMember['section']) => {
    setEditingMember(null);
    setForm({ ...EMPTY_FORM, section });
    setPhotoPreview(null);
    setDialogOpen(true);
  };

  const openEdit = (member: ClubMember) => {
    setEditingMember(member);
    setForm({ section: member.section, name: member.name, title: member.title, email: member.email ?? '' });
    setPhotoPreview(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingMember(null);
    setForm(EMPTY_FORM);
    setPhotoPreview(null);
  };

  // ── photo pick ─────────────────────────────────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    try {
      setPhotoPreview(await compressToFit(file));
    } catch {
      toast.error('Failed to process image');
    }
  };

  // ── upload photo for a saved member ───────────────────────────────────────
  const uploadPhoto = async (memberId: string, dataUrl: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE}/clubs/${clubId}/members/${memberId}/photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ photo: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Photo upload failed'); return null; }
      return data.photo_url as string;
    } catch {
      toast.error('Could not upload photo');
      return null;
    }
  };

  const setMemberStatus = (id: string, status: 'compressing' | 'uploading' | null) =>
    setPhotoStatus(prev => {
      const next = { ...prev };
      if (status === null) delete next[id]; else next[id] = status;
      return next;
    });

  // ── inline avatar upload (available to logged-in users) ───────────────────
  const handleInlinePhotoChange = async (member: ClubMember, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }

    try {
      // Show compressing state immediately — large files take a moment to read + encode
      setMemberStatus(member.id, 'compressing');
      const dataUrl = await compressToFit(file);

      setMemberStatus(member.id, 'uploading');
      const url = await uploadPhoto(member.id, dataUrl);
      if (url) setMembers(prev => prev.map(m => m.id === member.id ? { ...m, photo_url: url } : m));
    } catch {
      toast.error('Failed to process image');
    } finally {
      setMemberStatus(member.id, null);
      if (inlinePhotoRefs.current[member.id]) inlinePhotoRefs.current[member.id]!.value = '';
    }
  };

  // ── save (create or update) ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim() || !form.title.trim()) {
      toast.error('Name and title are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        section: form.section,
        name: form.name.trim(),
        title: form.title.trim(),
        email: form.email.trim() || null,
      };

      if (editingMember) {
        // update existing
        const res = await fetch(`${API_BASE}/clubs/${clubId}/members/${editingMember.id}`, {
          method: 'PATCH',
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error ?? 'Failed to update member'); return; }

        let updated: ClubMember = data;
        if (photoPreview) {
          const url = await uploadPhoto(editingMember.id, photoPreview);
          if (url) updated = { ...updated, photo_url: url };
          else updated = { ...updated, photo_url: editingMember.photo_url };
        }
        setMembers(prev => prev.map(m => m.id === editingMember.id ? updated : m));
        toast.success('Member updated');
      } else {
        // create new
        const res = await fetch(`${API_BASE}/clubs/${clubId}/members`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error ?? 'Failed to add member'); return; }

        let created: ClubMember = data;
        if (photoPreview) {
          const url = await uploadPhoto(created.id, photoPreview);
          if (url) created = { ...created, photo_url: url };
        }
        setMembers(prev => [...prev, created]);
        toast.success('Member added');
      }
      closeDialog();
    } catch {
      toast.error('Could not reach the server');
    } finally {
      setSaving(false);
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (member: ClubMember) => {
    try {
      const res = await fetch(`${API_BASE}/clubs/${clubId}/members/${member.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error ?? 'Failed to delete'); return; }
      setMembers(prev => prev.filter(m => m.id !== member.id));
      setDeleteConfirm(null);
      toast.success('Member removed');
    } catch {
      toast.error('Could not reach the server');
    }
  };

  // ── copy email ─────────────────────────────────────────────────────────────
  const copyEmail = (member: ClubMember) => {
    if (!member.email) return;
    navigator.clipboard.writeText(member.email).then(() => {
      setCopiedId(member.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // ── section label save ────────────────────────────────────────────────────
  const saveSectionLabel = async (section: ClubMember['section']) => {
    if (savingLabel) return;
    const trimmed = labelDraft.trim();
    if (!trimmed) { setEditingLabel(null); return; }
    setSavingLabel(true);
    setEditingLabel(null); // close input immediately to prevent blur double-fire
    const newLabels = { ...sectionLabels, [section]: trimmed };
    try {
      const res = await fetch(`${API_BASE}/clubs/${clubId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify({ sectionLabels: newLabels }),
      });
      if (res.ok) {
        onSectionLabelsChange?.(newLabels);
      } else {
        const body = await res.json().catch(() => ({}));
        toast.error((body as any).error ?? 'Failed to save section name');
      }
    } catch {
      toast.error('Could not reach the server');
    } finally {
      setSavingLabel(false);
    }
  };

  // ── member card ────────────────────────────────────────────────────────────
  const renderMember = (member: ClubMember) => {
    const status = photoStatus[member.id];
    const isBusy = !!status;
    return (
    <div key={member.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      {/* Avatar — click to upload (logged-in users) */}
      <div className="shrink-0 flex flex-col items-center gap-1">
        <button
          type="button"
          title={authToken ? 'Click to upload photo' : undefined}
          className={`w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center relative group ${authToken ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={() => authToken && inlinePhotoRefs.current[member.id]?.click()}
          disabled={isBusy}
        >
          {member.photo_url ? (
            <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {member.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </span>
          )}
          {/* hover overlay */}
          {!isBusy && authToken && (
            <span className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="h-4 w-4 text-white" />
            </span>
          )}
          {/* busy overlay */}
          {isBusy && (
            <span className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </span>
          )}
        </button>
        {/* status label + bar */}
        {isBusy && (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-muted-foreground leading-none">
              {status === 'compressing' ? 'Compressing…' : 'Uploading…'}
            </span>
            <div className="w-12 h-1 rounded-full bg-primary/20 overflow-hidden">
              <div className="h-full w-1/2 bg-primary rounded-full animate-pulse" />
            </div>
          </div>
        )}
        <input
          ref={el => { inlinePhotoRefs.current[member.id] = el; }}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => handleInlinePhotoChange(member, e)}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm leading-tight">{member.name}</p>
        <p className="text-xs text-muted-foreground">{member.title}</p>
        {member.email && (
          <button
            type="button"
            onClick={() => copyEmail(member)}
            className="inline-flex items-center gap-1 mt-0.5 text-xs text-primary hover:underline underline-offset-2"
            title="Click to copy email"
          >
            {copiedId === member.id
              ? <><Check className="h-3 w-3" /> Copied!</>
              : <><Mail className="h-3 w-3" /> {member.email}</>
            }
          </button>
        )}
      </div>

      {/* Edit / Delete (admin only) */}
      {canEdit && (
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(member)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(member)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
  };

  // ── render ─────────────────────────────────────────────────────────────────
  const hasAnyMembers = members.length > 0;

  return (
    <div className="space-y-1">
      {loading ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Loading team…</p>
      ) : !hasAnyMembers && !canEdit ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No team members listed yet.</p>
      ) : (
        SECTIONS.map(section => {
          const sectionMembers = members.filter(m => m.section === section);
          if (sectionMembers.length === 0 && !canEdit) return null;

          const displayLabel = sectionLabels?.[section] || SECTION_LABELS[section];
          const canEditLabel = canEdit && orgType === 'department';

          return (
            <div key={section} className="mb-6 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                {editingLabel === section ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      className="text-sm font-semibold uppercase tracking-wide bg-transparent border-b border-primary outline-none w-40"
                      value={labelDraft}
                      onChange={e => setLabelDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveSectionLabel(section); if (e.key === 'Escape') setEditingLabel(null); }}
                      onBlur={() => { if (!savingLabel) saveSectionLabel(section); }}
                      disabled={savingLabel}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 group/label">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {displayLabel}
                    </h4>
                    {canEditLabel && (
                      <button
                        type="button"
                        className="opacity-0 group-hover/label:opacity-100 transition-opacity"
                        onClick={() => { setLabelDraft(displayLabel); setEditingLabel(section); }}
                        title="Rename section"
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                )}
                {canEdit && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openAdd(section)}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add
                  </Button>
                )}
              </div>

              {sectionMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground italic pl-1">No members yet — click Add to get started.</p>
              ) : (
                <div>{sectionMembers.map(renderMember)}</div>
              )}
            </div>
          );
        })
      )}

      {/* ── Add / Edit dialog ─────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMember ? 'Edit Member' : 'Add Member'}</DialogTitle>
            <DialogDescription>
              {editingMember ? "Update this team member's details." : 'Add a new member to the team roster.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Photo */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                {photoPreview || editingMember?.photo_url ? (
                  <img
                    src={photoPreview ?? editingMember?.photo_url ?? ''}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-1.5">
                <Button type="button" variant="outline" size="sm" onClick={() => photoInputRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  {photoPreview || editingMember?.photo_url ? 'Change photo' : 'Upload photo'}
                </Button>
                {photoPreview && (
                  <Button type="button" variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setPhotoPreview(null); if (photoInputRef.current) photoInputRef.current.value = ''; }}>
                    <X className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">Optional · large images are auto-compressed</p>
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            {/* Section */}
            <div>
              <Label>Section</Label>
              <Select value={form.section} onValueChange={v => setForm(f => ({ ...f, section: v as ClubMember['section'] }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map(s => (
                    <SelectItem key={s} value={s}>{sectionLabels?.[s] || SECTION_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="mem-name">Full Name</Label>
              <Input
                id="mem-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Jane Doe"
                className="mt-1"
              />
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="mem-title">Title / Role</Label>
              <Input
                id="mem-title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="President"
                className="mt-1"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="mem-email">Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="mem-email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="jane@uoregon.edu"
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button
                type="button"
                className="bg-primary"
                onClick={handleSave}
                disabled={saving || !form.name.trim() || !form.title.trim()}
              >
                {saving ? 'Saving…' : editingMember ? 'Save Changes' : 'Add Member'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ───────────────────────────────────────── */}
      {deleteConfirm && (
        <Dialog open onOpenChange={open => { if (!open) setDeleteConfirm(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Remove Member</DialogTitle>
              <DialogDescription>
                Remove <strong>{deleteConfirm.name}</strong> from the team roster? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}>Remove</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
