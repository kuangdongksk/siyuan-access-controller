import $, { Cash } from "cash-dom";
import { IEventConfig } from "../Form/FormItem";

export class 蒙层 {
  父元素: Cash;
  蒙层: Cash = $(document.createElement("div"));
  事件列表: IEventConfig[];

  constructor(
    父元素: Cash,
    option?: {
      事件列表?: IEventConfig[];
      style?: Partial<CSSStyleDeclaration>;
      data?: { [key: string]: any };
    }
  ) {
    const { 事件列表, style } = option;
    this.父元素 = 父元素;
    this.父元素.css("position", "relative");

    this.父元素.append(this.蒙层);

    this.蒙层.css({
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

    事件列表 &&
      事件列表.forEach((item) => {
        this.蒙层.on(item.event, item.handler);
      });

    // 添加data
    this.蒙层.data(option?.data);
  }

  on(event: HTMLElementEventMap | string, handler: (e: Event) => void) {
    this.蒙层.on(event as any, handler);
  }

  destroy() {
    this.蒙层.remove();
  }
}
