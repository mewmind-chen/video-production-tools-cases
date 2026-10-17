# News Decoder 栏目格式

每周一一期，75–90 秒。讲上周最重要的一条供应链新闻：**发生了什么 → 对你的物料清单意味着什么 → 这周该做什么 → 我们还不知道什么**。
结构和画面固定，每期只改 `episode.json`。栏目颜色是电光蓝；栏目标识是荧光笔"解码"新闻里的关键句；声音标识是电报机嘀嗒加两声提示音。

## 场景

| type | 必须 | 底色 | 做什么 | 每期要填的 |
|---|---|---|---|---|
| `open` | ✅ | 墨黑 | **钩子**：撕页日历，旧日期被划掉掉落，新日期露出来；下面两行结论 | `kicker` `from`[月,日] `to`[月,日] `fromYear` `toYear` `tail`[两行] `source` |
| `intro` | ✅ | 墨黑 | 频道统一的自我介绍（LEO 胸牌，`pipeline/reel/brand.js`） | 固定一句：`I'm Leo. I trade components in Shenzhen.` |
| `what` | ✅ | 纸白 | 新闻卡（官方表态 + 印章），荧光笔刷过关键句；时间轴上旧日期挪到新日期 | `kicker` `stamp`[机构,日期] `headline`[三行，最后一行被高亮] `from` `to` `delta` `slideLine` `source` |
| `rules` | 选 | 墨黑 | 对比：暂停的（虚线框）vs 仍然有效的（红框 + 元素方块） | `paused`{label, items, line} `active`{label, tiles[[符号,名称]], line, note, noteLine, noteAt} `source` |
| `bom` | 选 | 纸白 | 元素 → 用在什么元器件里（目前有 `mlcc`、`magnet` 两种图） | `links`[{syms, part, detail, icon, line}] `note` `source` |
| `date2` | 选 | 电光蓝 | 第二个日期：日历页 + 元素方块 + 适用范围 | `kicker` `date` `tiles` `label` `note`[两行] `uses` `usesLine` `source` |
| `calendar` | 选 | 墨黑 | 日历陷阱：几个月的时间轴，日期标记 + 区间（红 = 风险，绿 = 你真正的截止日） | `start` `end` `markers`[{date,label,line,at,hot}] `bands`[{from,to,label,line,at,tone}] `source` |
| `actions` | ✅ | 纸白 | 本周三件事，一句一张卡 | `title` `items`[{tag, icon, head, sub, line}] |
| `unknown` | ✅ | 墨黑 | 我们不知道的 + 要盯的事件 | `question`[两行] `answer` `watch`[标签,事件,日期] `watchLine` `source` |
| `outro` | ✅ | 墨黑 | 频道统一片尾卡（胸牌 + 找料入口 + 排期 + 来源） | `sources`[最多 4 条] |

"选"的场景按新闻内容挑 1–3 个，顺序可调；`unknown` 必须有：不知道就说不知道。

## 时间怎么对上

和 Market Pulse 一样：元素出现时间写**第几句台词**（`line`）和**这句进行到几成**（`at`）。

## 制作命令

`make.sh` 会先运行 `node pipeline/check.mjs episodes/<id>` 自动检查（日期、周数、固定台词、台词编号、必填字段、文字长度、念法、时长、FACTS.md），有错误就停下。


```bash
cd pipeline
python3 tts.py ../episodes/<id>
node formats/news-decoder/music.mjs ../episodes/<id>
node render.mjs ../episodes/<id> --sheet 2,8,15,25,40,55,70,85
node render.mjs ../episodes/<id>
```

## 本栏目的事实红线

- 新闻卡上的标题是**我们对官方表态的概括**，卡片标"OFFICIAL STATEMENT"和机构、日期，不仿冒任何媒体的版式。
- 官方没说的不替它说（例：商务部没写明稀土暂停期也延到 1-10，旁白只说"那次休战暂停了稀土新规"）。
- "No extension yet" 这类截至某日的说法，发布当天再查一次。
