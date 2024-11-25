import FormInput from "./form-input.svelte";
import FormWrap from "./form-wrap.svelte";

const Form = { Wrap: FormWrap, Input: FormInput };

export type TFieldsType =
  | "checkbox"
  | "textinput"
  | "password"
  | "textarea"
  | "number"
  | "button"
  | "select"
  | "slider";

export interface ISettingItemCore {
  type: TFieldsType;
  key: string;
  value: any;
  placeholder?: string;
  slider?: {
    min: number;
    max: number;
    step: number;
  };
  options?: { [key: string | number]: string };
  button?: {
    label: string;
    callback: () => void;
  };
}

export interface ISettingItem extends ISettingItemCore {
  title: string;
  description: string;
  direction?: "row" | "column";
}
export interface ISettingUtilsItem extends ISettingItem {
  action?: {
    callback: () => void;
  };
  createElement?: (currentVal: any) => HTMLElement;
  getEleVal?: (ele: HTMLElement) => any;
  setEleVal?: (ele: HTMLElement, val: any) => void;
}
export default Form;
export { FormInput, FormWrap };
