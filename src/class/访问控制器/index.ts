import $, { Cash } from "cash-dom";
import { EventMenu, IMenuItemOption, IWebSocketData } from "siyuan";
import { EDataKey, sleep } from "../..";
import { IFormItemConfig } from "../../components/Form/FormItem";
import { 拦截蒙层 } from "./components/拦截蒙层";
import { 表单对话框 } from "./components/表单对话框";

export class NoteBookLocker {
  static i18n: any;

  static 密码框: IFormItemConfig;
  static 确认密码框: IFormItemConfig;
  static 上锁的笔记: {
    [key: string]: string;
  } = {};

  static getData: (key: EDataKey) => Promise<any>;
  static saveData: (key: EDataKey, value: any) => Promise<void>;

  //#region 生命周期
  static onLoad(
    getData: (key: EDataKey) => Promise<any>,
    saveData: (key: EDataKey, value: any) => Promise<void>,
    i18n: any
  ) {
    this.i18n = i18n;
    this.getData = getData;
    this.saveData = saveData;

    this.密码框 = {
      fieldName: "password",
      fieldType: "password",
      label: i18n.密码,
      tip: i18n.请输入密码,
      placeholder: i18n.请输入密码,
    };

    this.确认密码框 = {
      fieldName: "confirmPassword",
      fieldType: "password",
      label: i18n.确认密码,
      tip: i18n.请再次输入密码,
      placeholder: i18n.请再次输入密码,
    };

    this.getData(EDataKey.上锁的笔记).then((data: any) => {
      this.上锁的笔记 = data;
    });
  }

  static onLayoutReady() {
    this.遍历笔记并上锁();
  }

  static onOpenMenuDocTree(
    event: CustomEvent<{
      menu: EventMenu;
      elements: NodeListOf<HTMLElement>;
      type: "doc" | "docs" | "notebook";
    }>
  ) {
    const detail = event.detail;
    const $element = $(event.detail.elements[0]);
    const type = detail.type;
    if (type !== "notebook") return;

    const dataId = $element.parent().data("url") || $element.data("nodeId");

    if (this.已设置锁吗(dataId)) {
      detail.menu.addItem({
        iconHTML: "",
        label: this.i18n.锁定笔记,
        click: () => {
          this.锁定笔记($element.parent(), dataId);
        },
      });

      detail.menu.addItem({
        iconHTML: "",
        label: this.i18n.移除笔记密码,
        click: () => {
          const { 表单, 对话框 } = 表单对话框(this.i18n.请输入密码);
          表单.配置 = [
            {
              ...this.密码框,
              eventList: [
                {
                  event: "keydown",
                  handler: (e: KeyboardEvent) => {
                    if (e.key === "Enter") {
                      const password = this.上锁的笔记[dataId];
                      if (password === 表单.所有项[0].value.password) {
                        delete this.上锁的笔记[dataId];
                        this.saveData(EDataKey.上锁的笔记, this.上锁的笔记);
                        removeRefIgnore(dataId);
                        removeSearchIgnore(dataId);
                        对话框.destroy();
                      }
                    }
                  },
                },
              ],
            },
          ];
        },
      });
      return;
    }

    const 为笔记设置密码: IMenuItemOption = {
      iconHTML: "",
      label: this.i18n.为笔记设置密码,
      click: () => {
        const { 表单, 对话框 } = 表单对话框(this.i18n.设置密码);
        const KeyDownEvent = {
          event: "keydown",
          handler: (e: KeyboardEvent) => {
            if (e.key === "Enter") {
              const password = 表单.所有项[0].value.password as string;
              const confirmPassword = 表单.所有项[1].value.confirmPassword;

              if (password !== confirmPassword) {
                表单.所有项[1].input.val("");
                表单.所有项[1].tip.text(this.i18n.两次输入密码不一致);
              } else {
                this.上锁的笔记[dataId] = password;
                this.saveData(EDataKey.上锁的笔记, this.上锁的笔记);

                this.锁定笔记($element.parent(), dataId);

                对话框.destroy();
              }
            }
          },
        };
        表单.配置 = [
          this.密码框,
          {
            ...this.确认密码框,
            eventList: [KeyDownEvent],
          },
        ];
      },
    };

    event.detail.menu.addItem(为笔记设置密码);
  }

  static async onWSMain(event: CustomEvent<IWebSocketData>) {
    if (event.detail?.data?.box) {
      if (event.detail?.data?.existed === false) return;
      await sleep(100);
      this.遍历笔记并上锁();
    }
  }
  //#endregion 生命周期

  private static 锁定笔记(notebook: Cash, currentNotebookId: string) {
    // 添加引用和搜索忽略
    addRefIgnore(currentNotebookId);
    addSearchIgnore(currentNotebookId);
    if (notebook.hasClass("note-book-Locker-locked")) return;

    notebook.addClass("note-book-Locker-locked");
    new 拦截蒙层(
      $(notebook),
      {},
      {
        i18n: this.i18n,
        笔记数据: this.上锁的笔记,
        当前id: currentNotebookId,
      }
    );
  }

  private static 已设置锁吗(notebookId: string) {
    if (!notebookId) return false;
    return this.上锁的笔记[notebookId] !== undefined;
  }

  private static 遍历笔记并上锁() {
    this.遍历笔记目录并上锁();
    this.遍历笔记标签页并上锁();
  }

  private static 遍历笔记目录并上锁() {
    const 打开的笔记本 = $("ul.b3-list[data-url]");
    const 关闭的笔记本 = $(
      "li.b3-list-item.b3-list-item--hide-action[data-type='open']"
    );
    const 所有的笔记本 = 打开的笔记本.add(关闭的笔记本);
    所有的笔记本.each(async (_index, notebook) => {
      const dataId = notebook.dataset.url;

      // const notes = $("ul", notebook).children("li");

      // notes.each((_index, note) => {
      //   const dataId = $(note).data("nodeId");
      //   if (!this.已设置锁吗(dataId)) return;

      //   this.锁定笔记($(note), dataId);
      // });

      if (!this.已设置锁吗(dataId)) return;

      this.锁定笔记($(notebook), dataId);
    });
  }

  private static 遍历笔记标签页并上锁() {
    const 所有打开的标签页 = $("ul.layout-tab-bar").children("li[data-type]");

    所有打开的标签页.each((_index, 标签页) => {
      const 初始数据 = $(标签页).data("initdata");
      const dataId = 初始数据?.notebookId;
      if (!this.已设置锁吗(dataId)) return;

      $(标签页).addClass("note-book-Locker-locked");

      new 拦截蒙层(
        $(标签页),
        {},
        {
          i18n: this.i18n,
          笔记数据: this.上锁的笔记,
          当前id: dataId,
        }
      );

      if ($(标签页).hasClass("item--focus")) {
        const 内容区域 = $(".layout-tab-container");

        new 拦截蒙层(
          内容区域,
          {},
          {
            i18n: this.i18n,
            笔记数据: this.上锁的笔记,
            当前id: dataId,
          }
        );
      }
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
