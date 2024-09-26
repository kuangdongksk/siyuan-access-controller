import {
  confirm,
  Constants,
  Dialog,
  fetchPost,
  getBackend,
  getFrontend,
  ICard,
  ICardData,
  IModel,
  IOperation,
  lockScreen,
  Menu,
  openMobileFileById,
  openTab,
  openWindow,
  Plugin,
  Protyle,
  Setting,
  showMessage,
} from "siyuan";
import { NoteBookLocker } from "./class/NoteBookLocker";
import { OnLayoutReady, OnLoad } from "./event/lifeCycle";
import "./index.scss";
import { Icon } from "./template/Icon";
import { CustomContent, CustomContentMobile, IDockData } from "./template/dock";

export enum EDataKey {
  上锁的笔记 = "上锁的笔记",
}
const STORAGE_NAME = "menu-config";
const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";

export default class AccessControllerPlugin extends Plugin {
  private customTab: () => IModel;
  private isMobile: boolean;
  private blockIconEventBindThis = this.blockIconEvent.bind(this);

  //#region onLoad
  async onload() {
    this.data[EDataKey.上锁的笔记] = {};

    const getData = async (key: EDataKey) => {
      let data;
      try {
        data = await this.loadData(key);
      } catch (error) {
        console.log("🚀 ~ AccessControllerPlugin ~ getData ~ error:", error);
        return null;
      }
      return data;
    };
    const saveData = async (key: EDataKey, value: any) => {
      try {
        await this.saveData(key, value);
      } catch (error) {
        console.log("🚀 ~ AccessControllerPlugin ~ saveData ~ error:", error);
      }
    };

    OnLoad(getData, saveData);

    // 图标的制作参见帮助文档
    this.addIcons(Icon);

    const topBarElement = this.addTopBar({
      icon: "iconFace",
      title: this.i18n.addTopBarIcon,
      position: "right",
      callback: () => {
        if (this.isMobile) {
          this.addMenu();
        } else {
          let rect = topBarElement.getBoundingClientRect();
          // 如果被隐藏，则使用更多按钮
          if (rect.width === 0) {
            rect = document.querySelector("#barMore").getBoundingClientRect();
          }
          if (rect.width === 0) {
            rect = document
              .querySelector("#barPlugins")
              .getBoundingClientRect();
          }
          this.addMenu(rect);
        }
      },
    });

    const statusIconTemp = document.createElement("template");
    statusIconTemp.innerHTML = `
    <div class="toolbar__item ariaLabel" aria-label="Remove plugin-sample Data">
      <svg>
        <use xlink:href="#iconTrashcan"></use>
      </svg>
    </div>
    `;
    statusIconTemp.content.firstElementChild.addEventListener("click", () => {
      confirm(
        "⚠️",
        this.i18n.confirmRemove.replace("${name}", this.name),
        () => {
          this.removeData(STORAGE_NAME).then(() => {
            this.data[STORAGE_NAME] = { readonlyText: "Readonly" };
            showMessage(`[${this.name}]: ${this.i18n.removedData}`);
          });
        }
      );
    });

    this.addStatusBar({
      element: statusIconTemp.content.firstElementChild as HTMLElement,
    });

    this.customTab = this.addTab({
      type: TAB_TYPE,
      init() {
        this.element.innerHTML = `<div class="plugin-sample__custom-tab">${this.data.text}</div>`;
      },
      beforeDestroy() {},
      destroy() {},
    });

    //#region 添加快捷键
    this.addCommand({
      langKey: "showDialog",
      hotkey: "⇧⌘O",
      callback: () => {
        this.showDialog();
      },
    });

    this.addCommand({
      langKey: "getTab",
      hotkey: "⇧⌘M",
      globalCallback: () => {},
    });
    //#endregion

    //#region 添加dock
    const CustomDockTitle = "自定义Dock标题";
    const dockData: IDockData = { text: "这是我的自定义dock" };
    this.addDock({
      config: {
        position: "LeftBottom",
        size: { width: 200, height: 0 },
        icon: "iconSaving",
        title: "自定义 Dock",
        hotkey: "⌥⌘W",
      },
      data: dockData,
      type: DOCK_TYPE,
      resize() {},
      update() {},
      init: (dock) => {
        if (this.isMobile) {
          dock.element.innerHTML = CustomContentMobile(
            CustomDockTitle,
            dockData
          );
        } else {
          dock.element.innerHTML = CustomContent(CustomDockTitle, dockData);
        }
      },
      destroy() {},
    });
    //#endregion

    const textareaElement = document.createElement("textarea");
    this.setting = new Setting({
      confirmCallback: () => {
        this.saveData(STORAGE_NAME, { readonlyText: textareaElement.value });
      },
    });
    this.setting.addItem({
      title: "Readonly text",
      direction: "row",
      description: "Open plugin url in browser",
      createActionElement: () => {
        textareaElement.className = "b3-text-field fn__block";
        textareaElement.placeholder = "Readonly text in the menu";
        textareaElement.value = this.data[STORAGE_NAME].readonlyText;
        return textareaElement;
      },
    });
    const btnaElement = document.createElement("button");
    btnaElement.className =
      "b3-button b3-button--outline fn__flex-center fn__size200";
    btnaElement.textContent = "Open";
    btnaElement.addEventListener("click", () => {
      window.open("https://github.com/siyuan-note/plugin-sample");
    });
    this.setting.addItem({
      title: "Open plugin url",
      description: "Open plugin url in browser",
      actionElement: btnaElement,
    });

    this.protyleSlash = [
      {
        filter: ["insert emoji 😊", "插入表情 😊", "crbqwx"],
        html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${this.i18n.insertEmoji}</span><span class="b3-list-item__meta">😊</span></div>`,
        id: "insertEmoji",
        callback(protyle: Protyle) {
          protyle.insert("😊");
        },
      },
    ];

    this.protyleOptions = {
      toolbar: [
        "block-ref",
        "a",
        "|",
        "text",
        "strong",
        "em",
        "u",
        "s",
        "mark",
        "sup",
        "sub",
        "clear",
        "|",
        "code",
        "kbd",
        "tag",
        "inline-math",
        "inline-memo",
        "|",
        {
          name: "insert-smail-emoji",
          icon: "iconEmoji",
          hotkey: "⇧⌘I",
          tipPosition: "n",
          tip: this.i18n.insertEmoji,
          click(protyle: Protyle) {
            protyle.insert("😊");
          },
        },
      ],
    };
  }
  //#endregion

  onLayoutReady() {
    const 前端 = getFrontend();
    const 后端 = getBackend();
    if (前端 === "mobile" || 前端 === "browser-mobile") {
      return;
    }
    OnLayoutReady();
    this.eventBus.on("open-menu-doctree", NoteBookLocker.onOpenMenu(this.i18n));
  }

  onunload() {
    //
  }

  uninstall() {
    //
  }

  async updateCards(options: ICardData) {
    options.cards.sort((a: ICard, b: ICard) => {
      if (a.blockID < b.blockID) {
        return -1;
      }
      if (a.blockID > b.blockID) {
        return 1;
      }
      return 0;
    });
    return options;
  }

  //#region 自定义设置
  openSetting() {
    const dialog = new Dialog({
      title: this.name,
      content: `<div class="b3-dialog__content"><textarea class="b3-text-field fn__block" placeholder="readonly text in the menu"></textarea></div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${this.i18n.cancel}</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text">${this.i18n.save}</button>
</div>`,
      width: this.isMobile ? "92vw" : "520px",
    });
    const inputElement = dialog.element.querySelector("textarea");
    inputElement.value = this.data[STORAGE_NAME].readonlyText;
    const btnsElement = dialog.element.querySelectorAll(".b3-button");
    dialog.bindInput(inputElement, () => {
      (btnsElement[1] as HTMLButtonElement).click();
    });
    inputElement.focus();
    btnsElement[0].addEventListener("click", () => {
      dialog.destroy();
    });
    btnsElement[1].addEventListener("click", () => {
      this.saveData(STORAGE_NAME, { readonlyText: inputElement.value });
      dialog.destroy();
    });
  }
  //#endregion

  private eventBusPaste(event: any) {
    // 如果需异步处理请调用 preventDefault， 否则会进行默认处理
    event.preventDefault();
    // 如果使用了 preventDefault，必须调用 resolve，否则程序会卡死
    event.detail.resolve({
      textPlain: event.detail.textPlain.trim(),
    });
  }

  private blockIconEvent(event: any) {
    const detail = event.detail;

    detail.menu.addItem({
      iconHTML: "",
      label: this.i18n.removeSpace, // 移除空格
      click: () => {
        const doOperations: IOperation[] = [];
        detail.blockElements.forEach((item: HTMLElement) => {
          const editElement = item.querySelector('[contenteditable="true"]');
          if (editElement) {
            editElement.textContent = editElement.textContent.replace(/ /g, "");
            doOperations.push({
              id: item.dataset.nodeId,
              data: item.outerHTML,
              action: "update",
            });
          }
        });
        detail.protyle.getInstance().transaction(doOperations);
      },
    });
  }

  private showDialog() {
    const dialog = new Dialog({
      title: `SiYuan ${Constants.SIYUAN_VERSION}`,
      content: `<div class="b3-dialog__content">
    <div>appId:</div>
    <div class="fn__hr"></div>
    <div class="plugin-sample__time">${this.app.appId}</div>
    <div class="fn__hr"></div>
    <div class="fn__hr"></div>
    <div>API demo:</div>
    <div class="fn__hr"></div>
    <div class="plugin-sample__time">System current time: <span id="time"></span></div>
    <div class="fn__hr"></div>
    <div class="fn__hr"></div>
    <div>Protyle demo:</div>
    <div class="fn__hr"></div>
    <div id="protyle" style="height: 360px;"></div>
</div>`,
      width: this.isMobile ? "92vw" : "560px",
      height: "540px",
    });
    new Protyle(this.app, dialog.element.querySelector("#protyle"), {
      blockId: "20200812220555-lj3enxa",
    });
    fetchPost("/api/system/currentTime", {}, (response) => {
      dialog.element.querySelector("#time").innerHTML = new Date(
        response.data
      ).toString();
    });
  }

  //#endregion 添加目录
  private addMenu(rect?: DOMRect) {
    const 菜单关闭回调 = () => {
      //
    };
    const menu = new Menu("topBar示范", 菜单关闭回调);
    menu.addItem({
      icon: "iconInfo",
      label: "对话(open help first)",
      accelerator: this.commands[0].customHotkey,
      click: () => {
        this.showDialog();
      },
    });
    if (!this.isMobile) {
      menu.addItem({
        icon: "iconFace",
        label: "打开自定义 Tab",
        click: () => {
          const tab = openTab({
            app: this.app,
            custom: {
              icon: "iconFace",
              title: "自定义 Tab",
              data: {
                text: "这是我的自定义 tab",
              },
              id: this.name + TAB_TYPE,
            },
          });
        },
      });
      menu.addItem({
        icon: "iconImage",
        label: "Open Asset Tab(open help first)",
        click: () => {
          const tab = openTab({
            app: this.app,
            asset: {
              path: "assets/paragraph-20210512165953-ag1nib4.svg",
            },
          });
        },
      });
      menu.addItem({
        icon: "iconFile",
        label: "Open Doc Tab(open help first)",
        click: async () => {
          const tab = await openTab({
            app: this.app,
            doc: {
              id: "20200812220555-lj3enxa",
            },
          });
        },
      });
      menu.addItem({
        icon: "iconSearch",
        label: "Open Search Tab",
        click: () => {
          const tab = openTab({
            app: this.app,
            search: {
              k: "SiYuan",
            },
          });
        },
      });
      menu.addItem({
        icon: "iconRiffCard",
        label: "Open Card Tab",
        click: () => {
          const tab = openTab({
            app: this.app,
            card: {
              type: "all",
            },
          });
        },
      });
      menu.addItem({
        icon: "iconLayout",
        label: "Open Float Layer(open help first)",
        click: () => {
          this.addFloatLayer({
            ids: ["20210428212840-8rqwn5o", "20201225220955-l154bn4"],
            defIds: ["20230415111858-vgohvf3", "20200813131152-0wk5akh"],
            x: window.innerWidth - 768 - 120,
            y: 32,
          });
        },
      });
      menu.addItem({
        icon: "iconOpenWindow",
        label: "Open Doc Window(open help first)",
        click: () => {
          openWindow({
            doc: { id: "20200812220555-lj3enxa" },
          });
        },
      });
    } else {
      menu.addItem({
        icon: "iconFile",
        label: "打开文档(open help first)",
        click: () => {
          openMobileFileById(this.app, "20200812220555-lj3enxa");
        },
      });
    }
    menu.addItem({
      icon: "iconLock",
      label: "Lockscreen",
      click: () => {
        lockScreen(this.app);
      },
    });
    //#region 添加事件总线
    menu.addItem({
      icon: "iconScrollHoriz",
      label: "事件总线",
      type: "submenu",
      submenu: [
        {
          icon: "iconSelect",
          label: "订阅 ws-main",
          click: () => {
            this.eventBus.on("ws-main", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 ws-main",
          click: () => {
            this.eventBus.off("ws-main", 输出事件总线);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 点击-块图标",
          click: () => {
            this.eventBus.on("click-blockicon", this.blockIconEventBindThis);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 点击-块图标",
          click: () => {
            this.eventBus.off("click-blockicon", this.blockIconEventBindThis);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 打开-non编辑块",
          click: () => {
            this.eventBus.on("open-noneditableblock", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 打开-non编辑块",
          click: () => {
            this.eventBus.off("open-noneditableblock", 输出事件总线);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 加载-protyle-静态的",
          click: () => {
            this.eventBus.on("loaded-protyle-static", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 加载-protyle-静态的",
          click: () => {
            this.eventBus.off("loaded-protyle-static", 输出事件总线);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 加载-protyle-动态的",
          click: () => {
            this.eventBus.on("loaded-protyle-dynamic", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 加载-protyle-动态的",
          click: () => {
            this.eventBus.off("loaded-protyle-dynamic", 输出事件总线);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 switch-protyle",
          click: () => {
            this.eventBus.on("switch-protyle", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 switch-protyle",
          click: () => {
            this.eventBus.off("switch-protyle", 输出事件总线);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 destroy-protyle",
          click: () => {
            this.eventBus.on("destroy-protyle", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 destroy-protyle",
          click: () => {
            this.eventBus.off("destroy-protyle", 输出事件总线);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 打开目录文档书",
          click: () => {
            this.eventBus.on("open-menu-doctree", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 打开目录文档书",
          click: () => {
            this.eventBus.off("open-menu-doctree", 输出事件总线);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 打开目录-blockref",
          click: () => {
            this.eventBus.on("open-menu-blockref", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 打开目录-blockref",
          click: () => {
            this.eventBus.off("open-menu-blockref", 输出事件总线);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 打开目录-fileannotationref",
          click: () => {
            this.eventBus.on("open-menu-fileannotationref", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 打开目录-fileAnnotationRef",
          click: () => {
            this.eventBus.off("open-menu-fileannotationref", 输出事件总线);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 打开目录-标签",
          click: () => {
            this.eventBus.on("open-menu-tag", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 打开目录-标签",
          click: () => {
            this.eventBus.off("open-menu-tag", 输出事件总线);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 打开目录-链接",
          click: () => {
            this.eventBus.on("open-menu-link", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 打开目录-链接",
          click: () => {
            this.eventBus.off("open-menu-link", 输出事件总线);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 打开目录-图片",
          click: () => {
            this.eventBus.on("open-menu-image", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 打开目录-图片",
          click: () => {
            this.eventBus.off("open-menu-image", 输出事件总线);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 打开目录-av",
          click: () => {
            this.eventBus.on("open-menu-av", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 打开目录-av",
          click: () => {
            this.eventBus.off("open-menu-av", 输出事件总线);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 打开目录-内容",
          click: () => {
            this.eventBus.on("open-menu-content", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 打开目录-内容",
          click: () => {
            this.eventBus.off("open-menu-content", 输出事件总线);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 打开目录-更多面包屑",
          click: () => {
            this.eventBus.on("open-menu-breadcrumbmore", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 打开目录-更多面包屑",
          click: () => {
            this.eventBus.off("open-menu-breadcrumbmore", 输出事件总线);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 打开目录-inbox",
          click: () => {
            this.eventBus.on("open-menu-inbox", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 打开目录-inbox",
          click: () => {
            this.eventBus.off("open-menu-inbox", 输出事件总线);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 输入搜索",
          click: () => {
            this.eventBus.on("input-search", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 输入搜索",
          click: () => {
            this.eventBus.off("input-search", 输出事件总线);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 paste",
          click: () => {
            this.eventBus.on("paste", this.eventBusPaste);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 paste",
          click: () => {
            this.eventBus.off("paste", this.eventBusPaste);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 打开思源-url-plugin",
          click: () => {
            this.eventBus.on("open-siyuan-url-plugin", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 打开思源-url-plugin",
          click: () => {
            this.eventBus.off("open-siyuan-url-plugin", 输出事件总线);
          },
        },
        {
          icon: "iconSelect",
          label: "订阅 打开思源-url-block",
          click: () => {
            this.eventBus.on("open-siyuan-url-block", 输出事件总线);
          },
        },
        {
          icon: "iconClose",
          label: "取消订阅 打开思源-url-block",
          click: () => {
            this.eventBus.off("open-siyuan-url-block", 输出事件总线);
          },
        },
      ],
    });
    //#region
    menu.addSeparator();
    menu.addItem({
      icon: "iconSparkles",
      label: this.data[STORAGE_NAME].readonlyText || "只读",
      type: "readonly",
    });

    if (this.isMobile) {
      menu.fullscreen();
    } else {
      menu.open({
        x: rect.right,
        y: rect.bottom,
        isLeft: true,
      });
    }
  }
  //#endregion
}
