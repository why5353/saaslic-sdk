const https = require("https");
const http = require("http");
const os = require("os");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const CACHE_TTL = 86400; // 24 hours in seconds
const CACHE_VERSION = "1";

function getDeviceId() {
  const raw = [
    os.hostname(),
    os.platform(),
    os.arch(),
    os.cpus()[0]?.model || "",
  ].join("|");
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

function cachePath(projectCode, licenseKey) {
  const key = crypto
    .createHash("sha256")
    .update(projectCode + ":" + licenseKey)
    .digest("hex")
    .slice(0, 16);
  return path.join(os.tmpdir(), ".lk_" + key);
}

function cacheSign(payload, deviceId) {
  return crypto
    .createHmac("sha256", deviceId)
    .update(payload)
    .digest("hex")
    .slice(0, 16);
}

function readCache(projectCode, licenseKey, deviceId) {
  try {
    const raw = fs.readFileSync(cachePath(projectCode, licenseKey), "utf8");
    const sep = raw.indexOf("|");
    if (sep === -1) return null;
    const sig = raw.slice(0, sep);
    const payload = raw.slice(sep + 1);
    if (sig !== cacheSign(payload, deviceId)) return null;
    const data = JSON.parse(payload);
    if (data.v !== CACHE_VERSION) return null;
    if (Math.floor(Date.now() / 1000) - data.t > CACHE_TTL) return null;
    return data.result;
  } catch (e) {
    return null;
  }
}

function writeCache(projectCode, licenseKey, deviceId, result) {
  try {
    const data = {
      v: CACHE_VERSION,
      t: Math.floor(Date.now() / 1000),
      result,
    };
    const payload = JSON.stringify(data);
    const sig = cacheSign(payload, deviceId);
    fs.writeFileSync(cachePath(projectCode, licenseKey), sig + "|" + payload, "utf8");
  } catch (e) {}
}

function clearCache(projectCode, licenseKey) {
  try {
    fs.unlinkSync(cachePath(projectCode, licenseKey));
  } catch (e) {}
}

function httpPost(url, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const parsed = new URL(url);
    const mod = parsed.protocol === "https:" ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = mod.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error("Invalid JSON response"));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    req.write(body);
    req.end();
  });
}

class LicenseKit {
  constructor(projectCode, options = {}) {
    this.projectCode = projectCode;
    this.baseUrl = options.baseUrl || "https://api.saaslic.com";
  }

  async verify(licenseKey, options = {}) {
    const deviceId = getDeviceId();
    const payload = {
      license_key: licenseKey,
      project_code: this.projectCode,
      device_id: deviceId,
      device_name: options.deviceName || os.hostname(),
      platform: options.platform || os.platform(),
    };

    try {
      const result = await httpPost(
        `${this.baseUrl}/api/license/verify`,
        payload
      );

      if (result.ok) {
        // Online + valid: refresh cache
        writeCache(this.projectCode, licenseKey, deviceId, result);
      } else {
        // Online + explicitly invalid: clear cache, reject
        clearCache(this.projectCode, licenseKey);
      }

      return result;
    } catch (e) {
      // Offline or network error: fall back to cache
      const cached = readCache(this.projectCode, licenseKey, deviceId);
      if (cached) {
        return Object.assign({}, cached, { cached: true });
      }
      return {
        ok: false,
        message: "Unable to reach verification server and no valid cache found.",
      };
    }
  }

  async check(licenseKey, options = {}) {
    const result = await this.verify(licenseKey, options);
    return result.ok === true;
  }
}

module.exports = { LicenseKit };
