const { Plugin, Dialog } = require("siyuan");

const updateHotkeyTip = (hotkey) => {
  if (/Mac/.test(navigator.platform) || navigator.platform === "iPhone") {
      return hotkey;
  }

  const KEY_MAP = new Map(Object.entries({
      "⌘": "Ctrl",
      "⌃": "Ctrl",
      "⇧": "Shift",
      "⌥": "Alt",
      "⇥": "Tab",
      "⌫": "Backspace",
      "⌦": "Delete",
      "↩": "Enter",
  }));

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


module.exports = class KeymapPlugin extends Plugin {
  onload() {
    this.addStatus();
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
    }
    const pluginNames = {};
    for (const k in general) {
      types.general.push({ key: window.siyuan.languages[k] || k, value: updateHotkeyTip(general[k]?.custom || general[k]?.default) });
    }
    for (const k in editor) {
      types.editor[k] = [];
      for (const j in editor[k]) {
        types.editor[k].push({ key: window.siyuan.languages[j] || j, value: updateHotkeyTip(editor[k][j]?.custom || editor[k][j]?.default) });
      }
    }
    for (const k in plugin) {
      types.plugin[k] = [];
      const p = this.app.plugins.find(n => n.name === k);
      const i18n = p?.i18n || {};
      pluginNames[k] = p?.displayName;
      for (const j in plugin[k]) {
        types.plugin[k].push({ key: i18n[j] || j, value: updateHotkeyTip(plugin[k][j]?.custom || plugin[k][j]?.default) });
      }
    }
    const content = `<div class="keymap-plugin-container">
      <div class="keymap-plugin-header">${window.siyuan.languages['general']}</div>
      ${types.general.map((v) => `<div class="keymap-plugin-item"><div class="keymap-plugin-title" title="${v.key}">${v.key}</div><div class="keymap-plugin-value config-keymap__key">${v.value}</div></div>`).join('')}
      <div class="keymap-plugin-header">${window.siyuan.languages['editor']}</div>
      ${Object.keys(types.editor).map((v) => `
        <div class="keymap-plugin-header-2">${window.siyuan.languages[v] || v}</div>
        ${types.editor[v].map((v1) => `<div class="keymap-plugin-item"><div class="keymap-plugin-title" title="${v1.key}">${v1.key}</div><div class="keymap-plugin-value config-keymap__key">${v1.value}</div></div>`).join('')}
      `).join('')}
      <div class="keymap-plugin-header">${window.siyuan.languages['plugin']}</div>
      ${Object.keys(types.plugin).map((v) => `
        <div class="keymap-plugin-header-2">${pluginNames[v] || v}</div>
        ${types.plugin[v].map((v1) => `<div class="keymap-plugin-item"><div class="keymap-plugin-title" title="${v1.key}">${v1.key}</div><div class="keymap-plugin-value config-keymap__key">${v1.value}</div></div>`).join('')}
      `).join('')}
    </div>`
    const dialog = new Dialog({
      width: '1120px',
      title: this.i18n.title,
      content,
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

    this.statusIconTemp.addEventListener('click', () => {
      this.showDialog();
    })
  }
}