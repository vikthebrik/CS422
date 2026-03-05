/// <reference types="vite/client" />
import { useState, useRef } from 'react';
import { Upload, RefreshCw, ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { ImageWithFallback } from './figma/ImageWithFallback';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.uomcc.org';
const MAX_SIZE_MB = 5;

/**
 * Scales an image down client-side using a canvas.
 * Preserves aspect ratio up to the specified max width/height.
 * Uses WebP encoding at 80% quality for optimal file size.
 */
function downscaleImage(file: File, maxWidth = 400, maxHeight = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        // Use better interpolation if supported (Chrome/Safari)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP for smaller payloads to the backend
        resolve(canvas.toDataURL('image/webp', 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Samples a downscaled version of the image on a canvas and returns
 * the average non-white, non-black, non-transparent pixel color as a hex string.
 * Skips pixels that are near-white (likely backgrounds) or near-black.
 */
function extractDominantColor(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const SIZE = 64;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 128) continue;                               // transparent
        const pr = data[i], pg = data[i + 1], pb = data[i + 2];
        if (pr > 235 && pg > 235 && pb > 235) continue;     // near-white background
        if (pr < 20 && pg < 20 && pb < 20) continue;        // near-black
        r += pr; g += pg; b += pb; count++;
      }
      if (count === 0) { resolve('#94a3b8'); return; }
      resolve('#' + [Math.round(r / count), Math.round(g / count), Math.round(b / count)]
        .map(v => v.toString(16).padStart(2, '0')).join(''));
    };
    img.onerror = () => resolve('#94a3b8');
    img.src = dataUrl;
  });
}

interface LogoUploadProps {
  clubId: string;
  currentLogo?: string;
  clubColor: string;
  clubInitials: string;
  authToken: string | null;
  onUploaded: (newLogoUrl: string) => void;
}

export function LogoUpload({ clubId, currentLogo, clubColor, clubInitials, authToken, onUploaded }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedColor, setExtractedColor] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_SIZE_MB}MB`);
      return;
    }

    try {
      const downscaledDataUrl = await downscaleImage(file);
      setPreview(downscaledDataUrl);
      const color = await extractDominantColor(downscaledDataUrl);
      setExtractedColor(color);
    } catch (err) {
      console.error('Error processing image:', err);
      toast.error('Failed to process image');
    }
  };

  const handleUpload = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      const res = await fetch(`${API_BASE}/clubs/${clubId}/logo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ logo: preview, ...(extractedColor ? { color: extractedColor } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Upload failed');
        return;
      }
      onUploaded(data.logo_url);
      toast.success('Logo updated');
      setPreview(null);
      setExtractedColor(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch {
      toast.error('Could not reach the server');
    } finally {
      setUploading(false);
    }
  };

  const displaySrc = preview ?? currentLogo;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div
          className="w-20 h-20 rounded-lg flex items-center justify-center text-white shrink-0 overflow-hidden"
          style={{ backgroundColor: clubColor }}
        >
          {displaySrc ? (
            <ImageWithFallback src={displaySrc} alt="Logo preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-medium">{clubInitials}</span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
              Choose image
            </Button>
            {preview && (
              <Button
                type="button"
                size="sm"
                className="bg-primary"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading
                  ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading…</>
                  : <><Upload className="h-3.5 w-3.5 mr-1.5" />Upload</>}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG, WebP — max {MAX_SIZE_MB}MB</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
