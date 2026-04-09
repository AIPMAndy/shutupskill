# shutupskill

让 AI 不废话。不是魔法，是提示词注入。

## 这版到底解决了什么

原项目最大问题，不是理念，而是实现假设过时：

- 旧版写死 `~/.openclaw/agents/<agent>/workspace/SOUL.md`
- 但当前 OpenClaw 环境通常只有全局 `SOUL.md`
- 结果：`--agent`、`--all`、状态判断都会误导

新版直接收敛：

- 只支持 **全局 SOUL 注入**
- 不再伪装成 per-agent 优化
- 状态输出明确写 `scope: global only`
- 自动备份，可恢复
- `--apply` 遇到旧注入版本会自动升级

## 重要现实

`shutupskill` 能不能在 OpenClaw 里直接通过 `/shutup` 用，不只取决于这个仓库。
还取决于两件事：

1. skill 文件是否真的安装到 `~/.openclaw/skills/shutupskill/`
2. **OpenClaw gateway 是否正在运行并已重载技能命令**

如果 gateway 没启动，或者没重载，skill 仓库再正确，也不会变成可调用命令。

## 功能

- 压缩输出风格
- 引导先做后说
- 提醒并行工具调用
- 强化错误重试与结果验证

## 本地安装

### 方案 A：直接复制到本地技能目录

```bash
bash install-local.sh
```

### 方案 B：手动复制

```bash
mkdir -p ~/.openclaw/skills/shutupskill
cp SKILL.md ~/.openclaw/skills/shutupskill/
cp index.js ~/.openclaw/skills/shutupskill/
cp package.json ~/.openclaw/skills/shutupskill/
cp README.md ~/.openclaw/skills/shutupskill/
mkdir -p ~/.openclaw/skills/shutupskill/backups
chmod +x ~/.openclaw/skills/shutupskill/index.js
```

## 验证 skill 本体

```bash
cd ~/.openclaw/skills/shutupskill
node index.js --status
node index.js --apply
```

如果这两条正常，说明 **skill 本体可用**。

## 让 OpenClaw 真正接管命令

安装 skill 后，必须让 gateway 重新加载命令。

```bash
openclaw gateway restart
```

如果 gateway 还没启动，先启动：

```bash
openclaw gateway start
```

如果系统提示服务未安装，按环境执行对应命令。

## 用法

```bash
shutup --apply
shutup --upgrade
shutup --status
shutup --diff
shutup --template-only
shutup --restore
```

默认：

```bash
shutup
```

等同于：

```bash
shutup --apply
```

## 状态示例

```bash
shutupskill status

layout: global
soul:   /home/node/.openclaw/workspace/SOUL.md
agents: main, battlewrite-writer, battlewrite-critic, battlewrite-judge
state:  optimized (v1.1.0)
scope:  global only
```

## 最终验收标准

下面 3 条都成立，才算“真的能用”：

1. `~/.openclaw/skills/shutupskill/` 下有完整文件
2. `node index.js --status` 正常
3. gateway 已重载，且你在聊天里发 `/shutup --status` 能返回结果

## 适合场景

- GPT / Kimi 这类偏啰嗦模型
- 编程、排错、数据分析、文档处理
- 想减少无效 token

## 不适合场景

- 需要详细解释的教学场景
- 创意写作
- 情感交流
- 需要真正 per-agent 独立 persona 的部署

## 恢复

```bash
shutup --restore
```

## 结论

这版不吹。只做一件事：

**把全局 SOUL 改得更短、更狠、更像任务型 agent。**
