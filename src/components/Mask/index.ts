import $, { Cash } from "cash-dom";
import { IEventConfig } from "../Form/FormItem";

export class Mask {
  parent;
  element = $(document.createElement("div"));

  constructor(
    parent: Cash,
    option?: {
      eventList?: IEventConfig[];
      style?: Partial<CSSStyleDeclaration>;
      data?: { [key: string]: any };
    }
  ) {
    const { eventList, style } = option;
    this.parent = parent;
    this.parent.css("position", "relative");

    this.parent.append(this.element);

    this.element.css({
      ...style,
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "1",
      cursor: "not-allowed",
      backdropFilter: "blur(5px)",
    } as any);

    eventList &&
      eventList.forEach((item) => {
        this.element.on(item.event, item.handler);
      });

    // 添加data
    this.element.data(option?.data);
  }

  on(event: HTMLElementEventMap | string, handler: (e: Event) => void) {
    this.element.on(event as any, handler);
  }

  destroy() {
    this.element.remove();
  }
}
