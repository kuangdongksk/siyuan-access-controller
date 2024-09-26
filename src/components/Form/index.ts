import $, { Cash } from "cash-dom";
import { FormItem, IFormItemConfig } from "./FormItem";

export class Form {
  element = $(document.createElement("div"));
  private _formItems: FormItem[] = [];

  constructor(config: IFormItemConfig[], parent?: Cash) {
    if (parent) {
      parent.append(this.element);
    }

    this.element.addClass("form");
    this.element.css({
      width: "100%",
      height: "100%",
    });

    config.forEach((item) => {
      this._formItems.push(new FormItem(this, item));
    });
  }

  get items() {
    return this._formItems;
  }

  get values() {
    return this._formItems.reduce((acc, cur) => {
      return {
        ...acc,
        ...cur.value,
      };
    }, {});
  }
}
