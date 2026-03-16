# saaslic — Node.js SDK

Official Node.js SDK for [LicenseKit](https://saaslic.com).

## Install

npm install saaslic

## Quick Start

const { LicenseKit } = require('saaslic');

const kit = new LicenseKit('MY_APP');

async function main() {
  const result = await kit.verify(licenseKey);
  if (!result.ok) {
    console.log('Invalid license:', result.message);
    process.exit(1);
  }
  console.log('License valid, launching...');
}

main();

## API

### new LicenseKit(projectCode, options)

| Parameter | Type | Description |
|-----------|------|-------------|
| projectCode | string | Your project code from Dashboard |
| options.baseUrl | string | Custom API URL (optional) |

### .verify(licenseKey, options)

Returns a Promise that resolves to:

| Field | Type | Description |
|-------|------|-------------|
| ok | boolean | True if license is valid |
| message | string | Error message if invalid |
| license | object | License details if valid |

### .check(licenseKey)

Returns Promise<boolean>. Simpler version of verify().

## Links

- Dashboard: https://panel.saaslic.com
- Docs: https://saaslic.com/docs
- Issues: https://github.com/你的GitHub用户名/saaslic-sdk/issues
