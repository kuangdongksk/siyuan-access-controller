import $ from "cash-dom";
import { Dialog } from "siyuan";
import { getData } from "../util/data";
import { Mask } from "../components/Mask";

export class NoteBookLocker {
  static onLayoutReady() {
    $("ul.b3-list[data-url]").each(async function (_index, notebook) {
      const currentNotebookId = notebook.dataset.url;
      const lockNoteMap = await getData<Map<string, string>>("lockedNoteBooks");
      const lockNoteIds = Array.from(lockNoteMap.keys()).join(",");

      // 如果笔记本没有被锁定则跳过
      if (!lockNoteIds.includes(currentNotebookId)) return;

      // 添加引用和搜索忽略
      addRefIgnore(currentNotebookId);
      addSearchIgnore(currentNotebookId);

      // 添加一个span元素，放到顶层以拦截
      const mask = new Mask(notebook);

      const span = mask.element;

      // 开始监听笔记事件
      span.addEventListener("click", () => {
        const dialog = new Dialog({
          title: "请输入密码",
          content: `
          <div class="b3-dialog__content">
            <input class="b3-text-field fn__block" placeholder="请输入密码" type="password" />
            <div class="b3-text-field__tip">请输入密码</div>
          </div>
          `,
          width: "300px",
          height: "200px",

          hideCloseIcon: true,
        });

        const input = $("input", dialog.element).first();
        const tip = $(".b3-text-field__tip", dialog.element).first();
        input.on("keydown", async (e: KeyboardEvent) => {
          if (e.key === "Enter") {
            const password = input.val();

            if (lockNoteMap.get(currentNotebookId) === password) {
              // 删除引用和搜索忽略
              this.removeRefIgnore(currentNotebookId);
              this.removeSearchIgnore(currentNotebookId);
              dialog.destroy();
              span.remove();
            } else {
              tip.text("密码错误");
            }
          }
        });
      });
    });
  }

  // 添加忽略引用搜索
  async addRefIgnore(noteId: string) {
    const content = `\nbox != '${noteId}'`;
    const path = "/data/.siyuan/refsearchignore";
    let raw = await this.getFile(path);
    if (raw.indexOf(content) !== -1) {
      raw = raw.replace(content, "");
    }
    this.putFileContent(path, raw + content);
  }

  // 删除忽略引用搜索
  async removeRefIgnore(noteId: string) {
    const content = `\nbox != '${noteId}'`;
    const path = "/data/.siyuan/refsearchignore";
    let raw = await this.getFile(path);
    if (raw.indexOf(content) !== -1) {
      raw = raw.replace(content, "");
    }
    this.putFileContent(path, raw);
  }

  // 添加忽略搜索
  async addSearchIgnore(noteId: string) {
    const content = `\nbox != '${noteId}'`;
    const path = "/data/.siyuan/searchignore";
    let raw = await this.getFile(path);
    if (raw.indexOf(content) !== -1) {
      raw = raw.replace(content, "");
    }
    this.putFileContent(path, raw + content);
  }

  // 删除忽略搜索
  async removeSearchIgnore(noteId: string) {
    const content = `\nbox != '${noteId}'`;
    const path = "/data/.siyuan/searchignore";
    let raw = await this.getFile(path);
    if (raw.indexOf(content) !== -1) {
      raw = raw.replace(content, "");
    }
    this.putFileContent(path, raw);
  }

  // 请求api
  // returnType json返回json格式，text返回文本格式
  async fetchSyncPost(url: string, data: any | FormData, returnType = "json") {
    const init: {
      method: string;
      body?: string | FormData;
    } = {
      method: "POST",
    };
    if (data) {
      if (data instanceof FormData) {
        init.body = data;
      } else {
        init.body = JSON.stringify(data);
      }
    }
    try {
      const res = await fetch(url, init);
      const res2 = returnType === "json" ? await res.json() : await res.text();
      return res2;
    } catch (e) {
      console.log(e);
      return returnType === "json"
        ? { code: e.code || 1, msg: e.message || "", data: null }
        : "";
    }
  }

  // 读取文件
  async getFile(storagePath: string) {
    if (!storagePath) return "";
    const data = await this.fetchSyncPost(
      "/api/file/getFile",
      { path: `${storagePath}` },
      "text"
    );
    if (data.indexOf('"code":404') !== -1) return "";
    return data;
  }

  // 写入文件内容
  async putFileContent(path: string, content: any) {
    const formData = new FormData();
    formData.append("path", path);
    formData.append("file", new Blob([content]));
    return fetch("/api/file/putFile", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to save file");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }
}
