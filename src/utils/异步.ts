export function 暂停(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
