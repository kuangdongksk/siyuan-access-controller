import { 上锁的笔记本 } from "../data/上锁的笔记本";

export function getData<TData = any>(key: string): Promise<TData | null> {
  return new Promise((resolve) => {
    if (key === "lockedNoteBooks") {
      resolve(上锁的笔记本 as unknown as TData);
    }
    resolve(null);
  });
}
