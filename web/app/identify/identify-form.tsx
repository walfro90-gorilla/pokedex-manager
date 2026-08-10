"use client";

import { useState } from "react";
import Image from "next/image";
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

  async function handleIdentify() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
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
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="text-sm"
      />

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- blob: preview local, no aplica next/image
        <img src={preview} alt="preview" className="h-48 w-48 rounded-md object-cover" />
      )}

      <button
        type="button"
        onClick={handleIdentify}
        disabled={!file || loading}
        className="w-fit rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Identificando..." : "Identificar"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && !result.found && (
        <p className="text-sm text-gray-600">
          No se reconoció ningún Pokémon. {result.reasoning}
        </p>
      )}

      {result?.found && (
        <div className="flex items-center gap-4 rounded-lg border border-gray-200 p-4">
          {result.sprite_url && (
            <Image
              src={result.sprite_url}
              alt={result.name ?? ""}
              width={80}
              height={80}
              unoptimized
            />
          )}
          <div className="flex-1">
            <p className="font-medium capitalize">{result.name}</p>
            <p className="text-xs text-gray-500">
              confianza {(result.confidence * 100).toFixed(0)}% · vía {result.provider}
            </p>
            <p className="mt-1 text-xs text-gray-600">{result.reasoning}</p>
          </div>
          <form action={captureIdentifiedAction}>
            <input type="hidden" name="name" value={result.name ?? ""} />
            <button
              type="submit"
              className="rounded-md bg-black px-3 py-2 text-xs font-medium text-white"
            >
              Agregar a mi colección
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
