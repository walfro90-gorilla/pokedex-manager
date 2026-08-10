"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Foto del entrenador: galería o cámara (dos inputs, mismo flujo de subida).
// Sube a Storage (carpeta del propio uid, RLS) y guarda la URL en metadata.
export default function AvatarUpload() {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión expirada");

      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type || "image/jpeg",
      });
      if (upErr) throw upErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const { error: metaErr } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
      if (metaErr) throw metaErr;

      // Write-through al perfil público (directorio de entrenadores)
      await supabase.from("profiles").upsert({
        user_id: user.id,
        avatar_url: publicUrl,
        display_name:
          (user.user_metadata?.display_name as string | undefined) ?? "Entrenador/a",
      });

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error subiendo la foto");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Galería (sin capture) y cámara frontal (capture=user) */}
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFile}
        className="hidden"
      />
      {uploading ? (
        <span className="text-xs font-medium text-muted">Subiendo...</span>
      ) : (
        <div className="flex items-center gap-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="text-poke-blue hover:underline"
          >
            🖼️ Galería
          </button>
          <span className="text-muted">·</span>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="text-poke-blue hover:underline"
          >
            📷 Cámara
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
