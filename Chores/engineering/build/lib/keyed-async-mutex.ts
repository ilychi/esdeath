/**
 * 键值异步互斥锁工具
 * 用于防止对同一键的并发操作
 */
export function createKeyedAsyncMutex<T = unknown>(name: string) {
  const mutex = new Map<string, Promise<T>>();

  return {
    acquire: async function(key: string, fn: () => Promise<T>): Promise<T> {
      if (mutex.has(key)) {
        return mutex.get(key)!;
      }

      const promise = fn();
      mutex.set(key, promise);

      promise.finally(() => {
        mutex.delete(key);
      });

      return promise;
    },

    has: function(key: string): boolean {
      return mutex.has(key);
    },

    clear: function(): void {
      mutex.clear();
    }
  };
}
