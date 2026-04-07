#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');
const AGENTS_DIR = path.join(OPENCLAW_DIR, 'agents');
const BACKUP_DIR = path.join(OPENCLAW_DIR, 'skills', 'shutupskill', 'backups');
const VERSION = '1.0.0';

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

function getAllAgents() {
  if (!fs.existsSync(AGENTS_DIR)) return [];
  return fs.readdirSync(AGENTS_DIR).filter(name => {
    const agentDir = path.join(AGENTS_DIR, name);
    return fs.statSync(agentDir).isDirectory();
  });
}

function getAgentStatus(agentName) {
  const soulPath = path.join(AGENTS_DIR, agentName, 'workspace', 'SOUL.md');
  if (!fs.existsSync(soulPath)) return 'no_soul';
  
  const content = fs.readFileSync(soulPath, 'utf-8');
  if (content.includes('输出优化规则')) {
    const match = content.match(/shutupskill v([\d.]+)/);
    return match ? `v${match[1]}` : 'v?.?.?';
  }
  return 'not_optimized';
}

function backupSoul(agentName) {
  const soulPath = path.join(AGENTS_DIR, agentName, 'workspace', 'SOUL.md');
  if (!fs.existsSync(soulPath)) return false;

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `${agentName}_SOUL_${timestamp}.md`);
  fs.copyFileSync(soulPath, backupPath);
  
  // 清理旧备份，只保留最近 5 个
  cleanOldBackups(agentName);
  
  return true;
}

function cleanOldBackups(agentName) {
  if (!fs.existsSync(BACKUP_DIR)) return;
  
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith(`${agentName}_SOUL_`))
    .sort()
    .reverse();
  
  // 保留最近 5 个，删除其余
  backups.slice(5).forEach(backup => {
    fs.unlinkSync(path.join(BACKUP_DIR, backup));
  });
}

function optimizeAgent(agentName, upgrade = false) {
  const soulPath = path.join(AGENTS_DIR, agentName, 'workspace', 'SOUL.md');

  if (!fs.existsSync(soulPath)) {
    console.log(`  skip ${agentName}: no SOUL.md`);
    return false;
  }

  let content = fs.readFileSync(soulPath, 'utf-8');

  if (content.includes('输出优化规则')) {
    if (!upgrade) {
      console.log(`  skip ${agentName}: already optimized (use --upgrade to update)`);
      return false;
    }
    
    // 升级：删除旧规则，追加新规则
    const regex = /\n---\n\n# 输出优化规则[\s\S]*?(?=\n---\n|$)/;
    content = content.replace(regex, '');
    console.log(`  upgrading ${agentName}...`);
  }

  backupSoul(agentName);
  content += OPTIMIZATION_TEMPLATE;
  fs.writeFileSync(soulPath, content, 'utf-8');
  console.log(`  done: ${agentName}`);
  return true;
}

function restoreAgent(agentName) {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log(`  no backups`);
    return false;
  }

  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith(`${agentName}_SOUL_`))
    .sort()
    .reverse();

  if (backups.length === 0) {
    console.log(`  no backup for ${agentName}`);
    return false;
  }

  const latestBackup = path.join(BACKUP_DIR, backups[0]);
  const soulPath = path.join(AGENTS_DIR, agentName, 'workspace', 'SOUL.md');

  fs.copyFileSync(latestBackup, soulPath);
  console.log(`  restored: ${agentName} (from ${backups[0]})`);
  return true;
}

function showStatus() {
  const agents = getAllAgents();
  if (agents.length === 0) {
    console.log('no agents found');
    return;
  }

  console.log('\nAgent Status:\n');
  agents.forEach(agent => {
    const status = getAgentStatus(agent);
    let statusText;
    if (status === 'no_soul') {
      statusText = '❌ no SOUL.md';
    } else if (status === 'not_optimized') {
      statusText = '⚪ not optimized';
    } else {
      statusText = `✅ optimized (${status})`;
    }
    console.log(`  ${agent.padEnd(20)} ${statusText}`);
  });
  console.log('');
}

function showDiff() {
  console.log('\n=== Preview: Content to be injected ===\n');
  console.log(OPTIMIZATION_TEMPLATE);
  console.log('\n=== End of preview ===\n');
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
shutupskill v${VERSION} - 让 AI 不废话

用法:
  /shutup --all                优化所有 agent
  /shutup --agent <name>       优化指定 agent
  /shutup --upgrade            升级已优化的 agent 到最新版本
  /shutup --status             查看所有 agent 的优化状态
  /shutup --diff               预览会注入的内容
  /shutup --template-only      输出完整模板
  /shutup --restore            恢复所有备份
  /shutup --restore --agent <name>  恢复指定 agent
    `);
    return;
  }

  if (args.includes('--status')) {
    showStatus();
    return;
  }

  if (args.includes('--diff')) {
    showDiff();
    return;
  }

  if (args.includes('--template-only')) {
    console.log(OPTIMIZATION_TEMPLATE);
    return;
  }

  const agents = getAllAgents();
  if (agents.length === 0) {
    console.log('no agents');
    return;
  }

  const upgrade = args.includes('--upgrade');

  if (args.includes('--restore')) {
    if (args.includes('--agent')) {
      const idx = args.indexOf('--agent');
      restoreAgent(args[idx + 1]);
    } else {
      agents.forEach(restoreAgent);
    }
    console.log('\nrestart: openclaw restart');
    return;
  }

  if (args.includes('--all')) {
    console.log(`found ${agents.length} agents\n`);
    let count = 0;
    agents.forEach(a => { if (optimizeAgent(a, upgrade)) count++; });
    console.log(`\noptimized ${count} agents. restart openclaw.`);
  } else if (args.includes('--agent')) {
    const idx = args.indexOf('--agent');
    const name = args[idx + 1];
    if (!agents.includes(name)) {
      console.log(`"${name}" not found. available: ${agents.join(', ')}`);
      return;
    }
    optimizeAgent(name, upgrade);
    console.log('\nrestart openclaw.');
  } else {
    console.log('usage: /shutup --all or /shutup --agent <name>');
    console.log('run /shutup --help for more options');
  }
}

if (require.main === module) {
  main();
}

module.exports = { optimizeAgent, restoreAgent, getAllAgents, getAgentStatus };
