const https = require("https");
const http = require("http");
const os = require("os");
const crypto = require("crypto");

function getDeviceId() {
  const raw = [
    os.hostname(),
    os.platform(),
    os.arch(),
    os.cpus()[0]?.model || "",
  ].join("|");
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
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
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error("Invalid JSON response")); }
      });
    });
    req.on("error", reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error("请求超时")); });
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
    const payload = {
      license_key: licenseKey,
      project_code: this.projectCode,
      device_id: getDeviceId(),
      device_name: options.deviceName || os.hostname(),
      platform: options.platform || os.platform(),
    };
    try {
      return await httpPost(`${this.baseUrl}/api/license/verify`, payload);
    } catch (e) {
      return { ok: false, message: e.message };
    }
  }

  async check(licenseKey, options = {}) {
    const result = await this.verify(licenseKey, options);
    return result.ok === true;
  }
}

module.exports = { LicenseKit };
