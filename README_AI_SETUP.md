# 化学实验室AI系统 - 快速使用指南

## 🚀 立即开始

### 1. 获取Gemini API密钥 (免费)

访问 **[Google AI Studio](https://makersuite.google.com/app/apikey)** 获取免费API密钥

> 💡 Gemini API提供免费额度，无需信用卡！

### 2. 配置API密钥

编辑项目根目录的 `.env` 文件：

```bash
VITE_GEMINI_API_KEY=你的实际API密钥（替换这行）
VITE_GEMINI_MODEL=gemini-pro
```

### 3. 重启开发服务器

**重要！** 修改 `.env` 后必须**重启服务器**：

```bash
# 在终端中按 Ctrl+C 停止服务器
# 然后重新运行
npm run dev
```

### 4. 开始测试 🎉

打开 http://localhost:5173/ 并尝试以下实验：

#### 测试1：爆炸效果 💥
- 物质：氢气 + 氧气
- 操作：点燃
- 预期：爆炸特效 + 生成水

#### 测试2：燃烧效果 🔥
- 物质：甲烷
- 操作：点燃  
- 预期：火焰动画 + 燃烧音效

#### 测试3：冒泡效果 💧
- 物质：碳酸钙 + 盐酸
- 操作：混合
- 预期：气泡上升 + 冒泡声

## ⚙️ 系统功能

### AI智能判断
✅ 自动分析化学反应  
✅ 生成准确的产物  
✅ 判断特效类型  
✅ 提供安全警告  

### 视觉特效
🔥 燃烧 - Canvas粒子火焰  
💥 爆炸 - 冲击波+震动  
💧 冒泡 - 气泡上升  
⚡ 火花 - 飞溅效果  
💨 烟雾 - 渐变上升  

### 音效系统
🔊 Web Audio API程序化生成  
🔊 无需外部音频文件  
🔊 实时合成音效  

## ❓ 常见问题

### Q: API密钥在哪里配置？
A: 编辑项目根目录的 `.env` 文件

### Q: 配置后没有效果？
A: 必须重启开发服务器（Ctrl+C 然后 `npm run dev`）

### Q: API调用失败？
A: 检查API密钥是否正确，网络是否正常

### Q: 想关闭音效？
A: 音效服务暂未提供UI开关，可临时修改 `audioService.setVolume(0)`

## 📁 相关文件

- [AI服务](file:///Users/tycul/AILabs/ChemLabGame/src/services/ai-service.ts)
- [音效服务](file:///Users/tycul/AILabs/ChemLabGame/src/services/audio-service.ts)
- [特效系统](file:///Users/tycul/AILabs/ChemLabGame/src/services/effects-system.ts)
- [完整实现报告](file:///Users/tycul/.gemini/antigravity/brain/938f90be-3f89-4098-b0ae-9ebe20e70aa4/walkthrough.md)
