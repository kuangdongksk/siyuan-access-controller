import { EDataKey } from "..";
import { NoteBookLocker } from "../class/访问控制器";

export async function OnLoad(
  getData: (key: EDataKey) => Promise<any>,
  saveData: (key: EDataKey, value: any) => Promise<void>
) {
  NoteBookLocker.onLoad(getData, saveData);
}

export async function OnLayoutReady() {
  NoteBookLocker.onLayoutReady();
}
