---
name: ziwei
description: 紫微斗数智能算命 - 基于传统命理学的命盘分析与运势预测
triggers:
  - 算命
  - 看命
  - 命盘
  - 运势
  - 合盘
  - 紫微
  - 斗数
  - 八字
  - 流年
  - 大限
---

# 紫微斗数智能算命

基于传统紫微斗数命理学，提供命盘分析、运势预测、合盘匹配等服务。

## 使用方法

### 1. 收集生辰信息

需要以下信息：
- 出生日期（阳历或农历）
- 出生时间（尽量精确到分钟）
- 性别
- 出生地城市

### 2. 调用 ziwei CLI

根据用户问题映射到对应宫位，查询三方四正：

```bash
# 本命层（默认）
ziwei palace --date 1990-05-15 --time 14:30 --gender 男 --city 北京 --palace 命宫

# 大限层
ziwei palace --palace 官禄宫 --scope decadal --year 2025 ...

# 流年层
ziwei palace --palace 财帛宫 --scope yearly --year 2025 ...

# 流月层
ziwei palace --palace 夫妻宫 --scope monthly --year 2025 --month 6 ...

# 流日层
ziwei palace --palace 疾厄宫 --scope daily --year 2025 --month 6 --day 15 ...

# 本命合盘
ziwei synastry origin \
  --a-date 1990-05-15 --a-time 10:30 --a-gender 男 --a-city 北京 \
  --b-date 1992-03-20 --b-time 14:00 --b-gender 女 --b-city 上海

# 流年合盘
ziwei synastry yearly --year 2025 ...
```

### 3. 解读结果

根据 CLI 返回的 JSON 数据，按照紫微斗数口径进行解读：

1. **命宫定底**：先查命宫三方四正，确定总体格局基调
2. **目标宫分析**：根据用户问题映射到相应宫位查询
3. **动态叠加**：需要时查询运限层级，结合四化进行修正
4. **好坏并论**：既指出优势潜力，也点出风险隐患

## 参数说明

### 通用参数
- `--date`：出生日期，格式 YYYY-MM-DD
- `--time`：出生时间，格式 HH:MM
- `--gender`：性别，男 或 女
- `--city`：出生城市名称
- `--palace`：宫位名称（命宫、财帛宫、官禄宫等）
- `--lunar`：使用农历日期（可选）
- `--leap`：农历闰月（可选）

### 层级参数
- `--scope`：查询层级，可选值：
  - `origin`（默认）：本命层
  - `decadal`：大限层
  - `yearly`：流年层
  - `monthly`：流月层
  - `daily`：流日层
- `--year`：查询年份（运限层级必需）
- `--month`：查询月份（流月/流日必需）
- `--day`：查询日期（流日必需）

## 宫位与议题对应

| 议题 | 目标宫 |
|------|--------|
| 性格/整体运势 | 命宫 |
| 事业/升职 | 官禄宫 |
| 婚恋/感情 | 夫妻宫 |
| 财运/理财 | 财帛宫 |
| 健康 | 疾厄宫 |
| 房产/家庭 | 田宅宫 |
| 出行/移民 | 迁移宫 |
| 子女/创作 | 子女宫 |
| 朋友/同事 | 仆役宫 |
| 兄弟/合伙 | 兄弟宫 |
| 学业/考试 | 父母宫 |
| 心态/福报 | 福德宫 |

## 详细口径

见 [system-prompt.md](./system-prompt.md)
