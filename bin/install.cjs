#!/usr/bin/env node

/**
 * Ziwei Skill Installer for Claude Code / OpenClaw
 *
 * npx ziwei-cli
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");
const os = require("os");

// Colors
const c = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

const color = (col, text) => `${c[col]}${text}${c.reset}`;

// Paths
const HOME = os.homedir();
const CLAUDE_SKILLS_DIR = path.join(HOME, ".claude", "skills");
const OPENCLAW_SKILLS_DIR = path.join(HOME, ".openclaw", "skills");
const SKILL_NAME = "ziwei";
const PACKAGE_ROOT = path.resolve(__dirname, "..");

function log(msg) { console.log(msg); }
function logStep(step, msg) { console.log(`\n${color("cyan", `[${step}]`)} ${msg}`); }
function logSuccess(msg) { console.log(`${color("green", "✓")} ${msg}`); }
function logError(msg) { console.log(`${color("red", "✗")} ${msg}`); }
function logInfo(msg) { console.log(`${color("blue", "→")} ${msg}`); }
function logWarn(msg) { console.log(`${color("yellow", "!")} ${msg}`); }

function createPrompt() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip node_modules, .git, bin
    if (["node_modules", ".git", "bin"].includes(entry.name)) continue;

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function printBanner() {
  console.log(`
${color("magenta", "┌──────────────────────────────────────────────┐")}
${color("magenta", "│")}  ${color("bright", "紫微斗数 Ziwei Skill")} - Installer           ${color("magenta", "│")}
${color("magenta", "└──────────────────────────────────────────────┘")}

基于传统紫微斗数命理学的命盘分析与运势预测
支持 ${color("cyan", "Claude Code")} 和 ${color("cyan", "OpenClaw")}
`);
}

async function detectPlatform() {
  const hasClaude = fs.existsSync(path.join(HOME, ".claude"));
  const hasOpenClaw = fs.existsSync(path.join(HOME, ".openclaw"));

  return { hasClaude, hasOpenClaw };
}

async function selectPlatform(rl, platforms) {
  logStep("1/4", "检测安装平台...");

  const options = [];
  if (platforms.hasClaude) {
    options.push({ key: "1", name: "Claude Code", dir: CLAUDE_SKILLS_DIR });
    logSuccess("检测到 Claude Code");
  }
  if (platforms.hasOpenClaw) {
    options.push({ key: "2", name: "OpenClaw", dir: OPENCLAW_SKILLS_DIR });
    logSuccess("检测到 OpenClaw");
  }

  if (options.length === 0) {
    logWarn("未检测到 Claude Code 或 OpenClaw");
    logInfo("将创建 Claude Code skills 目录");
    fs.mkdirSync(CLAUDE_SKILLS_DIR, { recursive: true });
    return { name: "Claude Code", dir: CLAUDE_SKILLS_DIR };
  }

  if (options.length === 1) {
    return options[0];
  }

  // Both platforms available
  log("\n请选择安装平台:");
  options.forEach((opt, i) => {
    log(`  ${i + 1}. ${opt.name}`);
  });
  log(`  3. 两者都安装`);

  const choice = await ask(rl, "\n选择 (1/2/3): ");

  if (choice === "3") {
    return "both";
  }

  return options[parseInt(choice) - 1] || options[0];
}

async function installSkill(targetDir, platformName) {
  const skillDest = path.join(targetDir, SKILL_NAME);

  // Check if already installed
  if (fs.existsSync(skillDest)) {
    logWarn(`${platformName} 已安装 ziwei skill`);
    logInfo(`位置: ${skillDest}`);
    return "exists";
  }

  // Create skill directory
  fs.mkdirSync(skillDest, { recursive: true });

  // Copy files
  const filesToCopy = ["SKILL.md", "system-prompt.md"];
  for (const file of filesToCopy) {
    const src = path.join(PACKAGE_ROOT, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(skillDest, file));
    }
  }

  logSuccess(`Skill 已安装到: ${skillDest}`);
  return "installed";
}

async function installCli() {
  logStep("3/4", "安装 ziwei CLI...");

  try {
    // Check if already installed with correct version
    try {
      const version = execSync("ziwei --version", { encoding: "utf8" }).trim();
      const pkg = require(path.join(PACKAGE_ROOT, "package.json"));
      if (version === pkg.version) {
        logSuccess(`ziwei CLI 已安装 (v${version})`);
        return true;
      }
      logInfo(`当前版本 ${version}，升级到 ${pkg.version}...`);
    } catch {
      // Not installed, proceed
    }

    // Global install ensures dependencies are properly resolved
    // and persists after npx temp dir is cleaned up
    logInfo("正在全局安装 ziwei CLI 及依赖...");
    execSync("npm install -g ziwei-cli", { stdio: "inherit" });
    logSuccess("ziwei CLI 安装成功");

    // Verify
    const version = execSync("ziwei --version", { encoding: "utf8" }).trim();
    logInfo(`版本: ${version}`);

    return true;
  } catch (error) {
    logError(`CLI 安装失败: ${error.message}`);
    logInfo("你可以手动运行: npm install -g ziwei-cli");
    return false;
  }
}

function printSummary(platforms) {
  logStep("4/4", "安装完成!");

  console.log(`
${color("green", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}
${color("bright", "  紫微斗数 Skill 已就绪!")}
${color("green", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")}

${color("cyan", "CLI 命令:")}
  ziwei palace --palace 命宫 --date 1990-05-15 --time 10:30 --gender 男 --city 北京
  ziwei bazi --date 1990-05-15 --time 10:30 --gender 男
  ziwei calendar

${color("cyan", "Skill 触发词:")}
  算命、看命、命盘、运势、合盘、紫微、八字、流年、大限

${color("yellow", "在 Claude Code / OpenClaw 中试试:")}
  "帮我算命"
  "看看我今年的运势"
  "帮我排个八字"

${color("dim", "重启 Claude Code 会话后 skill 将自动加载")}
`);
}

async function main() {
  const rl = createPrompt();

  try {
    printBanner();

    // Step 1: Detect platforms
    const platforms = await detectPlatform();
    const selected = await selectPlatform(rl, platforms);

    // Step 2: Install skill files
    logStep("2/4", "安装 Skill 文件...");

    if (selected === "both") {
      await installSkill(CLAUDE_SKILLS_DIR, "Claude Code");
      await installSkill(OPENCLAW_SKILLS_DIR, "OpenClaw");
    } else {
      await installSkill(selected.dir, selected.name);
    }

    // Step 3: Install CLI
    await installCli();

    // Step 4: Summary
    printSummary(platforms);

    rl.close();
  } catch (error) {
    logError(`安装失败: ${error.message}`);
    console.error(error);
    rl.close();
    process.exit(1);
  }
}

main();
