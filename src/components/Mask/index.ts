import $ from "cash-dom";

export class Mask {
  parent: HTMLElement;
  element: HTMLDivElement = document.createElement("div");

  constructor(parent: HTMLElement, style?: Partial<CSSStyleDeclaration>) {
    this.parent = parent;
    this.parent.style.position = "relative";

    parent.appendChild(this.element);

    $(this.element).css({
      ...style,
    } as any);

    this.element.style.position = "absolute";
    this.element.style.top = "0";
    this.element.style.left = "0";
    this.element.style.width = "100%";
    this.element.style.height = "100%";
    this.element.style.zIndex = "1";
    this.element.style.cursor = "not-allowed";
    this.element.style.backgroundColor = "rgb(104 56 56 / 20%)";
    this.element.style.backdropFilter = "blur(5px)";
  }

  on(event: HTMLElementEventMap | string, handler: (e: Event) => void) {
    $(this.element).on(event as any, handler);
  }

  destroy() {
    this.element.remove();
  }
}
