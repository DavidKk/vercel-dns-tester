# DOH 服务测试工具

[![Build Status](https://github.com/DavidKk/vercel-dns-tester/actions/workflows/coverage.workflow.yml/badge.svg)](https://github.com/DavidKk/vercel-dns-tester/actions/workflows/coverage.workflow.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![中文](https://img.shields.io/badge/%E6%96%87%E6%A1%A3-%E4%B8%AD%E6%96%87-green?style=flat-square&logo=docs)](https://github.com/DavidKk/vercel-dns-tester/blob/main/README.zh-CN.md) [![English](https://img.shields.io/badge/docs-English-green?style=flat-square&logo=docs)](https://github.com/DavidKk/vercel-dns-tester/blob/main/README.md)

该项目旨在测试自托管的 DNS-over-HTTPS (DOH) 服务的功能，验证其配置是否正确并正常运行。同时，它还提供可直接使用的 DOH 服务 API，支持自定义域名和 HOSTS 配置。

## 功能概述

### 测试工具功能

- **DOH 服务测试**：验证自托管的 DOH 服务是否功能正常并符合规范。
- **SSL 验证**：确保 DOH 服务器的 SSL 证书配置正确。

此功能特别适合以下场景：

- 内部服务的 DNS 解析。
- 测试环境的域名配置。
- 自定义的 DNS 解析规则。

### DOH 服务 API

- **标准 DOH 查询**：提供符合规范的 DNS-over-HTTPS 查询服务。
- **自定义 HOSTS 配置**：支持通过 GitHub Gist 配置和管理自定义 DNS 记录。

## 使用指南

### 测试工具使用

#### 示例用例

- 测试使用 **Nginx** 作为反向代理部署的 DOH 服务。
- 验证使用自定义域名和 SSL 证书的 CoreDNS DOH 服务器。

#### 在线演示

您可以在以下 URL 试用该工具的在线演示：  
[在 Vercel 上的在线演示](https://vercel-dns-tester.vercel.app/)

### DOH 服务使用

#### 服务端点

1. **默认域名**  
   直接使用 `https://vercel-dns-tester.vercel.app/dns-query` 作为 DOH 服务端点，支持标准的 DOH 查询格式。

2. **自定义域名**  
   您可以将自己的域名指向该服务，配置完成后，使用 `https://您的域名/dns-query` 作为 DOH 服务端点。

#### DoH 端点安全配置

为了保护您的自定义 HOSTS 配置不被未授权访问，您可以启用 API 密钥认证：

1. 在 Vercel 中设置 `DOH_API_KEY` 环境变量
2. DoH 端点将要求以下任一认证方式：
   - **请求头**：`X-DOH-API-KEY: your-api-key`
   - **URL 参数**：`?token=your-api-key`（适用于不支持自定义请求头的客户端）

**注意：** 如果未设置 `DOH_API_KEY`，端点将公开访问（无需认证）。

#### 自定义 HOSTS 配置

本服务支持通过 GitHub Gist 配置自定义的 HOSTS 记录：

1. 在 GitHub Gist 中创建配置文件，使用标准 HOSTS 文件格式：

   ```
   192.168.1.1 example.com
   192.168.1.2 test.example.com
   ```

2. 在工具的自定义 DNS 界面（`/custom-dns`）中设置 Gist ID。
3. 保存后，您的自定义 HOSTS 记录将通过 DOH 服务下发。
4. 您可以通过以下方式管理 HOSTS 配置：
   - Web 界面：访问 `/custom-dns` 可视化管理配置
   - API 接口：使用 REST APIs，包含以下端点：
     - `PUT /api/hosts`：添加或更新 HOSTS 记录
     - `DELETE /api/hosts`：删除 HOSTS 记录
     - 需要在请求头中包含 `X-API-TOKEN` 进行身份验证

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

## 部署到 Vercel

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDavidKk%2Fvercel-proxy-rule)

### 环境变量配置

参考 [`.env.example`](./.env.example) 文件，设置必要的环境变量：

- `GIST_ID`: GitHub Gist ID。
- `GIST_TOKEN`: GitHub Gist Token。
- `ACCESS_USERNAME`: 管理员用户名。
- `ACCESS_PASSWORD`: 管理员密码。
- `ACCESS_2FA_SECRET`: 2FA 密钥，可以使用 [https://vercel-2fa.vercel.app](https://vercel-2fa.vercel.app) 生成 TOKEN。
- `JWT_SECRET`: JWT 密钥。
- `JWT_EXPIRES_IN`: JWT 过期时间。
- `API_SECRET`: API 密钥。
- `DOH_API_KEY`: （可选）用于保护 DoH 端点的 API 密钥。如果设置，客户端必须通过 `X-DOH-API-KEY` 请求头或 `?token=` URL 参数提供此密钥。

## 快速开始

1. 创建一个 **GitHub Gist** 并生成一个 **GitHub Access Token**。
2. 在 Vercel 中设置相应的环境变量。
3. 部署完成后，您可以通过生成的规则管理代理。

### 注意事项

- 确保 GitHub Gist 配置文件格式正确，否则可能导致解析失败。
- 自定义域名需要正确配置 DNS 解析和 SSL 证书。
- 如果使用 2FA，请妥善保管生成的 TOKEN。
