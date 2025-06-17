/**
 * DNS 查询缓存系统
 * 
 * 功能：
 * 1. 基于 better-sqlite3 实现持久化 DNS 缓存
 * 2. 支持缓存过期机制
 * 3. 提供高性能的缓存读写接口
 * 4. 兼容 Surge 的缓存策略
 * 
 * 基于 Surge 的 undici-cache-store-better-sqlite3 设计
 */

import Database from 'better-sqlite3';
import path from 'node:path';
import * as fs from 'node:fs';
import picocolors from 'picocolors';

export interface DnsCacheEntry {
  domain: string;
  isAlive: boolean;
  checkedAt: number;
  expiresAt: number;
  metadata?: {
    resolveTime: number;
    errorCode?: string;
    errorMessage?: string;
  };
}

export class DnsCache {
  private db: Database.Database;
  private insertStmt: Database.Statement;
  private selectStmt: Database.Statement;
  private deleteExpiredStmt: Database.Statement;
  private countStmt: Database.Statement;

  constructor(cacheDir: string = '.cache') {
    // 确保缓存目录存在
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const dbPath = path.join(cacheDir, 'dns-cache.db');
    
    // 初始化 SQLite 数据库
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');  // 启用 WAL 模式提升性能
    this.db.pragma('synchronous = NORMAL'); // 平衡性能和数据安全
    this.db.pragma('cache_size = 1000');   // 设置缓存大小

    // 创建表结构
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dns_cache (
        domain TEXT PRIMARY KEY,
        is_alive INTEGER NOT NULL,
        checked_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        resolve_time INTEGER,
        error_code TEXT,
        error_message TEXT
      )
    `);

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_expires_at ON dns_cache(expires_at);
      CREATE INDEX IF NOT EXISTS idx_checked_at ON dns_cache(checked_at);
    `);

    // 预编译 SQL 语句
    this.insertStmt = this.db.prepare(`
      INSERT OR REPLACE INTO dns_cache 
      (domain, is_alive, checked_at, expires_at, resolve_time, error_code, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    this.selectStmt = this.db.prepare(`
      SELECT domain, is_alive, checked_at, expires_at, resolve_time, error_code, error_message
      FROM dns_cache 
      WHERE domain = ? AND expires_at > ?
    `);

    this.deleteExpiredStmt = this.db.prepare(`
      DELETE FROM dns_cache WHERE expires_at <= ?
    `);

    this.countStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM dns_cache
    `);

    console.log(picocolors.blue(`[dns-cache] 初始化缓存数据库: ${dbPath}`));
  }

  /**
   * 获取缓存条目
   */
  get(domain: string): DnsCacheEntry | null {
    const now = Date.now();
    const row = this.selectStmt.get(domain, now) as any;
    
    if (!row) {
      return null;
    }

    return {
      domain: row.domain,
      isAlive: Boolean(row.is_alive),
      checkedAt: row.checked_at,
      expiresAt: row.expires_at,
      metadata: {
        resolveTime: row.resolve_time,
        errorCode: row.error_code,
        errorMessage: row.error_message
      }
    };
  }

  /**
   * 设置缓存条目
   */
  set(domain: string, isAlive: boolean, ttlMinutes: number = 180, metadata?: DnsCacheEntry['metadata']): void {
    const now = Date.now();
    const expiresAt = now + (ttlMinutes * 60 * 1000);

    this.insertStmt.run(
      domain,
      isAlive ? 1 : 0,
      now,
      expiresAt,
      metadata?.resolveTime || null,
      metadata?.errorCode || null,
      metadata?.errorMessage || null
    );
  }

  /**
   * 批量设置缓存条目
   */
  setBatch(entries: Array<{
    domain: string;
    isAlive: boolean;
    ttlMinutes?: number;
    metadata?: DnsCacheEntry['metadata'];
  }>): void {
    const transaction = this.db.transaction((entries: any[]) => {
      for (const entry of entries) {
        const now = Date.now();
        const expiresAt = now + ((entry.ttlMinutes || 180) * 60 * 1000);

        this.insertStmt.run(
          entry.domain,
          entry.isAlive ? 1 : 0,
          now,
          expiresAt,
          entry.metadata?.resolveTime || null,
          entry.metadata?.errorCode || null,
          entry.metadata?.errorMessage || null
        );
      }
    });

    transaction(entries);
  }

  /**
   * 清理过期条目
   */
  cleanExpired(): number {
    const now = Date.now();
    const result = this.deleteExpiredStmt.run(now);
    
    if (result.changes > 0) {
      console.log(picocolors.gray(`[dns-cache] 清理了 ${result.changes} 个过期条目`));
    }
    
    return result.changes;
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    cacheHitRate?: number;
  } {
    const now = Date.now();
    const total = this.countStmt.get() as { count: number };
    
    const validCount = this.db.prepare(`
      SELECT COUNT(*) as count FROM dns_cache WHERE expires_at > ?
    `).get(now) as { count: number };

    return {
      totalEntries: total.count,
      validEntries: validCount.count,
      expiredEntries: total.count - validCount.count
    };
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.db.exec('DELETE FROM dns_cache');
    console.log(picocolors.yellow('[dns-cache] 已清空所有缓存'));
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.db.close();
    console.log(picocolors.gray('[dns-cache] 数据库连接已关闭'));
  }

  /**
   * 优化数据库
   */
  optimize(): void {
    this.db.pragma('optimize');
    console.log(picocolors.blue('[dns-cache] 数据库已优化'));
  }

  /**
   * 获取缓存命中率（需要追踪查询统计）
   */
  private hitCount = 0;
  private missCount = 0;

  recordHit(): void {
    this.hitCount++;
  }

  recordMiss(): void {
    this.missCount++;
  }

  getCacheHitRate(): number {
    const total = this.hitCount + this.missCount;
    return total > 0 ? (this.hitCount / total) * 100 : 0;
  }

  resetHitStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
  }
}

// 全局缓存实例
let globalDnsCache: DnsCache | null = null;

/**
 * 获取全局 DNS 缓存实例
 */
export function getDnsCache(cacheDir?: string): DnsCache {
  if (!globalDnsCache) {
    globalDnsCache = new DnsCache(cacheDir);
  }
  return globalDnsCache;
}

/**
 * 关闭全局 DNS 缓存
 */
export function closeDnsCache(): void {
  if (globalDnsCache) {
    globalDnsCache.close();
    globalDnsCache = null;
  }
}
