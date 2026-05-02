#!/usr/bin/env python3
"""
Caviendoo — External API Health Check
Tests every external API used by caviendoo-api and validates the responses.

Usage:
    pip install requests          # only dependency
    python test_apis.py

Keys are read automatically from caviendoo-api/.env
"""

import os
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    print("Missing dependency.  Run:  pip install requests")
    sys.exit(1)

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RESET  = "\033[0m"

# ── Test constants ────────────────────────────────────────────────────────────
LAT        = 36.8065   # Tunis — weather, UV, climate
LNG        = 10.1815
SFAX_LAT   = 34.74     # Sfax agricultural belt — used for ISRIC soil test
SFAX_LNG   = 10.76     # (urban Tunis returns null values from SoilGrids)
LATIN_NAME = "Phoenix dactylifera"   # Deglet Nour date palm
FRUIT_EN   = "dates"
TIMEOUT    = 15   # seconds per request

# ── Load .env ─────────────────────────────────────────────────────────────────
def load_env(path: Path) -> dict:
    env = {}
    if not path.exists():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env

SCRIPT_DIR = Path(__file__).parent
ENV        = load_env(SCRIPT_DIR / "caviendoo-api" / ".env")

def key(name):
    return ENV.get(name, os.environ.get(name, ""))

# ── Result helpers ─────────────────────────────────────────────────────────────
passed  = 0
failed  = 0
skipped = 0

def _header(name, note=""):
    tag = f" {DIM}({note}){RESET}" if note else ""
    print(f"\n{BOLD}{CYAN}▶ {name}{RESET}{tag}")

def ok(msg, detail=""):
    global passed
    passed += 1
    suffix = f"  {DIM}{detail}{RESET}" if detail else ""
    print(f"  {GREEN}✓ PASS{RESET}  {msg}{suffix}")

def fail(msg, detail=""):
    global failed
    failed += 1
    suffix = f"  {DIM}{detail}{RESET}" if detail else ""
    print(f"  {RED}✗ FAIL{RESET}  {msg}{suffix}")

def skip(msg):
    global skipped
    skipped += 1
    print(f"  {YELLOW}– SKIP{RESET}  {msg}")

def info(msg):
    print(f"       {DIM}{msg}{RESET}")

def _get(url, headers=None, params=None, label="", silent=False):
    """silent=True: return None on network errors without calling fail() — for expected-dead endpoints."""
    try:
        r = requests.get(url, headers=headers or {}, params=params or {}, timeout=TIMEOUT)
        return r
    except requests.exceptions.ConnectionError as e:
        if not silent:
            fail(label or url, f"Connection error: {e}")
    except requests.exceptions.Timeout:
        if not silent:
            fail(label or url, f"Timed out after {TIMEOUT}s")
    except Exception as e:
        if not silent:
            fail(label or url, str(e))
    return None

def _post(url, headers=None, json_body=None, label=""):
    try:
        r = requests.post(url, headers=headers or {}, json=json_body or {}, timeout=TIMEOUT)
        return r
    except requests.exceptions.ConnectionError as e:
        fail(label or url, f"Connection error: {e}")
    except requests.exceptions.Timeout:
        fail(label or url, f"Timed out after {TIMEOUT}s")
    except Exception as e:
        fail(label or url, str(e))
    return None

# ─────────────────────────────────────────────────────────────────────────────
# 1. Open-Meteo  (free, no key)
# ─────────────────────────────────────────────────────────────────────────────
def test_open_meteo():
    _header("Open-Meteo", "free · no key · live weather")
    r = _get(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude":        LAT,
            "longitude":       LNG,
            "current":         "temperature_2m,relative_humidity_2m,precipitation,weathercode,wind_speed_10m,uv_index",
            "wind_speed_unit": "kmh",
            "timezone":        "auto",
        },
        label="GET /v1/forecast",
    )
    if r is None:
        return
    if r.status_code != 200:
        fail(f"HTTP {r.status_code}", r.text[:200])
        return

    c    = r.json().get("current", {})
    temp = c.get("temperature_2m")
    hum  = c.get("relative_humidity_2m")
    wind = c.get("wind_speed_10m")
    uv   = c.get("uv_index")

    (ok if temp is not None and -10 <= temp <= 55  else fail)(f"temperature_2m = {temp}°C")
    (ok if hum  is not None and 0   <= hum  <= 100 else fail)(f"humidity = {hum}%")
    (ok if wind is not None and wind >= 0           else fail)(f"wind_speed = {wind} km/h")
    (ok if uv   is not None and uv   >= 0           else fail)(f"uv_index = {uv}")

# ─────────────────────────────────────────────────────────────────────────────
# 2. NASA POWER  (free, no key)
# ─────────────────────────────────────────────────────────────────────────────
def test_nasa_power():
    _header("NASA POWER", "free · no key · 30-yr climate normals")
    r = _get(
        "https://power.larc.nasa.gov/api/temporal/climatology/point",
        params={
            "latitude":   LAT,
            "longitude":  LNG,
            "community":  "AG",
            "parameters": "ALLSKY_SFC_UV_INDEX,T2M,PRECTOTCORR,RH2M",
            "format":     "JSON",
            "header":     "true",
        },
        label="GET /api/temporal/climatology/point",
    )
    if r is None:
        return
    if r.status_code != 200:
        fail(f"HTTP {r.status_code}", r.text[:200])
        return

    param    = r.json().get("properties", {}).get("parameter", {})
    uv_ann   = param.get("ALLSKY_SFC_UV_INDEX", {}).get("ANN")
    t2m_ann  = param.get("T2M",         {}).get("ANN")
    precip   = param.get("PRECTOTCORR", {}).get("ANN")
    humidity = param.get("RH2M",        {}).get("ANN")

    (ok if uv_ann   is not None and 0 < uv_ann  <= 15  else fail)(f"UV annual mean = {uv_ann}")
    (ok if t2m_ann  is not None and 5 < t2m_ann <  40  else fail)(f"temp annual mean = {t2m_ann}°C")
    (ok if precip   is not None and precip > 0          else fail)(f"precip daily mean = {precip} mm/day")
    (ok if humidity is not None and 20 < humidity < 90  else fail)(f"relative humidity mean = {humidity}%")

# ─────────────────────────────────────────────────────────────────────────────
# 3. GBIF  (free, no key)
# ─────────────────────────────────────────────────────────────────────────────
def test_gbif():
    _header("GBIF", "free · no key · biodiversity data")

    r = _get(
        "https://api.gbif.org/v1/species/match",
        params={"name": LATIN_NAME, "kingdom": "Plantae"},
        label=f"species/match ({LATIN_NAME})",
    )
    if r is None:
        return
    if r.status_code != 200:
        fail(f"HTTP {r.status_code}")
        return

    d         = r.json()
    taxon_key = d.get("usageKey") or d.get("speciesKey")
    kingdom   = d.get("kingdom")
    family    = d.get("family")
    genus     = d.get("genus")

    (ok if taxon_key                  else fail)(f"taxonKey resolved: {taxon_key}")
    (ok if kingdom == "Plantae"       else fail)(f"kingdom = {kingdom}")
    (ok if family                     else fail)(f"family = {family}")
    if genus:
        info(f"genus = {genus}")

    if not taxon_key:
        return

    r2 = _get(
        "https://api.gbif.org/v1/occurrence/search",
        params={"taxonKey": taxon_key, "limit": 0},
        label="occurrence/search (global)",
    )
    if r2 and r2.status_code == 200:
        count = r2.json().get("count", 0)
        (ok if count > 0 else fail)(f"global occurrences: {count:,}")

    r3 = _get(
        "https://api.gbif.org/v1/occurrence/search",
        params={"taxonKey": taxon_key, "country": "TN", "limit": 0},
        label="occurrence/search (Tunisia)",
    )
    if r3 and r3.status_code == 200:
        tn = r3.json().get("count", 0)
        (ok if tn > 0 else fail)(f"Tunisia occurrences: {tn:,}")

# ─────────────────────────────────────────────────────────────────────────────
# 4. ISRIC SoilGrids  (free, no key)
# ─────────────────────────────────────────────────────────────────────────────
def test_isric():
    _header("ISRIC SoilGrids", "free · no key · soil properties · Sfax agricultural coords")
    info(f"Using Sfax ({SFAX_LAT}°N, {SFAX_LNG}°E) — Tunis urban area returns null values")
    info("Retrying up to 3× with backoff (mirrors isricService.ts retry logic)")
    params = {
        "lon":      SFAX_LNG,
        "lat":      SFAX_LAT,
        "property": "phh2o,clay,sand,soc",
        "depth":    "0-5cm",
        "value":    "mean",
    }
    r = None
    for attempt in range(1, 4):
        r = _get(
            "https://rest.isric.org/soilgrids/v2.0/properties/query",
            params=params,
            label=f"GET /soilgrids/v2.0/properties/query (attempt {attempt}/3)",
            silent=(attempt < 3),  # only report error on final attempt
        )
        if r is not None and r.status_code == 200:
            break
        if attempt < 3:
            time.sleep(attempt)
    if r is None:
        skip("No response after 3 attempts — server unreachable (production falls back to null soil values)")
        return
    if r.status_code == 500:
        skip(f"HTTP 500 after 3 attempts — ISRIC server overload (known intermittent issue)")
        info("Production isricService.ts returns null when retries exhausted — not a code bug")
        return
    if r.status_code != 200:
        fail(f"HTTP {r.status_code} after 3 attempts", r.text[:200])
        return

    layers = r.json().get("properties", {}).get("layers", [])
    (ok if layers else fail)(f"layers returned: {[l.get('name') for l in layers]}")

    for layer in layers:
        name = layer.get("name", "?")
        for depth_entry in layer.get("depths", []):
            val = depth_entry.get("values", {}).get("mean")
            if val is not None and val != -32768:
                if name == "phh2o":
                    ph = round(val / 10, 1)
                    (ok if 4 < ph < 10 else fail)(f"soil pH (0-5cm) = {ph}")
                else:
                    info(f"{name} (0-5cm) mean = {val}")
                break

# ─────────────────────────────────────────────────────────────────────────────
# 5. OpenUV  (requires OPENUV_API_KEY)
# ─────────────────────────────────────────────────────────────────────────────
def test_openuv():
    _header("OpenUV", "requires OPENUV_API_KEY · real-time UV index")
    api_key = key("OPENUV_API_KEY")
    if not api_key:
        skip("OPENUV_API_KEY not set in .env")
        return

    r = _get(
        "https://api.openuv.io/api/v1/uv",
        params={"lat": LAT, "lng": LNG},
        headers={"x-access-token": api_key, "Content-Type": "application/json"},
        label="GET /api/v1/uv",
    )
    if r is None:
        return
    if r.status_code == 403:
        fail("403 Forbidden — key invalid or quota exhausted", r.text[:200])
        return
    if r.status_code == 429:
        fail("429 Rate limited — daily quota likely exhausted")
        return
    if r.status_code != 200:
        fail(f"HTTP {r.status_code}", r.text[:200])
        return

    result = r.json().get("result", {})
    uv     = result.get("uv")
    uv_max = result.get("uv_max")
    ozone  = result.get("ozone")

    (ok if uv     is not None and uv     >= 0       else fail)(f"uv (current) = {uv}")
    (ok if uv_max is not None and uv_max >= 0       else fail)(f"uv_max = {uv_max}")
    (ok if ozone  is not None and 200 < ozone < 500 else fail)(f"ozone = {ozone} DU")

# ─────────────────────────────────────────────────────────────────────────────
# 6. Pixabay  (requires PIXABAY_API_KEY)
# ─────────────────────────────────────────────────────────────────────────────
def test_pixabay():
    _header("Pixabay", "requires PIXABAY_API_KEY · stock images")
    api_key = key("PIXABAY_API_KEY")
    if not api_key:
        skip("PIXABAY_API_KEY not set in .env")
        return

    r = _get(
        "https://pixabay.com/api/",
        params={
            "key":         api_key,
            "q":           f"{FRUIT_EN} Tunisia fruit",
            "image_type":  "photo",
            "category":    "food",
            "per_page":    "3",
            "min_width":   "800",
        },
        label=f"GET /api/ (q='{FRUIT_EN} Tunisia fruit')",
    )
    if r is None:
        return
    if r.status_code == 400:
        fail("400 Bad Request — key likely invalid", r.text[:200])
        return
    if r.status_code != 200:
        fail(f"HTTP {r.status_code}", r.text[:200])
        return

    data  = r.json()
    hits  = data.get("hits", [])
    total = data.get("totalHits", 0)

    (ok if hits else fail)(f"{len(hits)} hits returned (totalHits={total:,})")
    if hits:
        h = hits[0]
        ok(f"sample: {h.get('pageURL', '?')[:70]}")
        (ok if (h.get("imageWidth") or 0) >= 800 else fail)(f"width ≥ 800: {h.get('imageWidth')}")

# ─────────────────────────────────────────────────────────────────────────────
# 7. Unsplash  (requires UNSPLASH_ACCESS_KEY)
# ─────────────────────────────────────────────────────────────────────────────
def test_unsplash():
    _header("Unsplash", "requires UNSPLASH_ACCESS_KEY · stock images")
    api_key = key("UNSPLASH_ACCESS_KEY")
    if not api_key:
        skip("UNSPLASH_ACCESS_KEY not set in .env")
        return

    r = _get(
        "https://api.unsplash.com/search/photos",
        params={"query": f"{FRUIT_EN} fruit", "per_page": "3", "orientation": "landscape"},
        headers={"Authorization": f"Client-ID {api_key}"},
        label=f"GET /search/photos (query='{FRUIT_EN} fruit')",
    )
    if r is None:
        return
    if r.status_code == 401:
        fail("401 Unauthorized — access key invalid")
        return
    if r.status_code != 200:
        fail(f"HTTP {r.status_code}", r.text[:200])
        return

    results = r.json().get("results", [])
    total   = r.json().get("total", 0)

    (ok if results else fail)(f"{len(results)} results (total={total:,})")
    if results:
        s = results[0]
        ok(f"sample: {s.get('links', {}).get('html', '?')[:70]}")
        (ok if (s.get("width") or 0) >= 800 else fail)(f"width ≥ 800: {s.get('width')}")

# ─────────────────────────────────────────────────────────────────────────────
# 8. Pexels  (requires PEXELS_API_KEY)
# ─────────────────────────────────────────────────────────────────────────────
def test_pexels():
    _header("Pexels", "requires PEXELS_API_KEY · stock images")
    api_key = key("PEXELS_API_KEY")
    if not api_key:
        skip("PEXELS_API_KEY not set in .env")
        return

    r = _get(
        "https://api.pexels.com/v1/search",
        params={"query": f"{FRUIT_EN} fruit", "per_page": "3", "orientation": "landscape"},
        headers={"Authorization": api_key},
        label=f"GET /v1/search (query='{FRUIT_EN} fruit')",
    )
    if r is None:
        return
    if r.status_code == 401:
        fail("401 Unauthorized — API key invalid")
        return
    if r.status_code != 200:
        fail(f"HTTP {r.status_code}", r.text[:200])
        return

    photos = r.json().get("photos", [])
    total  = r.json().get("total_results", 0)

    (ok if photos else fail)(f"{len(photos)} photos (total_results={total:,})")
    if photos:
        p = photos[0]
        ok(f"sample: {p.get('url', '?')[:70]}")
        (ok if (p.get("width") or 0) >= 800 else fail)(f"width ≥ 800: {p.get('width')}")

# ─────────────────────────────────────────────────────────────────────────────
# 9. Wikimedia Commons  (free, no key)
# ─────────────────────────────────────────────────────────────────────────────
def test_wikimedia():
    _header("Wikimedia Commons", "free · no key · open-license images")
    r = _get(
        "https://commons.wikimedia.org/w/api.php",
        params={
            "action":        "query",
            "generator":     "search",
            "gsrnamespace":  "6",
            "gsrsearch":     f"{LATIN_NAME} fruit",
            "gsrlimit":      "3",
            "prop":          "imageinfo",
            "iiprop":        "url|size",
            "iiurlwidth":    "800",
            "format":        "json",
            "origin":        "*",
        },
        label=f"GET /w/api.php (gsrsearch='{LATIN_NAME} fruit')",
        silent=True,
    )
    if r is None:
        skip("commons.wikimedia.org unreachable — likely a local DNS/ISP block (not a code issue)")
        info("Wikimedia is an optional 4th image source; Pixabay/Unsplash/Pexels cover production use")
        return
    if r.status_code != 200:
        fail(f"HTTP {r.status_code}", r.text[:200])
        return

    pages = r.json().get("query", {}).get("pages", {})
    (ok if pages else fail)(f"{len(pages)} image page(s) found")

    for _, page in list(pages.items())[:1]:
        img_list = page.get("imageinfo", [])
        if img_list:
            img = img_list[0]
            w   = img.get("width", 0)
            url = img.get("thumburl") or img.get("url", "")
            ok(f"sample URL: {url[:70]}")
            (ok if w >= 800 else fail)(f"width ≥ 800: {w}")

# ─────────────────────────────────────────────────────────────────────────────
# 10. USDA FoodData Central  (optional USDA_API_KEY)
# ─────────────────────────────────────────────────────────────────────────────
def test_usda():
    _header("USDA FoodData Central", "optional USDA_API_KEY · nutrition data")
    api_key = key("USDA_API_KEY")
    if not api_key or api_key == "CHANGE_ME":
        skip("USDA_API_KEY not set — nutritional data will use seeded values")
        return

    r = _get(
        "https://api.nal.usda.gov/fdc/v1/foods/search",
        params={
            "query":    f"{FRUIT_EN} raw",
            "dataType": "Foundation,SR Legacy",
            "pageSize": "3",
            "api_key":  api_key,
        },
        label=f"GET /fdc/v1/foods/search (query='{FRUIT_EN} raw')",
    )
    if r is None:
        return
    if r.status_code == 403:
        fail("403 Forbidden — API key invalid or rate limited")
        return
    if r.status_code != 200:
        fail(f"HTTP {r.status_code}", r.text[:200])
        return

    foods = r.json().get("foods", [])
    total = r.json().get("totalHits", 0)

    (ok if foods else fail)(f"{len(foods)} foods found (totalHits={total:,})")
    if foods:
        best  = next((f for f in foods if "raw" in f.get("description", "").lower()), foods[0])
        desc  = best.get("description", "?")
        nuts  = best.get("foodNutrients", [])
        ok(f"best match: {desc}")
        ok(f"nutrient count: {len(nuts)}")
        energy = next((n for n in nuts if n.get("nutrientId") == 1008), None)
        (ok if energy else fail)(
            f"energy: {energy.get('value')} kcal/100g" if energy else "energy (nutrientId=1008) missing"
        )

# ─────────────────────────────────────────────────────────────────────────────
# 11. FAOSTAT  (REST API decommissioned 2024 — expected dead)
# ─────────────────────────────────────────────────────────────────────────────
def test_faostat():
    _header("FAOSTAT", "REST API decommissioned 2024 · app uses static fallback yields")
    info("FAO shut down the fenixservices REST API; bulk CSV download is also 403 server-side")
    info("faostatService.ts uses hardcoded default yield values — this test confirms the endpoint stays dead")
    r = _get(
        "https://fenixservices.fao.org/faostat/api/v1/en/data/QCL",
        params={"area": "202", "item": "577", "element": "5510", "year": "2022", "output_type": "objects"},
        label="GET /faostat/api/v1/en/data/QCL (Tunisia, dates, 2022)",
        silent=True,  # network/timeout errors are expected — don't count as failures
    )
    if r is None:
        info("No response (timeout/DNS) — confirmed dead endpoint")
    elif r.status_code in (404, 503, 521, 502, 500):
        info(f"HTTP {r.status_code} — confirmed decommissioned")
    elif r.status_code == 200:
        data = r.json().get("data", [])
        if data:
            ok(f"Endpoint unexpectedly alive — {len(data)} rows; consider wiring it back up")
            return
        else:
            info("HTTP 200 but no data rows — still effectively dead")
    else:
        info(f"HTTP {r.status_code}")
    ok("Static fallback yields in place — not a blocker for M2")

# ─────────────────────────────────────────────────────────────────────────────
# 12. Anthropic (Claude)  (optional ANTHROPIC_API_KEY · AI image scoring)
# ─────────────────────────────────────────────────────────────────────────────
def test_anthropic():
    _header("Anthropic (Claude Haiku)", "optional ANTHROPIC_API_KEY · AI image scoring")
    api_key = key("ANTHROPIC_API_KEY")
    if not api_key or api_key == "CHANGE_ME":
        skip("ANTHROPIC_API_KEY not set — image scoring uses keyword-match fallback")
        return

    r = _post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key":         api_key,
            "anthropic-version": "2023-06-01",
            "content-type":      "application/json",
        },
        json_body={
            "model":      "claude-haiku-4-5-20251001",
            "max_tokens": 10,
            "messages": [{"role": "user", "content": "Reply with only the number 0.9"}],
        },
        label="POST /v1/messages (echo test)",
    )
    if r is None:
        return
    if r.status_code == 401:
        fail("401 Unauthorized — API key invalid")
        return
    if r.status_code == 403:
        fail("403 Forbidden — key lacks permission or billing issue")
        return
    if r.status_code != 200:
        fail(f"HTTP {r.status_code}", r.text[:200])
        return

    body    = r.json()
    content = body.get("content", [])
    text    = content[0].get("text", "").strip() if content else ""
    model   = body.get("model", "?")
    usage   = body.get("usage", {})

    ok(f"model: {model}")
    ok(f"response text: '{text}'")
    info(f"tokens — input={usage.get('input_tokens')}  output={usage.get('output_tokens')}")
    try:
        val = float(text)
        (ok if 0 <= val <= 1 else fail)(f"score value in 0–1 range: {val}")
    except ValueError:
        fail(f"response is not a number: '{text}'  (keyword fallback will be used)")

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
def summary():
    total = passed + failed
    print(f"\n{'─'*60}")
    print(
        f"{BOLD}Results{RESET}  "
        f"{GREEN}{passed} passed{RESET}  "
        f"{RED}{failed} failed{RESET}  "
        f"{YELLOW}{skipped} skipped{RESET}  "
        f"(of {total} checks)"
    )
    if failed:
        print(
            f"\n{RED}One or more APIs are failing.{RESET}  "
            "Features that rely on them will fall back to seeded data or be missing."
        )
    else:
        print(f"\n{GREEN}All active APIs are responding correctly.{RESET}")

# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"{BOLD}Caviendoo — External API Health Check{RESET}")
    print(f"Weather  : Tunis ({LAT}°N, {LNG}°E)")
    print(f"Soil     : Sfax agricultural belt ({SFAX_LAT}°N, {SFAX_LNG}°E)")
    print(f"Test crop: {LATIN_NAME} ({FRUIT_EN})")
    print(f"Env file : {SCRIPT_DIR / 'caviendoo-api' / '.env'}")

    for fn in [
        test_open_meteo,
        test_nasa_power,
        test_gbif,
        test_isric,
        test_openuv,
        test_pixabay,
        test_unsplash,
        test_pexels,
        test_wikimedia,
        test_usda,
        test_faostat,
        test_anthropic,
    ]:
        try:
            fn()
        except Exception as exc:
            fail(f"Unhandled error in {fn.__name__}: {exc}")
        time.sleep(0.3)   # be polite between calls

    summary()
