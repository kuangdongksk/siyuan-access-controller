import $ from "cash-dom";
import { Dialog } from "siyuan";

export async function OnLoad() {
  //
}

export async function OnLayoutReady() {
  // const allNoteBooks = $(".b3-list-item--hide-action");

  // allNoteBooks.each((index, item) => {
  //   // 获取此元素上的所有事件
  //   const events = $(item, "events");
  //   console.log("🚀 ~ allNoteBooks.each ~ events:", events);

  //   // 添加事件监听
  //   $(item).on("click", () => {
  //     console.log("🚀 ~ OnLayoutReady ~ item:");
  //   });
  // });

  $("ul.b3-list[data-url]").each(async (_index, notebook) => {
    const notebookId = notebook.dataset.url;
    const lockNoteIds = Object.keys(await getData("lockedNoteBooks")).join(",");

    // 如果笔记本没有被锁定则跳过
    if (!lockNoteIds.includes(notebookId)) return;

    // 添加引用和搜索忽略
    addRefIgnore(notebookId);
    addSearchIgnore(notebookId);

    //获取笔记标题和箭头按钮
    const noteLi = notebook.firstElementChild as HTMLElement;

    // 开始监听笔记事件
    noteLi.addEventListener("click", () => {
      const dialog = new Dialog({
        title: "请输入密码",
        content: `
        <div class="b3-dialog__content">
          <input class="b3-text-field fn__block" placeholder="请输入密码" type="password" />
        </div>
        <div class="b3-dialog__action">
          <button class="b3-button b3-button--cancel">取消</button>
          <div class="fn__space"></div>
          <button class="b3-button b3-button--text">确定</button>
        </div>`,
        width: "300px",
        height: "200px",

        hideCloseIcon: true,
      });
    });
  });
}

function getData(key: string) {
  return new Promise((resolve) => {
    if (key === "lockedNoteBooks") {
      resolve({
        "20240918162306-jnneurg": "awsd123456",
      });
    }
    resolve(null);
  });
}

// 添加忽略引用搜索
async function addRefIgnore(noteId: string) {
  const content = `\nbox != '${noteId}'`;
  const path = "/data/.siyuan/refsearchignore";
  let raw = await getFile(path);
  if (raw.indexOf(content) !== -1) {
    raw = raw.replace(content, "");
  }
  putFileContent(path, raw + content);
}

// 删除忽略引用搜索
async function removeRefIgnore(noteId: string) {
  const content = `\nbox != '${noteId}'`;
  const path = "/data/.siyuan/refsearchignore";
  let raw = await getFile(path);
  if (raw.indexOf(content) !== -1) {
    raw = raw.replace(content, "");
  }
  putFileContent(path, raw);
}

// 添加忽略搜索
async function addSearchIgnore(noteId: string) {
  const content = `\nbox != '${noteId}'`;
  const path = "/data/.siyuan/searchignore";
  let raw = await getFile(path);
  if (raw.indexOf(content) !== -1) {
    raw = raw.replace(content, "");
  }
  putFileContent(path, raw + content);
}

// 删除忽略搜索
async function removeSearchIgnore(noteId: string) {
  const content = `\nbox != '${noteId}'`;
  const path = "/data/.siyuan/searchignore";
  let raw = await getFile(path);
  if (raw.indexOf(content) !== -1) {
    raw = raw.replace(content, "");
  }
  putFileContent(path, raw);
}

// 请求api
// returnType json返回json格式，text返回文本格式
async function fetchSyncPost(
  url: string,
  data: any | FormData,
  returnType = "json"
) {
  const init: {
    method: string;
    body?: string | FormData;
  } = {
    method: "POST",
  };
  if (data) {
    if (data instanceof FormData) {
      init.body = data;
    } else {
      init.body = JSON.stringify(data);
    }
  }
  try {
    const res = await fetch(url, init);
    const res2 = returnType === "json" ? await res.json() : await res.text();
    return res2;
  } catch (e) {
    console.log(e);
    return returnType === "json"
      ? { code: e.code || 1, msg: e.message || "", data: null }
      : "";
  }
}

// 读取文件
async function getFile(storagePath: string) {
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
async function putFileContent(path: string, content: any) {
  const formData = new FormData();
  formData.append("path", path);
  formData.append("file", new Blob([content]));
  return fetch("/api/file/putFile", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (response.ok) {
        //console.log("File saved successfully");
      } else {
        throw new Error("Failed to save file");
      }
    })
    .catch((error) => {
      console.error(error);
    });
}
