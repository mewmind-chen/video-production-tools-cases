# Buyer's Playbook 栏目格式

每周五一期，60–85 秒。讲一个可以直接照做的采购方法或清单：**一个可疑场景 → 为什么现在要在意 → 3–5 步 → 回顾清单**。
结构和画面固定，每期只改 `episode.json`。新的一期从 [`example/episode.json`](example/episode.json) 复制（那是模板样例，内容来自 001，不要直接发布）。
栏目标识是荧光绿目标框"锁定"；声音标识是锁定的咔嗒声加两声拨弦。

## 场景

| type | 次数 | 底色 | 做什么 | 每期要填的 |
|---|---|---|---|---|
| `open` | 1 | 墨黑 | **钩子**：一条可疑的消息气泡（可选）+ 一到两行大问题 + 底部两个标签 | `bubble`{from, time, text}（可省略）`big`[一到两行] `chips`[最多 2 个] `source` |
| `intro` | 1 | 墨黑 | 频道统一的自我介绍（LEO 胸牌） | 固定一句：`I'm Leo. I trade components in Shenzhen.` |
| `why` | 1 | 荧光绿 | 为什么是现在：一个大数字 + 说明 | `kicker` `prefix` `value` `suffix` `tone`（`alert` 为红色）`label` `note` `source` |
| `step` | 3–5 | 轮换 | 每一步：序号 + 两行标题 + 一种画面 + 底部"能抓住什么"的标签 | `title`[两行，第二行高亮] `short`（左下角小字）`visual`{kind, …} `tag` `tagTone`（`ok` 为绿色，默认红色）`note`（右下角小字） |
| `recap` | 1 | 纸白 | 回顾清单逐项打勾，最后盖章 | `heading`[两行] `items`[和步骤一一对应] `stamp` |
| `outro` | 1 | 墨黑 | 频道统一片尾卡 | `sources`[最多 4 条] |

## step 的五种画面（`visual.kind`）

| kind | 适合 | 字段 |
|---|---|---|
| `photo` | 让对方拍照、实物证明 | `note`[便利贴两行] `caption` `shutterLine` `shutterAt` |
| `code` | 拆解一个编码（日期码、料号规则） | `code` `parts`[[片段, 含义]] `caption` `partsLine` `partsAt` |
| `label` | 标签字段逐个锁定 | `title` `rows`[[字段, 值]]（最多 4 行）`locks`[行号] `lockLine` `lockAt` |
| `doc` | 单据，某一行高亮 | `title` `rows`[[字段, 值]]（最多 5 行）`hl`（高亮第几行）`hlLine` `hlAt` `stamp` |
| `compare` | 对的做法 vs 错的做法 | `good`{label, items[最多 3], line, at} `bad`{同上} |

标签、单据里的料号和批号都是示意，标题里写 `EXAMPLE`。

## 时间怎么对上

step 会重复，所以这个栏目按**场景序号**取时间，但写法和另外两个栏目一样：`line`（本场景第几句）+ `at`（这句进行到几成）。每个 step 两句台词最顺：第一句讲做法，第二句讲能抓住什么（`tag` 默认在第二句开头出现）。

## 制作命令

```bash
bash pipeline/make.sh episodes/<id> --sheet   # 先看联系表
bash pipeline/make.sh episodes/<id>           # 成片
```
