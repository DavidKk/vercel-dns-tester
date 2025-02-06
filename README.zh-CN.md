[![Build Status](https://github.com/DavidKk/vercel-dns-tester/actions/workflows/coverage.workflow.yml/badge.svg)](https://github.com/DavidKk/vercel-dns-tester/actions/workflows/coverage.workflow.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![中文](https://img.shields.io/badge/%E6%96%87%E6%A1%A3-%E4%B8%AD%E6%96%87-green?style=flat-square&logo=docs)](https://github.com/DavidKk/vercel-dns-tester/blob/main/README.zh-CN.md) [![English](https://img.shields.io/badge/docs-English-green?style=flat-square&logo=docs)](https://github.com/DavidKk/vercel-dns-tester/blob/main/README.md)

# DOH 服务测试工具

该项目旨在测试自托管的 DNS-over-HTTPS (DOH) 服务的功能。它有助于验证 DOH 设置（例如 Nginx 反向代理到 CoreDNS 之类的 DOH 服务器）是否配置正确并正常运行。它还检查 SSL 证书设置，并确保客户端与 DOH 服务器之间的通信正常。

## 功能

- **测试 DOH 服务**：验证自托管的 DOH 服务是否功能正常并符合规范。
- **SSL 验证**：确保 DOH 服务器的 SSL 证书配置正确。

### 示例用例

- 测试使用 **Nginx** 作为反向代理部署的 DOH 服务。
- 验证使用自定义域名和 SSL 证书的 CoreDNS DOH 服务器。

### 演示

您可以在以下 URL 试用该工具的在线演示：

[在 Vercel 上的在线演示](https://vercel-dns-tester.vercel.app/)
