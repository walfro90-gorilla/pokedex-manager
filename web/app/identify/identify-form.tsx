"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import TypeBadge from "@/app/components/type-badge";
import CameraScanner from "./camera-scanner";
import { captureIdentifiedAction } from "./actions";

type IdentifyResult = {
  found: boolean;
  name: string | null;
  pokemon_id: number | null;
  sprite_url: string | null;
  types: string[];
  confidence: number;
  reasoning: string;
  provider: string;
};

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? "http://localhost:8000";

export default function IdentifyForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  }

  const identify = useCallback(async (f: File) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", f);
      const res = await fetch(`${AI_SERVICE_URL}/identify`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Error ${res.status}`);
      }
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al identificar la imagen");
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleIdentify() {
    if (!file) return;
    await identify(file);
  }

  // Frame capturado desde el modo cámara: mismo flujo que el upload
  const handleCameraCapture = useCallback(
    (f: File) => {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);
      identify(f);
    },
    [identify],
  );

  return (
    <div className="flex flex-col gap-5">
      <CameraScanner onCapture={handleCameraCapture} disabled={loading} />

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-gray-200" />
        o sube una imagen
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <label className="poke-card flex cursor-pointer flex-col items-center gap-3 border-dashed p-8 text-center">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob: preview local
          <img src={preview} alt="preview" className="h-44 w-44 rounded-xl object-cover" />
        ) : (
          <>
            <span className="text-4xl">📷</span>
            <span className="text-sm font-medium text-muted">
              Toca para elegir una imagen (JPG, PNG o WebP, máx 5 MB)
            </span>
          </>
        )}
      </label>

      <button
        type="button"
        onClick={handleIdentify}
        disabled={!file || loading}
        className="self-center rounded-full bg-poke-red px-8 py-2.5 text-sm font-bold text-white transition-colors hover:bg-poke-red-dark disabled:opacity-50"
      >
        {loading ? "Identificando..." : "Identificar"}
      </button>

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      {result && !result.found && (
        <p className="text-center text-sm text-muted">
          No se reconoció ningún Pokémon. {result.reasoning}
        </p>
      )}

      {result?.found && (
        <div className="poke-card flex flex-col items-center gap-4 p-5 sm:flex-row">
          {result.sprite_url && (
            <Image
              src={result.sprite_url}
              alt={result.name ?? ""}
              width={110}
              height={110}
              unoptimized
              className="drop-shadow-sm"
            />
          )}
          <div className="flex-1 text-center sm:text-left">
            <p className="pixel text-[9px] text-muted">
              #{String(result.pokemon_id).padStart(4, "0")}
            </p>
            <p className="text-xl font-black capitalize">{result.name}</p>
            <div className="mt-1.5 flex justify-center gap-1.5 sm:justify-start">
              {result.types.map((t) => (
                <TypeBadge key={t} type={t} size="sm" />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              Confianza {(result.confidence * 100).toFixed(0)}% · vía {result.provider}
            </p>
            <p className="mt-1 text-xs text-muted">{result.reasoning}</p>
          </div>
          <form action={captureIdentifiedAction}>
            <input type="hidden" name="name" value={result.name ?? ""} />
            <button
              type="submit"
              className="rounded-full bg-poke-red px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-poke-red-dark"
            >
              ¡Capturar!
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
