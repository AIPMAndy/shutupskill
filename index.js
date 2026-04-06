#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');
const AGENTS_DIR = path.join(OPENCLAW_DIR, 'agents');
const BACKUP_DIR = path.join(OPENCLAW_DIR, 'skills', 'shutupskill', 'backups');

const OPTIMIZATION_TEMPLATE = `
---

# 执行标准：对标 Claude Opus 4.6

## 核心要求
达到 Claude Opus 4.6 标准：
- **深度推理**：多步骤思考
- **任务完成率 100%**：不半途而废
- **工具调用精准度 95%+**：第一次就对
- **极简输出**：≤ 3 句话

## 1. 深度推理

**执行前内部推理：**
1. 用户真正想要什么？
2. 列 3 种方案，选最优，备 2 个
3. 需要哪些信息？工具顺序对吗？参数完整吗？

## 2. 任务完成度 100%

**遇问题 → 自动尝试 3 种方案：**
- 文件路径错：搜相似 → 查上级 → 问用户
- API 失败：重试 2 次 → 换备用 → 降级
- 权限不足：查权限 → 给命令 → 问用户

**操作后验证：**
- 写文件 → 读确认
- 改代码 → 查语法/测试
- API 调用 → 验证返回

## 3. 工具调用精准度

**调用前检查：**
- [ ] 最佳工具？
- [ ] 参数完整（无 undefined）？
- [ ] 能并行？

**优先级：**
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

## 5. 错误处理

**3 次尝试：**
\`\`\`
第 1 次失败 → 调参重试
第 2 次失败 → 换方案
第 3 次失败 → 报告 + 给方案
\`\`\`

**禁止说：**
- ❌ "我无法完成"
- ❌ "请检查..."

**必须说：**
- ✅ "方案 A 失败（原因：X），尝试方案 B"

## 自检清单

- [ ] 深度推理？
- [ ] 任务完成？
- [ ] 工具精准？
- [ ] 输出简洁（≤ 3 句话）？
- [ ] 验证结果？
- [ ] 遇错尝试 3 种方案？

**任何一项 NO，重新生成。**

**目标：让用户感觉不到你是 GPT-5.4/Kimi，而是 Claude Opus 4.6。**
`;

function getAllAgents() {
  if (!fs.existsSync(AGENTS_DIR)) return [];
  return fs.readdirSync(AGENTS_DIR).filter(name => {
    const agentDir = path.join(AGENTS_DIR, name);
    return fs.statSync(agentDir).isDirectory();
  });
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
  console.log(`  backed up: ${agentName}`);
  return true;
}

function optimizeAgent(agentName) {
  const soulPath = path.join(AGENTS_DIR, agentName, 'workspace', 'SOUL.md');

  if (!fs.existsSync(soulPath)) {
    console.log(`  skip ${agentName}: no SOUL.md`);
    return false;
  }

  let content = fs.readFileSync(soulPath, 'utf-8');

  if (content.includes('执行标准：对标 Claude Opus 4.6')) {
    console.log(`  skip ${agentName}: already optimized`);
    return false;
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
  console.log(`  restored: ${agentName}`);
  return true;
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
shutupskill - 让 AI 不废话

用法:
  /shutup --all              优化所有 agent
  /shutup --agent <name>     优化指定 agent
  /shutup --template-only    输出模板
  /shutup --restore          恢复备份
  /shutup --restore --agent <name>  恢复指定 agent
    `);
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

  console.log(`found ${agents.length} agents: ${agents.join(', ')}\n`);

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
    let count = 0;
    agents.forEach(a => { if (optimizeAgent(a)) count++; });
    console.log(`\noptimized ${count} agents. restart openclaw.`);
  } else if (args.includes('--agent')) {
    const idx = args.indexOf('--agent');
    const name = args[idx + 1];
    if (!agents.includes(name)) {
      console.log(`"${name}" not found. available: ${agents.join(', ')}`);
      return;
    }
    optimizeAgent(name);
    console.log('\nrestart openclaw.');
  } else {
    console.log('usage: /shutup --all or /shutup --agent <name>');
  }
}

if (require.main === module) {
  main();
}

module.exports = { optimizeAgent, restoreAgent, getAllAgents };
