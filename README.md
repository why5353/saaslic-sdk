![API Status](https://img.shields.io/uptimerobot/status/monitor/m802561745-467f1859cf0b7137e9fff9db?label=API%20Status&style=flat-square)

# LicenseKit SDK

Official SDK for [LicenseKit](https://saaslic.com) — License management for indie developers.

## Python

### Install
pip install saaslic

### Usage
from saaslic import LicenseKit

kit = LicenseKit("MY_APP")
result = kit.verify(license_key)
if not result["ok"]:
    print("Invalid license")
    exit()

## Node.js

### Install
npm install saaslic

### Usage
const { LicenseKit } = require('saaslic');

const kit = new LicenseKit('MY_APP');
const result = await kit.verify(licenseKey);
if (!result.ok) process.exit(1);

## Links

- Website: https://saaslic.com
- Docs: https://saaslic.com/docs
- Issues: GitHub Issues
