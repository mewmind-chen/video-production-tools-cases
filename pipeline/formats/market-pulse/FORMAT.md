# Market Pulse 栏目格式

每周三一期，60–80 秒。结构和画面固定，**每期只改 `episode.json`**：数据、台词、来源。不用写代码。

## 为什么固定

- 观众认得出：同样的片头心跳、同样的行情条、同样的顺序，看第二期就知道这是什么。
- 制作快：一期从选题到成片约 30 分钟，大部分时间花在核对数字上。
- 能对比：每周同一位置放同类数字，复盘时能看出哪一段留人。

## 七段结构

| # | type | 底色 | 做什么 | 每期要填的 |
|---|---|---|---|---|
| 1 | `open` | 墨黑 | 一个反常的数字：旧价划掉，新价滚动到位，配产品图 | `kicker` `product` `productLabel` `prefix` `from` `to` `suffix` `after`（两行结论） `source` |
| 2 | `intro` | 墨黑 | 频道统一的自我介绍：LEO 的胸牌甩进来（`pipeline/reel/brand.js`），下面是本栏目的心电图，声音标识是心跳 | 只有一句固定台词：`I'm Leo. I trade components in Shenzhen.`（不报栏目名，栏目名在画面上） |
| 3 | `spot` | 纸白 | 现货：**只画报道过的点**，点之间虚线连，事件用红色竖线 | `title` `yMax` `yStep` `months` `years` `points[]` `events[]` `note` `source` |
| 4 | `contract` | 墨黑 | 合约：季度涨幅柱 → 叠成台阶（价格累积） → 倍数 | `kicker` `title` `bars[]` `quote` `quoteLine` `stairsLine` `stairsAt` `base` `final` `finalLine` `note` `source` |
| 5 | `street` | 电光蓝 | 市场声音：一句商户或业内的话，**必须标"观点，不是预测"** | `label` `quote`（两行） `attribution` `years` `range` |
| 6 | `actions` | 纸白 | 本周三件事，一句一张卡；第三条尽量引到下一条视频 | `title` `items[]`（`tag` `icon`：stairs / clock / lens，`head` `sub` `line`） |
| 7 | `outro` | 墨黑 | 频道统一片尾卡（`pipeline/reel/brand.js`）：栏目名、一周排期、找料入口、来源，加栏目的心电图 | `sources[]`（最多 4 条），`cta: false` 可关掉找料入口 |

顶部行情条读 `episode.json` 的 `ticker`：`[名称, 数值, "up" 或 "down"]`。F 表示预测。

## 时间怎么对上

元素出现的时间不写秒数，写**第几句台词**（`line`，从 0 开始）和**这句进行到几成**（`at`，0–1）。配音重新生成后，画面和音效会自动跟上。

例：`{ "x": 12, "v": 1400, "label": "¥1,400+", "line": 2, "at": 0.55, "hot": true }` 表示在本场第 3 句说到一半多时出现这个点，用红色并带脉冲。

## 某周没有某类数据怎么办

- 没有合约价新闻：`contract` 场景照样做，用最近一次的预测，并在 `note` 写清楚日期。
- 没有现货报价：这周不做 Market Pulse，换 Playbook，不要硬凑。
- 场景顺序不能改，也不能删（观众靠固定结构认栏目）。如果真要改结构，先改这份文档。

## 制作命令

`make.sh` 会先运行 `node pipeline/check.mjs episodes/<id>` 自动检查（日期、周数、固定台词、台词编号、必填字段、文字长度、念法、时长、FACTS.md），有错误就停下。


```bash
cd pipeline
python3 tts.py ../episodes/<id>                              # 配音 + 时间表
node formats/market-pulse/music.mjs ../episodes/<id>         # 配乐
node render.mjs ../episodes/<id> --sheet 2,8,15,30,45,55,70  # 先看联系表
node render.mjs ../episodes/<id>                             # 成片
```

## 事实红线（在 content-system/style-guide.md 之上，本栏目额外的）

- 现货报价都写"最便宜报价 / 某商户报价"，不写成市场均价。
- 不同来源的报价不能连成实线。
- 预测值一律标 F。
- 连乘、倍数这类计算标 ILLUSTRATIVE，并在 FACTS.md 写出算式。
