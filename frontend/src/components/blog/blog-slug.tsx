
import { UUID } from "crypto";
import { Post } from "@/lib/types";
import { get } from "@/lib/http";

// 简单的内存缓存
const cache = new Map<string, { data: Post; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 缓存有效期5分钟

// 获取文章内容
export async function getBlogBySlug(slug: UUID): Promise<Post> {
  // 检查缓存
  const cacheKey = `post-${slug}`;
  const cachedData = cache.get(cacheKey);
  const now = Date.now();
  
  // 如果缓存存在且未过期，返回缓存数据
  if (cachedData && now - cachedData.timestamp < CACHE_TTL) {
    return cachedData.data;
  }
  
  try {
    // 添加重试逻辑
    let retries = 3;
    let lastError: Error | null = null;
    
    while (retries > 0) {
      try {
        const data = await get<Post>(`/posts/${slug}`, { withToken: false });
        
        // 更新缓存
        cache.set(cacheKey, { data, timestamp: now });
        
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('未知错误');
        retries--;
        if (retries > 0) {
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // 所有重试都失败了
    throw lastError || new Error('获取文章失败');
  } catch (error) {
    console.error(`获取文章(${slug})失败:`, error);
    throw new Error(`获取文章失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}
