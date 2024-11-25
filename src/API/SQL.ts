import { fetchSyncPost, IWebSocketData } from "siyuan";

export function likeQuery(query: string, param?: any): Promise<IWebSocketData> {
  return fetchSyncPost("/api/query/sql", {
    stmt: `SELECT * FROM blocks WHERE id LIKE'%${query}%' LIMIT 7`,
  });
}
