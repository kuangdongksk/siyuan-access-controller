import { IEventBusMap } from "siyuan";

export interface IEventBusDetailBase {
  app: string;
  callback: string;
  cmd: string;
  code: number;
  msg: string;
  pushMode: number;
  reqId: number;
  sid: string;
}

export interface IEventBusMountDetail extends IEventBusDetailBase {
  cmd: "mount";
  data: {
    box: {
      id: string;
      name: string; // 笔记本名称
      icon: string; // 笔记本图标,emoji目录下的相对路径
      sort: number; // 笔记本排序
      sortMode: number; // 笔记本排序模式
      closed: boolean; // 笔记本是否关闭
      dueFlashcardCount: 0;
      flashcardCount: number; // 笔记本中的闪卡数量
      newFlashcardCount: number; // 笔记本中的新闪卡数量
    };
    existed: false;
  };
}

export interface IEventBusUnmountDetail extends IEventBusDetailBase {
  cmd: "unmount";
  data: {
    box: string; // 笔记本id
  };
}

export interface IEventBusDetail {
  cmd: "backgroundtask";
  data: {
    tasks: [];
  };
}

export type TEvent = IEventBusMap[keyof IEventBusMap];

export function 输出事件总线(event: { detail: any }) {
  const { detail } = event;

  switch (detail.cmd) {
    case "mount":
      break;
    case "unmount":
      break;
    case "backgroundtask":
      break;
    case "input-search":
      break;
    default:
      console.log("🚀 事件总线日志", event);
      break;
  }
}
