# 账号设置

人设见 [`persona.md`](persona.md)。已定（2026-10-17）：化名 **LEO**、不露脸、AI 配音；**YouTube Shorts 和 TikTok 为主**，LinkedIn 只开公司主页同步。
图片在 [`brand/`](brand/)：头像就是视频里 LEO 的胸牌。用 `node pipeline/brand.mjs` 重新生成。英文部分可以直接粘贴，字数都在平台限制内。

## 开号顺序

1. 翻劳动合同，确认没有禁止兼职或利益冲突的条款
2. 注册 YouTube 和 TikTok（**新邮箱**，不要用和真名关联的邮箱）
3. 填好名字、简介、头像、横幅
4. 开 LinkedIn 公司主页（需要一个 LinkedIn 个人号作为管理员；管理员身份不会公开显示在主页上）
5. 第一周三条全部发完后，在 TikTok 置顶

## 1. 名字

| 平台 | 显示名 | 账号 | 备注 |
|---|---|---|---|
| YouTube | Leo · China Supply Chain Signal | `@ChinaSupplySignal` | 被占用时试 `@LeoSupplySignal` |
| TikTok | Leo \| China Supply Signal | `@chinasupplysignal` | 显示名最多 30 字符 |
| LinkedIn 公司主页 | China Supply Chain Signal | `/company/china-supply-chain-signal` | |

显示名里放 **Leo**：人设是一个人，不是一个媒体品牌。

## 2. YouTube

| 项 | 内容 |
|---|---|
| 头像 | `brand/avatar.png`（800 × 800，圆形裁切后胸牌和 LEO 清楚可见） |
| 横幅 | `brand/youtube-banner.png`（2560 × 1440，文字都在中间安全区内） |
| 关键词 | electronic components, procurement, supply chain, China, Shenzhen, Huaqiangbei, DRAM, MLCC, memory prices, sourcing |
| AI 标注 | 上传时"改动或合成内容"选**是**（AI 配音） |

**简介（最多 1,000 字符）**：

```
I'm Leo. I trade electronic components in Shenzhen.

Every week I translate what China's component market is saying into 60-second Shorts for overseas buyers:
• Mon · News Decoder: one supply chain story, and what it means for your BOM
• Wed · Market Pulse: prices and lead times from Shenzhen's market
• Fri · Buyer's Playbook: a buying method you can use this week

Every number is sourced in the description. No price predictions. No sales pitch.

Part you can't find? Comment the part number. I'll ask around Shenzhen and reply.

Leo is a pen name. Voice and visuals are AI-generated; the sourcing is human.
```

**Shorts 标题公式**（约 60 字符以内，前半句放数字或冲突）：`[数字 / 冲突]: [对象] [时间] #shorts`
例：`¥200 → ¥1,400: Shenzhen's RAM prices in one year #shorts`

## 3. TikTok

| 项 | 内容 |
|---|---|
| 头像 | `brand/avatar.png` |
| AI 标注 | 发布时打开"AI 生成内容"标签 |

**简介（最多 80 字符）**：

```
Components trader in Shenzhen. China's parts market, for overseas buyers.
```

**置顶**：一期 Market Pulse、一期 Buyer's Playbook，再加一条 20 秒的"Leo 是谁"介绍（待做）。

## 4. LinkedIn 公司主页（同步发布）

| 项 | 内容 |
|---|---|
| 名称 | China Supply Chain Signal |
| 标志 | `brand/avatar.png` |
| 封面 | `brand/linkedin-page-cover.png`（1128 × 191） |
| 行业 | Online Audio and Video Media（没有就选最接近的） |
| 规模 | 0–1 employees |

**标语（最多 120 字符）**：

```
China's electronic component market, translated for overseas buyers. With Leo, a components trader in Shenzhen.
```

**简介（最多 2,000 字符）**：

```
China Supply Chain Signal translates first-hand signals from China's electronic component market for overseas procurement and supply chain teams.

Your host is Leo, a components trader in Shenzhen. Three short videos a week:
• Monday · News Decoder: one supply chain story, and what it means for your BOM
• Wednesday · Market Pulse: prices and lead times from Shenzhen's market
• Friday · Buyer's Playbook: a buying method you can use this week

Every number is sourced. No price predictions. No sales pitch.

Part you can't find? Message this page with the part number.

Leo is a pen name. Voice and visuals are AI-generated; the sourcing is human.
```

**注意**：公司主页的自然触达比个人号低很多（见调研）。LinkedIn 在这个方案里只是同步，不是主战场。

## 5. 发布时间

| 目标市场 | 北京时间 |
|---|---|
| 欧洲（主） | 工作日 15:00–17:00 |
| 东南亚、印度 | 工作日 10:00–12:00 |
| 美国 | 工作日 21:00–23:00 |

先固定一个时间连发 4 周，复盘时再对比。
