import Database from 'better-sqlite3';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import process from 'node:process';

// 确保缓存目录存在
const cacheDir = join(process.cwd(), '.cache');
mkdirSync(cacheDir, { recursive: true });

const db = new Database(join(cacheDir, 'doh-cache.db'));

// 初始化数据库表
db.exec(`
  CREATE TABLE IF NOT EXISTS doh_cache (
    key TEXT PRIMARY KEY,
    response TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    ttl INTEGER NOT NULL
  );
  
  CREATE INDEX IF NOT EXISTS idx_created_at ON doh_cache(created_at);
`);

// 准备语句
const stmtGet = db.prepare('SELECT response, created_at, ttl FROM doh_cache WHERE key = ?');
const stmtSet = db.prepare('INSERT OR REPLACE INTO doh_cache (key, response, created_at, ttl) VALUES (?, ?, ?, ?)');
const stmtDelete = db.prepare('DELETE FROM doh_cache WHERE key = ?');
const stmtClear = db.prepare('DELETE FROM doh_cache WHERE created_at + ttl < ?');
const stmtCount = db.prepare('SELECT COUNT(*) as count FROM doh_cache');
const stmtValidCount = db.prepare('SELECT COUNT(*) as count FROM doh_cache WHERE created_at + ttl >= ?');

interface CacheEntry {
  response: string;
  created_at: number;
  ttl: number;
}

export class DoHCache {
  private hitCount = 0;
  private missCount = 0;

  constructor() {
    // 清理过期缓存
    this.clearExpired();
    
    // 定期清理（每5分钟）
    setInterval(() => this.clearExpired(), 5 * 60 * 1000);

    // 程序退出时输出统计信息
    process.on('exit', () => {
      this.printStats();
      db.close();
    });
  }

  get(key: string): string | null {
    const row = stmtGet.get(key) as CacheEntry | undefined;
    
    if (!row) {
      this.missCount++;
      return null;
    }

    const now = Date.now();
    if (now > row.created_at + row.ttl) {
      // 缓存已过期
      this.missCount++;
      stmtDelete.run(key);
      return null;
    }

    this.hitCount++;
    return row.response;
  }

  set(key: string, response: string, ttl: number): void {
    const now = Date.now();
    stmtSet.run(key, response, now, ttl);
  }

  clearExpired(): void {
    const now = Date.now();
    const result = stmtClear.run(now);
    if (result.changes > 0) {
      console.log(`🗑️  [doh-cache] 清理了 ${result.changes} 个过期缓存条目`);
    }
  }

  getCacheKey(domain: string, type: string, server: string): string {
    return `${domain}:${type}:${server}`;
  }

  printStats(): void {
    const total = (stmtCount.get() as { count: number }).count;
    const valid = (stmtValidCount.get(Date.now()) as { count: number }).count;
    const hitRate = this.hitCount + this.missCount > 0 
      ? (this.hitCount / (this.hitCount + this.missCount) * 100).toFixed(1)
      : '0.0';

    console.log(`
📊 DoH 缓存统计:
   缓存命中率: ${hitRate}%
   命中次数: ${this.hitCount}
   未命中次数: ${this.missCount}
   有效缓存条目: ${valid}
   总缓存条目: ${total}
`);
  }
}

// 导出单例实例
export const dohCache = new DoHCache();
