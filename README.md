# DOH Service Testing Tool

[![Build Status](https://github.com/DavidKk/vercel-dns-tester/actions/workflows/coverage.workflow.yml/badge.svg)](https://github.com/DavidKk/vercel-dns-tester/actions/workflows/coverage.workflow.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![中文](https://img.shields.io/badge/%E6%96%87%E6%A1%A3-%E4%B8%AD%E6%96%87-green?style=flat-square&logo=docs)](https://github.com/DavidKk/vercel-dns-tester/blob/main/README.zh-CN.md) [![English](https://img.shields.io/badge/docs-English-green?style=flat-square&logo=docs)](https://github.com/DavidKk/vercel-dns-tester/blob/main/README.md)

This project is designed to test the functionality of self-hosted DNS-over-HTTPS (DOH) services, verifying their configuration and operational status. Additionally, it provides a ready-to-use DOH service API that supports custom domains and HOSTS configuration.

## Features Overview

### Testing Tool Features

- **DOH Service Testing**: Verify that your self-hosted DOH service is functional and compliant.
- **SSL Validation**: Ensure that SSL certificates for the DOH server are correctly configured.

This functionality is particularly suitable for:

- DNS resolution for internal services.
- Domain configuration in test environments.
- Custom DNS resolution rules.

### DOH Service API

- **Standard DOH Query**: Provides standard-compliant DNS-over-HTTPS query service.
- **Custom HOSTS Configuration**: Supports configuring and managing custom DNS records through GitHub Gist.

## Usage Guide

### Testing Tool Usage

#### Example Use Cases

- Testing a DOH service deployed with **Nginx** as a reverse proxy.
- Validating a CoreDNS DOH server with a custom domain and SSL certificate.

#### Online Demo

You can try out the tool live at the following URL:  
[Live Demo on Vercel](https://vercel-dns-tester.vercel.app/)

### DOH Service Usage

#### Service Endpoints

1. **Default Domain**  
   Use `https://vercel-dns-tester.vercel.app/dns-query` as the DOH service endpoint, supporting standard DOH query format.

2. **Custom Domain**  
   You can point your own domain to this service, and after configuration, use `https://your-domain/dns-query` as the DOH service endpoint.

#### DoH Endpoint Security

To protect your custom HOSTS configuration from unauthorized access, you can enable API key authentication:

1. Set the `DOH_API_KEY` environment variable in Vercel
2. The DoH endpoint will require either:
   - **Header**: `X-DOH-API-KEY: your-api-key`
   - **URL Parameter**: `?token=your-api-key` (for clients that don't support custom headers)

**Note:** If `DOH_API_KEY` is not set, the endpoint will be publicly accessible (no authentication required).

#### Custom HOSTS Configuration

This service supports custom HOSTS records configuration through GitHub Gist:

1. Create a configuration file in GitHub Gist using standard HOSTS file format:

   ```
   192.168.1.1 example.com
   192.168.1.2 test.example.com
   ```

2. Set the Gist ID in the tool's custom DNS interface at `/custom-dns`.
3. After saving, your custom HOSTS records will be served through the DOH service.
4. You can manage your HOSTS configurations through:
   - Web Interface: Access `/custom-dns` to manage configurations visually
   - API Interface: Use REST APIs with the following endpoints:
     - `PUT /api/hosts`: Add or update HOSTS records
     - `DELETE /api/hosts`: Remove HOSTS records
     - Include `X-API-TOKEN` header for authentication

```bash
# PUT /api/hosts
curl -X PUT \
  -H "X-API-TOKEN: your-api-token" \
  -H "Content-Type: application/json" \
  -d '{"example.com":"1.2.3.4","test.com":"5.6.7.8"}' \
  https://vercel-dns-tester.vercel.app/api/hosts
```

```bash
# DELETE /api/hosts
curl -X DELETE \
  -H "X-API-TOKEN: your-api-token" \
  -H "Content-Type: application/json" \
  -d '["example.com","test.com"]' \
  https://vercel-dns-tester.vercel.app/api/hosts
```

## Deploy to Vercel

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDavidKk%2Fvercel-proxy-rule)

### Environment Variables Configuration

Refer to the [`.env.example`](./.env.example) file to set up the necessary environment variables:

- `GIST_ID`: GitHub Gist ID
- `GIST_TOKEN`: GitHub Gist Token
- `ACCESS_USERNAME`: Administrator username
- `ACCESS_PASSWORD`: Administrator password
- `ACCESS_2FA_SECRET`: 2FA secret key, you can generate a TOKEN using [https://vercel-2fa.vercel.app](https://vercel-2fa.vercel.app)
- `JWT_SECRET`: JWT secret key
- `JWT_EXPIRES_IN`: JWT expiration time
- `API_SECRET`: API secret key
- `DOH_API_KEY`: (Optional) API key for protecting DoH endpoint. If set, clients must provide this key via `X-DOH-API-KEY` header or `?token=` URL parameter

## Quick Start

1. Create a **GitHub Gist** and generate a **GitHub Access Token**.
2. Set up the corresponding environment variables in Vercel.
3. After deployment, you can manage proxies through the generated rules.

### Important Notes

- Ensure the GitHub Gist configuration file format is correct, otherwise parsing may fail.
- Custom domains need proper DNS resolution and SSL certificate configuration.
- If using 2FA, keep the generated TOKEN secure.
