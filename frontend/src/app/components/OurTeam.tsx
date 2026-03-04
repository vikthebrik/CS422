import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Mail, Check, Upload, ImageIcon, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';

const API_BASE = '/api';
const MAX_PHOTO_MB = 3;

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

// Downscale image client-side (reuses same pattern as LogoUpload)
function downscaleImage(file: File, maxPx = 300): Promise<string> {
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
        resolve(canvas.toDataURL('image/webp', 0.75));
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
}

export function OurTeam({ clubId, canEdit, authToken }: Props) {
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // copy-email feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) { toast.error(`Photo must be under ${MAX_PHOTO_MB}MB`); return; }
    try {
      setPhotoPreview(await downscaleImage(file));
    } catch {
      toast.error('Failed to process image');
    }
  };

  // ── upload photo for a saved member ───────────────────────────────────────
  const uploadPhoto = async (memberId: string, dataUrl: string): Promise<string | null> => {
    setUploadingPhoto(true);
    try {
      const res = await fetch(`${API_BASE}/clubs/${clubId}/members/${memberId}/photo`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ photo: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Photo upload failed'); return null; }
      return data.photo_url as string;
    } catch {
      toast.error('Could not upload photo');
      return null;
    } finally {
      setUploadingPhoto(false);
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

  // ── member card ────────────────────────────────────────────────────────────
  const renderMember = (member: ClubMember) => (
    <div key={member.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0 flex items-center justify-center">
        {member.photo_url ? (
          <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-medium text-muted-foreground">
            {member.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
          </span>
        )}
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

          return (
            <div key={section} className="mb-6 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {SECTION_LABELS[section]}
                </h4>
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
                <Button type="button" variant="outline" size="sm" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  {photoPreview || editingMember?.photo_url ? 'Change photo' : 'Upload photo'}
                </Button>
                {photoPreview && (
                  <Button type="button" variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setPhotoPreview(null); if (photoInputRef.current) photoInputRef.current.value = ''; }}>
                    <X className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">Optional · max {MAX_PHOTO_MB}MB</p>
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
                    <SelectItem key={s} value={s}>{SECTION_LABELS[s]}</SelectItem>
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
                disabled={saving || uploadingPhoto || !form.name.trim() || !form.title.trim()}
              >
                {saving || uploadingPhoto ? 'Saving…' : editingMember ? 'Save Changes' : 'Add Member'}
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
