# 006 事实核对

状态：✅ 两个以上独立来源或原始来源 ｜ ⚠️ 只有一个来源或二手转述，需要你确认 ｜ ❌ 不能用

| # | 画面 / 旁白里的说法 | 来源 | 等级 | 状态 | 备注 |
|---|---|---|---|---|---|
| 1 | 美欧标签按 ECIA（EIGP 114）格式 | [ECIA EIGP 114.2018](https://www.ecianow.org/assets/docs/EIGP-114.2018-Labeling-Specification-.pdf)、[GlobalSpec：现行版 EIGP 114:2023-12](https://standards.globalspec.com/std/14650038/eigp-114) | A | ✅ | 旁白说 "follow ECIA"，不说"所有标签" |
| 2 | Q = 数量 | [DigiKey 标签解读](https://forum.digikey.com/t/digikey-product-labels-decoding-digikey-barcodes/41097) | B（分销商解读） | ✅ | |
| 3 | 9D = 日期码，规范格式为年+周（YYWW） | 同 #2 | B | ✅ | DigiKey 注明他们印的是厂家给的日期码，可能不是 YYWW，所以旁白说 "usually" |
| 4 | 1T = 批号 | 同 #2 | B | ✅ | |
| 5 | 4L = 原产国（ISO 3166 两位代码） | 同 #2 | B | ✅ | |
| 6 | 1P = 制造商料号 | [IEC 62090 目录](https://www.vde-verlag.de/iec-normen/preview-pdf/info_iec62090{ed2.0}b.pdf)（"1P" 列在 manufacturer item identification 下） | B（推断） | ⚠️ | 没拿到 ECIA 原文的字段表，"1P = part number" 是合理推断 |
| 7 | 2541 = 2025 年第 41 周 | 示意 | — | ✅ | 画面标 EXAMPLE |
| 8 | 日期晚于该料的最后下单日（LTB）是红旗 | [ERAI 筛查指南](https://erai.com/customuploads/ca/sc/screening_for_nonconforming_suspect_counterfeit_parts.pdf) | A | ✅ | ERAI 原文：lot/date code 与停产、LTB 通知冲突 |
| 9 | 部分日本厂家用 EIAJ C-3 标签格式 | [Future Electronics 转松下通知](https://www.futureelectronics.com/p/electromechanical--switches--pushbutton/esb-33536-panasonic-industry-3028162)（日本、中国工厂料盘标签 2022 年改为 EIAJ C3） | B | ✅ | 旁白说 "some Japanese makers" |
| 10 | 我们看过的那盘日系料，标签上没有单独的日期码栏；字段有 ⟨P/N⟩ ⟨QTY⟩ ⟨S/N⟩ ⟨3N⟩ ⟨D⟩ ⟨L⟩ ⟨Q⟩ | 用户提供的太阳诱电料盘实拍（一手观察，2026-10） | 一手 | ✅ 作为单个观察 | 旁白说 "the reel we checked"，不推广成"日系标签都没有日期码"；画面不出现品牌 |
| 11 | 没有日期码栏时，用批号和合格证（CoC）比对 | 编辑建议，依据 #10 和 001 期的 CoC 检查 | — | ✅ | 是建议，不是事实陈述 |
| 12 | ERAI 红旗：标签上的料号或原产国和实物不符；条码与文字不一致；字体、间距异常 | [ERAI 筛查指南](https://erai.com/customuploads/ca/sc/screening_for_nonconforming_suspect_counterfeit_parts.pdf)、[ERAI 网页版](https://www.erai.com/ca_screening_for_counterfeits) | A | ✅ | ERAI 说这些是"迹象"，不是证明 |
| 13 | 2024 年报给 ERAI 的可疑假冒和不合格零件比 2023 年多 25%（1,055 件） | [TrustCompo 转述 ERAI](https://trustcompo.com/blog/how-to-spot-counterfeit-in4148ws-7-f-marking-label-package-checklist) | C（商家博客转述） | ⚠️ | 旁白必须说 reportedly；能找到 ERAI 原始年报最好 |
| 14 | 标签上的料号、批号等示意值 | 示意 | — | ✅ | 画面标 EXAMPLE，不用真实品牌 |

**发布前你需要确认的**：#6、#13。
