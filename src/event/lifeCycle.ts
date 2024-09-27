import { EDataKey } from "..";
import { NoteBookLocker } from "../class/NoteBookLocker";

export async function OnLoad(
  getData: (key: EDataKey) => Promise<any>,
  saveData: (key: EDataKey, value: any) => Promise<void>,
  i18n: any
) {
  NoteBookLocker.onLoad(getData, saveData, i18n);
}

export async function OnLayoutReady() {
  NoteBookLocker.onLayoutReady();
}
