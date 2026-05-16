---
name: dns-tester-mcp
description: >-
  DNS Tester HTTP MCP — authenticated Gist HOSTS tools at /api/mcp (dns_hosts_*)
  and public DoH probe tools at /api/mcp-dns (dns_probe_*). Use when installing
  Cursor/VS Code MCP, configuring DNS_MCP_HEADERS or x-api-key, calling MCP
  JSON-RPC (initialize, tools/list, tools/call, resources/list, resources/read),
  debugging HOSTS gist edits, or running resolve/dns-query checks without the web UI.
---

# DNS Tester — MCP 使用说明

## 一、拥有什么内容

本项目暴露 **两个** 独立的 HTTP MCP 端点，协议相同（支持 **JSON-RPC 2.0** 的 `initialize`、`tools/list`、`tools/call`、`resources/list`、`resources/read`，以及旧版 POST body：`{ "tool": "<name>", "params": { ... } }`）。

### 1. HOSTS / Gist（需鉴权）— `GET` / `POST` **`/api/mcp`**

- **编辑器里的 server key（name）**：`dns-tester-hosts`（与安装页生成的一致）。
- **作用**：读写 **GitHub Gist** 里用于自定义解析的 HOSTS 文本（默认文件名见常量 `GIST_HOSTS_FILE`，一般为 `hosts.my-doh-service`）。
- **工具前缀**：`dns_hosts_*`

| 工具                        | 用途摘要                                                            |
| --------------------------- | ------------------------------------------------------------------- |
| `dns_hosts_read`            | 读全文 + 解析后的 `pairs`                                           |
| `dns_hosts_write`           | 整文件覆盖写入                                                      |
| `dns_hosts_add`             | 单条增改：`position`=`start`\|`end`，`ifExists`=`skip`\|`overwrite` |
| `dns_hosts_remove`          | 按域名 / 按 IP / 按「域名+IP」精确删除                              |
| `dns_hosts_exists`          | 判断是否存在（可只 hostname、只 IP、或两者同时精确匹配）            |
| `dns_hosts_lookup`          | **二选一**：只给 `hostname` 查 IP 列表，或只给 `ip` 查域名列表      |
| `dns_hosts_list`            | 仅返回解析后的 `pairs`（省流量）                                    |
| `dns_hosts_tooling_summary` | 静态列出工具名与默认文件名                                          |

可选参数 **`filename`**：不传则用默认 HOSTS 文件名；传入时必须符合服务端白名单（仅字母、数字、`.`、`_`、`-`，长度上限等），禁止路径穿越。

### 2. DNS 探测（公开、无鉴权）— `GET` / `POST` **`/api/mcp-dns`**

- **编辑器里的 server key（name）**：`dns-tester`（安装页默认；旧名 `dns-tester-probe` 仍可用作兼容别名理解）。
- **作用**：与首页 DoH 测试相同逻辑的 **上游 DoH 查询**（不向本应用 Gist 写入）。
- **工具前缀**：`dns_probe_*`

| 工具                        | 用途摘要                                                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `dns_probe_query`           | `mode`: `resolve`（JSON `/resolve`）或 `dns-query`（RFC 8484 `/dns-query`）；`queryType`: `A` \| `AAAA`；可选 `headers` |
| `dns_probe_options_support` | 对 DoH 源站做 OPTIONS 预检（与前端 client 模式发 `dns-query` 前一致）                                                   |
| `dns_probe_tooling_summary` | 列出工具与模式说明                                                                                                      |

`dnsService` 支持完整 `https://` URL、裸域名或 IP；服务端用 **`extractDNSDomain`** 抽 host，与网页 playground 一致。公网探测会拒绝 loopback / 私网地址。

### 3. MCP Resources（SKILL 文档）

两个端点的 manifest 均包含 **`resources`**。通过 JSON-RPC：

- `resources/list` — 列出 SKILL 资源（`uri`、`name`、`mimeType`）
- `resources/read`，`params.uri` — 读取完整 Markdown（与 `skills/dns-tester-mcp/SKILL.md` 同源）

典型 URI：`skill://vercel-dns-tester-mcp/vercel-dns-tester-mcp-skill.md`

---

## 二、使用方法

### 安装（Cursor / VS Code）

1. 打开站内 **`/mcp`** 安装页（公开 DNS 探测无需登录；HOSTS MCP 在登录后展示安装区块；**`x-api-key` 不会通过 `/api/mcp/headers` 下发到浏览器**）。
2. **HOSTS MCP**：复制 JSON 或点「Cursor / VS Code」深链；在编辑器中自行配置 **`x-api-key`**（与运维提供的 `DNS_MCP_HEADERS` 一致）。
3. **公开 DNS MCP**：安装页第一块为 **`/api/mcp-dns`**，**无需** headers。

### JSON-RPC 调用流程（典型）

1. `initialize`（可带 `protocolVersion`）
2. `tools/list` 查看 `inputSchema`
3. `resources/list` → `resources/read` 加载 SKILL（推荐在首次连接时读取）
4. `tools/call`，`params`: `{ "name": "<tool>", "arguments": { ... } }`

### 响应结构（与 unbnd / vercel-openapi MCP 对齐）

- **GET manifest**：`{ "type": "result", "result": { "name", "version", "description", "tools": { ... }, "resources": [ ... ] } }`
- **POST JSON-RPC**：成功 `{ "jsonrpc": "2.0", "id", "result": ... }`；失败 `{ "jsonrpc": "2.0", "id", "error": { "code", "message" } }`
- **`tools/call` 成功**：`result` 为 `{ "content": [ { "type": "text", "text": "<JSON 字符串>" } ], "isError": false }`
- **旧版 POST**：`{ "tool": "<name>", "params": { ... } }` → `{ "type": "result", "result": ... }`
- **`ping`** / **`notifications/...`**：同 vercel-openapi HTTP MCP

### 推荐调用顺序（HOSTS）

1. `resources/read` 加载本 SKILL（可选）
2. `dns_hosts_read` 或 `dns_hosts_list`
3. 小改 `dns_hosts_add` / `dns_hosts_remove`；大改 `dns_hosts_write`

### 推荐调用顺序（DNS 探测）

1. `dns_probe_query`；需要解释 CORS 时用 `dns_probe_options_support`

---

## 三、什么时候适合用

| 场景                                                              | 建议端点                       |
| ----------------------------------------------------------------- | ------------------------------ |
| Agent 要改 Gist HOSTS、查某域名是否已指向某 IP、批量整理 hosts 行 | `/api/mcp` + `dns_hosts_*`     |
| Agent 只查公网/指定 DoH 的解析结果，不需要动 Gist                 | `/api/mcp-dns` + `dns_probe_*` |
| CI / 无登录环境只做 DNS 检查                                      | `/api/mcp-dns`（无鉴权）       |
| 人类在编辑器里一键安装两个 MCP                                    | 使用 `/mcp` 页                 |

---

## 四、什么时候不要用 / 不适合

| 场景                                                                     | 原因                                                       |
| ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| 不应把 **GIST_TOKEN**、**x-api-key**、cookie 写进仓库、issue、聊天公开贴 | 凭据泄露会直接危及 Gist 与 MCP 写权限                      |
| 把 **`/api/mcp-dns`** 暴露在完全不可信的公网且无任何限流/WAF             | 易被用作对外 `fetch` 的滥用面                              |
| 指望 MCP 替代 **本应用 `POST /dns-query`** 的二进制 DNS 消息协议         | MCP 探测封装的是对 **外部** DoH 的 `resolve` / `dns-query` |

---

## 五、使用要注意什么

1. **鉴权**：`/api/mcp` 需要 **会话 cookie** 或 **`DNS_MCP_HEADERS` 中的全部请求头**（含 `x-api-key`）。`/api/mcp-dns` **不鉴权**。
2. **写操作幂等**：无变更的写操作返回 `changed: false` 且跳过 Gist 写入。
3. **环境变量**：HOSTS 工具依赖 **`GIST_ID`**、**`GIST_TOKEN`**。
4. **超时**：可选 **`MCP_TOOL_CALL_TIMEOUT_MS`**（3000–24000 ms，默认 20000）。

---

## 六、相关代码位置（排障）

| 区域             | 路径                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| HOSTS MCP 工具   | `services/hosts/dnsHostsMcpTools.ts`                                 |
| DNS 探测 MCP     | `services/dns/dnsProbeMcpTools.ts`                                   |
| MCP SKILL 资源   | `app/api/mcp/mcpSkillResources.ts`、`skills/dns-tester-mcp/SKILL.md` |
| MCP 协议内核     | `initializer/mcp/`                                                   |
| 安装 JSON / 常量 | `app/api/mcp/installSnippets.ts`                                     |
| UI 安装页        | `app/mcp/page.tsx`、`components/mcp/McpInstallPanel.tsx`             |
