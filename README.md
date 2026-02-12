# 紫微斗数 Ziwei Skill

基于传统紫微斗数命理学的命盘分析与运势预测，支持 Claude Code 和 OpenClaw。

## Quick Start

```bash
npx ziwei-cli
```

这会：
1. 检测你的 Claude Code / OpenClaw 安装
2. 安装 skill 到正确位置
3. 全局安装 `ziwei` CLI

## 手动安装

```bash
# Clone
git clone https://github.com/shanrichard/ziwei-skill ~/.claude/skills/ziwei
cd ~/.claude/skills/ziwei

# 安装依赖
npm install

# 全局安装 CLI
npm link
```

## CLI 使用

```bash
# 本命层 - 查看命宫三方四正
ziwei palace --date 1990-05-15 --time 10:30 --gender 男 --city 北京 --palace 命宫

# 流年层 - 查看官禄宫流年运势
ziwei palace --palace 官禄宫 --scope yearly --year 2025 --date 1990-05-15 --time 10:30 --gender 男 --city 北京

# 流月层
ziwei palace --palace 财帛宫 --scope monthly --year 2025 --month 6 ...

# 本命合盘
ziwei synastry origin \
  --a-date 1990-05-15 --a-time 10:30 --a-gender 男 --a-city 北京 \
  --b-date 1992-03-20 --b-time 14:00 --b-gender 女 --b-city 上海
```

## Skill 使用

安装后重启 Claude Code / OpenClaw，然后直接说：

- "帮我算命"
- "看看我今年的运势"
- "我和对方合适吗"

## 支持的功能

### 宫位查询 (`palace`)
- 本命层 (`origin`) - 默认
- 大限层 (`decadal`) - 需指定 `--year`
- 流年层 (`yearly`) - 需指定 `--year`
- 流月层 (`monthly`) - 需指定 `--year --month`
- 流日层 (`daily`) - 需指定 `--year --month --day`

### 合盘分析 (`synastry`)
- 本命合盘 (`origin`)
- 流年合盘 (`yearly`)

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

## 技术栈

- [iztro](https://github.com/SylarLong/iztro) - 紫微斗数排盘库
- [lunar-javascript](https://github.com/6tail/lunar-javascript) - 农历转换
- [commander](https://github.com/tj/commander.js) - CLI 框架

## License

MIT
