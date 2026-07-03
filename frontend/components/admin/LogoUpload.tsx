"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const API = "http://localhost:8000/api/v1";

function getToken() {
  try {
    const a = JSON.parse(localStorage.getItem("photodelivery_auth") || "{}");
    return a.accessToken || "";
  } catch {
    return "";
  }
}

interface LogoUploadProps {
  label: string;
  description?: string;
  value: string;
  onChange: (url: string) => void;
  eventId?: string;
}

export function LogoUpload({ label, description, value, onChange, eventId }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<"upload" | "url">("upload");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Show local preview immediately
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const endpoint = eventId
          ? `${API}/events/${eventId}/theme/upload-asset`
          : `${API}/upload/theme-asset`;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          onChange(data.url || data.file_url || "");
        } else {
          // Fallback: keep the local preview URL
          onChange(localPreview);
        }
      } catch {
        // If API not available, use local preview
        onChange(localPreview);
      } finally {
        setUploading(false);
      }
    },
    [onChange, eventId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading,
  });

  function clearImage() {
    onChange("");
    setPreviewUrl(null);
  }

  const displayUrl = previewUrl || value;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">{label}</Label>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-1.5 bg-muted rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={cn(
              "px-3 py-1.5 text-xs rounded-md transition-all font-medium",
              mode === "upload" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={cn(
              "px-3 py-1.5 text-xs rounded-md transition-all font-medium",
              mode === "url" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            URL
          </button>
        </div>
      </div>

      {mode === "upload" ? (
        <>
          {displayUrl ? (
            /* Preview + re-upload */
            <div className="relative rounded-xl overflow-hidden border-2 border-border bg-muted/30 group">
              <img
                src={displayUrl}
                alt={label}
                className="w-full h-40 object-contain p-4"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearImage}
                    className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur text-white text-sm font-medium hover:bg-white/30 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Remover
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Drop zone */
            <div
              {...getRootProps()}
              className={cn(
                "relative rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all",
                isDragActive
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
                uploading && "opacity-50 pointer-events-none"
              )}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <div className="space-y-3">
                  <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
                  <p className="text-sm text-muted-foreground">Enviando imagem...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {isDragActive ? "Solte a imagem aqui" : "Arraste a imagem ou clique para selecionar"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, WebP ou SVG — até 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* URL input */
        <div className="flex gap-3">
          <Input
            placeholder="https://exemplo.com/logo.png"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 h-11"
          />
          {value && (
            <div className="w-14 h-14 rounded-xl border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={value}
                alt=""
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
