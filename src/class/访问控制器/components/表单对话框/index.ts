import { Dialog } from "siyuan";
import $ from "cash-dom";
import { Form } from "../../../../components/表单";

function 创建对话框(标题: string) {
  const 对话框 = new Dialog({
    title: 标题,
    content: "",
    width: "600px",
    height: "400px",
    hideCloseIcon: true,
  });
  const $对话框内容 = $(".b3-dialog__body", 对话框.element);
  return {
    对话框,
    $对话框内容,
  };
}

export function 表单对话框(标题: string) {
  const { 对话框, $对话框内容 } = 创建对话框(标题);
  const 表单 = new Form([], $对话框内容);

  return {
    对话框,
    表单,
  };
}
