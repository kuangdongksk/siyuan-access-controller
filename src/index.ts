import { Plugin } from "siyuan";
import { NoteBookLocker } from "./class/访问控制器";
import { OnLayoutReady, OnLoad } from "./event/lifeCycle";
import "./index.scss";

export enum EDataKey {
  上锁的笔记 = "上锁的笔记",
}

export default class AccessControllerPlugin extends Plugin {
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
  }
  //#endregion

  async onLayoutReady() {
    OnLayoutReady();

    this.eventBus.on("open-menu-doctree", (event) =>
      NoteBookLocker.onOpenMenuDocTree(event)
    );

    this.eventBus.on("open-menu-content", (event) =>
      NoteBookLocker.打开内容区菜单(event)
    );
    this.eventBus.on("click-blockicon", (event) =>
      NoteBookLocker.打开内容区菜单(event as any)
    );

    this.eventBus.on("ws-main", (event) => NoteBookLocker.onWSMain(event));
  }

  onunload() {
    //
  }

  uninstall() {
    //
  }
}

// sleep 函数
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
