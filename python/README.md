# saaslic — Python SDK

Official Python SDK for [LicenseKit](https://saaslic.com).

## Install

pip install saaslic

## Quick Start

from saaslic import LicenseKit

kit = LicenseKit("MY_APP")
result = kit.verify(license_key)

if result["ok"]:
    print("License valid, launching...")
else:
    print("Invalid license:", result["message"])
    exit()

## API

### LicenseKit(project_code, base_url=None)

| Parameter | Type | Description |
|-----------|------|-------------|
| project_code | str | Your project code from Dashboard |
| base_url | str | Custom API URL (optional) |

### .verify(license_key, device_name=None, timeout=5)

Returns a dict:

| Field | Type | Description |
|-------|------|-------------|
| ok | bool | True if license is valid |
| message | str | Error message if invalid |
| license | dict | License details if valid |

### .check(license_key)

Returns True/False directly. Simpler version of verify().

## Links

- Dashboard: https://panel.saaslic.com
- Docs: https://saaslic.com/docs
- Issues: https://github.com/你的GitHub用户名/saaslic-sdk/issues
