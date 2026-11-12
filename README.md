# 中台 v1 内核

本机决策看板的命令行和服务。设计见 `中台/设计.md`，规则见 `中台/docs/adr/`。

## 怎么跑

```sh
中台/dt health          # 第一次调用会自动拉起服务
中台/dt import github 117
中台/dt import github 139
中台/dt show 117        # 地图正文、子票、评论、覆盖表
中台/dt show D-0009     # 一条决定和它的前提
中台/dt coverage 117
中台/dt status          # orca 工作状态
```

数据默认放 `~/.grilling/中台/`。用 `GRILLING_HOME` 换目录，用 `GRILLING_PORT` 换端口，默认 `127.0.0.1:8788`。

服务只监听本机回环地址。CLI 读写都走 HTTP；服务是唯一写者。服务没起来时，CLI 会后台拉起，最多等 5 秒。写请求失败不重试，报「写入结果未知」，退出码 4。

## 命令

写命令一次只写一条事件。

| 命令 | 作用 |
| --- | --- |
| `dt import github <地图号>` | 从 GitHub 导入一张地图，只做一次 |
| `dt issue create/edit/state/close/reopen/label/block` | 票和地图 |
| `dt comment add/edit/delete` | 评论 |
| `dt decision create/overturn/void` | 决定 |
| `dt premise add/edit/judge` | 前提 |
| `dt impact list/show/act/close` | 影响清单，`act` 也可写 `handle` |
| `dt show <编号>` | 看地图、票、决定、前提或影响清单 |
| `dt coverage [地图号]` | 覆盖表 |
| `dt status` | 工作状态快照，强制问一次 orca |
| `dt sync [--check] <地图号>` | 同步到 GitHub 镜像 |
| `dt mirror <地图号> on\|off` | 镜像开关 |
| `dt rebuild` / `dt hash` | 从事件重建索引，打印状态哈希 |
| `dt snapshot` | 提交数据目录 |
| `dt events` | 跟 SSE 事件流 |

退出码：0 成功；1 业务错误；2 用法错误；3 服务不可用；4 写入结果未知。

## 数据目录

```
~/.grilling/中台/
  events.jsonl     权威事件日志，只追加
  board.db         可删可重建的索引
  sync.jsonl       同步日志和 GitHub 编号映射
  workstate.json   工作状态快照
  service.json      服务端口和 pid
  service.log       服务日志
  backups/          重建前的 events 副本
```

数据目录初始化成独立 git 仓。服务空闲 60 秒后提交，两次至少隔 10 分钟；正常退出补一次。`dt snapshot` 手动提交。

## 导入和同步

- 导入读 GitHub 的 issue、评论、标签、状态、父子、阻塞，写一条 `import` 事件。一张地图只导入一次。
- 从四列表重建决定：`source_ticket` 取评论所在票，`supersedes` 取「取代」列，`output_files` 取「产出文件」列。
- 根决定编号 `D-<地图号>-ROOT`。主句取 `**主句：**`，没有取第一句；拆句取旧覆盖表的原文片段。
- 导入的票 `derived_from` 挂根决定，`split_reason` 留空，显示「未记录」。
- 同步由运营者按地图触发。`--check` 只读，打印计划；不带 `--check` 才写 GitHub。
- 同步写 issue、评论、标签、父子、阻塞，以及地图正文里的生成段。中台为准，GitHub 上的直接修改在下一次同步被覆盖。
- 生成段到约 60KB 截断，末尾写「完整内容在中台」和本地地址。

## 工作状态

服务每 2 秒跑一次 `orca worktree ps --json`，按 `repoId` 加 `linkedIssue` 映射到票，分支名 `issue-<N>` 兜底。状态四个：`未领取`、`进行中`、`等待人`、`被挡`。连续两次失败显示离线，快照保留最后一次状态。工作状态不进事件，不进状态哈希。

## 测试

```sh
python3 -m unittest discover -s 中台/tests -v
```

测试不联网，不碰真实数据目录。覆盖折叠、哈希、导入解析、前提、影响清单、ADR 0006 的例子、v1 事件、阻塞、工作状态和同步计划。

## v1 边界

- 只同步导入的图。中台新建的地图还没有 GitHub 号，`dt sync` 会拒绝。
- 导入的老票缺拆票理由和票与票、决定与决定的派生；这些边要靠后续编辑补。
- 屏幕在《实现屏幕：完整内容、编辑与同步状态》里做，`dt open` 现在只开一个占位页。
- assignees、milestones、projects、reactions、通知不搬。
