import {
  getBackend,
  getFrontend,
  ICard,
  ICardData,
  IModel,
  Plugin,
} from "siyuan";
import { NoteBookLocker } from "./class/NoteBookLocker";
import { OnLayoutReady, OnLoad } from "./event/lifeCycle";
import "./index.scss";

export enum EDataKey {
  上锁的笔记 = "上锁的笔记",
}

export default class AccessControllerPlugin extends Plugin {
  private customTab: () => IModel;
  private 是移动端吗: boolean;

  //#region onLoad
  async onload() {
    const 前端 = getFrontend();
    this.是移动端吗 = 前端 === "mobile" || 前端 === "browser-mobile";
    if (this.是移动端吗) {
      return;
    }

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
  }
  //#endregion

  onLayoutReady() {
    const 后端 = getBackend();
    if (this.是移动端吗) {
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

  private eventBusPaste(event: any) {
    // 如果需异步处理请调用 preventDefault， 否则会进行默认处理
    event.preventDefault();
    // 如果使用了 preventDefault，必须调用 resolve，否则程序会卡死
    event.detail.resolve({
      textPlain: event.detail.textPlain.trim(),
    });
  }
}
