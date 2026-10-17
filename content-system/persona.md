# 人设与文案

> 依据：[`research/2026-10-17-persona-research.md`](research/2026-10-17-persona-research.md)（同类账号调研）。
> 账号简介、头像、横幅见 [`channel-setup.md`](channel-setup.md)。
> 已定（2026-10-17）：化名 **LEO**、不露脸、AI 配音、YouTube Shorts / TikTok 为主，LinkedIn 只开公司主页同步。

## 1. LEO 是谁

> **LEO，深圳做元器件的业内人，把中国市场的一手信号翻译给海外采购。**
> I'm Leo. I trade components in Shenzhen.

- **化名**，真人背后是你；不露脸；声音是 AI，片尾写明 *Leo is a pen name · AI-generated voice & visuals*。
- **身份标识是一张展会胸牌**：做元器件的人都戴过，海外采购在 electronica 之类的展会上天天见。胸牌上写 LEO / COMPONENTS TRADER / HUAQIANGBEI · SHENZHEN，底条写 AI VOICE · MY NUMBERS。
- **头像就是这张胸牌**，视频里字幕旁挂的也是它。观众在信息流里和视频里看到的是同一个人。

**LEO 不是**：贸易商（喊库存）、记者（只报新闻）、大师（预测涨跌）、有政治立场的人。

### 为什么这样定（调研结论）

| 调研发现 | 对 LEO 的要求 |
|---|---|
| 面向海外买家的中国 B2B 账号，做得好的几乎都是真人（老板、业务员、顾问） | LEO 必须像一个真实的业内人：有名字、有身份、有地点，说话像在市场里的人 |
| 不露脸的头部频道靠固定的旁白声音和画面语言建立辨识度 | 每期同一个声音（`am_michael`，语速 1.08）、同一张胸牌、同一套颜色 |
| AI 声音在新闻、行情类内容里最不受信任（只有 19% 接受） | 用 AI 声音就要在**内容**上补信任：每个数字有出处，尽量有你手机拍的真实镜头 |

## 2. 每期视频的固定模板

所有栏目都用这个顺序，由 `pipeline/reel/brand.js` 统一画，不用每期手动加。

| 时间 | 段落 | 画面 | 旁白 | 依据 |
|---|---|---|---|---|
| 0–3 秒 | **钩子** | 第一秒同时出现画面、大字、音效 | 一个反常的数字、一个倒计时或一个带利害的问题 | 不要打招呼、不要片头标志、不要报频道名 |
| 约 2 秒 | **自我介绍** | LEO 的胸牌挂着挂绳甩进画面，下面一行写栏目和更新日 | 固定一句：*I'm Leo. I trade components in Shenzhen.* | 钩子之后给"可信的理由"，越短越好 |
| 主体 | **内容** | 字幕左侧全程挂着 LEO 的小胸牌，下面有声纹；左上频道名，右上 SHENZHEN · 日期 | 一句一个信息，每个数字出处在画面底部 | — |
| 有一手信息时 | **一线笔记** | FIELD NOTE 卡（或你手机拍的视频） | "I asked three sellers on Tuesday…" | 同类账号靠真实场景建立信任 |
| 最后 3–5 秒 | **片尾** | 胸牌 + 绿色找料入口 + 一周排期 + 来源 | *[栏目]. Every [星期]. Sources in the caption.* | 评论多能带动推荐 |

### 钩子公式

| 公式 | 例子 |
|---|---|
| 反常的数字对比 | ¥200 → ¥1,400. Same stick of DDR5. One year. |
| 倒计时 | Two dates. 24 days apart. Mark them now. |
| 带利害的问题 | Apple is testing Chinese memory. Should you? |
| 纠正误解 | "Cooling" doesn't mean cheaper. |
| 直接点出风险 | 4,000 pcs in stock. Ships today. Real stock, or bait? |

## 3. 说话方式

**冷静、具体、先给出处。** 短句，一句一个信息，不用感叹号。

| 要 | 不要 |
|---|---|
| "TrendForce forecasts +10–15%." | "Prices will skyrocket!" |
| "Some sellers reportedly cut 30%." | "The market is crashing." |
| "That's their view, not a forecast." | "Experts predict…" |
| "We don't know yet." | 猜 |

## 4. 找料入口和 Part Hunt

片尾每期都有：**Part you can't find? Comment or DM the part number. I'll ask around Shenzhen and reply.**

- 发料号的人几乎一定在真实采购，这正是最初要找的人。
- **评论里的料号**还能带动推荐；不方便公开的可以私信。
- **Part Hunt**（新栏目，参考 Adafruit × DigiKey 的 The Great Search）：从评论和私信里挑一个料号，LEO 去问深圳市场，下一期公布结果（有没有货、大概价格区间、常见批次）。料号做脱敏处理，不暴露是谁问的。
- 有真实需求的，**只在私信里**介绍朋友公司。公开内容里永远不推销。

### 私信模板

第一次回复：

```
Thanks — happy to take a look.
Could you share:
1. Part number (and acceptable alternates)
2. Quantity
3. When you need it
4. Ship-to country
I'll come back within 24h with what I'm hearing in Shenzhen.
```

确认有需求后：

```
I work with an exporter I trust for exactly this.
They quote with date codes and photos before you pay.
Want me to connect you?
```

## 5. 红线

1. **不用现雇主的任何信息**：报价、客户、库存、内部消息。数字只用公开报道和你自己在华强北问到的。
2. **不碰现雇主的客户。**
3. **公开内容不推销**，不出现朋友公司名字。
4. **不发政治观点**；出口管制、关税只讲事实和对采购的影响。
5. **不预测价格**，只引用机构预测并标出来源和 F。
6. **一线笔记只用于你本人得到的信息**，不能用来包装公开报道。
7. 询价涉及出口管制物项、受制裁国家或实体时，交给朋友公司按合规流程处理。
8. 平台要求标注 AI 内容时如实标注（YouTube 的"改动或合成内容"、TikTok 的 AI 生成标签）。
