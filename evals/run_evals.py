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
import urllib.request

BASE = "http://localhost:8000"
IMAGES = pathlib.Path(__file__).parent / "images"

# archivo -> nombre esperado (None = debe responder found=false)
CASES = {
    "pikachu_card.jpg": "pikachu",
    "charizard_toy.png": "charizard",
    "not_a_pokemon.jpg": None,
    # ... completar hasta ~10 casos
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
        result = post_image(path)
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
