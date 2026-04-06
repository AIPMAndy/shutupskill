# shutupskill

让 AI 不废话。

## 问题

GPT-5.4/Kimi：
- ❌ 啰嗦
- ❌ 工具调用弱
- ❌ 半途而废

## 解决

一个命令：
- ✅ 深度推理
- ✅ 任务完成率 100%
- ✅ 工具精准度 95%+
- ✅ 极简输出（≤ 3 句话）

## 安装

```bash
openclaw skill install https://github.com/你的用户名/shutupskill
```

手动：

```bash
cd ~/.openclaw/skills
git clone https://github.com/你的用户名/shutupskill
cd shutupskill && npm install
```

## 使用

```bash
/shutup --all                    # 优化所有
/shutup --agent dev              # 优化指定
/shutup --template-only          # 查看模板
/shutup --restore                # 恢复备份
/shutup --restore --agent dev    # 恢复指定
```

## 效果

### 优化前
```
用户："优化 API"

AI："好的，让我先读取文件，然后分析性能瓶颈..."
"您希望优先优化哪个？"
```

### 优化后
```
用户："优化 API"

AI：[直接执行]
"发现 3 个问题，优化中。"
"完成。响应时间：850ms → 290ms。"
```

## 优化内容

| 维度 | 规则 |
|------|------|
| 深度推理 | 执行前内部推理 + 多方案 |
| 任务完成 | 3 次尝试 + 自主决策 |
| 工具调用 | 检查清单 + 优先级 + 并行 |
| 输出效率 | ≤ 3 句话 + 删冠词/客套话 + 短同义词 |
| 错误处理 | 自动尝试 3 种方案 |

### 输出规则细节

**删除：**
- 冠词（"一个"、"这个"）
- 语气填充词（"那么"、"其实"）
- 客套话（"希望能帮到您"）
- 犹豫性表达（"可能"、"也许"）

**允许：**
- 短句、碎片句

**优先短同义词：**
- 「大」不是「庞大」
- 「修」不是「实施解决方案」
- 「查」不是「进行检查」

**保持精确：**
- 技术术语
- 代码块
- 报错信息（原样引用）

**推荐句式：**
```
[问题][动作][原因]。[下一步]。

示例：
"配置错误。已修复。原因：缺 API key。重启生效。"
"性能瓶颈在第 45 行。已优化。响应时间降 60%。"
```

## 兼容性

- OpenClaw: >= 2026.3.28
- 模型: GPT-5.x, Kimi, Claude, Qwen, MiniMax

## 卸载

```bash
openclaw skill uninstall shutupskill
/shutup --restore
```

## 许可证

MIT

## 作者

Andy
