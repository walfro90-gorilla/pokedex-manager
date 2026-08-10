"""Mini-evals del endpoint /identify.

Uso:
    1. Coloca imágenes de prueba en evals/images/
    2. Registra el resultado esperado en CASES
    3. python evals/run_evals.py  (con el ai-service corriendo en :8000)

Filosofía: un agente sin evals es una demo. Diez casos no son ciencia,
pero convierten "parece que funciona" en un número reproducible.
"""
import json
import pathlib
import sys
import urllib.error
import urllib.request

BASE = "http://localhost:8000"
IMAGES = pathlib.Path(__file__).parent / "images"

# archivo -> nombre esperado (None = debe responder found=false)
# Tres niveles de dificultad: artwork oficial (fácil), renders home (medio),
# sprites pixelados de 96px (difícil) + control negativo (franjas de color).
CASES = {
    "pikachu_artwork.png": "pikachu",
    "charizard_artwork.png": "charizard",
    "bulbasaur_artwork.png": "bulbasaur",
    "gengar_artwork.png": "gengar",
    "eevee_artwork.png": "eevee",
    "squirtle_home.png": "squirtle",
    "snorlax_home.png": "snorlax",
    "mewtwo_pixel.png": "mewtwo",
    "jigglypuff_pixel.png": "jigglypuff",
    "not_a_pokemon.png": None,
}


def post_image(path: pathlib.Path) -> dict:
    boundary = "----evals"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{path.name}"\r\n'
        f"Content-Type: image/{'png' if path.suffix == '.png' else 'jpeg'}\r\n\r\n"
    ).encode() + path.read_bytes() + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(
        f"{BASE}/identify", data=body, method="POST",
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def main() -> int:
    passed = 0
    for fname, expected in CASES.items():
        path = IMAGES / fname
        if not path.exists():
            print(f"SKIP {fname} (no existe)")
            continue
        # Un error del servicio (ej. 502 por output no parseable del modelo)
        # cuenta como FAIL del caso, no tumba la corrida completa.
        try:
            result = post_image(path)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            print(f"FAIL {fname}: esperado={expected} obtenido=ERROR({e})")
            continue
        got = result["name"] if result["found"] else None
        ok = got == expected
        passed += ok
        print(f"{'PASS' if ok else 'FAIL'} {fname}: esperado={expected} obtenido={got} "
              f"(conf={result['confidence']:.2f}, via {result['provider']})")
    total = len([f for f in CASES if (IMAGES / f).exists()])
    print(f"\n{passed}/{total} casos correctos")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
