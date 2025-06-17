# 域名验证实现对比：Esdeath vs Surge

## 概述

本文档详细对比了 Esdeath 项目和 Surge 项目在域名活性检测方面的实现差异。经过重构升级后，Esdeath 已经完全对齐 Surge 的高级实现。

## 实现对比表

| 特性 | Esdeath (原始) | Esdeath (升级后) | Surge |
|------|---------------|-----------------|-------|
| **DNS 查询方式** | 系统 DNS (dns.resolve) | DoH (DNS-over-HTTPS) | DoH (DNS-over-HTTPS) |
| **DNS 服务器** | 单一系统 DNS | 多个 DoH 服务器池 | 多个 DoH 服务器池 |
| **服务器选择** | 无 | 随机选择 (pickRandom) | 随机选择 (pickRandom) |
| **重试机制** | 自定义简单重试 | async-retry (5次) | async-retry (5次) |
| **域名解析库** | 简单字符串处理 | tldts-experimental | tldts-experimental |
| **WHOIS 查询** | ❌ 不支持 | ✅ whoiser 库 | ✅ whoiser 库 |
| **缓存机制** | 内存 Map + JSON 文件 | 内存 Map + SQLite | 内存 Map + SQLite |
| **HTTP 缓存** | ❌ 不支持 | ✅ SQLite DoH 缓存 | ✅ undici 缓存 |
| **并发控制** | 自定义队列 (30) | @henrygd/queue (32) | @henrygd/queue (32) |
| **互斥锁** | 简单锁机制 | KeyedAsyncMutex | KeyedAsyncMutex |
| **进度显示** | 无 | cli-progress | cli-progress |

## 主要改进详情

### 1. DNS-over-HTTPS (DoH) 实现

升级后使用 `dns2` 库实现 DoH 查询，支持的服务器包括：

**国际 DoH 服务器：**
- Google: 8.8.8.8, 8.8.4.4
- Cloudflare: 1.1.1.1, 1.0.0.1, dns.cloudflare.com
- Quad9: dns10.quad9.net
- AdGuard: unfiltered.adguard-dns.com
- NextDNS: dns.nextdns.io
- 更多...

**国内 DoH 服务器：**
- 阿里 DNS: 223.5.5.5, 223.6.6.6
- DNSPod: 120.53.53.53, 1.12.12.12

### 2. WHOIS 集成

- 使用 `whoiser` 库查询域名 WHOIS 信息
- 智能检测未注册域名的关键词（如 "not found", "available" 等）
- 支持多 WHOIS 服务器响应的递归检查

### 3. 高级缓存策略

#### DoH 缓存 (doh-cache.ts)
- 使用 SQLite 持久化 DNS 查询结果
- 智能 TTL：有记录 1 小时，无记录 5 分钟
- 自动清理过期缓存
- 缓存命中率统计

#### DNS 缓存 (dns-cache.ts)
- SQLite 持久化存储
- HTTP fetch 缓存集成
- 定期清理机制

### 4. 域名检测逻辑

```typescript
// 检测流程：
1. 检查内存缓存
2. 使用 tldts 提取 apex domain
3. 检查 apex domain 是否存活（NS 记录 + WHOIS）
4. 如果是子域名，检查 A/AAAA 记录
5. 使用随机 DoH 服务器查询（国际 + 国内）
6. 缓存结果
```

### 5. 错误处理与重试

- 每个 DNS 查询自动重试 5 次
- WHOIS 查询自动重试 5 次
- 详细的错误日志记录
- 优雅的降级策略

## 性能优化

1. **并发控制**：使用 `@henrygd/queue` 限制并发数为 32
2. **互斥锁**：防止同一域名重复查询
3. **多级缓存**：内存 + SQLite 双层缓存
4. **智能 TTL**：根据查询结果动态设置缓存时间

## 使用示例

```bash
# 检测失效域名（预览模式）
npm run clean:dead-domains

# 检测并自动删除失效域名
npm run clean:dead-domains:apply

# 验证非法 TLD
npm run validate:tld

# 检测规则哈希碰撞
npm run validate:hash

# 验证规则语法
npm run validate:rulesyntax
```

## GitHub Actions 集成

相关工作流已更新以支持新的验证脚本：
- `check-domain.yml`: 域名活性检测 + TLD/哈希/语法验证
- `check-rules.yml`: 规则格式验证

## 总结

经过升级后，Esdeath 的域名验证实现已经完全达到 Surge 的水准，在以下方面实现了显著提升：

1. **安全性**：使用 DoH 避免 DNS 劫持
2. **准确性**：结合 DNS + WHOIS 双重验证
3. **性能**：多级缓存 + 并发优化
4. **可靠性**：自动重试 + 多服务器冗余
5. **可维护性**：模块化设计 + 完善的日志

这些改进确保了域名活性检测的准确性和效率，为规则集维护提供了坚实的技术基础。
