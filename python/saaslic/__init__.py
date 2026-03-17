import hashlib
import hmac
import json
import os
import platform
import socket
import tempfile
import time
import requests

__version__ = "0.2.0"

CACHE_TTL = 86400  # 24 hours
CACHE_VERSION = "1"


def _get_device_id() -> str:
    raw = "|".join([
        platform.node(),
        platform.processor(),
        platform.machine(),
        socket.gethostname(),
    ])
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def _cache_path(project_code: str, license_key: str) -> str:
    key = hashlib.sha256((project_code + ":" + license_key).encode()).hexdigest()[:16]
    return os.path.join(tempfile.gettempdir(), ".lk_" + key)


def _cache_sign(data: str, device_id: str) -> str:
    return hmac.new(device_id.encode(), data.encode(), hashlib.sha256).hexdigest()[:16]


def _read_cache(project_code: str, license_key: str, device_id: str):
    path = _cache_path(project_code, license_key)
    try:
        with open(path, "r") as f:
            raw = f.read()
        parts = raw.split("|", 1)
        if len(parts) != 2:
            return None
        sig, payload = parts
        if sig != _cache_sign(payload, device_id):
            return None
        data = json.loads(payload)
        if data.get("v") != CACHE_VERSION:
            return None
        if time.time() - data.get("t", 0) > CACHE_TTL:
            return None
        return data.get("result")
    except Exception:
        return None


def _write_cache(project_code: str, license_key: str, device_id: str, result: dict):
    path = _cache_path(project_code, license_key)
    try:
        data = {"v": CACHE_VERSION, "t": int(time.time()), "result": result}
        payload = json.dumps(data, separators=(",", ":"))
        sig = _cache_sign(payload, device_id)
        with open(path, "w") as f:
            f.write(sig + "|" + payload)
    except Exception:
        pass


def _clear_cache(project_code: str, license_key: str):
    try:
        os.remove(_cache_path(project_code, license_key))
    except Exception:
        pass


class LicenseKit:
    def __init__(self, project_code: str, base_url: str = "https://api.saaslic.com"):
        self.project_code = project_code
        self.base_url = base_url.rstrip("/")

    def verify(self, license_key: str, device_name: str = None, timeout: int = 5) -> dict:
        device_id = _get_device_id()
        payload = {
            "license_key": license_key,
            "project_code": self.project_code,
            "device_id": device_id,
            "device_name": device_name or platform.node(),
            "platform": platform.system(),
        }

        try:
            resp = requests.post(
                f"{self.base_url}/api/license/verify",
                json=payload,
                timeout=timeout,
            )
            result = resp.json()

            if result.get("ok"):
                # Online + valid: refresh cache
                _write_cache(self.project_code, license_key, device_id, result)
            else:
                # Online + explicitly invalid: clear cache, reject
                _clear_cache(self.project_code, license_key)

            return result

        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError):
            # Offline: fall back to cache
            cached = _read_cache(self.project_code, license_key, device_id)
            if cached:
                cached["cached"] = True
                return cached
            return {"ok": False, "message": "Unable to reach verification server and no valid cache found."}

        except Exception as e:
            # Unknown error: try cache first
            cached = _read_cache(self.project_code, license_key, device_id)
            if cached:
                cached["cached"] = True
                return cached
            return {"ok": False, "message": str(e)}

    def check(self, license_key: str, device_name: str = None, timeout: int = 5) -> bool:
        return self.verify(license_key, device_name, timeout).get("ok", False)
