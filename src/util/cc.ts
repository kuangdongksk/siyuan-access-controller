// 功能：简单锁定笔记
// version 0.0.2
// 功能简介：
// 1. 支持给多个笔记添加不同的密码
// 2. 可自定义多少秒内不再输入密码
// 3. 锁定期间忽略搜索和引用搜索（锁定或解锁后30秒后生效，这是思源忽略文件延迟决定的）
// 4. 复制笔记ID的方法：
//    笔记上右键 => 设置 => 打开的对话框中最顶部点击“复制ID”即可
// 使用帮助：https://ld246.com/article/1725612799463
// 更新记录：
// 0.0.2 修复了当窗口较小时，密码框可能超出屏幕外的bug；改进了当拖动窗口大小时，密码框始终在窗口内。

(() => {
  // 定义锁定的笔记
  const lockNotes = {
    // 前面是笔记id，后面是笔记密码，请根据自己情况修改
    "20240918162311-5otu4ko": "awsd31302",
  };

  // 定义多少秒内无需再输入密码，默认60秒，如果想使用分钟表示，比如10分钟可以使用 10*60代表即可。
  const keepTime = 60;

  // 密码输入框显示方式，notePos 默认，笔记的位置，通常显示在右侧；mouseClick 鼠标点击位置(mouseClick方式不稳定)
  const inputPosBy = "notePos";

  // 微调输入框的显示位置，通常不需要改，如果你想自定义位置可以在这里微调
  const inputLeft = 0; // 数值越大越向右，支持负值和小数点
  const inputTop = 0; // 数值越大越向下，支持负值和小数点

  //////// 以下代码非必要勿动 //////////////////////

  // todo
  // 打开或预览时限制，嵌入内容隐藏或引用链接隐藏，已打开内容关闭，任意文件夹加密

  // 监听笔记列表渲染完成
  whenElementExist("ul.b3-list[data-url]").then(async (el) => {
    // 防止更多笔记列表尚未渲染完成（笔记目录只渲染第一级，一般100毫秒足够了）
    await sleep(150);
    // 获取所有锁定的笔记
    const lockNoteIds = Object.keys(lockNotes);
    // 监听笔记打开事件
    document.querySelectorAll("ul.b3-list[data-url]").forEach(async (note) => {
      let inputPassword = false;
      const noteId = note.dataset.url;
      if (!lockNoteIds.includes(noteId)) return;
      // 注入css
      //addLockStyle(noteId);
      // 添加引用和搜索忽略
      addRefIgnore(noteId);
      addSearchIgnore(noteId);
      //获取笔记标题和箭头按钮
      const noteLi = note.firstElementChild;
      const arrowBtn = noteLi.querySelector(".b3-list-item__arrow");
      let lockTimer;
      // 笔记打开事件
      const onOpen = async (event) => {
        // 等待打开菜单事件
        const arrowClassList = arrowBtn.classList.toString();
        await whenElementExist(() => {
          return (
            noteLi.nextElementSibling?.tagName === "UL" &&
            arrowClassList !== arrowBtn.classList.toString() &&
            arrowBtn.classList.contains("b3-list-item__arrow--open")
          );
        });
        //打开时且未输入过密码时执行
        if (inputPassword === false) {
          // 删除系统展开的菜单
          arrowBtn.parentElement.click();
          //if(noteLi.nextElementSibling) noteLi.nextElementSibling.remove();
          // 正在输入中不再打开新的输入框
          const input = document.querySelector(
            "#lockNotePasswordInput" + noteId
          );
          if (input) {
            inputMovePos(event, noteLi, input);
            input.focus();
            return;
          }
          // 等待输入
          const password = await showInput(event, noteId, noteLi);
          if (password) {
            // 通过密码展开菜单
            inputPassword = true;
            if (!arrowBtn.classList.contains("b3-list-item__arrow--open")) {
              arrowBtn.parentElement.click();
              //await whenElementExist(()=>noteLi.nextElementSibling?.tagName === 'UL');
            }
            // 重新锁定笔记函数
            const lockNoteFn = () => {
              inputPassword = false;
              if (lockTimer) clearTimeout(lockTimer);
              removeLockBtn(noteLi);
              //addLockStyle(noteId);
              if (arrowBtn.classList.contains("b3-list-item__arrow--open"))
                arrowBtn.parentElement.click();
              addRefIgnore(noteId);
              addSearchIgnore(noteId);
              console.log(noteId + " locked");
            };
            addLockBtn(noteLi, lockNoteFn);
            //removeLockStyle(noteId);
            removeRefIgnore(noteId);
            removeSearchIgnore(noteId);
            // 指定时间后需要重新输入密码
            lockTimer = setTimeout(lockNoteFn, keepTime * 1000);
          }
        }
      };
      // 开始监听笔记事件
      noteLi.addEventListener("click", onOpen);
      document.addEventListener("keydown", onOpen);
    });
  });

  // 弹出输入密码
  function showInput(event, noteId, noteLi) {
    return new Promise((resolve, reject) => {
      // 创建css
      if (!document.querySelector("#lockNotePasswordInputStyle")) {
        const style = document.createElement("style");
        style.id = "lockNotePasswordInputStyle";
        style.textContent = `
              input.lockNotePasswordInput::placeholder {
                  font-size: 12px;
              }`;
        document.head.appendChild(style);
      }
      // 创建输入框
      window.siyuan.zIndex++;
      const inputEl = document.createElement("div");
      inputEl.class = "lockNotePasswordInputEl";
      inputEl.style.position = "absolute";
      inputEl.style.zIndex = window.siyuan.zIndex;
      const input = document.createElement("input");
      input.id = "lockNotePasswordInput" + noteId;
      input.className = "lockNotePasswordInput";
      input.placeholder = "请输入密码，Enter提交，ESC取消";
      input.type = "password";
      input.style.color = "var(--b3-theme-on-background)";
      input.style.width = "186px";
      input.style.backgroundColor = "var(--b3-theme-background)";
      input.style.border = "0";
      input.style.borderRadius = "var(--b3-border-radius)";
      input.style.boxShadow = "inset 0 0 0 .6px var(--b3-theme-on-surface)";
      input.style.padding = "4px 8px";
      const inputTips = document.createElement("div");
      inputTips.className = "lockNotePasswordInputTips";
      inputTips.style.position = "absolute";
      inputTips.style.top = "4px";
      inputTips.style.right = "4px";
      inputTips.style.backgroundColor = "var(--b3-theme-error)";
      inputTips.style.color = "var(--b3-theme-on-error)";
      inputTips.style.fontSize = "13px";
      inputTips.style.padding = "0 5px";
      inputTips.style.borderRadius = "var(--b3-border-radius)";
      inputTips.style.display = "none";
      inputEl.appendChild(input);
      inputEl.appendChild(inputTips);
      document.body.appendChild(inputEl);
      // 计算输入框位置
      inputMovePos(event, noteLi, input);
      // 获取焦点
      setTimeout(() => {
        input.focus();
      }, 100);
      // 监听esc事件
      const globalKeydownHandler = (e) => {
        if (e.key === "Escape") {
          // 移除输入框
          if (input) document.body.removeChild(inputEl);
          document.removeEventListener("keydown", globalKeydownHandler);
          resolve(false);
        }
      };
      document.addEventListener("keydown", globalKeydownHandler);
      const resizeHandler = inputMovePos.bind(null, event, noteLi, input);
      window.addEventListener("resize", resizeHandler);
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          const password = input.value;
          if (password === lockNotes[noteId]) {
            // 移除输入框
            document.body.removeChild(inputEl);
            document.removeEventListener("keydown", globalKeydownHandler);
            window.removeEventListener("resize", resizeHandler);
            resolve(true);
          } else {
            inputTips.innerHTML = "密码错误";
            inputTips.style.display = "block";
            setTimeout(() => {
              inputTips.style.display = "none";
            }, 1500);
          }
        } else if (e.key === "Escape") {
          // 移除输入框
          document.body.removeChild(inputEl);
          document.removeEventListener("keydown", globalKeydownHandler);
          window.removeEventListener("resize", resizeHandler);
          resolve(false);
        }
      });
    });
  }

  // 移动输入框位置
  function inputMovePos(event, noteLi, input) {
    const inputEl = input.parentElement;
    const noteLiRect = noteLi.getBoundingClientRect();
    // 计算输入框位置
    let leftPos = noteLiRect.left + noteLi.offsetWidth - 45;
    let topPos = noteLiRect.top;
    if (inputPosBy === "mouseClick") {
      leftPos = (event.pageX ? event.pageX + 20 : 0) || leftPos;
      topPos = (event.pageY ? event.pageY + 20 : 0) || topPos;
    }
    let left = leftPos + inputLeft;
    if (left > window.innerWidth - input.offsetWidth) {
      left = window.innerWidth - input.offsetWidth - 10;
    }
    if (left < 0) left = 0;
    let top = topPos + inputTop;
    if (top > window.innerHeight - input.offsetHeight) {
      top = window.innerHeight - input.offsetHeight - 10;
    }
    if (top < 0) top = 0;
    inputEl.style.left = left + "px";
    inputEl.style.top = top + "px";
  }

  // 添加立即锁定按钮
  async function addLockBtn(noteLi, callback = () => {}) {
    const lockBtn = document.createElement("span");
    lockBtn.classList.add(
      "b3-list-item__action",
      "b3-tooltips",
      "b3-tooltips__w"
    );
    lockBtn.dataset.type = "lock-note";
    lockBtn.ariaLabel = "立即锁定";
    lockBtn.innerHTML = `<svg><use xlink:href="#iconLock"></use></svg>`;
    lockBtn.onclick = callback;
    const moreBtn = await whenElementExist(() =>
      noteLi.querySelector('span[data-type="more-root"]')
    );
    noteLi.insertBefore(lockBtn, moreBtn.nextElementSibling);
  }

  // 删除立即锁定按钮
  function removeLockBtn(noteLi) {
    const lockBtn = noteLi.querySelector('span[data-type="lock-note"]');
    if (lockBtn) lockBtn.remove();
  }

  // 添加忽略引用搜索
  async function addRefIgnore(noteId) {
    const content = `\nbox != '${noteId}'`;
    const path = "/data/.siyuan/refsearchignore";
    let raw = await getFile(path);
    if (raw.indexOf(content) !== -1) {
      raw = raw.replace(content, "");
    }
    putFileContent(path, raw + content);
  }

  // 删除忽略引用搜索
  async function removeRefIgnore(noteId) {
    const content = `\nbox != '${noteId}'`;
    const path = "/data/.siyuan/refsearchignore";
    let raw = await getFile(path);
    if (raw.indexOf(content) !== -1) {
      raw = raw.replace(content, "");
    }
    putFileContent(path, raw);
  }

  // 添加忽略搜索
  async function addSearchIgnore(noteId) {
    const content = `\nbox != '${noteId}'`;
    const path = "/data/.siyuan/searchignore";
    let raw = await getFile(path);
    if (raw.indexOf(content) !== -1) {
      raw = raw.replace(content, "");
    }
    putFileContent(path, raw + content);
  }

  // 删除忽略搜索
  async function removeSearchIgnore(noteId) {
    const content = `\nbox != '${noteId}'`;
    const path = "/data/.siyuan/searchignore";
    let raw = await getFile(path);
    if (raw.indexOf(content) !== -1) {
      raw = raw.replace(content, "");
    }
    putFileContent(path, raw);
  }

  // 添加样式，防止通过快回车或捷键等意外显示（暂未用到）
  function addLockStyle(noteId) {
    const style = `ul.b3-list[data-url="${noteId}"] > ul {display:none;}`;
    const styleEl = document.createElement("style");
    styleEl.id = "lock-style-" + noteId;
    styleEl.textContent = style;
    document.head.appendChild(styleEl);
  }

  // 当通过密码验证后移除隐藏样式（暂未用到）
  function removeLockStyle(noteId) {
    document.querySelector("#lock-style-" + noteId).remove();
  }

  // 请求api
  // returnType json返回json格式，text返回文本格式
  async function fetchSyncPost(url, data, returnType = "json") {
    const init = {
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
  async function getFile(storagePath) {
    if (!storagePath) return "";
    const data = await fetchSyncPost(
      "/api/file/getFile",
      { path: `${storagePath}` },
      "text"
    );
    if (data.indexOf('"code":404') !== -1) return "";
    return data;
  }

  // 写入文件内容
  async function putFileContent(path, content) {
    const formData = new FormData();
    formData.append("path", path);
    formData.append("file", new Blob([content]));
    return fetch("/api/file/putFile", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (response.ok) {
          //console.log("File saved successfully");
        } else {
          throw new Error("Failed to save file");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }
})();
