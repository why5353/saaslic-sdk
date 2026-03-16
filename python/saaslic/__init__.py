import hashlib
import platform
import socket
import requests

__version__ = "0.1.0"

def _get_device_id() -> str:
    raw = "|".join([
        platform.node(),
        platform.processor(),
        platform.machine(),
        socket.gethostname(),
    ])
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


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
            return resp.json()
        except requests.exceptions.Timeout:
            return {"ok": False, "message": "验证超时，请检查网络连接"}
        except requests.exceptions.ConnectionError:
            return {"ok": False, "message": "无法连接到验证服务器"}
        except Exception as e:
            return {"ok": False, "message": str(e)}

    def check(self, license_key: str, device_name: str = None, timeout: int = 5) -> bool:
        result = self.verify(license_key, device_name, timeout)
        return result.get("ok", False)
