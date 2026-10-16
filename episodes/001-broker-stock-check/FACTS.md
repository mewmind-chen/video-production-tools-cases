# 001 事实核对表

状态说明：✅ 已找到来源 ｜ ⚠️ 只看到搜索摘要，发布前需打开原文核对 ｜ ❌ 无来源，不得出现在画面或旁白

## 旁白与画面中的市场数据

| 说法 | 来源 | 状态 |
|---|---|---|
| TrendForce 预计 MLCC 缺货、交期拉长、涨价趋势延续到下一季度 | TrendForce MLCC Market Bulletin, 2026-08-12 https://www.trendforce.com/research/download/RP260812FP | ⚠️ |
| DDR5 服务器内存（RDIMM）对传统 OEM 的满足率低于 30%，产能优先给大型云厂商 | Fusion Worldwide, The Greensheet, Aug 2026 https://info.fusionww.com/blog/the-greensheet-august-2026 | ⚠️ |

## 五项检查（方法来源）

| 检查 | 来源 | 状态 |
|---|---|---|
| 要求实物照片、核对批次号 / date code、核对原厂标签和条码、索要 CoC 和采购记录 | Mouser https://resources.mouser.com/purchasing-resource-library/expert-tips-identifying-counterfeit-electronic-components ；Electropages https://www.electropages.com/blog/2024/04/expert-tips-identifying-counterfeit-electronic-components | ⚠️ |
| 第三方检测：X 光、外观检查、开封（decap） | ERAI 课程说明 https://www.erai.com/intercept_certificateclasses/6/counterfeit_inspection_and_testing_of_electronic_parts_xrf_radiography_decapsulation_and_criteria_for_acceptance_or_rejection ；Electronics360 https://electronics360.globalspec.com/article/21813/how-to-identify-counterfeit-electronics | ⚠️ |
| "诱饵库存"：网上挂的库存可能早已卖掉或根本不存在 | Converge, Finding Components in a Shortage Market https://www.converge.com/wp-content/uploads/2020/10/Finding_Components_in_a_Shortage_Market_102020.pdf | ⚠️ |
| "带当天日期和公司名的照片" 这个具体做法 | 行业常见做法，未找到书面来源 | ⚠️ 作为建议表述，不作为"标准"表述 |

## 产品建模用到的真实规格

| 规格 | 来源 | 状态 |
|---|---|---|
| 7 英寸料盘直径 178 mm（±2 mm），另一常用规格为 330 mm | Vishay 包装规范 https://www.vishay.com/docs/45051/vjvitramonpackaging.pdf ；Kyocera AVX 写作 177.8 mm | ⚠️ |
| 8 mm 载带，口袋间距 4 mm（±0.10 mm），齿孔直径约 1.5 mm | Protek 数据手册、Mini-Circuits TR-F8、Johanson 包装文件 https://www.johansondielectrics.com/docs/4471/capacitor-packaging.pdf | ⚠️ |
| 0805 MLCC 可能用纸带或凸起塑料载带，取决于厚度；较厚的料多用凸起载带 | Johanson 包装文件与 Tape & Reel 页面 https://johansontechnology.com/tape-reel-packaging | ⚠️ |
| 料盘材料为抗静电聚苯乙烯，颜色因供应商而异 | ST AN1235 | ⚠️ 颜色没有统一标准，画面中的颜色是设计选择 |
| 料盘标签至少标注料号、检验号、数量（村田包装规范） | Murata 包装规范 https://www.murata.com/products/productdata/8796836036638/NTHCM101.pdf | ⚠️ |
| 行业 2D 条码标签（ECIA EIGP 114）常用数据标识：1P 料号、Q 数量、9D/10D 日期码、1T 批次、4L 原产国 | ECIA EIGP 114 简介 https://standards.globalspec.com/std/14650038/eigp-114 ；二手资料对 1P 的定义有分歧 | ⚠️ |
| MLCC 结构：BaTiO₃ 等陶瓷介质与内电极交替叠层，交替的内电极分别连到两端端电极 | 专利文献（见搜索结果） | ⚠️ |
| 现在多数商用 MLCC 用镍内电极（BME） | passive-components.eu https://passive-components.eu/reliability-improvement-in-batio3-mlccs-using-ni-sn-and-ni-in-alloy-electrodes/ | ⚠️ |
| 端电极：铜底层 + 镍阻挡层 + 镀锡 | 镍/锡见 RS 上的村田 0805 产品页；铜底层为常见做法，未找到单一产品的明确来源 | ⚠️ 画面写"典型结构" |
| 0805 尺寸 2.0 × 1.25 mm | EIA 标准尺寸（常识），本轮未打开原始数据手册 | ⚠️ 发布前用任一厂商手册核对 |
| `D/C 2541` 读作 2025 年第 41 周（YYWW） | YYWW 是常见格式但不是唯一格式 | ⚠️ 画面标注"示例格式" |

## 虚构内容

- 开场的贸易商消息 "4,000 pcs. In stock. Ships today." 是虚构的示例场景。
- 标签、CoC 上的品牌、料号、批次号均为虚构，不对应任何真实厂商或产品。
- 订单格子（PO-01 至 PO-10）是对"满足率低于 30%"的示意，不是真实订单数据。
