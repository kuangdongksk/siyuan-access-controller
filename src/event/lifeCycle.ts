import { NoteBookLocker } from "../class/NoteBookLocker";

export async function OnLoad() {
  //
}

export async function OnLayoutReady() {
  NoteBookLocker.onLayoutReady();
}
