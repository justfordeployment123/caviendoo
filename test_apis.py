#!/usr/bin/env python3
"""
Caviendoo — Full API Health Check
Tests every external API used in the project.
"""

import sys
import requests

# Force UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ── Keys (pulled from caviendoo-api/.env) ─────────────────────────────────────
OPENUV_API_KEY      = "openuv-ls5v9rmo934kzk-io"
PIXABAY_API_KEY     = "55539132-f81a4555f52bc7d18e77a5ce4"
UNSPLASH_ACCESS_KEY = "Je83j6q4O1zR-4x8UTwK6WdZijeiJruQQT6HmsRjKmw"
PEXELS_API_KEY      = "xr6zclKIWS3R0Qhgs1F5MkygW87wQEhvzTmZ8dU7HR7sqqVtViYm4ify"
USDA_API_KEY        = "MbaAyIbks75zUTHa045viSv9rbi8Ne2CmectpUsH"
ANTHROPIC_API_KEY   = "CHANGE_ME"  # update when key is filled in

# Test coordinates: Tunis centroid
LAT, LNG = 36.8, 10.18

# ── Console colours ────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"
DIM    = "\033[2m"

results: list[tuple[str, bool, str]] = []

def ok(name: str, detail: str = ""):
    line = f"  {GREEN}✓ PASS{RESET}  {name}"
    if detail:
        line += f"  {DIM}→ {detail}{RESET}"
    print(line)
    results.append((name, True, detail))

def fail(name: str, reason: str):
    print(f"  {RED}✗ FAIL{RESET}  {name}  {RED}→ {reason}{RESET}")
    results.append((name, False, reason))

def warn(name: str, reason: str):
    print(f"  {YELLOW}⚠ SKIP{RESET}  {name}  {YELLOW}→ {reason}{RESET}")
    results.append((name, False, reason))

def section(title: str):
    print(f"\n{BOLD}{CYAN}── {title} {'─' * (52 - len(title))}{RESET}")

def call(name: str, method: str, url: str,
         headers: dict = None, params: dict = None, body: dict = None,
         timeout: int = 20, ok_keys: list[str] = None):
    """Make one HTTP request and report pass/fail with a meaningful reason."""
    try:
        h = headers or {}
        kw: dict = {"timeout": timeout, "headers": h}
        if params:
            kw["params"] = params

        if method == "POST":
            r = requests.post(url, json=body, **kw)
        else:
            r = requests.get(url, **kw)

        status = r.status_code

        if status == 200:
            # Try to extract a meaningful snippet from the response
            try:
                data = r.json()
                if ok_keys:
                    found = {k: _dig(data, k) for k in ok_keys}
                    snippet = "  ".join(f"{k}={v}" for k, v in found.items() if v is not None)
                else:
                    snippet = _first_value(data)
                ok(name, f"HTTP 200  {snippet}")
            except Exception:
                ok(name, f"HTTP 200")

        elif status == 201:
            ok(name, "HTTP 201 Created")
        elif status == 400:
            fail(name, f"HTTP 400 Bad Request — check query params  ({r.text[:120]})")
        elif status == 401:
            fail(name, "HTTP 401 Unauthorized — API key invalid or missing")
        elif status == 403:
            fail(name, "HTTP 403 Forbidden — key lacks permission or daily quota exhausted")
        elif status == 404:
            fail(name, f"HTTP 404 Not Found — endpoint URL may have changed")
        elif status == 429:
            fail(name, "HTTP 429 Too Many Requests — rate limit hit")
        elif status == 500:
            fail(name, f"HTTP 500 Server Error — API-side issue  ({r.text[:120]})")
        else:
            fail(name, f"HTTP {status}  ({r.text[:120]})")

    except requests.exceptions.ConnectionError as e:
        cause = str(e)
        if "ECONNREFUSED" in cause or "Connection refused" in cause:
            fail(name, "Connection refused — service is not running on that host/port")
        elif "ENOTFOUND" in cause or "Name or service not known" in cause or "getaddrinfo" in cause.lower():
            fail(name, "DNS resolution failed — no internet or domain unreachable")
        elif "ETIMEDOUT" in cause or "timed out" in cause.lower():
            fail(name, f"Connection timed out after {timeout}s — host unreachable or firewall blocking")
        else:
            fail(name, f"Connection error — {cause[:160]}")

    except requests.exceptions.ReadTimeout:
        fail(name, f"Read timeout after {timeout}s — API responded but sent no data in time (try increasing timeout)")

    except requests.exceptions.ConnectTimeout:
        fail(name, f"Connect timeout after {timeout}s — host unreachable or firewall blocking")

    except requests.exceptions.SSLError as e:
        fail(name, f"SSL/TLS error — {str(e)[:120]}")

    except Exception as e:
        fail(name, f"{type(e).__name__}: {str(e)[:160]}")


def _dig(obj, key: str):
    """Recursively find first value for a key in a nested dict/list."""
    if isinstance(obj, dict):
        if key in obj:
            v = obj[key]
            return str(v)[:40] if v is not None else None
        for v in obj.values():
            found = _dig(v, key)
            if found is not None:
                return found
    elif isinstance(obj, list) and obj:
        return _dig(obj[0], key)
    return None


def _first_value(data) -> str:
    """Return a short readable snippet from the top of a JSON response."""
    if isinstance(data, dict):
        for k, v in list(data.items())[:3]:
            if isinstance(v, (str, int, float)) and v:
                return f"{k}={str(v)[:50]}"
    elif isinstance(data, list) and data:
        return f"[{len(data)} items]"
    return ""


# ══════════════════════════════════════════════════════════════════════════════
print(f"\n{BOLD}{'═'*60}{RESET}")
print(f"{BOLD}   Caviendoo API Health Check{RESET}")
print(f"{BOLD}{'═'*60}{RESET}")

# ── 1. OpenUV ──────────────────────────────────────────────────────────────────
section("Environmental APIs (keyed)")

call(
    "OpenUV  (nightly UV forecast)",
    "GET", "https://api.openuv.io/api/v1/uv",
    headers={"x-access-token": OPENUV_API_KEY, "Content-Type": "application/json"},
    params={"lat": LAT, "lng": LNG},
    ok_keys=["uv_max"],
)

# ── 2. NASA POWER ──────────────────────────────────────────────────────────────
section("Climate APIs (free / no key)")

call(
    "NASA POWER  (30-yr climatology, water footprint)",
    "GET", "https://power.larc.nasa.gov/api/temporal/climatology/point",
    params={
        "latitude": LAT, "longitude": LNG,
        "community": "AG",
        "parameters": "T2M,PRECTOTCORR",
        "format": "JSON", "header": "true",
    },
    timeout=45,
    ok_keys=["T2M"],
)

# ── 3. Open-Meteo ──────────────────────────────────────────────────────────────
call(
    "Open-Meteo  (live weather per governorate)",
    "GET", "https://api.open-meteo.com/v1/forecast",
    params={
        "latitude": LAT, "longitude": LNG,
        "current": "temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation",
        "timezone": "Africa/Tunis",
        "uv_index_max": "true",
    },
    ok_keys=["temperature_2m"],
)

# ── 4. ISRIC SoilGrids ─────────────────────────────────────────────────────────
call(
    "ISRIC SoilGrids  (soil pH / texture per governorate)",
    "GET", "https://rest.isric.org/soilgrids/v2.0/properties/query",
    params={"lon": LNG, "lat": LAT, "property": "phh2o,clay", "depth": "0-5cm", "value": "mean"},
    timeout=30,
)

# ── 5. GBIF ────────────────────────────────────────────────────────────────────
call(
    "GBIF  (biodiversity occurrences)",
    "GET", "https://api.gbif.org/v1/species/match",
    params={"name": "Olea europaea", "kingdom": "Plantae"},
    ok_keys=["usageKey", "species"],
)

# ── 6. FAOSTAT ─────────────────────────────────────────────────────────────────
# FAOSTAT REST API was decommissioned in 2024. The app falls back to seeded
# default yield values. We verify the bulk CSV endpoint is reachable instead.
call(
    "FAOSTAT  (bulk CSV endpoint — REST API decommissioned 2024)",
    "GET", "https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_Africa.zip",
    timeout=15,
)

# ── 7. Wikimedia Commons ───────────────────────────────────────────────────────
section("Image APIs")

call(
    "Wikimedia Commons  (image pipeline)",
    "GET", "https://commons.wikimedia.org/w/api.php",
    params={
        "action": "query", "generator": "search",
        "gsrnamespace": "6", "gsrsearch": "File:Orange citrus fruit",
        "gsrlimit": "3", "prop": "imageinfo", "iiprop": "url", "format": "json",
    },
)

# ── 8. Pixabay ─────────────────────────────────────────────────────────────────
call(
    "Pixabay  (image pipeline)",
    "GET", "https://pixabay.com/api/",
    params={"key": PIXABAY_API_KEY, "q": "orange fruit", "per_page": 3, "image_type": "photo"},
    ok_keys=["totalHits", "hits"],
)

# ── 9. Unsplash ────────────────────────────────────────────────────────────────
call(
    "Unsplash  (image pipeline)",
    "GET", "https://api.unsplash.com/search/photos",
    headers={"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"},
    params={"query": "orange fruit", "per_page": 3},
    ok_keys=["total"],
)

# ── 10. Pexels ─────────────────────────────────────────────────────────────────
call(
    "Pexels  (image pipeline)",
    "GET", "https://api.pexels.com/v1/search",
    headers={"Authorization": PEXELS_API_KEY},
    params={"query": "orange fruit", "per_page": 3},
    ok_keys=["total_results"],
)

# ── 11. USDA FoodData Central ─────────────────────────────────────────────────
section("Nutritional APIs")

call(
    "USDA FoodData Central  (live nutrition per fruit)",
    "GET", "https://api.nal.usda.gov/fdc/v1/foods/search",
    params={"query": "orange", "api_key": USDA_API_KEY, "pageSize": 3},
    ok_keys=["totalHits"],
)

# ── 12. Anthropic ──────────────────────────────────────────────────────────────
section("AI APIs")

if ANTHROPIC_API_KEY == "CHANGE_ME":
    warn(
        "Anthropic Claude Haiku  (image scoring in seed pipeline)",
        "Key is still 'CHANGE_ME' — fill in ANTHROPIC_API_KEY in caviendoo-api/.env to enable AI image scoring",
    )
else:
    call(
        "Anthropic Claude Haiku  (image scoring in seed pipeline)",
        "POST", "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        body={
            "model": "claude-haiku-4-5-20251001",
            "max_tokens": 10,
            "messages": [{"role": "user", "content": "ping"}],
        },
        ok_keys=["id", "type"],
    )

# ── 13. Local services ─────────────────────────────────────────────────────────
section("Local Services")

call(
    "MinIO  (local S3 — image storage)",
    "GET", "http://localhost:9000/minio/health/live",
    timeout=5,
)

# Redis speaks its own binary protocol — test via TCP socket, not HTTP
import socket as _socket
def _check_redis():
    try:
        s = _socket.create_connection(("localhost", 6379), timeout=3)
        s.close()
        ok("Redis  (TCP socket on localhost:6379)", "port open")
    except ConnectionRefusedError:
        fail("Redis  (TCP socket on localhost:6379)", "Connection refused — Redis is not running")
    except OSError as e:
        fail("Redis  (TCP socket on localhost:6379)", str(e))
_check_redis()

call(
    "Caviendoo API  (localhost:4000/api/v1/metrics)",
    "GET", "http://localhost:4000/api/v1/metrics",
    timeout=5,
    ok_keys=["totalFruits", "totalGovernorates"],
)

# ── Summary ────────────────────────────────────────────────────────────────────
passed = sum(1 for _, s, _ in results if s)
failed = sum(1 for _, s, _ in results if not s)

print(f"\n{BOLD}{'═'*60}{RESET}")
print(f"{BOLD}  Result: {GREEN}{passed} passed{RESET}  |  {RED}{failed} failed{RESET}  |  {len(results)} total")
print(f"{BOLD}{'═'*60}{RESET}")

if failed:
    print(f"\n{RED}{BOLD}Failed:{RESET}")
    for name, status, detail in results:
        if not status:
            short_name = name.split("  ")[0]
            print(f"  {RED}•{RESET} {short_name}: {detail}")

print()
sys.exit(0 if failed == 0 else 1)
