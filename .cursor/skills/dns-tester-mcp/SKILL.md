---
name: dns-tester-mcp
description: >-
  DNS Tester HTTP MCP — authenticated Gist HOSTS tools at /api/mcp (dns_hosts_*)
  and public DoH probe tools at /api/mcp-dns (dns_probe_*). Use when installing
  Cursor/VS Code MCP, configuring DNS_MCP_HEADERS or x-api-key, calling MCP
  JSON-RPC (initialize, tools/list, tools/call), debugging HOSTS gist edits, or
  running resolve/dns-query checks without the web UI.
---

# DNS Tester — MCP 使用说明

## 一、拥有什么内容

本项目暴露 **两个** 独立的 HTTP MCP 端点，协议相同（支持 **JSON-RPC 2.0** 的 `initialize`、`tools/list`、`tools/call`，以及旧版 POST body：`{ "tool": "<name>", "params": { ... } }`）。

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
| `dns_hosts_tooling_summary` | 静态列出工具名、默认文件名、依赖的 `gistEnv`                        |

可选参数 **`filename`**：不传则用默认 HOSTS 文件名；传入时必须符合服务端白名单（仅字母、数字、`.`、`_`、`-`，长度上限等），禁止路径穿越。

### 2. DNS 探测（公开、无鉴权）— `GET` / `POST` **`/api/mcp-dns`**

- **编辑器里的 server key（name）**：`dns-tester-probe`。
- **作用**：与首页 DoH 测试相同逻辑的 **上游 DoH 查询**（不向本应用 Gist 写入）。
- **工具前缀**：`dns_probe_*`

| 工具                        | 用途摘要                                                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `dns_probe_query`           | `mode`: `resolve`（JSON `/resolve`）或 `dns-query`（RFC 8484 `/dns-query`）；`queryType`: `A` \| `AAAA`；可选 `headers` |
| `dns_probe_options_support` | 对 DoH 源站做 OPTIONS 预检（与前端 client 模式发 `dns-query` 前一致）                                                   |
| `dns_probe_tooling_summary` | 列出工具与模式说明                                                                                                      |

`dnsService` 支持完整 `https://` URL、裸域名或 IP；服务端用 **`extractDNSDomain`** 抽 host，与网页 playground 一致。

---

## 二、使用方法

### 安装（Cursor / VS Code）

1. 登录后打开站内 **`/mcp`** 安装页（HOSTS MCP 的 headers 从 **`/api/mcp/headers`** 拉取，不落进公开 HTML）。
2. **HOSTS MCP**：复制生成的 JSON 或点「Cursor / VS Code」深链；若未配置 `DNS_MCP_HEADERS`，需在编辑器里自行补 **`x-api-key`**（与 `DNS_MCP_HEADERS` 中配置一致）。
3. **公开 DNS MCP**：安装页第二块为 **`/api/mcp-dns`**，**无需** headers。

### JSON-RPC 调用流程（典型）

1. `initialize`（可带 `protocolVersion`）
2. `tools/list` 查看 `inputSchema`
3. `tools/call`，`params`: `{ "name": "<tool>", "arguments": { ... } }`（与 **unbnd（vercel-openapi）** HTTP MCP 相同字段名）

### 响应结构（与 unbnd / vercel-openapi MCP 对齐）

- **GET manifest**：`{ "type": "result", "result": { "name", "version", "description", "tools": { "<toolName>": { "description", "inputSchema" } }, "resources"? } }`
- **POST JSON-RPC**：成功 `{ "jsonrpc": "2.0", "id", "result": ... }`；失败 `{ "jsonrpc": "2.0", "id", "error": { "code", "message" } }`（`code` 为数字，如 `-32601`）
- **`tools/call` 成功**：`result` 为 `{ "content": [ { "type": "text", "text": "<JSON 字符串，内含工具返回值>" } ], "isError": false }`；工具执行失败时为 `isError: true`，`text` 为错误信息
- **旧版 POST**：`{ "tool": "<name>", "params": { ... } }` → 成功 `{ "type": "result", "result": <工具返回值> }`；失败 `{ "type": "error", "error": { "code", "message" } }`（`code` 为字符串，如 `INVALID_ARGUMENT`）
- **`ping`**：`{ "jsonrpc": "2.0", "id", "method": "ping" }` → `result` 为 `{}`
- **`notifications/...`**：客户端生命周期通知；服务端返回 **HTTP 200**、**空 body**（无 JSON-RPC 包）
- **超时**：可选环境变量 **`MCP_TOOL_CALL_TIMEOUT_MS`**（毫秒，夹在 3000–24000，默认 20000）；超时后 JSON-RPC 的 `tools/call` 返回 `isError: true` 的 `content` 文本；旧版 POST 则落入外层错误处理

### 推荐调用顺序（HOSTS）

1. `dns_hosts_read` 或 `dns_hosts_list` 了解当前内容
2. 小改优先 `dns_hosts_add` / `dns_hosts_remove`；大改再用 `dns_hosts_write`
3. 改前可用 `dns_hosts_exists` / `dns_hosts_lookup` 做判断

### 推荐调用顺序（DNS 探测）

1. 一般直接 `dns_probe_query`
2. 仅当需要解释「浏览器 client 模式为何 CORS 失败」时用 `dns_probe_options_support`

### REST 测试（非 MCP 客户端）

- **`POST /api/test`**：JSON 体需 **`dnsType` 或 `type`**（`resolve` \| `dns-query`）、`dnsService`、`domain`、`queryType`（`A` \| `AAAA`），可选 `headers`。服务端会对 `dnsService` 做与 MCP 相同的 host 提取。

---

## 三、什么时候适合用

| 场景                                                              | 建议端点                       |
| ----------------------------------------------------------------- | ------------------------------ |
| Agent 要改 Gist HOSTS、查某域名是否已指向某 IP、批量整理 hosts 行 | `/api/mcp` + `dns_hosts_*`     |
| Agent 只查公网/指定 DoH 的解析结果，不需要动 Gist                 | `/api/mcp-dns` + `dns_probe_*` |
| CI / 无登录环境只做 DNS 检查                                      | `/api/mcp-dns`（无鉴权）       |
| 人类在编辑器里一键安装两个 MCP                                    | 使用 `/mcp` 页两段 JSON        |

---

## 四、什么时候不要用 / 不适合

| 场景                                                                     | 原因                                                                             |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| 不应把 **GIST_TOKEN**、**x-api-key**、cookie 写进仓库、issue、聊天公开贴 | 凭据泄露会直接危及 Gist 与 MCP 写权限                                            |
| 把 **`/api/mcp-dns`** 暴露在完全不可信的公网且无任何限流/WAF             | 易被用作 **开放 HTTP 代理式** 的对外 `fetch`，存在滥用与合规风险                 |
| 指望 MCP 替代 **本应用 `POST /dns-query`** 的二进制 DNS 消息协议         | 那是另一条路由；MCP 的探测工具封装的是对 **外部** DoH 的 `resolve` / `dns-query` |
| 需要改 **非 HOSTS 的 Gist 文件**                                         | `dns_hosts_*` 仅服务 HOSTS 场景；`filename` 也受白名单约束                       |

---

## 五、使用要注意什么

1. **鉴权**：`/api/mcp` 需要 **有效会话 cookie** 或请求头 **`x-api-key`**（与 `DNS_MCP_HEADERS` JSON 里配置的 key 一致）。`/api/mcp-dns` **不鉴权**，部署到公网前请自行评估风险。
2. **写操作幂等**：`dns_hosts_add` 的 `ifExists: skip` 在「该 hostname 已存在（任意 IP）」时会跳过写入；需要覆盖时用 `overwrite`。
3. **规范化**：HOSTS 写回时会 **按 IP 聚合、排序**，与网页侧「逻辑上 hostname → 唯一 IP」一致；不要假设原始行的字节级顺序完全保留。
4. **`dns_hosts_write`**：会整文件替换，错误内容可能导致解析异常；优先增量工具。
5. **环境变量**：HOSTS 工具依赖服务端 **`GIST_ID`**、**`GIST_TOKEN`**；缺失会在调用时抛错。
6. **GET manifest**：两个端点的 `GET` 均返回上述 **`{ type, result }`** 包装（与 OpenAPI 项目一致），不是裸 manifest 根对象。
7. **超时**：见上文 **`MCP_TOOL_CALL_TIMEOUT_MS`**。

---

## 六、相关代码位置（排障）

| 区域             | 路径                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------- |
| HOSTS MCP 工具   | `services/hosts/dnsHostsMcpTools.ts`、`services/hosts/hostsFileOps.ts`                       |
| HOSTS MCP 装配   | `app/api/mcp/dnsHostsMcpServer.ts`、`app/api/mcp/route.ts`                                   |
| DNS 探测 MCP     | `services/dns/dnsProbeMcpTools.ts`、`app/api/mcp-dns/`                                       |
| MCP 协议内核     | `initializer/mcp/`（`createMCPHttpServer`、`tool()` 等）                                     |
| 安装 JSON / 常量 | `app/api/mcp/installSnippets.ts`（`MCP_INSTALL_SERVER_KEY`、`MCP_PROBE_INSTALL_SERVER_KEY`） |
| UI 安装页        | `app/mcp/page.tsx`、`components/mcp/McpInstallPanel.tsx`                                     |

更多 Signet 登录与 MCP 并存时的说明，见同目录技能 **`dns-signet-login`**（若已安装）。
