import { Cash } from "cash-dom";
import { IEventConfig } from "../../../../components/Form/FormItem";
import { 蒙层 } from "../../../../components/蒙层";
import { 表单对话框 } from "../表单对话框";

export class 拦截蒙层 extends 蒙层 {
  constructor(
    父元素: Cash,
    option: {
      eventList?: IEventConfig[];
      style?: Partial<CSSStyleDeclaration>;
      data?: { [key: string]: any };
    },
    访问控制数据: {
      i18n: { [key: string]: string };
      笔记数据: { [key: string]: string };
      当前id: string;
    }
  ) {
    super(父元素, option);

    const { i18n, 笔记数据, 当前id } = 访问控制数据;

    this.事件列表 = [
      {
        event: "click",
        handler: (event) => {
          event.stopPropagation();
          const { 表单, 对话框 } = 表单对话框(i18n.请输入密码);
          表单.配置 = [
            {
              fieldName: "password",
              fieldType: "password",
              label: i18n.密码,
              tip: i18n.请输入密码,
              placeholder: i18n.请输入密码,
              eventList: [
                {
                  event: "keydown",
                  handler: (e: KeyboardEvent) => {
                    if (e.key === "Enter") {
                      const password = 表单.所有项[0].value.password;
                      if (笔记数据[当前id] === password) {
                        this.父元素.removeClass("note-book-Locker-locked");
                        对话框.destroy();
                        this.destroy();
                      } else {
                        表单.所有项[0].input.val("");
                        表单.所有项[0].tip.text(i18n.密码错误);
                      }
                    }
                  },
                },
              ],
            },
          ];
        },
      },
    ];

    this.事件列表.forEach((item) => {
      this.蒙层.on(item.event, item.handler);
    });
  }
}
