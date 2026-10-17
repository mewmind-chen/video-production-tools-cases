# 006 选题卡与台词草稿

> 由 Claude 准备（选题 + 核实 + 台词草稿）。Codex 负责：按 `pipeline/formats/playbook/FORMAT.md` 把下面的内容转成 `episode.json`，写 `PUBLISH.md`，检查、出联系表、渲染。
> **只能用 `FACTS.md` 里的事实。** 台词可以为了时长和排版删减，但不要加新的事实或数字。

- **栏目**：Buyer's Playbook
- **发布日**：FRI 30 OCT 2026（WK 44）
- **一句话**：一张料盘标签能告诉你料号、数量、日期码、批号、原产国；美系和日系格式不一样；对不上就是红旗。
- **为什么做**：常青题；我们手上有日系 EIAJ 标签的实拍观察（没有单独日期码栏），英文内容很少讲两种格式的区别。
- **观众看完能做什么**：拿到贸易商发来的标签照片时，知道该看哪几个字段、和什么比对。

## 打分

| 维度 | 分 | 理由 |
|---|---|---|
| 观众痛点 ×6 | 4 | 缺货时被迫找贸易商，最怕假货 |
| 时效 ×4 | 2 | 常青题 |
| 中国视角优势 ×4 | 4 | 日系格式的实拍观察、贸易商现场经验 |
| 可核实 ×4 | 4 | ECIA 字段有 DigiKey 解读，红旗有 ERAI 原文 |
| 能讲清楚 ×2 | 5 | 一张标签、逐字段锁定 |
| **总分** | **74** | |

## 台词草稿（逐场景）

场景类型按 playbook 模板：open → intro → why → step × 4 → recap → outro。画面字段的写法见 `FORMAT.md` 和 `example/episode.json`。

### open（钩子）
- 气泡：BROKER · 10:12 · "Label photo attached. 100% original."
- 大字：`CAN YOU READ` / `THIS LABEL?`
- 标签：`4 CHECKS` / `BEFORE YOU PAY`
- 台词 1：Label photo attached. One hundred percent original.（字幕："Label photo attached. 100% original."）
- 台词 2：Can you read it? Four checks, before you pay.

### intro
- 固定台词。

### why
- 数字：value `1,055`？**不行**：模板 value 最多 4 个字符。用 `+25%`：prefix 空，value `25`，suffix `%`，前面加 `+` 作为 prefix。
- label：Suspect counterfeit & nonconforming parts reported to ERAI in 2024, vs 2023
- note：REPORTEDLY · ERAI DATA VIA TRUSTCOMPO
- 台词：Suspect counterfeit parts reported to ERAI reportedly rose twenty-five percent last year.（字幕："Suspect counterfeits reported to ERAI reportedly rose 25% last year."）

### step 1 · FIVE FIELDS.（visual: label）
- 标题：`FIVE` / `FIELDS.`
- 标签：REEL LABEL · ECIA FORMAT · EXAMPLE；行：`1P` 料号、`Q` 数量、`9D` 日期码、`1T` 批号（示意值可沿用 example 里的）；逐行锁定
- tag：`ECIA EIGP 114`；tagTone 用 ok
- 台词 1：US and European labels follow ECIA: 1P is the part number, Q the quantity, 9D the date code, 1T the lot.（念法里 1P / 9D / 1T 要拆开："one-P"、"nine-D"、"one-T"）
- 台词 2：And 4L is the country of origin.

### step 2 · DATE CODE.（visual: code）
- 标题：`DATE` / `CODE.`
- 编码：`2541`，分段：`25` → YEAR · 2025，`41` → WEEK · 41；caption：9D · YYWW · EXAMPLE
- tag：`CATCHES: RE-MARKED PARTS`
- 台词 1：The date code is usually year and week. 2541 is week 41 of 2025.
- 台词 2：A date after the part's last-time-buy is a red flag.

### step 3 · JAPAN IS DIFFERENT.（visual: label）
- 标题：`JAPAN` / `DIFFERS.`
- 标签：REEL LABEL · EIAJ C-3 · EXAMPLE；行：`<P/N>`、`<QTY>`、`<S/N>`、`<L>`（**用 ASCII 尖括号**，字体里没有全角括号）；锁定 `<L>` 那一行
- tag：`NO D/C FIELD? CHECK THE LOT`
- 台词 1：Some Japanese makers use the EIAJ C-3 format. The reel we checked had no separate date code field.
- 台词 2：So match the lot number to the certificate of conformance instead.

### step 4 · MATCH THE PARTS.（visual: compare）
- 标题：`MATCH THE` / `PARTS.`
- good（REAL）：P/N matches the parts / Origin matches 4L / Barcode scans to the text
- bad（RED FLAG）：P/N or origin don't match / Barcode ≠ printed text / Odd fonts or spacing
- tag：`CATCHES: RELABELED REELS`
- 台词 1：Then check the label against the parts: part number, origin, lot.
- 台词 2：ERAI flags barcodes that don't match the text, and odd fonts or spacing.

### recap
- heading：`BEFORE` / `YOU PAY.`
- items：Read the 5 fields / Date code makes sense / No D/C? Match the lot / Label matches the parts
- stamp：`READ IT.`
- 台词：Four checks. Save this for your next broker quote.

### outro
- 固定台词；sources：DigiKey label guide · ERAI screening guidance · Panasonic EIAJ C3 notice (via Future Electronics) · ERAI 2024 data (via TrustCompo)

## 时长目标

75–85 秒。超过 90 秒先删 step 1 台词 2。
