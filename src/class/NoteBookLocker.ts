import $ from "cash-dom";
import { Dialog } from "siyuan";
import { getData } from "../util/data";
import { Mask } from "../components/Mask";
import { Form } from "../components/Form";

export class NoteBookLocker {
  static onLayoutReady() {
    $("ul.b3-list[data-url]").each(async (_index, notebook) => {
      const currentNotebookId = notebook.dataset.url;
      const lockNoteMap = await getData<Map<string, string>>("lockedNoteBooks");
      const lockNoteIds = Array.from(lockNoteMap.keys()).join(",");

      // 如果笔记本没有被锁定则跳过
      if (!lockNoteIds.includes(currentNotebookId)) return;

      // 添加引用和搜索忽略
      addRefIgnore(currentNotebookId);
      addSearchIgnore(currentNotebookId);

      // 添加一个span元素，放到顶层以拦截
      const mask = new Mask(notebook);
      mask.on("click", () => {
        const dialog = new Dialog({
          title: "请输入密码",
          content: "",
          width: "600px",
          height: "400px",

          hideCloseIcon: true,
        });
        const $dialogBody = $(".b3-dialog__body", dialog.element);
        const form = new Form(
          [
            {
              fieldName: "password",
              fieldType: "password",
              label: "密码",
              tip: "请输入密码",
              placeholder: "请输入密码",
              eventList: [
                {
                  event: "keydown",
                  handler: (e: KeyboardEvent) => {
                    if (e.key === "Enter") {
                      const password = form.items[0].value.password;
                      if (lockNoteMap.get(currentNotebookId) === password) {
                        // 删除引用和搜索忽略
                        removeRefIgnore(currentNotebookId);
                        removeSearchIgnore(currentNotebookId);
                        dialog.destroy();
                        mask.destroy();
                      } else {
                        form.items[0].input.val("");
                        form.items[0].tip.text("密码错误");
                      }
                    }
                  },
                },
              ],
            },
          ],
          $dialogBody
        );
      });
    });
  }

  static onOpenMenu(i18n: any) {
    return (event: CustomEvent) => {
      event.detail.menu.addItem({
        iconHTML: "",
        label: i18n.为笔记本设置密码,
        click: () => {
          const dialog = new Dialog({
            title: i18n.为笔记本设置密码,
            content: "",
            width: "600px",
            height: "400px",
          });

          const $dialogBody = $(".b3-dialog__body", dialog.element);
          const form = new Form(
            [
              {
                fieldName: "password",
                fieldType: "password",
                label: i18n.密码,
                tip: i18n.请输入密码,
                placeholder: i18n.请输入密码,
                eventList: [
                  {
                    event: "keydown",
                    handler: (e: KeyboardEvent) => {
                      if (e.key === "Enter") {
                        form.items[1].input.focus();
                      }
                    },
                  },
                ],
              },
              {
                fieldName: "confirmPassword",
                fieldType: "password",
                label: i18n.确认密码,
                tip: i18n.请再次输入密码,
                placeholder: i18n.请再次输入密码,
                eventList: [
                  {
                    event: "keydown",
                    handler: (e: KeyboardEvent) => {
                      if (e.key === "Enter") {
                        const password = form.items[0].value.password;
                        const confirmPassword =
                          form.items[1].value.confirmPassword;
                        if (password !== confirmPassword) {
                          form.items[1].input.val("");
                          form.items[1].tip.text(i18n.两次输入密码不一致);
                        } else {
                          // TODO: 保存密码
                          dialog.destroy();
                        }
                      }
                    },
                  },
                ],
              },
            ],
            $dialogBody
          );
        },
      }); // 添加菜单项
    };
  }

  // 添加忽略引用搜索
  async addRefIgnore(noteId: string) {
    const content = `\nbox != '${noteId}'`;
    const path = "/data/.siyuan/refsearchignore";
    let raw = await this.getFile(path);
    if (raw.indexOf(content) !== -1) {
      raw = raw.replace(content, "");
    }
    this.putFileContent(path, raw + content);
  }

  // 删除忽略引用搜索
  async removeRefIgnore(noteId: string) {
    const content = `\nbox != '${noteId}'`;
    const path = "/data/.siyuan/refsearchignore";
    let raw = await this.getFile(path);
    if (raw.indexOf(content) !== -1) {
      raw = raw.replace(content, "");
    }
    this.putFileContent(path, raw);
  }

  // 添加忽略搜索
  async addSearchIgnore(noteId: string) {
    const content = `\nbox != '${noteId}'`;
    const path = "/data/.siyuan/searchignore";
    let raw = await this.getFile(path);
    if (raw.indexOf(content) !== -1) {
      raw = raw.replace(content, "");
    }
    this.putFileContent(path, raw + content);
  }

  // 删除忽略搜索
  async removeSearchIgnore(noteId: string) {
    const content = `\nbox != '${noteId}'`;
    const path = "/data/.siyuan/searchignore";
    let raw = await this.getFile(path);
    if (raw.indexOf(content) !== -1) {
      raw = raw.replace(content, "");
    }
    this.putFileContent(path, raw);
  }

  // 请求api
  // returnType json返回json格式，text返回文本格式
  async fetchSyncPost(url: string, data: any | FormData, returnType = "json") {
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
  async getFile(storagePath: string) {
    if (!storagePath) return "";
    const data = await this.fetchSyncPost(
      "/api/file/getFile",
      { path: `${storagePath}` },
      "text"
    );
    if (data.indexOf('"code":404') !== -1) return "";
    return data;
  }

  // 写入文件内容
  async putFileContent(path: string, content: any) {
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
      if (!response.ok) {
        throw new Error("Failed to save file");
      }
    })
    .catch((error) => {
      console.error(error);
    });
}
