import $, { Cash } from "cash-dom";
import {
  Dialog,
  EventMenu,
  IMenuItemOption,
  IWebSocketData
} from "siyuan";
import { EDataKey, sleep } from "..";
import { Form } from "../components/Form";
import { IFormItemConfig } from "../components/Form/FormItem";
import { Mask } from "../components/Mask";

export class NoteBookLocker {
  static i18n: any = {};
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

    getData(EDataKey.上锁的笔记).then((data: any) => {
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
    const 密码框: IFormItemConfig = {
      fieldName: "password",
      fieldType: "password",
      label: this.i18n.密码,
      tip: this.i18n.请输入密码,
      placeholder: this.i18n.请输入密码,
    };

    const 确认密码框: IFormItemConfig = {
      fieldName: "confirmPassword",
      fieldType: "password",
      label: this.i18n.确认密码,
      tip: this.i18n.请再次输入密码,
      placeholder: this.i18n.请再次输入密码,
    };

    const detail = event.detail;
    const $element = $(event.detail.elements[0]);
    const type = detail.type;
    if (type !== "notebook") return;

    const dataId = $element.parent().data("url") || $element.data("nodeId");

    if (this.已上锁吗(dataId)) {
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
          const dialog = new Dialog({
            title: this.i18n.移除笔记密码,
            content: "",
            width: "600px",
            height: "400px",
          });

          const $dialogBody = $(".b3-dialog__body", dialog.element);
          const form = new Form(
            [
              {
                ...密码框,
                eventList: [
                  {
                    event: "keydown",
                    handler: (e: KeyboardEvent) => {
                      if (e.key === "Enter") {
                        const password = this.上锁的笔记[dataId];
                        if (password === form.items[0].value.password) {
                          delete this.上锁的笔记[dataId];
                          this.saveData(EDataKey.上锁的笔记, this.上锁的笔记);
                          removeRefIgnore(dataId);
                          removeSearchIgnore(dataId);
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
      });
      return;
    }

    const 为笔记设置密码: IMenuItemOption = {
      iconHTML: "",
      label: this.i18n.为笔记设置密码,
      click: () => {
        const dialog = new Dialog({
          title: this.i18n.为笔记设置密码,
          content: "",
          width: "600px",
          height: "400px",
        });

        const $dialogBody = $(".b3-dialog__body", dialog.element);

        const KeyDownEvent = {
          event: "keydown",
          handler: (e: KeyboardEvent) => {
            if (e.key === "Enter") {
              const password = form.items[0].value.password as string;
              const confirmPassword = form.items[1].value.confirmPassword;

              if (password !== confirmPassword) {
                form.items[1].input.val("");
                form.items[1].tip.text(this.i18n.两次输入密码不一致);
              } else {
                this.上锁的笔记[dataId] = password;
                this.saveData(EDataKey.上锁的笔记, this.上锁的笔记);

                this.锁定笔记($element.parent(), dataId);

                dialog.destroy();
              }
            }
          },
        };

        const form = new Form(
          [
            密码框,
            {
              ...确认密码框,
              eventList: [KeyDownEvent],
            },
          ],
          $dialogBody
        );
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

    const mask = new Mask($(notebook), {
      eventList: [
        {
          event: "click",
          handler: (event) => {
            event.stopPropagation();
            const dialog = new Dialog({
              title: this.i18n.请输入密码,
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
                  label: this.i18n.密码,
                  tip: this.i18n.请输入密码,
                  placeholder: this.i18n.请输入密码,
                  eventList: [
                    {
                      event: "keydown",
                      handler: (e: KeyboardEvent) => {
                        if (e.key === "Enter") {
                          const password = form.items[0].value.password;
                          if (this.上锁的笔记[currentNotebookId] === password) {
                            // 删除引用和搜索忽略
                            removeRefIgnore(currentNotebookId);
                            removeSearchIgnore(currentNotebookId);
                            dialog.destroy();
                            mask.destroy();
                          } else {
                            form.items[0].input.val("");
                            form.items[0].tip.text(this.i18n.密码错误);
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
        },
      ],
    });
  }

  private static 已上锁吗(notebookId: string) {
    if (!notebookId) return false;
    return this.上锁的笔记[notebookId] !== undefined;
  }

  private static 遍历笔记并上锁() {
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
      //   if (!this.已上锁吗(dataId)) return;

      //   this.锁定笔记($(note), dataId);
      // });

      if (!this.已上锁吗(dataId)) return;

      this.锁定笔记($(notebook), dataId);
    });
  }
}

function 添加监听器(cash: Cash) {
  const 监听器 = new MutationObserver(function (操作列表, observer) {
    console.log("🚀 ~ NoteBookLocker ~ observer:", observer);
    console.log("🚀 ~ NoteBookLocker ~ 操作列表:", 操作列表);
    // for (const mutation of 操作列表) {
    //   if (mutation.type === "childList") {
    //     console.log("A child node has been added or removed.");
    //   } else if (mutation.type === "attributes") {
    //     console.log(
    //       "The " + mutation.attributeName + " attribute was modified."
    //     );
    //   }
    // }
  });

  const 监听器配置 = {
    attributes: true, // 观察属性变化
    childList: true, // 观察子元素的添加和删除
    subtree: true, // 观察所有后代元素的变化
  };

  监听器.observe(cash as any, 监听器配置);
  return 监听器;
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
