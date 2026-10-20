# 钢笔淡彩代码动画样片

两版技术原型，均为 HTML 实时动画、无音频、无外部素材或 CDN 依赖。不是参考 MV 的完整复刻，也没有 MP4 导出。

## 运行

克隆仓库后，在仓库根目录运行：

```sh
python3 -m http.server 8000
```

浏览器打开：

- 第二版：http://localhost:8000/examples/ink-watercolor/v2/play.html
- 第一版：http://localhost:8000/examples/ink-watercolor/v1/preview.html

也可下载整个样片目录，保持 HTML 和 JS 的相对路径后打开 HTML。GitHub 的源码页面不直接播放 HTML，本目录链接用于浏览源码；本地服务方式最稳妥。未配置 GitHub Pages。

## 第二版：逐笔成画（16 秒）

- 0–5 秒：245 条 SVG 路径逐笔生长，建筑、窗框、街道逐步成形。
- 5–8 秒：淡彩分块渐入。
- 8–16 秒：人物前进、腿部摆动、雨伞及衣摆运动，雨丝与涟漪持续更新。
- 支持暂停、进度拖动、重播；提供 `window.renderFrame(t)`、`window.pauseAt(t)`、`window.DURATION`。
- `motion-fixed.js` 使用定时驱动，修复当时预览环境动画帧回调未持续触发的问题。
- `build.py` 只使用 Python 标准库，可重新生成当前目录的 `play.html`：

```sh
python3 examples/ink-watercolor/v2/build.py
```

局限：角色为简化部件动画，尚无自然步态；水彩采用透明度和模糊过渡，尚未实现真实扩散；场景美术偏简单。仅验证画线与运动机制。

## 第一版：静态街景对照（12 秒）

Canvas 绘制静态街景和撑伞人物，叠加雨丝、涟漪、倒影与微幅镜头运动。人物基本静态，无逐笔绘制；原预览环境持续播放也未得到正确验证。用户反馈不符合预期，保留作复盘，不作为推荐版本。

## 方法文档

[完整制作方法与失败复盘](../../notes/source-05-ink-watercolor-code-animation.md)

本目录不含用户私人故事、聊天记录、参考视频下载文件或歌曲音频。
