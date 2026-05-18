# short-video-ip-leadgen

`short-video-ip-leadgen` 是一个给 Codex / Claude 使用的短视频商业 IP 分析 Skill。

它用于分析用户提供的抖音、小红书和短视频材料，学习商业博主的视频风格，保存独立记忆，并基于这些记忆生成原创的私域商业 IP 口播脚本。

这是一个 **Skill 包**，安装后由 Codex / Claude 直接调用。

## 目录结构

```text
short-video-ip-leadgen/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── scripts/
│   └── prepare_video_for_agent.py
├── references/
│   └── output_templates.md
├── memory/
│   └── .gitkeep
├── README.md
└── .gitignore
```

## 能做什么

- 分析抖音、小红书和短视频内容。
- 分析用户提供的本地视频、音频、字幕、截图。
- 将视频抽帧，交给 Codex / Claude 的视觉能力读取画面。
- 识别视频中的封面文字、画面字幕、分镜节奏和口播结构。
- 拆解主题、目标人群、痛点、表达方式和内容结构。
- 总结商业博主的口播风格、叙事方式、字幕风格和私域承接方式。
- 为每个商业博主单独保存“记忆”。
- 启用已有记忆，生成新的原创短视频脚本。
- 输出适合抖音/小红书发布的标题、封面文案、口播脚本和拍摄提示。

## 不能做什么

- 不从抖音、小红书链接下载视频。
- 不去水印。
- 不绕过登录、验证码、风控或平台限制。
- 不伪造点赞、评论、收藏、转发、粉丝或成交数据。
- 不洗稿、不搬运、不逐句改写、不伪原创。
- 不复刻原视频完整叙事顺序、案例、画面和文案。
- 不生成保证收益、保证疗效、保证结果的违规表达。

如果用户要求洗稿或搬运，应回复：

```text
可以基于该视频做选题拆解、结构学习和原创观点重构，但不能搬运或逐句改写。
```

## 安装到 Codex

把这个仓库克隆到 Codex 的 skills 目录：

```powershell
cd C:\Users\33162\.codex\skills
git clone <你的 GitHub 仓库地址> short-video-ip-leadgen
```

确保存在：

```text
C:\Users\33162\.codex\skills\short-video-ip-leadgen\SKILL.md
```

然后重启 Codex。

## 使用方式

在 Codex 对话中直接说：

```text
使用 $short-video-ip-leadgen 分析这个视频
```

或：

```text
用 short-video-ip-leadgen 帮我分析这个本地视频，并生成原创抖音口播脚本
```

## 用户开始操作模板

### 分析视频并保存记忆

```text
使用 $short-video-ip-leadgen

我的目标：分析这个商业博主的视频风格，并保存成记忆
视频路径：D:\a视频解析\下载.mp4
音频路径：D:\a视频解析\音频.mp4
记忆名：商业博主A
平台：抖音
```

### 启用记忆生成原创脚本

```text
使用 $short-video-ip-leadgen

启用记忆：商业博主A
我的身份：商业 IP 私域转化顾问
我的行业：私域转化 / 短视频获客
目标客户：想通过短视频获取咨询线索的知识型创业者
主题：这两年私域为什么越来越难做
风格要求：自然陈述，不要明显钩子，不要评论区引导，不要第一第二第三这种结构
输出：完整抖音发布脚本，包含标题、封面文案、口播脚本、拍摄提示
```


## 视频抽帧

当用户提供本地视频路径时，Codex 可以运行：

```powershell
python .\scripts\prepare_video_for_agent.py "D:\a视频解析\下载.mp4" --mode standard
```

脚本会生成：

```text
下载_codex_frames/
├── frame_001.jpg
├── frame_002.jpg
├── ...
└── manifest.json
```

Codex / Claude 再用视觉能力查看这些帧，分析：

- 封面文字
- 画面字幕
- 人物表达
- 分镜节奏
- 字幕风格
- 画面信息密度

抽帧模式：

```text
light       抽 8 帧，快速看风格
standard    抽 18 帧，适合普通口播视频
dense       接近每秒抽帧，更适合完整拆解
```

## 记忆功能

记忆用于保存某个商业博主、账号或稳定风格。

默认保存位置：

```text
memory/
```

如果 Skill 安装目录不可写，Codex 应改用当前工作区：

```text
.short-video-ip-leadgen/memory/
```

每个商业博主建议单独一个记忆文件：

```text
memory/商业博主A.json
memory/商业博主B.json
```

记忆内容包括：

```json
{
  "memory_name": "商业博主A",
  "creator_label": "商业博主A",
  "platform": "douyin",
  "business_category": "商业认知",
  "topics": [],
  "hook_patterns": [],
  "narrative_structure": [],
  "spoken_style": [],
  "visual_style": [],
  "subtitle_style": "",
  "editing_rhythm": "",
  "trust_building": [],
  "private_domain_method": [],
  "lead_magnets": [],
  "do_not_copy": [],
  "samples": []
}
```

记忆只用于参考底层风格、节奏和结构，不能用于复刻。

## 输出格式

常规输出：

```text
标题：

封面文案：

视频时长：

画面形式：

口播脚本：

字幕节奏：

拍摄提示：

结尾字幕：

合规说明：
```

如果用户要求“只要视频脚本”，则输出：

```text
标题：

封面文案：

口播脚本：

拍摄提示：
```


## 典型工作流

1. 用户提供视频、音频、字幕、截图或链接。
2. Codex 判断材料是否足够。
3. 如果是本地视频，运行抽帧脚本。
4. Codex 查看帧图并提取字幕、画面和风格。
5. Codex 结合音频字幕或用户提供的转写文本做内容分析。
6. 如果用户提供记忆名，保存商业博主风格记忆。
7. 如果用户启用记忆，读取记忆作为风格参考。
8. 输出原创视频脚本。

## 推荐提示词

```text
使用 $short-video-ip-leadgen

请分析这个视频的内容结构和商业博主风格。
不要洗稿，不要复刻原视频。
请保存记忆名：商业博主A。
然后基于这个记忆，帮我写一条新的抖音口播脚本。
要求自然陈述，不要明显引流，不要评论区引导。
```
