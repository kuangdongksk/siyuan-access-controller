import $ from "cash-dom";
import { Form } from ".";

export interface IFormItemConfig {
  fieldName: string;
  fieldType: "text" | "password";
  label: string;
  tip: string;

  initialValue?: string;
  /** 输入组件label的宽度，默认80 */
  labelWidth?: number;
  placeholder?: string;
  eventList?: { event: string; handler: (e: any) => void }[];
}

export class FormItem {
  element = $(document.createElement("div"));
  label = $(document.createElement("div"));
  space = $(document.createElement("span"));
  input = $(document.createElement("input"));

  tip = $(document.createElement("div"));
  private _value: string;

  constructor(parent: Form, config: IFormItemConfig) {
    const {
      fieldName,
      fieldType,
      label,
      tip,
      initialValue,
      labelWidth = 80,
      placeholder,
      eventList,
    } = config;

    $(parent.element).append(this.element);
    this.element.addClass("fn__flex b3-label config__item");

    this.label.css({
      width: labelWidth + "px",
      textAlign: "right",
    });
    this.label.text(label);
    this.label.css({
      display: "flex",
      alignItems: "center",
    });
    this.tip.addClass("b3-label__text");
    this.tip.text(tip);
    this.space.addClass("fn__space");
    this.input.addClass("b3-text-field fn__flex-center fn__flex-1");
    this.input.attr("type", fieldType);
    this.input.attr("name", fieldName);
    this.input.attr("placeholder", placeholder);
    initialValue && this.input.val(initialValue);
    eventList &&
      eventList.forEach((item) => this.input.on(item.event, item.handler));

    this.element.append(
      this.label,
      this.space,
      this.input,
      this.space.clone(),
      this.tip
    );
  }

  get value() {
    return {
      [this.input.attr("name")]: this.input.val(),
    };
  }
}
