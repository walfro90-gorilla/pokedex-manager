"use client";

import { useState } from "react";
import TypeBadge from "@/app/components/type-badge";

// Botón de movimiento: al tocarlo trae el detalle del ataque de PokéAPI
// (tipo, poder, precisión, PP) y lo muestra inline.
type MoveInfo = {
  type: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  damageClass: string;
};

const CLASS_LABELS: Record<string, string> = {
  physical: "Físico",
  special: "Especial",
  status: "Estado",
};

export default function MoveButton({ name, level }: { name: string; level: number }) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<MoveInfo | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (info || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/move/${name}`);
      const m = await res.json();
      setInfo({
        type: m.type?.name ?? "normal",
        power: m.power,
        accuracy: m.accuracy,
        pp: m.pp,
        damageClass: m.damage_class?.name ?? "",
      });
    } catch {
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={toggle}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors ${
          open
            ? "bg-poke-navy text-white"
            : "bg-gray-100 text-gray-800 hover:bg-poke-navy hover:text-white"
        }`}
      >
        <span className="pixel text-[8px] opacity-60">Nv.{level}</span>
        <span className="font-semibold capitalize">{name.replace(/-/g, " ")}</span>
      </button>
      {open && (
        <div className="mt-1 flex flex-wrap items-center gap-2 rounded-xl border-2 border-gray-100 bg-surface px-3 py-2 text-[11px]">
          {loading ? (
            <span className="text-muted">Cargando...</span>
          ) : info ? (
            <>
              <TypeBadge type={info.type} size="sm" />
              <span>
                Poder <strong>{info.power ?? "—"}</strong>
              </span>
              <span>
                Precisión <strong>{info.accuracy ?? "—"}</strong>
              </span>
              <span>
                PP <strong>{info.pp ?? "—"}</strong>
              </span>
              {info.damageClass && (
                <span className="text-muted">{CLASS_LABELS[info.damageClass] ?? info.damageClass}</span>
              )}
            </>
          ) : (
            <span className="text-muted">Sin datos</span>
          )}
        </div>
      )}
    </div>
  );
}
