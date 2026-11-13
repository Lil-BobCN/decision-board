window.PROTO_DATA = {
  "generatedAt": "2026-11-12 14:20",
  "map": {
    "id": 139,
    "title": "中台 v1：决策看板，GitHub 做镜像",
    "url": "https://github.com/Lil-BobCN/grilling-remote/issues/139",
    "rootDecision": "D-ROOT",
    "destination": "中台在本机跑起来，维护运营者的决策：Destination 是一句主句，存成根决定；根决定产生票，票产出或推翻决定；每次变更算出受影响的决定和票，把范围画出来并逐项处理；GitHub 是只读镜像，orca 是执行现场，票的工作状态实时同步回中台。",
    "fragments": [
      "中台在本机跑起来，维护运营者的决策。",
      "地图的 Destination 是一句主句，存成根决定。",
      "根决定产生第一批票。每张票写拆票理由和 `derived_from`。",
      "票产出决定，或推翻决定。决定记来源票、取代关系、派生关系、前提。",
      "决定一变，中台沿因果边算出受影响的决定和票，画出一个范围，生成影响清单。",
      "影响清单逐项处理：决定四档，票五种，运营者确认，确认记事件。",
      "GitHub 是只读镜像；orca 是执行现场，票的工作状态实时同步回中台。",
      "屏幕先做原型，原型定稿后实现。屏幕要能看决策图、影响清单、覆盖表和九类视觉信号。",
      "复刻 GitHub tracker 的核心编辑功能，作为支撑。"
    ]
  },
  "decisions": [
    {
      "id": "D-ROOT",
      "statement": "中台 v1：决策看板，GitHub 做镜像（根决定，9 句拆句）",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/设计.md"
      ],
      "base": "D-ROOT",
      "isBase": true,
      "root": true,
      "layer": "new",
      "sourceTicket": 139,
      "premises": []
    },
    {
      "id": "D-117",
      "statement": "旧图 #117 的终点（旧模型没有存成决定）",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "D-117",
      "isBase": true,
      "root": true,
      "layer": "old",
      "sourceTicket": null,
      "premises": []
    },
    {
      "id": "D-0001",
      "statement": "一项决定只在关票评论的四列表里写一次，五列固定为 `id`、`决定`、`取代`、`解答未定`、`产出文件`；没有结论的票第一行写 `无结论：<理由>",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "docs/agents/issue-tracker.md"
      ],
      "base": "D-0001",
      "isBase": true,
      "root": false,
      "layer": "old",
      "sourceTicket": 118,
      "premises": []
    },
    {
      "id": "D-0001a",
      "statement": "编号形如 `D-0002`，全仓连续，从 `D-0001` 起；同一张票第二条起加小写字母后缀；编号写完不复用，新号取台账最大号加一",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "docs/agents/issue-tracker.md"
      ],
      "base": "D-0001",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 118,
      "premises": []
    },
    {
      "id": "D-0001b",
      "statement": "开放票正文第一行写 `依据：D-0002,D-0005`，不依赖任何已定决定时写 `依据：无",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "docs/agents/issue-tracker.md"
      ],
      "base": "D-0001",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 118,
      "premises": []
    },
    {
      "id": "D-0002",
      "statement": "术语表用「决定」「台账」「依据」「推迟」四个词，旧词「已废」改成「被取代」；「扫描表」定义成决定的唯一写入点，「现行决定」定义成台账里没被标被取代的行",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "GLOSSARY.md"
      ],
      "base": "D-0002",
      "isBase": true,
      "root": false,
      "layer": "old",
      "sourceTicket": 119,
      "premises": []
    },
    {
      "id": "D-0002a",
      "statement": "换法记进 ADR 0008：写入点退到关票评论，台账和地图 `Decisions so far` 由 `scripts/decisions build` 生成，验证分脚本八条加人工抽查两处",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "docs/adr/0008-决定写在关票评论",
        "台账编译生成.md"
      ],
      "base": "D-0002",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 119,
      "premises": []
    },
    {
      "id": "D-0002c",
      "statement": "docs/decisions.md` 只收现行决定；被取代的条目连编号带原行挪进 `docs/decisions-archive.md`，原样保留。ADR 整份被取代时删掉，靠 git 历史找回；部分被取代的保留，开头指向新 ADR",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "GLOSSARY.md",
        "docs/adr/0008-决定写在关票评论",
        "台账编译生成.md"
      ],
      "base": "D-0002",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 119,
      "premises": []
    },
    {
      "id": "D-0002d",
      "statement": "新编号取 `docs/decisions.md` 和 `docs/decisions-archive.md` 里最大的号加一；两个文件都不存在时，取所有已关闭票评论里的最大号加一",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "docs/adr/0008-决定写在关票评论",
        "台账编译生成.md"
      ],
      "base": "D-0002",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 119,
      "premises": []
    },
    {
      "id": "D-0002e",
      "statement": "to-spec` 读地图全文、`docs/decisions.md` 和台账里这条决定对应的来源票，地图 `Decisions so far` 只当索引；`map-gate` 与 `spec-check` 都按这个读法改，清单评论降为放行报告",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "GLOSSARY.md",
        "docs/adr/0008-决定写在关票评论",
        "台账编译生成.md",
        "docs/adr/0006-地图变动要留痕.md"
      ],
      "base": "D-0002",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 119,
      "premises": []
    },
    {
      "id": "D-0003",
      "statement": "scripts/decisions` 三个子命令：`build <地图编号>` 编两份台账并重写地图 `Decisions so far`，`check <地图编号>` 只读跑八条不变量，`chain <编号>` 只读列引用票和派生编号",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "scripts/decisions",
        "docs/decisions.md",
        "docs/decisions-archive.md"
      ],
      "base": "D-0003",
      "isBase": true,
      "root": false,
      "layer": "old",
      "sourceTicket": 120,
      "premises": []
    },
    {
      "id": "D-0003a",
      "statement": "报错分类：第 1、2、6 条不变量和覆盖表状态非法归 A（给改法），第 3、5、7 条归 B（二选一），第 4 条和缺覆盖表归 C（建议新票）",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "scripts/decisions"
      ],
      "base": "D-0003",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 120,
      "premises": []
    },
    {
      "id": "D-0003b",
      "statement": "地图 `Decisions so far` 整段由 `build` 重写，夹在 `<!-- decisions:begin… -->` 和 `<!-- decisions:end -->` 之间，只列地图的已关闭子票，一张票一行",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "scripts/decisions"
      ],
      "base": "D-0003",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 120,
      "premises": []
    },
    {
      "id": "D-0003c",
      "statement": "被取代的条目进 `docs/decisions-archive.md` 时保留原行，取代关系另用「被取代、被谁取代」两列表标出；`产出文件` 多路径按 `,` 或 `、` 拆，文件名里的 `，` 不拆",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "docs/decisions-archive.md",
        "scripts/decisions"
      ],
      "base": "D-0003",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 120,
      "premises": []
    },
    {
      "id": "D-0003d",
      "statement": "退出码 0 全过、1 有不变量破、2 用法错；`build` 和 `check` 的目标 issue 必须带 `wayfinder:map` 标签，否则退出",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "scripts/decisions"
      ],
      "base": "D-0003",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 120,
      "premises": []
    },
    {
      "id": "D-0004",
      "statement": "scripts/decisions check` 是独立入口，运营者先跑，`wrap-up` 只读它的输出、不重跑；`wrap-up` 由八步改六步：前置 check、扫会话查漏、查冲突、查票、给运营者看、回应后动手",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        ".claude/skills/wrap-up/SKILL.md"
      ],
      "base": "D-0004",
      "isBase": true,
      "root": false,
      "layer": "old",
      "sourceTicket": 121,
      "premises": []
    },
    {
      "id": "D-0004a",
      "statement": "开放票前提不在 `wrap-up` 里逐张扫，改由领取时的「开工核对」查；客户版 `wrap-up` 由七步改六步，合并「扫对话」和「查漏」，没有 check 前置",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "customer-kit/package/.dsh/skills/wrap-up/SKILL.md"
      ],
      "base": "D-0004",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 121,
      "premises": []
    },
    {
      "id": "D-0005",
      "statement": "开工前先选方法：改动很小 one-shot，中等以上先 `/grill-with-docs`，grilling 中雾大升级 `/wayfinder`；钱、数据、安全、公开 API 类即使小 diff 也不 one-shot；不从 `/wayfinder` 起步再降级",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "docs/agents/issue-tracker.md",
        ".claude/skills/next/SKILL.md"
      ],
      "base": "D-0005",
      "isBase": true,
      "root": false,
      "layer": "old",
      "sourceTicket": 127,
      "premises": []
    },
    {
      "id": "D-0005a",
      "statement": "票型按保真度选：低保真讨论，中保真方框箭头或线框图，高保真半可运行原型；grilling 停在抽象层面转 prototype；原型票写「用 `/prototype`」，研究票写「用 `/research`」；先拆小原型验证方案",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "docs/agents/issue-tracker.md"
      ],
      "base": "D-0005",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 127,
      "premises": []
    },
    {
      "id": "D-0005b",
      "statement": "客户单分流（G-009）与本仓任务选方法各管各的；工厂流程、术语表、讲解的分流句加范围限定，指回 issue-tracker.md 的入口；不取代 G-009",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "docs/工厂流程.md",
        "GLOSSARY.md",
        "docs/讲解.md"
      ],
      "base": "D-0005",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 127,
      "premises": []
    },
    {
      "id": "D-0006",
      "statement": "词汇表格式以 `domain-modeling` 技能的 `GLOSSARY-FORMAT.md` 为准，本仓不再另写格式说明",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "docs/agents/domain.md"
      ],
      "base": "D-0006",
      "isBase": true,
      "root": false,
      "layer": "old",
      "sourceTicket": 128,
      "premises": []
    },
    {
      "id": "D-0006a",
      "statement": "ADR 只在难回退、不写会让人意外、真取舍三条同时成立时写，缺一条不写；修剪按三条复检，够不上的删掉，被取代的删留按 D-0002c",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "docs/agents/domain.md"
      ],
      "base": "D-0006",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 128,
      "premises": []
    },
    {
      "id": "D-0006b",
      "statement": "docs/agents/issue-tracker.md` 只留 GitHub 特有差异：sub-issue、原生 blocked-by、`wayfinder:*` 标签、`gh` 命令；地图结构、四种票型、frontier、关票动作指向 `/wayfinder",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "docs/agents/issue-tracker.md"
      ],
      "base": "D-0006",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 128,
      "premises": []
    },
    {
      "id": "D-0007",
      "statement": "Destination 覆盖表由 `build` 按 `## Destination` 原文切句生成，固定四列：句、原文片段、由哪张票落、状态；切句按 `。！？`，跳过 `<details>` 旧稿、`**状态：**` 行和以冒号结尾的引导行；agent 只填第三列，有票即已落票、无票未定、原文变了标原文已改并清空旧票",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "scripts/decisions"
      ],
      "base": "D-0007",
      "isBase": true,
      "root": false,
      "layer": "old",
      "sourceTicket": 122,
      "premises": []
    },
    {
      "id": "D-0007a",
      "statement": "check` 第 8 条校验覆盖表：句数和原文片段与 Destination 对齐、状态只取三值、已落票必须有票，输出行报「n 句里 m 句没落票」",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "scripts/decisions"
      ],
      "base": "D-0007",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 122,
      "premises": []
    },
    {
      "id": "D-0007b",
      "statement": "在 D-0003 的 build、check、chain 三个子命令之外新增只读子命令 `coverage`，报「n 句里 m 句没落票」并列出没落的句子；`map-gate` 第 1 步记数、第 7 步 m 不为 0 不发布放行报告，D-0003 原文不动",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "scripts/decisions",
        ".claude/skills/map-gate/SKILL.md"
      ],
      "base": "D-0007",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 122,
      "premises": []
    },
    {
      "id": "D-0008",
      "statement": "「关票扫描」的五项检查并进一张四列表：结论进「决定」列，产出进「产出文件」列，被推翻的决定进「取代」列；删掉逐张判开放票和判地图索引行两项，开放票前提改由领取时的「开工核对」查",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "docs/agents/issue-tracker.md"
      ],
      "base": "D-0008",
      "isBase": true,
      "root": false,
      "layer": "old",
      "sourceTicket": 123,
      "premises": []
    },
    {
      "id": "D-0008a",
      "statement": "关票顺序写死：贴四列表 → 关票 → `scripts/decisions build` → `scripts/decisions check` → `/wrap-up` 和 `/next` → 推当前 PR → 合并；`check` 只读已关闭票，本票的四列表关票后才进 `check`，`build` 也在关票后跑",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "docs/agents/issue-tracker.md"
      ],
      "base": "D-0008",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 123,
      "premises": []
    },
    {
      "id": "D-0008b",
      "statement": "map-gate` 第 7 步发的评论降为放行报告，不再是新会话的唯一输入；给新会话的提示词改成读地图全文、`docs/decisions.md` 和决定对应的来源票，地图 `Decisions so far` 只当索引",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        ".claude/skills/map-gate/SKILL.md"
      ],
      "base": "D-0008",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 123,
      "premises": []
    },
    {
      "id": "D-0008c",
      "statement": "被取代的 ADR 整份删掉，靠 git 历史找回；部分被取代的保留，开头指向新 ADR；流程文档的旧句句末注「被取代，见 <票名>」，四列表例子用同一说法",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "docs/agents/issue-tracker.md"
      ],
      "base": "D-0008",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 123,
      "premises": []
    },
    {
      "id": "D-0008d",
      "statement": "customer-kit/package/` 下的同名文件是本地 Markdown 跟踪器和客户版技能，没有 `scripts/decisions`、`build`、`check`，和本仓不同构，保持原样；客户版 `wrap-up` 已在 #121 改六步",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "D-0008",
      "isBase": false,
      "root": false,
      "layer": "old",
      "sourceTicket": 123,
      "premises": []
    },
    {
      "id": "D-0009",
      "statement": "删除 `init-trail` 技能及其模板，不再向新项目复制地图变动留痕规则和四个技能；`map-gate`、`wrap-up`、`next`、`spec-check` 留在本仓，ADR 0006 第 2 条同步去掉 init-trail",
      "status": "active",
      "supersedes": "D-0002b",
      "outputs": [
        "docs/adr/0006-地图变动要留痕.md"
      ],
      "base": "D-0009",
      "isBase": true,
      "root": false,
      "layer": "old",
      "sourceTicket": 137,
      "premises": [
        "P-0005"
      ]
    },
    {
      "id": "D-0010",
      "statement": "数据默认放 `~/.grilling/中台/`，`events.jsonl` 是权威记录，`board.db` 可随时重建，`GRILLING_HOME` 可覆盖根目录",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0001-数据放仓库外服务单写者.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0010",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 140,
      "premises": [
        "P-0001"
      ]
    },
    {
      "id": "D-0010a",
      "statement": "服务只监听 `127.0.0.1:8788`，端口和 pid 写进 `service.json`；CLI 读写都走 HTTP，不直接碰数据文件",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0001-数据放仓库外服务单写者.md"
      ],
      "base": "D-0010",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 140,
      "premises": []
    },
    {
      "id": "D-0010b",
      "statement": "数据目录独立成 git 仓，分支 `main`；服务空闲 60 秒提交，两次至少隔 10 分钟，正常退出补一次；v1 不配远端",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0001-数据放仓库外服务单写者.md"
      ],
      "base": "D-0010",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 140,
      "premises": []
    },
    {
      "id": "D-0010c",
      "statement": "事件一行一条，加锁追加并 `fsync`；启动时残片搬到 `events.jsonl.torn-<时间戳>` 后截断，中间坏行拒绝启动；`board.db` 随时重建",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0001-数据放仓库外服务单写者.md"
      ],
      "base": "D-0010",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 140,
      "premises": []
    },
    {
      "id": "D-0010d",
      "statement": "CLI 发现服务未启动就后台拉起并等 5 秒；写失败不自动重试，报结果未知；屏幕断线显示重连条并禁用动作；服务重启按锁、重放、哈希、重建自检",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0001-数据放仓库外服务单写者.md"
      ],
      "base": "D-0010",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 140,
      "premises": []
    },
    {
      "id": "D-0011",
      "statement": "事件日志是唯一权威，状态由事件按 `seq` 折叠；一次操作一条事件，创建时初始字段全带上；未知 op、未知版本、payload 缺字段或多字段都拒绝启动",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0002-事件模型-一条动作一条事件.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0011",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 141,
      "premises": [
        "P-0002"
      ]
    },
    {
      "id": "D-0011a",
      "statement": "状态哈希只算折叠后的业务状态；对象键排序、数组按 id 排序、含事件时间、不含 `seq`、壁钟和索引字段；序列化加 `v1\\n` 前缀后算 SHA-256",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0002-事件模型-一条动作一条事件.md"
      ],
      "base": "D-0011",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 141,
      "premises": []
    },
    {
      "id": "D-0011b",
      "statement": "actor` 写成 `human:<名字>` 或 `agent:<名字>`；CLI 从 `--actor` 或 `GRILLING_ACTOR` 取，有终端默认 human，无终端默认 `agent:unknown`；服务原样记录",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0002-事件模型-一条动作一条事件.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0011",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 141,
      "premises": []
    },
    {
      "id": "D-0011c",
      "statement": "编号由服务发本地号：新票 `I-`、评论 `C-`、决定 `D-`、前提 `P-`；导入保留 GitHub 号；GitHub 号存同步映射，本地号不变，最终对齐 GitHub 编号",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0002-事件模型-一条动作一条事件.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0011",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 141,
      "premises": []
    },
    {
      "id": "D-0011d",
      "statement": "同步状态单独记进 `sync.jsonl`，不进业务事件，不进状态哈希",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0002-事件模型-一条动作一条事件.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0011",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 141,
      "premises": []
    },
    {
      "id": "D-0011e",
      "statement": "v1 的 op 清单 14 个：`import`、`issue.create/edit/state/label/parent/block`、`comment.create/edit/delete`、`decision.create/overturn`、`premise.add/judge`；点号命名，target 指事件主角，评论单独写事件",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0002-事件模型-一条动作一条事件.md"
      ],
      "base": "D-0011",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 141,
      "premises": []
    },
    {
      "id": "D-0011f",
      "statement": "决定不直接改，没有 `decision.edit`；改就是新建决定再 `decision.overturn` 取代旧的",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0002-事件模型-一条动作一条事件.md"
      ],
      "base": "D-0011",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 141,
      "premises": []
    },
    {
      "id": "D-0011g",
      "statement": "import` 写一条事件，装下源的全部内容；实验用地图 #117 的真实数据，57,814 字节，解析和重放哈希通过",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0002-事件模型-一条动作一条事件.md"
      ],
      "base": "D-0011",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 141,
      "premises": []
    },
    {
      "id": "D-0013",
      "statement": "前提是独立记录，有自己的 `P-` 编号，挂在一条决定上；一条决定可以挂多条前提",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0004-前提模型-状态判定与命令.md",
        "中台/设计.md"
      ],
      "base": "D-0013",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 142,
      "premises": [
        "P-0004"
      ]
    },
    {
      "id": "D-0013a",
      "statement": "前提状态四个：`未验`、`成立`、`已破`、`未知`；新建是 `未验`，其余三个是最近一次判定的结果",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0004-前提模型-状态判定与命令.md",
        "中台/设计.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0013",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 142,
      "premises": []
    },
    {
      "id": "D-0013b",
      "statement": "前提判定词三个：`成立`、`已破`、`未知`；每判一次写一条 `premise.judge`，状态立刻变；`未知` 是判过但按现有证据判不了",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0004-前提模型-状态判定与命令.md",
        "中台/设计.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0013",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 142,
      "premises": []
    },
    {
      "id": "D-0013c",
      "statement": "决定被推翻后的四档（仍成立、需修改、作废、要补问）归 #151，前提不用这四个词",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0004-前提模型-状态判定与命令.md",
        "中台/设计.md"
      ],
      "base": "D-0013",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 142,
      "premises": []
    },
    {
      "id": "D-0013d",
      "statement": "前提由 agent 写、人审阅，也可以人直接写；谁写的由事件的 `actor` 记，不新增字段",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0004-前提模型-状态判定与命令.md",
        "中台/设计.md"
      ],
      "base": "D-0013",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 142,
      "premises": []
    },
    {
      "id": "D-0013e",
      "statement": "没判过的前提可以改陈述和证据；判过锁住，要换说法新建一条，旧前提留在决定上。新增 `premise.edit`，op 从 15 个变 16 个",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0004-前提模型-状态判定与命令.md",
        "中台/docs/adr/0002-事件模型-一条动作一条事件.md"
      ],
      "base": "D-0013",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 142,
      "premises": []
    },
    {
      "id": "D-0013f",
      "statement": "证据存引用：票号、相对路径、链接、原话；原话要带来源，不抄全文",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0004-前提模型-状态判定与命令.md",
        "中台/设计.md"
      ],
      "base": "D-0013",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 142,
      "premises": []
    },
    {
      "id": "D-0013g",
      "statement": "判破写 `premise.judge`，状态立刻变，决定标红，触发影响清单；系统只列名单，不自动改决定",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0004-前提模型-状态判定与命令.md",
        "中台/设计.md"
      ],
      "base": "D-0013",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 142,
      "premises": []
    },
    {
      "id": "D-0013h",
      "statement": "一条前提只属于一条决定；两条决定依赖同一件事，各写一条",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0004-前提模型-状态判定与命令.md",
        "中台/设计.md"
      ],
      "base": "D-0013",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 142,
      "premises": []
    },
    {
      "id": "D-0013i",
      "statement": "前提编号 `P-0001` 起，由服务分配；命令形状 `premise add`、`premise judge`、`premise edit`，参数细节归实现票",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0004-前提模型-状态判定与命令.md"
      ],
      "base": "D-0013",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 142,
      "premises": []
    },
    {
      "id": "D-0012",
      "statement": "地图是带 `kind: map` 的 issue，和票共用一个实体；`kind` 建时固定，不能改",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0003-图票与评论模型.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0012",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 149,
      "premises": [
        "P-0003"
      ]
    },
    {
      "id": "D-0012a",
      "statement": "根决定存 `statement`（主句）和 `fragments[]`（拆句，id 形如 `D-0012#3`）；地图正文只放 Notes、未定、范围外和索引；终点变更走新根决定加 `decision.overturn",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0003-图票与评论模型.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0012",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 149,
      "premises": []
    },
    {
      "id": "D-0012b",
      "statement": "覆盖是票上的 `covers[]` 指根决定的拆句 id；覆盖表由拆句、票和拆票理由联接算出，一句可落多张票",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0003-图票与评论模型.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0012",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 149,
      "premises": []
    },
    {
      "id": "D-0012c",
      "statement": "票的 `derived_from[]` 可指多条决定；决定派生由 `source_ticket` 加票的 `derived_from` 算出，不单存决定到决定的派生边；一条决定最多一个 `source_ticket`，可空",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0003-图票与评论模型.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0012",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 149,
      "premises": []
    },
    {
      "id": "D-0012d",
      "statement": "票型是独立字段 `type`（grilling/research/prototype/task）；标签是自由文本只存名字；导入时 `wayfinder:map` 和 `wayfinder:<type>` 被 `kind`、`type` 吃掉",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0003-图票与评论模型.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0012",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 149,
      "premises": []
    },
    {
      "id": "D-0012e",
      "statement": "票字段和新建必填：`split_reason`、至少一条 `derived_from`、`parent` 是地图；导入的老票可空，屏幕标「无主票」「缺拆票理由」；父票一层，v1 不改",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0003-图票与评论模型.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0012",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 149,
      "premises": []
    },
    {
      "id": "D-0012f",
      "statement": "评论字段是 id、所属 issue、正文、作者、创建时间、编辑时间、删除标记；编辑只改正文并记编辑时间；删除是墓碑，id 和作者保留",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0003-图票与评论模型.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0012",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 149,
      "premises": []
    },
    {
      "id": "D-0012g",
      "statement": "编辑动作表：标题、正文、类型、拆票理由、派生、覆盖走 `issue.edit` v2；状态、标签、阻塞各走原 op；父票不开放；覆盖不单独写事件",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0003-图票与评论模型.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0012",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 149,
      "premises": []
    },
    {
      "id": "D-0012h",
      "statement": "建地图用一条 `issue.create` 带 `destination`，折叠时同时建根决定，根决定 `root_of` 指地图；新增 `decision.void`（v2 第 15 个 op），决定状态 active/superseded/void；根决定不能作废，只能被新根决定取代",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0003-图票与评论模型.md",
        "中台/docs/adr/0002-事件模型-一条动作一条事件.md",
        "中台/设计.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0012",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 149,
      "premises": []
    },
    {
      "id": "D-0012i",
      "statement": "编号：新建 issue 发 `I-`，地图和票共用序列；导入的 issue 保留 GitHub 号；新决定从最大 `D-` 号加一；评论 `C-`，前提 `P-",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0003-图票与评论模型.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0012",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 149,
      "premises": []
    },
    {
      "id": "D-0012j",
      "statement": "阻塞只存被挡票的 `blocked_by[]`，`blocks` 反算；允许跨地图挡；地图不参与阻塞；GitHub 镜像写 sub-issue 和 blocked-by",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0003-图票与评论模型.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0012",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 149,
      "premises": []
    },
    {
      "id": "D-0012k",
      "statement": "GitHub 不搬 assignees、milestones、projects、reactions、通知、PR 关联、模板、转移、置顶、issue types、自定义字段、多用户和权限；状态只 open/closed；issue 只关不删",
      "status": "active",
      "supersedes": "无",
      "outputs": [
        "中台/docs/adr/0003-图票与评论模型.md",
        "中台/GLOSSARY.md"
      ],
      "base": "D-0012",
      "isBase": false,
      "root": false,
      "layer": "new",
      "sourceTicket": 149,
      "premises": []
    }
  ],
  "tickets": [
    {
      "id": 118,
      "title": "四列表与编号规范",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 117,
      "derivedFrom": [
        "D-117"
      ],
      "produces": [
        "D-0001",
        "D-0001a",
        "D-0001b"
      ],
      "covers": [],
      "splitReason": "根决定要能执行，先把决定写在哪、怎么编号定下来。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/118",
      "labels": [
        "wayfinder:task"
      ]
    },
    {
      "id": 119,
      "title": "词条与 ADR：决定、台账、依据、推迟",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 117,
      "derivedFrom": [
        "D-117"
      ],
      "produces": [
        "D-0002",
        "D-0002a",
        "D-0002c",
        "D-0002d",
        "D-0002e"
      ],
      "covers": [],
      "splitReason": "术语和 ADR 的写法会影响后面每张票，先统一。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/119",
      "labels": [
        "wayfinder:task"
      ]
    },
    {
      "id": 120,
      "title": "scripts/decisions：build、check、chain",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 117,
      "derivedFrom": [
        "D-117"
      ],
      "produces": [
        "D-0003",
        "D-0003a",
        "D-0003b",
        "D-0003c",
        "D-0003d"
      ],
      "covers": [],
      "splitReason": "台账不能手改，要先有能重生成的脚本。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/120",
      "labels": [
        "wayfinder:task"
      ]
    },
    {
      "id": 121,
      "title": "check 独立入口，wrap-up 改六步",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 117,
      "derivedFrom": [
        "D-117"
      ],
      "produces": [
        "D-0004",
        "D-0004a"
      ],
      "covers": [],
      "splitReason": "check 要能从 wrap-up 里独立出来，运营者先跑。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/121",
      "labels": [
        "wayfinder:task"
      ]
    },
    {
      "id": 122,
      "title": "Destination 逐句覆盖表",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 117,
      "derivedFrom": [
        "D-117"
      ],
      "produces": [
        "D-0007",
        "D-0007a",
        "D-0007b"
      ],
      "covers": [],
      "splitReason": "终点逐句检查，覆盖表要先能生成。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/122",
      "labels": [
        "wayfinder:task"
      ]
    },
    {
      "id": 123,
      "title": "关票流程与地图段改由脚本生成",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 117,
      "derivedFrom": [
        "D-117"
      ],
      "produces": [
        "D-0008",
        "D-0008a",
        "D-0008b",
        "D-0008c",
        "D-0008d"
      ],
      "covers": [],
      "splitReason": "关票流程和地图索引都由脚本管，先定顺序。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/123",
      "labels": [
        "wayfinder:task"
      ]
    },
    {
      "id": 124,
      "title": "老票迁移：#1 下 53 张票迁入本图",
      "type": "task",
      "state": "open",
      "work": "卡住",
      "mapId": 117,
      "derivedFrom": [
        "D-117"
      ],
      "produces": [],
      "covers": [],
      "splitReason": "旧票还挂在 #1 下，要迁进这张图。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/124",
      "labels": [
        "wayfinder:task"
      ]
    },
    {
      "id": 127,
      "title": "选方法与保真度：补两节判据",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 117,
      "derivedFrom": [
        "D-117"
      ],
      "produces": [
        "D-0005",
        "D-0005a",
        "D-0005b"
      ],
      "covers": [],
      "splitReason": "票型保真度决定讨论停在哪个层次。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/127",
      "labels": [
        "wayfinder:task"
      ]
    },
    {
      "id": 128,
      "title": "引进作者技能，删掉我们的重述",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 117,
      "derivedFrom": [
        "D-117"
      ],
      "produces": [
        "D-0006",
        "D-0006a",
        "D-0006b"
      ],
      "covers": [],
      "splitReason": "作者技能和我们自己的重述会打架，先删重述。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/128",
      "labels": [
        "wayfinder:task"
      ]
    },
    {
      "id": 137,
      "title": "init-trail 模板引用 scripts/decisions，但技能不装脚本",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 117,
      "derivedFrom": [
        "D-117"
      ],
      "produces": [
        "D-0009"
      ],
      "covers": [],
      "splitReason": "旧模板还引用冻结的脚本，先处理掉。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/137",
      "labels": [
        "wayfinder:grilling"
      ]
    },
    {
      "id": 140,
      "title": "数据位置与读写路径：服务、CLI、events.jsonl",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 139,
      "derivedFrom": [
        "D-ROOT"
      ],
      "produces": [
        "D-0010",
        "D-0010a",
        "D-0010b",
        "D-0010c",
        "D-0010d"
      ],
      "covers": [],
      "splitReason": "根决定第 1 句要落地，先定数据放哪、谁写。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/140",
      "labels": [
        "wayfinder:grilling"
      ]
    },
    {
      "id": 141,
      "title": "事件模型：op、payload、折叠与哈希",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 139,
      "derivedFrom": [
        "D-ROOT"
      ],
      "produces": [
        "D-0011",
        "D-0011a",
        "D-0011b",
        "D-0011c",
        "D-0011d",
        "D-0011e",
        "D-0011f",
        "D-0011g"
      ],
      "covers": [],
      "splitReason": "所有状态由事件折叠，先把事件格式定死。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/141",
      "labels": [
        "wayfinder:grilling"
      ]
    },
    {
      "id": 142,
      "title": "前提模型：状态、判定与命令",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 139,
      "derivedFrom": [
        "D-ROOT"
      ],
      "produces": [
        "D-0013",
        "D-0013a",
        "D-0013b",
        "D-0013c",
        "D-0013d",
        "D-0013e",
        "D-0013f",
        "D-0013g",
        "D-0013h",
        "D-0013i"
      ],
      "covers": [
        4
      ],
      "splitReason": "决定能不能被推翻，要看前提怎么记、怎么判。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/142",
      "labels": [
        "wayfinder:grilling"
      ]
    },
    {
      "id": 143,
      "title": "导入与同步：中台主记录，GitHub 镜像",
      "type": "grilling",
      "state": "open",
      "work": "未领取",
      "mapId": 139,
      "derivedFrom": [
        "D-ROOT"
      ],
      "produces": [],
      "covers": [
        7
      ],
      "splitReason": "中台是主记录，GitHub 只读镜像，先把导入和同步定下来。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/143",
      "labels": [
        "wayfinder:grilling"
      ]
    },
    {
      "id": 144,
      "title": "屏幕原型：决策图、影响清单与视觉信号",
      "type": "prototype",
      "state": "open",
      "work": "进行中",
      "mapId": 139,
      "derivedFrom": [
        "D-ROOT"
      ],
      "produces": [],
      "covers": [
        8
      ],
      "splitReason": "屏幕先做原型，排布和九类信号要看到东西才能定。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/144",
      "labels": [
        "wayfinder:prototype"
      ]
    },
    {
      "id": 145,
      "title": "实现内核：事件日志、CLI、导入与同步",
      "type": "task",
      "state": "open",
      "work": "未领取",
      "mapId": 139,
      "derivedFrom": [
        "D-ROOT"
      ],
      "produces": [],
      "covers": [
        1,
        9
      ],
      "splitReason": "验收要有能跑的内核，先实现事件日志和 CLI。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/145",
      "labels": [
        "wayfinder:task"
      ]
    },
    {
      "id": 146,
      "title": "实现屏幕：完整内容、编辑与同步状态",
      "type": "task",
      "state": "open",
      "work": "未领取",
      "mapId": 139,
      "derivedFrom": [
        "D-ROOT"
      ],
      "produces": [],
      "covers": [
        1,
        6,
        8,
        9
      ],
      "splitReason": "原型定稿后要落成真正的屏幕。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/146",
      "labels": [
        "wayfinder:task"
      ]
    },
    {
      "id": 147,
      "title": "v1 验收：真实数据跑一遍",
      "type": "task",
      "state": "open",
      "work": "未领取",
      "mapId": 139,
      "derivedFrom": [
        "D-ROOT"
      ],
      "produces": [],
      "covers": [
        1
      ],
      "splitReason": "v1 要能用真数据跑一遍。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/147",
      "labels": [
        "wayfinder:task"
      ]
    },
    {
      "id": 149,
      "title": "图、票与评论模型：根决定、拆票理由、字段与关系",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 139,
      "derivedFrom": [
        "D-ROOT"
      ],
      "produces": [
        "D-0012",
        "D-0012a",
        "D-0012b",
        "D-0012c",
        "D-0012d",
        "D-0012e",
        "D-0012f",
        "D-0012g",
        "D-0012h",
        "D-0012i",
        "D-0012j",
        "D-0012k"
      ],
      "covers": [
        2,
        3,
        4,
        9
      ],
      "splitReason": "决定、票、评论的关系会决定整张图怎么画。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/149",
      "labels": [
        "wayfinder:grilling"
      ]
    },
    {
      "id": 151,
      "title": "影响清单模型：范围、处理动作与生命周期",
      "type": "grilling",
      "state": "open",
      "work": "未领取",
      "mapId": 139,
      "derivedFrom": [
        "D-ROOT"
      ],
      "produces": [],
      "covers": [
        5,
        6
      ],
      "splitReason": "决定一变要算出范围，影响清单怎么算、怎么处理要先定。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/151",
      "labels": [
        "wayfinder:grilling"
      ]
    },
    {
      "id": 152,
      "title": "工作状态同步：orca → 中台",
      "type": "grilling",
      "state": "open",
      "work": "未领取",
      "mapId": 139,
      "derivedFrom": [
        "D-ROOT"
      ],
      "produces": [],
      "covers": [
        7
      ],
      "splitReason": "票的工作状态要从 orca 同步回中台。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/152",
      "labels": [
        "wayfinder:grilling"
      ]
    },
    {
      "id": 153,
      "title": "文档：按新终点改 issue-tracker 和设计稿",
      "type": "task",
      "state": "open",
      "work": "未领取",
      "mapId": 139,
      "derivedFrom": [
        "D-ROOT"
      ],
      "produces": [],
      "covers": [],
      "splitReason": "新终点的规则要写进项目文档。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/153",
      "labels": [
        "wayfinder:task"
      ]
    },
    {
      "id": 158,
      "title": "工作流程：中台接管后，地图、票、决定、会话怎么走",
      "type": "grilling",
      "state": "open",
      "work": "未领取",
      "mapId": 139,
      "derivedFrom": [
        "D-ROOT"
      ],
      "produces": [],
      "covers": [],
      "splitReason": "Map #139 是对工作流程的整体更新，旧技能删掉后要重新设计整条流程。",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/158",
      "labels": [
        "wayfinder:grilling"
      ]
    }
  ],
  "premises": [
    {
      "id": "P-0001",
      "decision": "D-0010",
      "statement": "运营者的数据只在一台机器上产生",
      "state": "已破",
      "evidence": [
        "#140 正文：数据放 ~/.grilling/中台/",
        "原话：只有一个权威状态，agent 通过 CLI 读（中台/设计.md）"
      ],
      "lastJudge": {
        "verdict": "已破",
        "by": "human:运营者",
        "at": "2026-11-10 15:20",
        "reason": "第二台机器也要读事件日志，单机单写者的假设不成立。"
      }
    },
    {
      "id": "P-0002",
      "decision": "D-0011",
      "statement": "事件日志的量级能用 JSONL 单文件承载",
      "state": "成立",
      "evidence": [
        "#141 关票评论：全量导入约 57KB"
      ],
      "lastJudge": {
        "verdict": "成立",
        "by": "human:运营者",
        "at": "2026-11-10 01:10",
        "reason": "导入实验 57,814 字节，单文件够用。"
      }
    },
    {
      "id": "P-0003",
      "decision": "D-0012",
      "statement": "地图和票可以共用一个 issue 实体，不需要拆成两张表",
      "state": "未知",
      "evidence": [
        "#149 关票评论"
      ],
      "lastJudge": {
        "verdict": "未知",
        "by": "human:运营者",
        "at": "2026-11-10 06:00",
        "reason": "还没有真实数据跑过，先按合并实体做。"
      }
    },
    {
      "id": "P-0004",
      "decision": "D-0013",
      "statement": "判过的前提不需要再改陈述",
      "state": "未知",
      "evidence": [
        "#142 关票评论"
      ],
      "lastJudge": {
        "verdict": "未知",
        "by": "human:运营者",
        "at": "2026-11-10 16:40",
        "reason": "实际使用时改措辞的频率还不知道。"
      }
    },
    {
      "id": "P-0005",
      "decision": "D-0009",
      "statement": "init-trail 只在本仓使用，客户包不需要它",
      "state": "未验",
      "evidence": [
        "#137 关票评论"
      ],
      "lastJudge": null
    }
  ],
  "coverage": [
    {
      "frag": 1,
      "text": "中台在本机跑起来，维护运营者的决策。",
      "tickets": [
        145,
        146,
        147
      ],
      "status": "待做"
    },
    {
      "frag": 2,
      "text": "地图的 Destination 是一句主句，存成根决定。",
      "tickets": [
        149
      ],
      "status": "已落"
    },
    {
      "frag": 3,
      "text": "根决定产生第一批票。每张票写拆票理由和 `derived_from`。",
      "tickets": [
        149
      ],
      "status": "已落"
    },
    {
      "frag": 4,
      "text": "票产出决定，或推翻决定。决定记来源票、取代关系、派生关系、前提。",
      "tickets": [
        149,
        142
      ],
      "status": "已落"
    },
    {
      "frag": 5,
      "text": "决定一变，中台沿因果边算出受影响的决定和票，画出一个范围，生成影响清单。",
      "tickets": [
        151
      ],
      "status": "待做"
    },
    {
      "frag": 6,
      "text": "影响清单逐项处理：决定四档，票五种，运营者确认，确认记事件。",
      "tickets": [
        151,
        146
      ],
      "status": "待做"
    },
    {
      "frag": 7,
      "text": "GitHub 是只读镜像；orca 是执行现场，票的工作状态实时同步回中台。",
      "tickets": [
        143,
        152
      ],
      "status": "待做"
    },
    {
      "frag": 8,
      "text": "屏幕先做原型，原型定稿后实现。屏幕要能看决策图、影响清单、覆盖表和九类视觉信号。",
      "tickets": [
        144,
        146
      ],
      "status": "进行中"
    },
    {
      "frag": 9,
      "text": "复刻 GitHub tracker 的核心编辑功能，作为支撑。",
      "tickets": [
        149,
        145,
        146
      ],
      "status": "待做"
    }
  ],
  "impact": {
    "id": "I-0001",
    "triggerPremise": "P-0001",
    "triggerDecision": "D-0010",
    "openedAt": "2026-11-10 15:20",
    "decisions": [
      "D-0010",
      "D-0010a",
      "D-0010b",
      "D-0010c",
      "D-0010d"
    ],
    "tickets": [
      143,
      145
    ],
    "items": [
      {
        "key": "decision:D-0010",
        "kind": "decision",
        "id": "D-0010",
        "status": "pending",
        "why": "P-0001 已破：数据只在一台机器上产生的前提不成立"
      },
      {
        "key": "decision:D-0010a",
        "kind": "decision",
        "id": "D-0010a",
        "status": "pending",
        "why": "服务只监听 127.0.0.1:8788，单机边界要重看"
      },
      {
        "key": "decision:D-0010b",
        "kind": "decision",
        "id": "D-0010b",
        "status": "pending",
        "why": "数据目录独立 git 仓，多机怎么同步要重看"
      },
      {
        "key": "decision:D-0010c",
        "kind": "decision",
        "id": "D-0010c",
        "status": "pending",
        "why": "事件日志加锁追加，多机写者前提要重看"
      },
      {
        "key": "decision:D-0010d",
        "kind": "decision",
        "id": "D-0010d",
        "status": "pending",
        "why": "CLI 自动拉起服务，多机路径要重看"
      },
      {
        "key": "ticket:143",
        "kind": "ticket",
        "id": "143",
        "status": "pending",
        "why": "导入与同步要处理多机来源"
      },
      {
        "key": "ticket:145",
        "kind": "ticket",
        "id": "145",
        "status": "pending",
        "why": "内核的写入口要重新考虑"
      }
    ]
  },
  "signals": [
    {
      "key": "orphan-ticket",
      "label": "无主票",
      "tone": "amber",
      "count": 1,
      "targets": [
        "ticket:124"
      ],
      "hint": "票没有来源决定。示例：#124 的 依据 还停在旧台账。"
    },
    {
      "key": "orphan-decision",
      "label": "无源决定",
      "tone": "amber",
      "count": 1,
      "targets": [
        "decision:D-117"
      ],
      "hint": "决定没有来源票。旧图终点 #117 没有存成决定，是一处真实的迁移缺口。"
    },
    {
      "key": "stale-decision",
      "label": "吃旧决定",
      "tone": "red",
      "count": 0,
      "targets": [],
      "hint": "票还挂在已被取代或作废的决定上。点一下造一个示例。"
    },
    {
      "key": "bare-decision",
      "label": "裸决定",
      "tone": "gray",
      "count": 8,
      "targets": [
        "decision:D-0001",
        "decision:D-0002",
        "decision:D-0003",
        "decision:D-0004",
        "decision:D-0005",
        "decision:D-0006",
        "decision:D-0007",
        "decision:D-0008"
      ],
      "hint": "决定没有前提。旧图里大多数决定都是这样。"
    },
    {
      "key": "broken-premise",
      "label": "破前提",
      "tone": "red",
      "count": 1,
      "targets": [
        "premise:P-0001"
      ],
      "hint": "前提已破，决定要重判。示例挂在 D-0010 上。"
    },
    {
      "key": "coverage-gap",
      "label": "覆盖缺口",
      "tone": "amber",
      "count": 0,
      "targets": [],
      "hint": "根决定的某一句没有票接。当前 9 句都有票。"
    },
    {
      "key": "impact-open",
      "label": "影响清单未清",
      "tone": "red",
      "count": 1,
      "targets": [
        "impact:I-0001"
      ],
      "hint": "P-0001 判破后生成的影响清单还有 7 项没处理。"
    },
    {
      "key": "stuck-ticket",
      "label": "工作卡住",
      "tone": "amber",
      "count": 1,
      "targets": [
        "ticket:124"
      ],
      "hint": "#124 一直开着，没有领取。"
    },
    {
      "key": "sync-error",
      "label": "同步异常",
      "tone": "violet",
      "count": 0,
      "targets": [],
      "hint": "GitHub 状态和中台不一致。点一下造一个示例。"
    }
  ]
};
