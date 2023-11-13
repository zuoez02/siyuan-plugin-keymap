const { Plugin, Dialog } = require("siyuan");

// copy from siyuan
const updateHotkeyTip = (hotkey) => {
  if (/Mac/.test(navigator.platform) || navigator.platform === "iPhone") {
    return hotkey;
  }

  const KEY_MAP = new Map(
    Object.entries({
      "⌘": "Ctrl",
      "⌃": "Ctrl",
      "⇧": "Shift",
      "⌥": "Alt",
      "⇥": "Tab",
      "⌫": "Backspace",
      "⌦": "Delete",
      "↩": "Enter",
    })
  );

  const keys = [];

  if (hotkey.indexOf("⌘") > -1) keys.push(KEY_MAP.get("⌘"));
  if (hotkey.indexOf("⇧") > -1) keys.push(KEY_MAP.get("⇧"));
  if (hotkey.indexOf("⌥") > -1) keys.push(KEY_MAP.get("⌥"));

  // 不能去最后一个，需匹配 F2
  const lastKey = hotkey.replace(/⌘|⇧|⌥/g, "");
  if (lastKey) {
    keys.push(KEY_MAP.get(lastKey) || lastKey);
  }

  return keys.join("+");
};

const sendGlobalShortcut = (app) => {
  const hotkeys = [window.siyuan.config.keymap.general.toggleWin.custom];
  app.plugins.forEach(plugin => {
      plugin.commands.forEach(command => {
          if (command.globalCallback) {
              hotkeys.push(command.customHotkey);
          }
      });
  });
  ipcRenderer.send(Constants.SIYUAN_HOTKEY, {
      languages: window.siyuan.languages["_trayMenu"],
      hotkeys
  });
};

/// END

let searchInput = '';

module.exports = class KeymapPlugin extends Plugin {
  onload() {
    this.addStatus();

    this.addScript();
  }

  showDialog() {
    const keys = window.siyuan.config.keymap;
    const general = keys.general;
    const editor = keys.editor;
    const plugin = keys.plugin;
    const types = {
      general: [],
      editor: {},
      plugin: {},
    };
    const pluginNames = {};
    for (const k in general) {
      types.general.push({
        key: window.siyuan.languages[k] || k,
        value: updateHotkeyTip(general[k]?.custom || general[k]?.default),
      });
    }
    for (const k in editor) {
      types.editor[k] = [];
      for (const j in editor[k]) {
        types.editor[k].push({
          key: window.siyuan.languages[j] || j,
          value: updateHotkeyTip(editor[k][j]?.custom || editor[k][j]?.default),
        });
      }
    }
    for (const k in plugin) {
      types.plugin[k] = [];
      const p = this.app.plugins.find((n) => n.name === k);
      const i18n = p?.i18n || {};
      pluginNames[k] = p?.displayName;
      for (const j in plugin[k]) {
        types.plugin[k].push({
          key: i18n[j] || j,
          value: updateHotkeyTip(plugin[k][j]?.custom || plugin[k][j]?.default),
        });
      }
    }
    const content = `<div class="keymap-plugin-container">
      <div class="keymap-plugin-search">
      <span>搜索</span>
        <input class="b3-text-field" type="input" id="keymap-plugin-search-input"/>
      </div>
      <div id="keymap-plugin-content"></div>
    </div>`;

    const render = () => {
      // genernal
      const generals = types.general.filter((v) => !searchInput || (searchInput && v.key.indexOf(searchInput) >= 0));
      let innerHTML = '';
      if (generals.length > 0) {
        innerHTML += `
        <div class="keymap-plugin-header">${
          window.siyuan.languages["general"]
        }</div>
        ${generals
          .map(
            (v) =>
              `<div class="keymap-plugin-item"><div class="keymap-plugin-title" title="${v.key}">${v.key}</div><div class="keymap-plugin-value config-keymap__key">${v.value}</div></div>`
          )
          .join("")}
        `;
      }
      
    // editor
    const editorKeys = Object.keys(types.editor);
    const editor = {};
    let showEditor = false;
    for (const k of editorKeys) {
      editor[k] = types.editor[k].filter((v1) => !searchInput || (searchInput && v1.key.indexOf(searchInput) >= 0));
      if (editor[k].length > 0) {
        showEditor = true;
      } else {
        delete editor[k];
      }
    }
    if (showEditor) {
      innerHTML += `
      <div class="keymap-plugin-header">${
        window.siyuan.languages["editor"]
      }</div>
      ${Object.keys(editor)
        .map(
          (v) => `
        <div class="keymap-plugin-header-2">${
          window.siyuan.languages[v] || v
        }</div>
        ${editor[v]
          .map(
            (v1) =>
              `<div class="keymap-plugin-item"><div class="keymap-plugin-title" title="${v1.key}">${v1.key}</div><div class="keymap-plugin-value config-keymap__key">${v1.value}</div></div>`
          )
          .join("")}
      `
        )
        .join("")}
      `;
    }
    // plugin
    const pluginKeys = Object.keys(types.plugin);
    const plugin = {};
    let showPlugin = false;
    for (const k of pluginKeys) {
      plugin[k] = types.plugin[k].filter((v1) => !searchInput || (searchInput && v1.key.indexOf(searchInput) >= 0));
      if (plugin[k].length > 0) {
        showPlugin = true;
      } else {
        delete plugin[k];
      }
    }
    if (showPlugin) {
      innerHTML += `
      <div class="keymap-plugin-header">${
        window.siyuan.languages["plugin"]
      }</div>
      ${Object.keys(plugin)
        .map(
          (v) => `
        <div class="keymap-plugin-header-2">${
          window.siyuan.languages[v] || v
        }</div>
        ${plugin[v]
          .map(
            (v1) =>
              `<div class="keymap-plugin-item"><div class="keymap-plugin-title" title="${v1.key}">${v1.key}</div><div class="keymap-plugin-value config-keymap__key">${v1.value}</div></div>`
          )
          .join("")}
      `
        )
        .join("")}
      `;
    }
    
      const contentEl = document.getElementById('keymap-plugin-content');
      if (contentEl) {
        contentEl.innerHTML = innerHTML;
      }
    }
    const dialog = new Dialog({
      width: "1120px",
      title: this.i18n.title,
      content,
    });
    render();

    const input = document.getElementById('keymap-plugin-search-input');
    if (!input) {
      return;
    }

    input.addEventListener('keyup', (e) => {
      searchInput = e.target.value || '';
      render();
    });
  }

  addStatus() {
    this.statusIconTemp = document.createElement("template");
    this.statusIconTemp.innerHTML = `<div class="toolbar__item">
    <svg>
        <use xlink:href="#iconKeymap"></use>
    </svg>
    <span id="tts-content" style="margin-left: 4px">${this.i18n.title}</span>
</div>`;

    this.addStatusBar({
      element: this.statusIconTemp.content.firstElementChild,
    });
    this.statusIconTemp =
      this.statusIconTemp.content.firstElementChild.querySelector("span");

    this.statusIconTemp.addEventListener("click", () => {
      this.showDialog();
    });
  }

  async addScript() {
    const arr = (await this.loadData("script.json")) || [];
    const keys = [];
    if (arr.length === 0) {
      await this.saveData("script.json", [
        {
          langKey: "hello world",
          script: "console.log('hello world')",
        },
      ]);
      return;
    }
    arr.forEach((conf) => {
      keys.push(conf.langKey);
      this.addCommand({
        langKey: conf.langKey,
        hotkey: conf.hotkey || '',
        callback: () => {
          eval(conf.script);
        },
      });
    });
    let shouldUpdate = false;
    for (const key of keys) {
      if (!this.i18n[key]) {
        shouldUpdate = true;
      }
    }
    if (!shouldUpdate) {
      return;
    }
    const formData = new FormData();
    formData.append(
      "path",
      `/data/plugins/${this.name}/i18n/${window.siyuan.config.lang}.json`
    );
    formData.append("isDir", "false");
    const content = JSON.stringify(
      [...new Set(keys)].reduce((obj, item) => {
        obj[item] = item;
        return obj;
      }, { ...this.i18n })
    );
    const file = new File(
      [
        new Blob([content], {
          type: "application/json",
        }),
      ],
      `${window.siyuan.config.lang}.json`
    );
    formData.append("file", file);
    fetch("/api/file/putFile", {
      method: "POST",
      body: formData,
    }).then((res) => {
      if (res.ok) {
        window.location.reload();
      }
    });
  }

  changeKeyMap() {
    window.siyuan.config.keymap = data;
    fetch("/api/setting/setKeymap", {
        body: JSON.stringify(data),
        method: 'POST'
    }, () => {
        sendGlobalShortcut(app);
    });
  }
};
