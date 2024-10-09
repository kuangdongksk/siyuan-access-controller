import $, { Cash } from "cash-dom";
import {
  EventMenu,
  IMenuBaseDetail,
  IMenuItemOption,
  IWebSocketData,
} from "siyuan";
import { EDataKey, sleep } from "../..";
import { likeQuery } from "../../API/SQL";
import { removeRefIgnore, removeSearchIgnore } from "../../API/搜索忽略";
import { IFormItemConfig } from "../../components/Form/FormItem";
import { 拦截蒙层zIndex } from "../../constant/style";
import { 拦截蒙层 } from "./components/拦截蒙层";
import { 表单对话框 } from "./components/表单对话框";

const 当前编辑区选择器 = ".protyle:not(.fn__none)";
const 所见即所得选择器 = ".protyle-wysiwyg.protyle-wysiwyg--attr";

export class NoteBookLocker {
  static i18n: any;

  // static 当前页签对应的笔记本id: string;
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
          this.添加拦截蒙层($element.parent(), dataId);
          this.锁定指定笔记本下的页签(dataId);
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

                this.添加拦截蒙层($element.parent(), dataId);

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

  static async 打开内容区菜单(event: CustomEvent<IMenuBaseDetail>) {
    const detail = event.detail;

    const 当前编辑区的第一个笔记 = $(".layout-tab-container")
      .children(当前编辑区选择器)
      .find(".protyle-content " + 所见即所得选择器)
      .children("[data-node-index]");

    detail.menu.addItem({
      iconHTML: "",
      label: this.i18n.锁定笔记,
      click: () => {
        likeQuery(当前编辑区的第一个笔记.data("nodeId")).then(({ data }) => {
          const dataId = data[0].box;

          if (this.已设置锁吗(dataId)) {
            this.添加拦截蒙层(
              $(".layout-tab-container").children(当前编辑区选择器),
              dataId
            );
            this.添加拦截蒙层(
              $(".layout-tab-bar").children("li.item--focus"),
              dataId
            );
          }
        });
      },
    });
  }

  static async onWSMain(event: CustomEvent<IWebSocketData>) {
    if (event.detail?.data?.box) {
      const 打开笔记本 = event.detail?.data?.existed === false;
      const 新建文档或重命名文档 = Boolean(event.detail?.data?.id);

      if (打开笔记本 || 新建文档或重命名文档) return "不上锁";
      await sleep(100);
      this.遍历笔记并上锁();
    }
  }
  //#endregion 生命周期

  private static 遍历笔记并上锁() {
    this.遍历笔记目录并上锁();
    this.遍历笔记页签并上锁();
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

      this.添加拦截蒙层($(notebook), dataId);
    });
  }

  private static async 遍历笔记页签并上锁() {
    const 所有打开的页签 = $("ul.layout-tab-bar").children("li[data-type]");

    await sleep(200);
    await likeQuery(
      $(所见即所得选择器).children("[data-node-index]").first().data("nodeId")
    ).then(({ data }) => {
      // BUG: 有时候会获取不到当前页签的笔记本id
      const 当前页签的笔记本id = data?.[0]?.box;

      const 所有页签 = [];
      所有打开的页签.each((_index, 页签) => {
        if ($(页签).hasClass("item--focus")) {
          所有页签.push({
            根元素: $(页签),
            id: 当前页签的笔记本id,
          });
          return;
        }
        所有页签.push({
          根元素: $(页签),
          id: $(页签).data("initdata")?.notebookId,
        });
      });

      所有页签.push({
        根元素: $(".layout-tab-container").children(".protyle"),
        id: 当前页签的笔记本id,
      });

      所有页签.forEach((页签) => {
        if (this.已设置锁吗(页签.id)) {
          const { 根元素, id } = 页签;
          this.添加拦截蒙层(根元素, id);
        }
      });
    });
  }

  // 不锁定当前打开的文档
  private static 锁定指定笔记本下的页签(笔记本Id: string) {
    const 所有页签 = $("ul.layout-tab-bar").children("li[data-type]");
    console.log("🚀 ~ NoteBookLocker ~ 所有页签:", 所有页签);

    所有页签.each((_index, 页签) => {
      const notebookId = $(页签).data("initdata")?.notebookId;
      if (笔记本Id !== notebookId) return;

      this.添加拦截蒙层($(页签), notebookId);
    });
  }

  private static 添加拦截蒙层(根元素: Cash, 当前笔记本Id: string) {
    if (根元素.hasClass("note-book-Locker-locked")) return;

    根元素.addClass("note-book-Locker-locked");
    new 拦截蒙层(
      $(根元素),
      {
        style: {
          backdropFilter: "blur(15px)",
          zIndex: 拦截蒙层zIndex,
        },
      },
      {
        i18n: this.i18n,
        笔记数据: this.上锁的笔记,
        当前id: 当前笔记本Id,
      }
    );
  }

  private static 已设置锁吗(notebookId: string) {
    if (!notebookId) return false;
    return this.上锁的笔记[notebookId] !== undefined;
  }
}
