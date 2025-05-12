import { fetchSyncPost } from "./util";

// 添加忽略引用搜索
export async function addRefIgnore(noteId: string) {
  const content = `\nbox != '${noteId}'`;
  const path = "/data/.siyuan/refsearchignore";
  let raw = await getFile(path);
  if (raw.indexOf(content) !== -1) {
    raw = raw.replace(content, "");
  }
  putFileContent(path, raw + content);
}

// 删除忽略引用搜索
export async function removeRefIgnore(noteId?: string) {
  const path = "/data/.siyuan/refsearchignore";
  if (!noteId) {
    putFileContent(path, '');
    return
  }

  const content = `\nbox != '${noteId}'`;

  let raw = await getFile(path);
  if (raw.indexOf(content) !== -1) {
    raw = raw.replace(content, "");
  }
  putFileContent(path, raw);
}

// 添加忽略搜索
export async function addSearchIgnore(noteId: string) {
  const content = `\nbox != '${noteId}'`;
  const path = "/data/.siyuan/searchignore";

  let raw = await getFile(path);
  if (raw.indexOf(content) !== -1) {
    raw = raw.replace(content, "");
  }
  putFileContent(path, raw + content);
}

// 删除忽略搜索
export async function removeSearchIgnore(noteId?: string) {
  const path = "/data/.siyuan/searchignore";
  if (!noteId) {
    putFileContent(path, '');
    return
  }

  const content = `\nbox != '${noteId}'`;
  let raw = await getFile(path);
  if (raw.indexOf(content) !== -1) {
    raw = raw.replace(content, "");
  }
  putFileContent(path, raw);
}

// 读取文件
export async function getFile(storagePath: string) {
  if (!storagePath) return "";
  const data = await fetchSyncPost(
    "/api/file/getFile",
    { path: `${storagePath}` },
    "text"
  );
  if (data.indexOf('"code":404') !== -1) return "";
  return data;
}

// 写入文件内容
export async function putFileContent(path: string, content: any) {
  const formData = new FormData();
  formData.append("path", path);
  formData.append("file", new Blob([content]));
  return fetch("/api/file/putFile", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to save file");
      }
    })
    .catch((error) => {
      console.error(error);
    });
}
