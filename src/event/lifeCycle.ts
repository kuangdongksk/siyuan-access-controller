import { lockNoteBooks } from "./onLayoutReady/lockNoteBooks";

export async function OnLoad() {
  //
}

export async function OnLayoutReady() {
  lockNoteBooks();
}
