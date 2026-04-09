#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');
const AGENTS_DIR = path.join(OPENCLAW_DIR, 'agents');
const SKILL_DIR = path.join(OPENCLAW_DIR, 'skills', 'shutupskill');
const BACKUP_DIR = path.join(SKILL_DIR, 'backups');
const VERSION = '1.1.0';

const OPTIMIZATION_TEMPLATE = `
---

# 输出优化规则 (shutupskill v${VERSION})

## 核心目标
改善输出风格和工作流程：
- **先做后说**：减少询问，直接执行
- **工具并行**：能同时调用的工具不串行
- **错误重试**：遇错尝试多种方案
- **极简输出**：≤ 3 句话

## 1. 工作流程优化

**执行前思考：**
1. 用户真正想要什么？
2. 需要哪些信息？
3. 工具顺序对吗？参数完整吗？

**先做后说：**
- 能直接执行的，不要先问
- 执行过程中简短汇报进度
- 完成后给出结果和关键数据

## 2. 错误处理引导

**遇问题时尝试多种方案：**
- 文件路径错：搜相似 → 查上级 → 问用户
- API 失败：重试 → 换备用 → 降级
- 权限不足：查权限 → 给命令 → 问用户

**操作后验证（建议）：**
- 写文件 → 读确认
- 改代码 → 查语法
- API 调用 → 验证返回

## 3. 工具调用优化

**调用前检查清单：**
- [ ] 是否选择了最佳工具？
- [ ] 参数是否完整（无 undefined）？
- [ ] 能否并行调用？

**工具优先级建议：**
\`\`\`
Read > Bash cat
Glob > Bash find
Grep > Bash grep
Edit > Bash sed
飞书 API > 浏览器
批量并行 > 单次串行
\`\`\`

## 4. 极简输出

**规则：**
- 先做后说
- ≤ 3 句话
- 删除：冠词、语气填充词、客套话、犹豫性表达
- 允许：短句、碎片句
- 优先短同义词：「大」不是「庞大」，「修」不是「实施解决方案」
- 技术术语保持精确
- 代码块不改
- 报错信息原样引用
- 推荐句式：[问题][动作][原因]。[下一步]。

**禁止：**
- "让我先..."
- "我将要..."
- "以上就是..."
- "希望这能帮到您"
- "如果您还有..."

**示例：**
\`\`\`
❌ "我读取了文件，发现有 100 行代码，其中包含..."
✅ "发现性能瓶颈在第 45 行。已优化。"

❌ "好的，让我先读取一下配置文件，然后分析..."
✅ [直接读取] "配置错误。已修复。"

❌ "经过仔细分析，我认为这个问题可能是由于..."
✅ "问题：内存泄漏。原因：未释放连接。已修复。"
\`\`\`

## 5. 错误处理建议

**多次尝试策略：**
\`\`\`
第 1 次失败 → 调参重试
第 2 次失败 → 换方案
第 3 次失败 → 报告原因 + 给建议
\`\`\`

**推荐表达：**
- ✅ "方案 A 失败（原因：X），尝试方案 B"
- ✅ "已尝试 3 种方案，建议：..."

**避免表达：**
- ⚠️ "我无法完成"（不给任何建议）
- ⚠️ "请检查..."（直接推给用户）

## 自检清单

- [ ] 是否先做后说？
- [ ] 工具调用是否优化？
- [ ] 输出是否简洁（≤ 3 句话）？
- [ ] 是否验证了结果？
- [ ] 遇错是否尝试了多种方案？

**目标：通过提示词引导，改善输出风格和工作效率。**
`;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getGlobalSoulPath() {
  return path.join('/home/node/.openclaw/workspace', 'SOUL.md');
}

function getAllAgents() {
  if (!fs.existsSync(AGENTS_DIR)) return [];
  return fs.readdirSync(AGENTS_DIR).filter(name => {
    const agentDir = path.join(AGENTS_DIR, name);
    try {
      return fs.statSync(agentDir).isDirectory();
    } catch {
      return false;
    }
  });
}

function detectMode() {
  const globalSoul = getGlobalSoulPath();
  if (fs.existsSync(globalSoul)) {
    return { mode: 'global', soulPath: globalSoul };
  }
  return { mode: 'unsupported', soulPath: globalSoul };
}

function getStatus() {
  const { mode, soulPath } = detectMode();
  if (mode === 'unsupported') return { mode, optimized: false, version: null, soulPath };

  const content = fs.readFileSync(soulPath, 'utf-8');
  const optimized = content.includes('输出优化规则');
  const match = content.match(/shutupskill v([\d.]+)/);
  return {
    mode,
    optimized,
    version: match ? match[1] : null,
    soulPath,
  };
}

function backupSoul() {
  const { soulPath } = detectMode();
  if (!fs.existsSync(soulPath)) return false;

  ensureDir(BACKUP_DIR);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `global_SOUL_${timestamp}.md`);
  fs.copyFileSync(soulPath, backupPath);
  cleanOldBackups();
  return backupPath;
}

function cleanOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return;
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('global_SOUL_'))
    .sort()
    .reverse();
  backups.slice(5).forEach(file => fs.unlinkSync(path.join(BACKUP_DIR, file)));
}

function stripInjectedBlock(content) {
  return content.replace(/\n---\n\n# 输出优化规则 \(shutupskill v[\d.]+\)[\s\S]*$/m, '');
}

function optimizeGlobal(upgrade = false) {
  const info = detectMode();
  if (info.mode === 'unsupported') {
    console.log('unsupported layout: global SOUL.md not found');
    return false;
  }

  let content = fs.readFileSync(info.soulPath, 'utf-8');
  const match = content.match(/shutupskill v([\d.]+)/);
  const currentVersion = match ? match[1] : null;
  const alreadyOptimized = content.includes('输出优化规则');
  const needsUpgrade = alreadyOptimized && currentVersion !== VERSION;

  if (alreadyOptimized && !upgrade && !needsUpgrade) {
    console.log(`already optimized (v${currentVersion || VERSION})`);
    return false;
  }

  backupSoul();
  if (alreadyOptimized) content = stripInjectedBlock(content);
  content += OPTIMIZATION_TEMPLATE;
  fs.writeFileSync(info.soulPath, content, 'utf-8');

  if (needsUpgrade && !upgrade) {
    console.log(`done: upgraded global SOUL ${currentVersion} -> ${VERSION} (${info.soulPath})`);
  } else {
    console.log(`done: global SOUL updated (${info.soulPath})`);
  }
  return true;
}

function restoreGlobal() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('no backups');
    return false;
  }

  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('global_SOUL_'))
    .sort()
    .reverse();

  if (backups.length === 0) {
    console.log('no backups');
    return false;
  }

  const latestBackup = path.join(BACKUP_DIR, backups[0]);
  const { soulPath } = detectMode();
  fs.copyFileSync(latestBackup, soulPath);
  console.log(`restored: ${latestBackup}`);
  return true;
}

function showStatus() {
  const info = getStatus();
  const agents = getAllAgents();

  console.log('\nshutupskill status\n');
  console.log(`layout: ${info.mode}`);
  console.log(`soul:   ${info.soulPath}`);
  console.log(`agents: ${agents.length ? agents.join(', ') : '(none)'}`);

  if (info.mode === 'unsupported') {
    console.log('state:  unsupported');
    console.log('note:   global SOUL.md not found');
    console.log('');
    return;
  }

  if (info.optimized) {
    console.log(`state:  optimized (v${info.version || '?'})`);
    console.log('scope:  global only');
  } else {
    console.log('state:  not optimized');
    console.log('scope:  global only');
  }
  console.log('');
}

function showDiff() {
  console.log('\n=== Preview: Content to be injected (global SOUL only) ===\n');
  console.log(OPTIMIZATION_TEMPLATE);
  console.log('\n=== End of preview ===\n');
}

function printHelp() {
  console.log(`
shutupskill v${VERSION} - 让 AI 不废话

用法:
  shutup --apply            注入到全局 SOUL.md
  shutup --upgrade          升级已注入内容
  shutup --status           查看当前状态
  shutup --diff             预览注入内容
  shutup --template-only    输出完整模板
  shutup --restore          恢复最近备份
  shutup --help             查看帮助

说明:
  - 当前版本按全局 SOUL.md 工作，不做假 agent 级注入
  - 如果你的 OpenClaw 未来支持 per-agent SOUL，再扩展
    `);
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) return printHelp();
  if (args.includes('--status')) return showStatus();
  if (args.includes('--diff')) return showDiff();
  if (args.includes('--template-only')) return console.log(OPTIMIZATION_TEMPLATE);
  if (args.includes('--restore')) {
    restoreGlobal();
    console.log('\nrestart: openclaw gateway restart');
    return;
  }

  if (args.includes('--upgrade')) {
    optimizeGlobal(true);
    console.log('\nrestart: openclaw gateway restart');
    return;
  }

  if (args.includes('--apply') || args.length === 0) {
    optimizeGlobal(false);
    console.log('\nrestart: openclaw gateway restart');
    return;
  }

  console.log('unknown args');
  printHelp();
}

if (require.main === module) {
  main();
}

module.exports = {
  detectMode,
  getStatus,
  optimizeGlobal,
  restoreGlobal,
  getAllAgents,
  stripInjectedBlock,
};
