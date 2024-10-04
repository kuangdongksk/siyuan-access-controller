import $, { Cash } from "cash-dom";
import { FormItem, IFormItemConfig } from "./FormItem";

export class Form {
  表单 = $(document.createElement("div"));
  private _配置: IFormItemConfig[] = [];
  private _表单项: FormItem[] = [];

  /**
   *
   * @param 配置 表单项配置
   * @param 父元素
   */
  constructor(配置: IFormItemConfig[], 父元素?: Cash) {
    if (父元素) {
      父元素.append(this.表单);
    }

    this.表单.addClass("form");
    this.表单.css({
      width: "100%",
      height: "100%",
    });

    this._配置 = 配置;
    this._配置.forEach((item) => {
      this._表单项.push(new FormItem(this, item));
    });
  }

  set 配置(配置: IFormItemConfig[]) {
    this.销毁所有表单项();
    this._表单项 = [];
    this._配置 = 配置;
    this._配置.forEach((item) => {
      this._表单项.push(new FormItem(this, item));
    });
  }

  get 配置() {
    return this._配置;
  }

  get 所有项() {
    return this._表单项;
  }

  get 所有值() {
    return this._表单项.reduce((acc, cur) => {
      return {
        ...acc,
        ...cur.value,
      };
    }, {});
  }

  销毁() {
    this.表单.remove();
  }

  销毁所有表单项() {
    this._表单项.forEach((item) => {
      item.销毁();
    });
  }
}
