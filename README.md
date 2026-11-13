# 决策中台（Decision Board）

跑在本机的决策管理工具。它记决定、票和前提的关系，GitHub 只留一份只读副本。

> 这个仓库是 2026-11-13 从 [`Lil-BobCN/grilling-remote`](https://github.com/Lil-BobCN/grilling-remote) 的 `中台/` 目录一次性导出的。两边不自动同步，导出后各走各的。提交信息里的 `#编号` 指原仓库的 issue；ADR 里的 issue 链接也指向原仓库，需要原仓库保持公开。

## 是什么

- 决定是主记录，只写一次；要改就新建一条取代旧的。
- 票是从决定拆出来的工作项，做完产出新决定，或推翻旧决定。
- 前提是一条决定要成立必须先成立的一句话。前提破了，影响清单会列出受影响的决定和票。
- 一张地图是一组决定和票的容器，根决定是地图的终点。

## 运行环境

- Python 3.11 以上，只用标准库。
- 可选：`gh`（从 GitHub 导入、同步镜像）、`orca`（工作状态）、Node（前端布局测试，没有会跳过）。

## 怎么跑

```sh
./dt health          # 第一次调用会自动拉起本机服务
./dt open            # 打开网页屏幕
./dt show <地图号>    # 看地图正文、子票、评论和覆盖表
./dt coverage <地图号>
```

数据默认放 `~/.grilling/中台/`。目录名沿用原项目，代码里写死。用 `GRILLING_HOME` 换目录，用 `GRILLING_PORT` 换端口，默认 `127.0.0.1:8788`。

服务只监听本机回环地址。CLI 读写都走 HTTP，服务是唯一写者。服务没起来时，CLI 会后台拉起，最多等 5 秒。写请求失败不重试，报「写入结果未知」，退出码 4。

## 命令

写命令一次只写一条事件。

| 命令 | 作用 |
| --- | --- |
| `./dt import github <地图号>` | 从 GitHub 导入一张地图，只做一次 |
| `./dt issue create/edit/state/close/reopen/label/block` | 票和地图；`issue close` 遇到等合并的记录会拒绝，`--force` 只给运营者 |
| `./dt close prepare <票号> --pr <号> --sha <sha> --payload <文件>` | 开完 PR 后写待关票记录，合并后服务自动关票 |
| `./dt close revoke <票号>` | 撤回还没合并的待关票记录 |
| `./dt issue confirm-derived <票号> [--decision <决定号>]` | 确认推断来源，移进 `derived_from` |
| `./dt comment add/edit/delete` | 评论 |
| `./dt decision create/overturn/void` | 决定 |
| `./dt decision annotate <决定号> --rationale <理由> [--source <来源>]` | 旧图补记依据，不改陈述和状态 |
| `./dt premise add/edit/judge` | 前提 |
| `./dt impact list/show/act/close` | 影响清单，`act` 也可写 `handle` |
| `./dt show <编号>` | 看地图、票、决定、前提或影响清单 |
| `./dt coverage [地图号]` | 覆盖表 |
| `./dt status` | 工作状态快照，强制问一次 orca |
| `./dt sync [--check] <地图号>` | 同步到 GitHub 镜像 |
| `./dt mirror <地图号> on\|off` | 镜像开关 |
| `./dt rebuild` / `./dt hash` | 从事件重建索引，打印状态哈希 |
| `./dt snapshot` | 提交数据目录 |
| `./dt events` | 跟 SSE 事件流 |

退出码：0 成功；1 业务错误；2 用法错误；3 服务不可用；4 写入结果未知。

## 屏幕

`./dt open` 打开 `http://127.0.0.1:8788/`。屏幕读 `/board/<地图号>`，事件走 `/events` 的 SSE，动作和 CLI 一样发到 `/command`，写进同一条事件日志。

- 决策图按根 → 票 → 决定 → 票 → 决定分层；一个决定组是一张票产出的全部决定，主决定给结论，其余的决定列在卡片里。主来源画实线，同层另一条来源画短虚线，跨层来源只写在票卡上。推断来源画蓝色虚线，票详情点「确认来源」后转实线。取代边用琥珀虚线。
- 影响清单打开时，范围外的节点压暗；待处理项标红，处理完的保留在范围里。
- 覆盖表把根决定的拆句、接的票和拆票理由放在一行，缺口标红。
- 顶部信号条列出全部信号：无主票、无源决定、吃旧决定、裸决定、破前提、覆盖缺口、影响清单未清、工作卡住、同步异常、待关票记录过期、缺待关票记录、关票 SHA 不符、关票无法核对、关票写入失败。点信号筛图。
- 详情抽屉分票和决定两套。票显示拆票理由、`derived_from`、covers、正文、评论、阻塞和同步状态；决定显示前提、依据、取代关系、派生票和影响史。
- 动作：改票、写评论、改评论、加前提、判前提、推翻决定、新建票、关闭/重开票、处理影响清单、按地图同步。
- 屏幕文件在 `web/`，服务只认白名单里的文件名。

## 数据目录

```text
~/.grilling/中台/
  events.jsonl     权威事件日志，只追加
  board.db         可删可重建的索引
  sync.jsonl       同步日志和 GitHub 编号映射
  workstate.json   工作状态快照
  service.json     服务端口和 pid
  service.log      服务日志
  backups/         重建前的 events 副本
```

数据目录初始化成独立 git 仓。服务空闲 60 秒后提交，两次至少隔 10 分钟；正常退出补一次。`./dt snapshot` 手动提交。

## 导入和同步

- 导入读 GitHub 的 issue、评论、标签、状态、父子、阻塞，写一条 `import` 事件。一张地图只导入一次。本地快照用 `./dt import --payload <文件>` 导入。
- 从四列表重建决定：`source_ticket` 取评论所在票，`supersedes` 取「取代」列，`output_files` 取「产出文件」列，`rationale` 取评论里的 `## 依据` 一节（约定写在关票评论）。
- 根决定编号 `D-<地图号>-ROOT`。主句取 `**主句：**`，没有取第一句；拆句取旧覆盖表的原文片段。
- 地图正文 `## 拆票理由` 进 `split_rationale`，票正文 `## 拆票理由` 进 `split_reason`。没有就是空，显示「未记录」。
- 导入的票 `derived_from` 挂根决定。
- 同步由运营者按地图触发。`--check` 只读，打印计划；不带 `--check` 才写 GitHub。
- 同步写 issue、评论、标签、父子、阻塞，以及地图正文里的生成段。中台为准，GitHub 上的直接修改在下一次同步被覆盖。
- 生成段到约 60KB 截断，末尾写「完整内容在中台」和本地地址。

`import github` 和 `sync` 需要 `gh`。服务启动时按 `GRILLING_REPO=<owner/repo>` 或当前目录识别目标仓库，启动后不再改。要在别的项目里用，先设 `GRILLING_REPO` 再启动服务；服务已经在跑时，换目录不会换仓库。要换仓库，先停掉服务（pid 在 `~/.grilling/中台/service.json`），设好 `GRILLING_REPO` 再启动；或者每个项目用独立的 `GRILLING_HOME` 和端口。

## 工作状态

服务每 2 秒跑一次 `orca worktree ps --json`，按 `repoId` 加 `linkedIssue` 映射到票，分支名 `issue-<N>` 兜底。`linkedIssue` 和分支名带 GitHub 号时，先用本地票号直接查；查不到再用 `sync.jsonl` 的 `I-xxxx -> GitHub 号` 反查。导入票的本地号等于 GitHub 号，直接查得到。状态四个：`未领取`、`进行中`、`等待人`、`被挡`。连续两次失败显示离线，快照保留最后一次状态。工作状态不进事件，不进状态哈希。

有待关票记录时票显示「等合并」。PR 合并后服务核对 head SHA，写一条 `issue.close` 展开记录：四条评论、决定和关票一次完成。细节见 `docs/adr/0007-自动关票-待关票记录与合并触发.md`。

## 测试

```sh
python3 -m unittest discover -s tests -v
```

测试不联网，不碰真实数据目录。覆盖折叠、哈希、导入解析、前提、影响清单、ADR 0006 的例子、v1 事件、阻塞、工作状态、自动关票和同步计划。

## 已知边界

- 新建的地图镜像开关默认关。`./dt mirror <地图号> on` 后，第一次 `./dt sync` 会先建地图 issue，再写票、父子边和阻塞。导入的图默认开。
- 导入的老票缺拆票理由和票与票、决定与决定的派生；这些边要靠后续编辑补。
- 屏幕不做对话、会话链接和登录。
- assignees、milestones、projects、reactions、通知不搬。

## 文档

- 设计稿：`设计.md`
- 规则：`docs/adr/`
- 团队使用方式：`docs/工作流.md`
- 运营者日常：`docs/运营者日常.md`
- 词汇表：`GLOSSARY.md`
- 屏幕设计原型：`design/prototype/screen/`

## 许可证

MIT，见 `LICENSE`。
