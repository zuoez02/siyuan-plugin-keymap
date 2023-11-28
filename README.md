# 快捷键

1. 点击状态栏右下角的“快捷键”, 即可显示快捷键内容, 支持搜索
2. 自定义命令
3. 支持找到重复的快捷键，并点击高亮展示

## Usage 使用方法

修改`/data/storage/petal/siyuan-plugin-keymap/config.json`文件，内容为脚本配置，例如：

```json
[{"langKey":"打开首页", "script":"window.open('siyuan://blocks/20230103184046-v2ierte')"}，{"langKey":"输出内容", "script":"console.log('hello world')"}]
```

其中，langKey为提示内容，可以在命令面板中找到对应的快捷键，思源-设置-快捷键中找到内容进行手动切换。script为你要运行的javascript脚本。添加完成后需要手动刷新思源即可进行加载。