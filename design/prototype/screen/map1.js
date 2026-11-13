window.PROTO_MAP1 = {
  "generatedAt": "2026-11-12",
  "map": {
    "id": 1,
    "title": "地图：客户需求 → 自动软件工厂",
    "url": "https://github.com/Lil-BobCN/grilling-remote/issues/1",
    "rootDecision": "M1-ROOT",
    "destination": "客户在本机装 DeepSeek Harness（`dsh`），用自然语言和原型把「我想要什么」问到清楚，卡住时找你，文件写在本地 `.scratch/`；网站放教程、提示词和回传上传页。回传后需求落成 GitHub Issue 工单，运营者解压回传包，agent 读文件并列出未决策问题，运营者决策完后手动跑 to-spec。拆票经运营者点头后，调度器点火实现，进度回写工单，并由 Grok Bot 推给你。客户在网站登录后看订单进度：五档状态，微信加邮件三条消息。",
    "fragments": [
      "客户在本机装 DeepSeek Harness（`dsh`），用自然语言和原型把「我想要什么」问到清楚，卡住时找你，文件写在本地 `.scratch/`；网站放教程、提示词和回传上传页。",
      "回传后需求落成 GitHub Issue 工单，运营者解压回传包，agent 读文件并列出未决策问题，运营者决策完后手动跑 to-spec。",
      "拆票经运营者点头后，调度器点火实现，进度回写工单，并由 Grok Bot 推给你。",
      "客户在网站登录后看订单进度：五档状态，微信加邮件三条消息。",
      "地图终点 = **可施工**：决策锁定、规格成形、工单拆好。"
    ]
  },
  "decisions": [
    {
      "id": "M1-ROOT",
      "statement": "客户在本机装 DeepSeek Harness（dsh），用自然语言和原型把「我想要什么」问到清楚（根决定，53 张票）",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-ROOT",
      "isBase": true,
      "root": true,
      "layer": "new",
      "sourceTicket": 1,
      "premises": [
        "M1-P1"
      ]
    },
    {
      "id": "M1-001",
      "statement": "Server酱 为默认、企微自建应用为备选；免费额度只够一天 1.6 个需求，先只推「进队列」「完成」，标题里带编号与状态；#14 起微信去掉，改 Grok Bot 推送，邮件兜底",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-001",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 2,
      "premises": []
    },
    {
      "id": "M1-002",
      "statement": "2026-11-02 改：首屏用输入框，卡片退到辅助位；分三段问；右侧换双手机预览。保留：卡点找人归 A5（客户直接找人工客服，通道见 [客户 AGENTS.md 里写什么：谁管什么、跳步怎么回应](https://github.com/Lil-BobCN/grilling-remote/issues/25)）；客户确认后才回传、建单，确认的对象是需求草稿的「已经定下的」，不单独出确认单。2026-11-05 注：「右侧换双手机预览」已改，题走普通聊天，原型保持被动，每段 5、4、3 问作废、不限题数，见 [#16 的结论评论](https://github.com/Lil-BobCN/grilling-remote/issues/16#issuecomment-6648095233)",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-002",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 3,
      "premises": []
    },
    {
      "id": "M1-003",
      "statement": "已废，见 [客户要看原型时在本机怎么出：单个 HTML 能不能撑住](https://github.com/Lil-BobCN/grilling-remote/issues/27)。网页内预览方案不做了。原结论：钱不是瓶颈，延迟才是；三变体串行 30–150 秒不可接受，先模板拼装、再现场生成单变体",
      "status": "superseded",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-003",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 4,
      "premises": []
    },
    {
      "id": "M1-004",
      "statement": "能跑；`.sandcastle/.env` 必须显式写凭证（宿主环境不自动继承），建议用无空格路径，是否必须未验证",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-004",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 8,
      "premises": []
    },
    {
      "id": "M1-005",
      "statement": "14 条清单；客户只须答五类硬性项，其余给默认值或升级运营者；`/to-spec` 模板本身没有验收条件字段，缺需求不报错只让评审降级",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-005",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 9,
      "premises": []
    },
    {
      "id": "M1-006",
      "statement": "四档状态由 Issue 标签驱动，调度器是唯一写入方；测试加评审两道门自动进待验收；客户驳回回开发中、另开分支修。客户没有网页（客户网页部分已废，见 [客户进度模块：登录、四屏样品、五档状态](https://github.com/Lil-BobCN/grilling-remote/issues/109)），驳回由客户告诉运营者，运营者打回开发中",
      "status": "active",
      "partlySuperseded": true,
      "supersedes": "无",
      "outputs": [],
      "base": "M1-006",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 5,
      "premises": []
    },
    {
      "id": "M1-007",
      "statement": "一客户一仓；默认不过户，要了再过；脚手架分三层（不变量 12 项、条件层 8 项、其余不预制）；AGENTS.md 按文件分所有权",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-007",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 13,
      "premises": []
    },
    {
      "id": "M1-008",
      "statement": "2026-11-06 改：入口只分两类。同时满足三条才算小需求：改动落在一个已有功能里，一个会话做得完，验收条件客户已经说清。其余走 wayfinder。不设回退规则，拿不准走 wayfinder。点头留补缺口和拆票两次，取代 G-003 的三档。2026-11-02 的旧写法：仍是六步、入口仍是一个岔口，但拆票后加了一次点头，PR 那次点头去掉。三个关口：闸门、拆票、验收",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-008",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 6,
      "premises": []
    },
    {
      "id": "M1-009",
      "statement": "四样证据齐了自己合并推你；PR 分两层（子票→需求分支→主干）；禁区改看「能不能验证 + 能不能回滚」；夜间白名单可合；「两次失败就叫人」与 [自主循环：没人盯的时候谁推进](https://github.com/Lil-BobCN/grilling-remote/issues/12) 的「三圈」并用：同一问题先自动加一次规则再试，三圈内仍未解决就停下叫运营者",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-009",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 11,
      "premises": []
    },
    {
      "id": "M1-010",
      "statement": "对账式调度：每 30 秒读工单状态找「该动没动」的；同题最多三圈；自动检查加自动评审两关；三种停法；先跑一单；客户可勾急；已打「点火超时」标签的单，对账时跳过，等人处理",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-010",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 12,
      "premises": []
    },
    {
      "id": "M1-011",
      "statement": "开工前卡一次；五类问题归你定（技术栈、部署、第三方与账号、数据与合规、花钱）；决定在本机 ADE 里做，Grok Bot 只推选项到手机；不回则停着并每 24 小时提醒",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-011",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 10,
      "premises": []
    },
    {
      "id": "M1-012",
      "statement": "用 Orca，不装第二个系统；闸门靠自定义看板列加聊天选项拼；已知缺口：手机端无看板、未开工的单没有卡；[运营者工作台：待办在哪看、怎么处理](https://github.com/Lil-BobCN/grilling-remote/issues/14) 起不再把 Orca 当看板。Orca 是运营者在本机做决策和调试的 ADE",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-012",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 15,
      "premises": []
    },
    {
      "id": "M1-013",
      "statement": "不做看板；Mac 上的调度器直接点火，Grok Bot 只当窗口和收件箱；点火失败只告警不补点；门铃和 webhook 退场；微信去掉。见 `docs/adr/0005-调度器直接点火.md`",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-013",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 14,
      "premises": []
    },
    {
      "id": "M1-014",
      "statement": "买域名、加 A 记录、用 caddy 出 Let's Encrypt 证书，三项完成条件都满足",
      "status": "superseded",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-014",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 7,
      "premises": []
    },
    {
      "id": "M1-015",
      "statement": "买服务器、买域名、登录与授权由运营者手动做，客户不做，agent 也不自动买；配安全组、sudo、主机指纹调研认为能自动做，交不交给 agent 没定；朝晞云有没有接口未验证，[结论评论](https://github.com/Lil-BobCN/grilling-remote/issues/17#issuecomment-6609089614)。2026-11-07 #96 已验证控制台有接口，能改安全组。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-015",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 17,
      "premises": []
    },
    {
      "id": "M1-016",
      "statement": "已废，见 [客户 AGENTS.md 里写什么：谁管什么、跳步怎么回应](https://github.com/Lil-BobCN/grilling-remote/issues/25) 和 [客户要看原型时在本机怎么出：单个 HTML 能不能撑住](https://github.com/Lil-BobCN/grilling-remote/issues/27)。网页上出题和原型页的做法不做了，题走本机 `dsh`。原结论：题走普通聊天，网页 agent 挂好技能，不再用固定组件；题数按 grilling 原文；原型随时能点，由 agent 判断够不够，分模板粗稿和现场写完整版两档；引擎选 DeepSeek Harness，前端要改。没验证的四项见 [结论评论](https://github.com/Lil-BobCN/grilling-remote/issues/16#issuecomment-6648095233)",
      "status": "superseded",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-016",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 16,
      "premises": []
    },
    {
      "id": "M1-017",
      "statement": "已废，见 [客户本机怎么装：技能包放哪、装配提示词、客服怎么带](https://github.com/Lil-BobCN/grilling-remote/issues/23)。原结论是网页 agent 用 DeepSeek Harness，只能一客户一进程部署。11-05 改成客户本机装 `dsh`，该结论被取代。",
      "status": "superseded",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-017",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 18,
      "premises": []
    },
    {
      "id": "M1-018",
      "statement": "不做议题页面；客户在本机用编辑器和 `dsh` 看 `.scratch/` 的 Markdown。怎么看文件归 #23，内部评论和阻塞纠正归 #25。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-018",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 19,
      "premises": []
    },
    {
      "id": "M1-019",
      "statement": "按本机 `dsh` 路线关闭：产物在客户机器 `.scratch/{简称}/`；小需求写 `需求草稿.md`，其余写 `map.md` 和 `issues/`；回传后进 parent issue，通道归 #24；原型不进客户仓；`proto/` 限制作废；确认单缺口已答：不单独出，见 [客户 AGENTS.md 里写什么：谁管什么、跳步怎么回应](https://github.com/Lil-BobCN/grilling-remote/issues/25)。原五问拆到 #23–#27 与 B1 部分已废，见 [客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63)：目录名改称需求名，路径里的 `{简称}` 现在写 `{需求名}`。词表例外，见 [客户工作区里 AGENTS.md、GLOSSARY.md、docs/agents/ 各归谁写，setup 会不会撞](https://github.com/Lil-BobCN/grilling-remote/issues/39)：`GLOSSARY.md` 放工作区根目录，不在 `.scratch/` 内。 2026-11-07 按 #30 补：进度文件多一份 `.scratch/{需求名}/问题树.md`。",
      "status": "active",
      "partlySuperseded": true,
      "supersedes": "无",
      "outputs": [],
      "base": "M1-019",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 20,
      "premises": []
    },
    {
      "id": "M1-020",
      "statement": "不做聊天页；题和卡片用 `dsh` 自带界面。卡片行为归 #23、#26，原型窗口归 #27。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-020",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 21,
      "premises": []
    },
    {
      "id": "M1-021",
      "statement": "客户可以不答任何技术题。说不懂就按推荐答案往下问，记进 `.scratch/{简称}/pending.md`。推荐答案先联网查证并写出处，查不到写“未核验”。运营者在 #10 的闸门里一次定。[结论评论](https://github.com/Lil-BobCN/grilling-remote/issues/22#issuecomment-6653448132) 部分已废，同上：路径里的 `{简称}` 现在写 `{需求名}`。",
      "status": "active",
      "partlySuperseded": true,
      "supersedes": "无",
      "outputs": [],
      "base": "M1-021",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 22,
      "premises": []
    },
    {
      "id": "M1-022",
      "statement": "部分已废，见 [客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63)：提示词①装配、八个技能装配这部分被取代，其余仍有效。原结论：官网发一个 zip（发布和 URL 归 #35），八个技能装到工作文件夹 `.dsh/skills/`；提示词①写 `AGENTS.md` 和本地追踪器；macOS Apple 芯片空文件夹跑通，路径带中文和空格；Windows、Intel Mac、客户机 `workspace-write` 归 #36（2026-11-07 #36 已跳过，三项未验证）；`AGENTS.md` 正文由 #25 定稿，已随 PR #40 合并；客服带话通道：微信为主，电话兜底；截图清单和文件查看见 `customer-kit/安装步骤.md`；技术题按 #22（可以问、客户可不答），懂开发客户可走 GitHub 原版。",
      "status": "active",
      "partlySuperseded": true,
      "supersedes": "无",
      "outputs": [],
      "base": "M1-022",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 23,
      "premises": []
    },
    {
      "id": "M1-023",
      "statement": "部分已废，见 [客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63)：回传改整个工作区，取消 `meta.json`。原结论：官网固定上传页，客户拖 `.scratch/{简称}/` 加 `meta.json` 的 zip；服务器校验 `meta.json` 和客户白名单，自动建或复用客户仓、写 parent issue、打闸门；澄清全部做完传一次，按需补快照；不回对话记录；微信、邮件兜底；服务器失败留 7 天；上传页、接收端点、Mac 拉取桥归 to-spec 出票（[结论](https://github.com/Lil-BobCN/grilling-remote/issues/24#issuecomment-6655144059)）",
      "status": "active",
      "partlySuperseded": true,
      "supersedes": "无",
      "outputs": [],
      "base": "M1-023",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 24,
      "premises": []
    },
    {
      "id": "M1-024",
      "statement": "客户侧只落澄清材料：小需求写 `需求草稿.md`，其余写 `map.md` 加票；运营者审完，加上自己的选择和内容，再跑 `to-spec`。`AGENTS.md` 收全部跨会话规则，提示词②只剩“开始需求澄清”和“继续”（后一句已废，见 [客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63)：改成「继续：需求名 编号 票名」）；查漏用 `subagent_fork`，读对话和文件；客服带话走微信，电话兜底；不单独出确认单；开头、结尾三句话都含终点，A/B 用客户目标，C 用 map Destination；需求草稿由客户侧写、客户确认后上传，Mac 不再生成；官网包 `wait-what` 允许模型自动调用，本机自用副本仍手动。取代 #20 的 `spec.md` 和 #23 的“AGENTS.md 仍是草稿”。",
      "status": "superseded",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-024",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 25,
      "premises": []
    },
    {
      "id": "M1-025",
      "statement": "两个单文件样品（流程 249 行、版本 191 行）运营者判「看得懂」；400 行上限够用，未对样品提修改要求。客户侧 `prototype/UI.md` 已是单文件版（76 行），样品验证了它可行，不用再补文字。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-025",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 27,
      "premises": []
    },
    {
      "id": "M1-026",
      "statement": "两处都放：地图加「接下来」一段，一行一张开放票，写四词之一加这次做什么；开工第一句复述；票正文留 `Type:` 行。四词：聊一聊、看个样子、动手做、我去查。选票改按地图行序。第一次对话一口气走完开口、评估、定终点、拆议题，不拆成两次。开场词两段和改文件归 [客户包收尾](https://github.com/Lil-BobCN/grilling-remote/issues/44)",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-026",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 55,
      "premises": []
    },
    {
      "id": "M1-027",
      "statement": "选第三种的简化版。`next`、`map-gate`、`wrap-up` 三个客户版技能进客户包，三句触发写进 `AGENTS.md`，agent 自己查冲突，真冲突才问客户。越界产出和文件矛盾取简化版。三条规则是 agent 自拟的，运营者未确认。没在 dsh 里实测。[结论评论](https://github.com/Lil-BobCN/grilling-remote/issues/53#issuecomment-6701080114)",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-027",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 53,
      "premises": []
    },
    {
      "id": "M1-028",
      "statement": "官网改发摆好的工作区 zip，不再有提示词①，回传改整个工作区，取消 `meta.json`。新会话用「继续：需求名 编号 票名」，「简称」分成客户简称和需求名，v1 不做升级。取代 [客户本机怎么装：技能包放哪、装配提示词、客服怎么带](https://github.com/Lil-BobCN/grilling-remote/issues/23) 和 [客户本机的进度文件怎么回到我们这里](https://github.com/Lil-BobCN/grilling-remote/issues/24) 里装配和回传两部分。没在 dsh 里实测。[关票扫描](https://github.com/Lil-BobCN/grilling-remote/issues/63#issuecomment-6701338099)",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-028",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 63,
      "premises": []
    },
    {
      "id": "M1-029",
      "statement": "四项都过；2026-11-07 重启后 caddy 与 `/data` 自动恢复，14 秒回来；时钟仍未同步。时钟已在 [服务器运维：操作手册、例行检查、闲置凭据](https://github.com/Lil-BobCN/grilling-remote/issues/72) 修好",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-029",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 41,
      "premises": []
    },
    {
      "id": "M1-030",
      "statement": "手册进 `docs/服务器操作手册.md`；时钟改钉 IPv4 后同步；删掉第二把密钥只留 `dev-hk-server`；agent 用 `dev` 加 sudo 四命令白名单；不做备份，理由写在手册第六节",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-030",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 72,
      "premises": []
    },
    {
      "id": "M1-031",
      "statement": "四行归属表：`AGENTS.md`、`docs/agents/`、`.dsh/skills/` 我们写、agent 只读；`GLOSSARY.md` 和 `.scratch/` 客户侧 agent 写。词表放根目录，一个工作区一份，只放词义，不写规则。客户工作区不写 ADR，决定进票的 `## 结论` 和地图。改词原地改，不标废。setup 不进包，防撞一半作废。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-031",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 39,
      "premises": []
    },
    {
      "id": "M1-032",
      "statement": "六步加三件事总览、继续行和三忌；样品在 PR #70，归 #31 并入整页",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-032",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 58,
      "premises": []
    },
    {
      "id": "M1-033",
      "statement": "每个需求一份 `.scratch/{需求名}/问题树.md`；客户侧 `grilling` 提问时登记，运营者侧 `question-tree` 现算三堆、沿边重算；客户机只加登记规则，不加新技能。见 `docs/adr/0007-问题树单独存一份.md`。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-033",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 30,
      "premises": []
    },
    {
      "id": "M1-034",
      "statement": "官网和上传服务都放现有香港服务器。官网走裸域，Caddy 托管本仓库 `site/`；上传页和端点在 `upload.` 子域，同机反代到 Node 服务；Cloudflare 只加一条 A 记录，代理先关（2026-11-07 按 [Cloudflare 代理和防护：域名现在开没开，v1 要不要开](https://github.com/Lil-BobCN/grilling-remote/issues/81) 改为 v1 开，动作归 [开 Cloudflare 代理：源站换 Origin CA 证书、SSL 调 strict、补 WAF 和限速](https://github.com/Lil-BobCN/grilling-remote/issues/88)，2026-11-07 已开）；运营者手动发布，不做 CI。上传服务用独立用户，token 只给该用户；清旧 agent 和中转站另开 [#78](https://github.com/Lil-BobCN/grilling-remote/issues/78)。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-034",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 73,
      "premises": []
    },
    {
      "id": "M1-035",
      "statement": "卸掉全局 `@anthropic-ai/claude-code`，删 `~/.claude`、`~/.claude.json`、`~/work/.claude`；无常驻进程、无用户级 systemd、无 crontab；`dev`、四命令白名单、唯一密钥未动；手册记了这段（清理、防火墙、复核表），[PR #79](https://github.com/Lil-BobCN/grilling-remote/pull/79) 已合，防火墙那节已合（[PR #83](https://github.com/Lil-BobCN/grilling-remote/pull/83)）；云安全组另开 [#84](https://github.com/Lil-BobCN/grilling-remote/issues/84)",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-035",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 78,
      "premises": []
    },
    {
      "id": "M1-036",
      "statement": "词表放根目录一份、只放词义，客户包不写 ADR；客户侧 `grilling` 登记问题树，运营者侧新增 `question-tree`（先判后写，不进客户包）；技术题五组、原型满 3 次照做，两处写法一致。最后一次打包 43625 字节，SHA256 以 `9fedd60a` 开头，全值见该票末尾打包记录；PR 87 已合并。没在客户机和 dsh 里实测，归[实测客户提示词](https://github.com/Lil-BobCN/grilling-remote/issues/26)。",
      "status": "superseded",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-036",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 44,
      "premises": []
    },
    {
      "id": "M1-037",
      "statement": "代理没开，自定义 WAF、托管规则、限速、Bot 防护全空，SSL 模式是 Full 不是 strict；v1 决定开，源站换 Cloudflare Origin CA（15 年，Full strict），设置改动归 [开 Cloudflare 代理：源站换 Origin CA 证书、SSL 调 strict、补 WAF 和限速](https://github.com/Lil-BobCN/grilling-remote/issues/88)。已由 #88 执行。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-037",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 81,
      "premises": []
    },
    {
      "id": "M1-038",
      "statement": "父单五段、子票三段、四个 `状态:*` 标签（只有调度器改，建票那一刻各打第一档）、父子两套迁移表；驳回走运营者写 `驳回：` 评论、调度器改标签并开修复子票；改口只追加评论不改单；需求全文整包拷进客户仓 `docs/requirements/<需求名>/`。演练在私有仓 `grilling-customer-test`，见 `docs/工单模型.md`、`docs/工单模型-演练记录.md`，PR #89 已合。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-038",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 45,
      "premises": []
    },
    {
      "id": "M1-039",
      "statement": "代理已开，源站换 15 年 Origin CA（到 2041-11-03），SSL strict、TLS 1.2、Always HTTPS、Bot Fight、免费托管 WAF、上传限速已配；手册改完，PR #93、#97 已合。上传服务未上线，限速未实测；源站直连收窄已按 #96 完成。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-039",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 88,
      "premises": []
    },
    {
      "id": "M1-040",
      "statement": "安全组 `afkfactory` 入方向八条全开：`all_tcp 1-65535`，加 RDP 3389、UDP22、UDP3389，来源全是 `0.0.0.0/0`；`ufw` 只放 22、80、443，实际靠它挡。`ufw.log` 11-03 到 11-07 有 17822 条拦包、11756 个不同端口，证明这些包先过了安全组。手册第二节补了云侧对照和风险，[PR #91](https://github.com/Lil-BobCN/grilling-remote/pull/91) 已合。收窄另开 [服务器：收窄云安全组入站，只留 22、80、443 和 ICMP](https://github.com/Lil-BobCN/grilling-remote/issues/92)。 2026-11-07 已按 [服务器：收窄云安全组入站，只留 22、80、443 和 ICMP](https://github.com/Lil-BobCN/grilling-remote/issues/92) 收窄为四条。2026-11-07 来源已按 #96 收窄到 Cloudflare 段。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-040",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 84,
      "premises": []
    },
    {
      "id": "M1-041",
      "statement": "17 项里 11 通过、4 部分、1 没测到、1 作废；分流规则可用，测试语第一句要改；两处真缺口是收尾漏 next 和小需求漏子代理复核；桌面版卡片和自然压缩没测。规则修正转 [按 #26 实测修客户规则：收尾 next、子代理复核、问题树分工](https://github.com/Lil-BobCN/grilling-remote/issues/95)，见 [PR #94](https://github.com/Lil-BobCN/grilling-remote/pull/94)。2026-11-07 按 #95 更新：第 17 项拆成客户侧登记（通过）和运营者侧重判（另测），结果表 18 行，通过 12、部分 3、没测到 1、作废 1、另测 1。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-041",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 26,
      "premises": []
    },
    {
      "id": "M1-042",
      "statement": "收尾 `wrap-up` 后必须再跑 `next` 并核对继续行；小需求收尾起子代理复核、草稿末尾留「复核：」；走 `wayfinder` 的需求建 `问答记录.md`；票完成删 `Blocked by`；产出文件算写它的那张票；#26 第 17 项拆成客户侧登记和运营者侧重判。见 [PR #98](https://github.com/Lil-BobCN/grilling-remote/pull/98)。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-042",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 95,
      "premises": []
    },
    {
      "id": "M1-043",
      "statement": "入方向从八条收到四条：SSH 22、HTTP 80、HTTPS 443、ICMP，来源仍 `0.0.0.0/0`。控制台改完要点组那一行的「应用」，不点不生效。外网三节点验过 22、80、443 通，3389 和随机端口超时，ping 通，站点回 `ok`；`ufw.log` 改后 4 分钟 0 条新拦包。手册第二节重写，`docs/工厂流程.md:701` 同步改，[PR #99](https://github.com/Lil-BobCN/grilling-remote/pull/99) 已合。80、443 来源收窄归 #96。2026-11-07 来源已按 #96 收窄到 Cloudflare IPv4 段。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-043",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 92,
      "premises": []
    },
    {
      "id": "M1-044",
      "statement": "安全组和 `ufw` 两层都把 80、443 的来源改成 Cloudflare IPv4 段：安全组 15 个段按 /16 拆成 33 条，80、443 各 33 条；`ufw` 15 个段，80、443 各 15 条。22、ICMP 不动。非 Cloudflare 直连 80、443 全超时，经 Cloudflare 仍回 200，`cf-ray` 在。IPv6 的 7 段没下发，源站没有 IPv6 路由。手册第二节、复核表、访问链路、重建第 4 步已改，`docs/工厂流程.md:701` 同步，PR #103 已合。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-044",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 96,
      "premises": []
    },
    {
      "id": "M1-045",
      "statement": "裸域改用 Caddy 托管 `/data/www`，配置源在 `deploy/Caddyfile`，发布脚本 `deploy/publish.sh`；客户包 `客户工作区-v1.zip` 41461 字节，SHA256 `49d3d89a…`，下载 https://afkfactory.dev/downloads/客户工作区-v1.zip。打包改成可复现：包内时间戳取 `manifest.json` 的日期，同一份内容重打校验值不变；中文文件名带 UTF-8 标记，Windows 自带解压不乱码。PR #100 已合。",
      "status": "superseded",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-045",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 35,
      "premises": []
    },
    {
      "id": "M1-046",
      "statement": "单页三步：下载、解压、用 dsh 打开；第 4 节第一次对话，第 5 节整包回传。第一句给复制按钮，第二句只给示例；八张截图位和逐步文案在 `prototype/issue-31/`；Windows 页面只写支持。上线归后续。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-046",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 31,
      "premises": []
    },
    {
      "id": "M1-047",
      "statement": "官网静态页位置写 `site/`（还没写），技能清单来源 `customer-kit/manifest.json`；手册服务清单补 Node 26，删「没配过」，记 Claude Code 和中转站已移除；工厂流程「不跑 agent」未动。PR #105。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-047",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 80,
      "premises": []
    },
    {
      "id": "M1-048",
      "statement": "改 Cloudflare：zone `afkfactory.dev` 的 Browser Cache TTL 从 14400 改成 0（Respect Existing Headers）。下载响应头从 `max-age=14400` 变成 `no-cache`，边缘仍 `REVALIDATED`；链接保持固定，不用版本串。文档见 PR #107。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-048",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 101,
      "premises": []
    },
    {
      "id": "M1-049",
      "statement": "Cloudflare 开 zone 级 AOP，用私有 CA 签的客户端证书；源站 Caddy `require_and_verify`。经 Cloudflare 回 200，裸直连报 `certificate required`，换证并删旧证书后仍回源。手册补「源站 mTLS」一节，PR #108 已合。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-049",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 104,
      "premises": []
    },
    {
      "id": "M1-050",
      "statement": "客户看五档：已收到、安排中、开发中、待客户验收、已完成；分支：校验未通过、已驳回。三条消息：校验未通过、待客户验收、满 24 小时；微信人工三条都发，邮件自动前两条。进度模块、登录态、转档格式归 [客户进度模块：登录、四屏样品、五档状态](https://github.com/Lil-BobCN/grilling-remote/issues/109)；客户邮件服务归 to-spec；验收不设时限，不催；客户不反馈就算结束。见 [关票扫描](https://github.com/Lil-BobCN/grilling-remote/issues/52#issuecomment-6706176712)。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-050",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 52,
      "premises": []
    },
    {
      "id": "M1-051",
      "statement": "四屏样品在 `prototype/issue-109/`；五档各自固定小步，校验未通过落在「已收到 · 校验」，驳回回「开发中」第 2 轮；转档状态写工单评论一行一条，建单前写上传服务的订单记录；开修复、过户不占小步；登录、订单入口、转档格式、细阶段词表和读取规则见 `prototype/issue-109/README.md` 和 `docs/客户进度.md` 第四节。PR #112 已合。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-051",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 109,
      "premises": []
    },
    {
      "id": "M1-052",
      "statement": "客户包按登录后上传说法重打上线：41456 字节，SHA256 `ad5931ac…`，线上取回和 `.sha256` 一致；包内 `README.txt` 去掉「Windows 未实机验证」，教程页样品同步新值；官网下载页还没上线，页面源已改。见 [PR #115](https://github.com/Lil-BobCN/grilling-remote/pull/115)。",
      "status": "active",
      "supersedes": "无",
      "outputs": [],
      "base": "M1-052",
      "isBase": true,
      "root": false,
      "layer": "new",
      "sourceTicket": 113,
      "premises": []
    }
  ],
  "tickets": [
    {
      "id": 2,
      "title": "微信通知：选一条真能到手机的通道",
      "type": "research",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-001"
      ],
      "covers": [
        3,
        4
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/2",
      "labels": [
        "wayfinder:research"
      ],
      "body": "## Question\n\n哪条通道能把「有客户进了队列 / 需求开始被开发 / 完成」这三类事件稳定推到运营者的手机上？在 Server酱、WxPusher、企业微信机器人、Bark 之间，当前的可用性、免费额度、实名要求、延迟和接入成本各是什么？\n\n## Type\n\nresearch / AFK\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只比较通道本身。不决定消息文案、触发点、以及消息里是否带操作按钮。\n\n## Success condition\n\n每个候选给出五项事实：能否用、多少钱、延迟量级、接入步数、失败兜底方式。每条结论附可打开的一手文档链接，并给出一个默认选择与一个备选。\n\n## Evidence\n\n- 运营者要求：需求进队列、开始被开发时，想通过微信知道\n- [Server酱文档](https://sct.ftqq.com/docs/)\n- [WxPusher 文档](https://github.com/wxpusher/wxpusher-docs)\n"
    },
    {
      "id": 3,
      "title": "澄清层：客户答不上来时，给他看什么",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-002"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/3",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n客户提交需求时，「看得见的选项」和「原型预览」各自出现在哪一步？客户填到一半卡住时，网页给他看的是什么——已答内容的回放、三个风格的原型、还是一句「这部分待定」？\n\n## Type\n\ngrilling / HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n决定澄清层的交互形态与档位。不决定技术实现，不决定成本（另见预览成本工单）。\n\n## Success condition\n\n一张「客户状态 → 网页给什么」对照表，每个状态都有出口；运营者认可这张表能覆盖「说得出 / 拿不准 / 卡住 / 反复听不懂」四种情形。\n\n## Evidence\n\n- 运营者原话：「填一半需求了，不知道自己现在在哪了，不知道现在自己想要什么了，可以通过 Show Me 或者 prototype 快速了解自己当前所填的这些需求最终能呈现出来一个什么样的东西」\n- `/prototype` 技能：生成某一页的三种风格供选择\n"
    },
    {
      "id": 4,
      "title": "网页里生成看得见的预览：成本与延迟",
      "type": "research",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-003"
      ],
      "covers": [],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/4",
      "labels": [
        "wayfinder:research"
      ],
      "body": "## Question\n\n在网页里生成「这一页的三个风格」，单次要多久、花多少钱？能否在用户愿意等待的时间内完成（流式输出 / 骨架屏 / 先出线框）？\n\n## Type\n\nresearch / AFK\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只测生成侧的成本与延迟。不设计 UI，不决定用哪个模型。\n\n## Success condition\n\n三种复杂度（登录页、表单页、列表页）各一次的耗时与 token 成本；给出一个能落在可接受等待时间内的最低方案，并标注实测环境。\n\n## Evidence\n\n- `/prototype` 技能：生成某一页的三种风格，用户挑一个再改造\n- 待验证项：网页内「看得见的预览」目前无成本与延迟数据\n"
    },
    {
      "id": 5,
      "title": "工单模型：客户的话怎么变成一条能干活的 Issue",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-006"
      ],
      "covers": [
        2
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/5",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n客户提交的内容要落成什么样的 Issue——字段、标签、验收条件、客户标识？客户在网页看到的进度，如何映射自 Issue 的状态与评论？\n\n## Type\n\ngrilling / HITL\n\n## Direct blockers\n\n- 澄清层：客户答不上来时，给他看什么\n\n## Scope\n\n只定 Issue 模板与状态映射。不改 GitHub 仓库结构，不做多仓库方案。\n\n## Success condition\n\n一份 Issue 模板 + 一张状态映射表（网页状态 ↔ Issue 标签/状态），且能说明客户改口时如何追加而不是新建。\n\n## Evidence\n\n- `software-factory`：ticket tracker 是工厂的人机接口\n- Sandcastle 用 label 过滤接单（视频中为 `sandcastle` 标签）\n- 已确认：Ticket tracker = GitHub Issues\n"
    },
    {
      "id": 6,
      "title": "流水线选择：什么单子走哪条技能链",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-008"
      ],
      "covers": [
        3
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/6",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n入口分几类？按什么判？\n\n2026-11-06 改。原问题问的是各类工单走哪条技能链，以及判错怎么回退。运营者已定：入口只分两类，不设回退规则。\n\n## Type\n\ngrilling / HITL\n\n## Direct blockers\n\n- 澄清层：客户答不上来时，给他看什么\n- 工单模型：客户的话怎么变成一条能干活的 Issue\n\n## Scope\n\n只定分流规则与判定者。不定具体 prompt，不搭流水线。\n\n判据写进客户 `AGENTS.md`，agent 照着判。\n\n## Success condition\n\n一张两类判据表，写明三条判据、误判偏向 wayfinder、不设回退规则。\n\n| 类别 | 条件 | 走法 |\n| --- | --- | --- |\n| 小需求 | 同时满足三条：改动落在一个已有功能里；一个会话做得完；验收条件客户已经说清 | 直接做 |\n| 其余 | 缺任何一条 | 走 wayfinder |\n\n拿不准时走 wayfinder。误判只会偏向 wayfinder，所以不另设升级、降级或回退。\n\n原型保持被动：地图里有 prototype 票才做。客户主动要，先劝“现在还不能做”，不马上建票。提醒满 3 次客户仍坚持，就照客户做，记一笔。规则同 `customer-kit/package/AGENTS-TEMPLATE.md`。\n\n## Evidence\n\n- 视频实测：9 个 agent 并行，1 小时 18 分跑完\n- `implement-spec` 自动判断依赖并开多个 worktree\n- 运营者要求：「开发不可能按照一套不变的流程来做」\n- 运营者 2026-11-06 答复：入口只分小需求和其余；不设回退规则；原型被动。\n- 取代 `docs/异议记录.md` 的 G-003（小单、大单、特大单三档）。\n"
    },
    {
      "id": 7,
      "title": "服务器与域名：租什么、在哪、怎么上",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-014"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/7",
      "labels": [
        "wayfinder:task"
      ],
      "body": "## Question\n\n租哪台机器、放在哪个区域、用什么域名与 DNS，把 HTTPS 跑起来？\n\n## Type\n\ntask / HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只完成采购与开通。不部署应用，不装数据库。\n\n## Success condition\n\n一台能 SSH 登录的服务器 + 一个能解析到它的域名 + 一个可用的 HTTPS 证书，三样都有截图或命令输出为证。\n\n## Evidence\n\n- 运营者答复：「我会租一台的，到时候会把网站发给你，你去进行参数对比」\n- 已确认拓扑：远端服务器接单 + 本机 Mac worker 轮询\n"
    },
    {
      "id": 8,
      "title": "Sandcastle 接线：在这台 Mac 上真能跑通吗",
      "type": "research",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-004"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/8",
      "labels": [
        "wayfinder:research"
      ],
      "body": "## Question\n\n在这台 Mac 上，Sandcastle 能不能用现有凭证（Claude Code 订阅或 API key）跑通一次最小 run——起 Docker 沙箱、跑一个 agent、产出一个 commit？\n\n## Type\n\nresearch / AFK\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只验证最小闭环能否跑通。不验证多 agent 并行，不接业务队列。\n\n## Success condition\n\n一次真实 run 的运行日志与 commit SHA；若失败，给出确切失败原因、卡在哪一步、以及需要运营者提供什么。\n\n## Evidence\n\n- [官方 README](https://github.com/mattpocock/sandcastle)：`@ai-hero/sandcastle`，Docker / Podman / Vercel / no-sandbox\n- 本机已有 Docker、Node 26、pnpm 9.15\n- 待验证项：能不能用现有凭证跑通\n"
    },
    {
      "id": 9,
      "title": "准入清单：从 matt 规格标准里长出客户能答的问题",
      "type": "research",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-005"
      ],
      "covers": [
        2
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/9",
      "labels": [
        "wayfinder:research"
      ],
      "body": "## Question\n\n按 matt 技能链的输出要求（`/to-spec` 的字段、`/to-tickets` 的阻塞边、`CONTEXT.md` 与 ADR 的约定、`/code-review` 的两轴），一份客户需求必须包含哪些信息，才能直接生成 spec 与可开工的 ticket？把这些信息变成**客户回答得出来的问题清单**。\n\n## Type\n\nresearch / AFK\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只提炼清单与它的依据。不设计界面，不写 prompt，不决定准入由谁判定。\n\n## Success condition\n\n一份 10–15 条的问题清单，每条标注：问什么、为什么问（对应 spec 的哪个字段）、客户没答会怎样、能不能给默认值。清单必须能映射回 `to-spec` 的模板字段，不能是通用问卷。\n\n## Evidence\n\n- `/to-spec`、`/to-tickets`、`/grill-with-docs` 技能原文\n- `software-factory` 的「Question every task」五问：什么触发、读写哪些服务、触发什么、人在哪回来、怎么防重复\n- 运营者要求：「结合 matt 制定一个问题清单」\n"
    },
    {
      "id": 10,
      "title": "技术闸门：哪些问题必须你拍板",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-011"
      ],
      "covers": [
        2
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/10",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n客户答不了的技术问题（网络中间层、后端服务选型、技术栈）由谁定？人工闸门放在哪一步——进队列前必须运营者点一次，还是开工后边做边问？闸门超时没人处理怎么办？\n\n## Type\n\ngrilling / HITL\n\n## Direct blockers\n\n- 工单模型：客户的话怎么变成一条能干活的 Issue\n\n## Scope\n\n只定闸门的触发条件、触点位置与超时行为。不定具体技术选型。\n\n## Success condition\n\n一张「问题类型 → 谁定 → 何时定 → 没人定怎么办」的表，且标明闸门在工单状态机里的位置。\n\n## Evidence\n\n- 运营者原话：「硬核问题先让客户尝试理解并给推荐选项，搞不定就直接甩给我；进队列、开建之前我需要把这些技术问题再次抉择」\n- `software-factory`：run 不等人，人的介入要变成新的触发\n"
    },
    {
      "id": 11,
      "title": "PR 归属：AI 自己合还是你点头",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-009"
      ],
      "covers": [
        3
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/11",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n一个需求一个分支、通过 PR 合并——PR 由 AI 自己审、自己合，还是必须运营者点头？两个 run 同时改同一处冲突时谁赢？AI 管不了的时候，升级信号是什么？\n\n## Type\n\ngrilling / HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只定 PR 的生命周期、合并权限与冲突升级路径。不定 CI 细节。\n\n## Success condition\n\n一张 PR 生命周期图 + 一张权限表（谁能建、谁能审、谁能合）+ 冲突与失败时的升级信号。\n\n## Evidence\n\n- 运营者原话：「一个工单对应一个隔离工作区；新增需求直接创建新分支，通过 PR 合并」「最好能 AI 管理 PR，管理不了我就得管」\n- `/pr` 技能存在，但它是「写 PR 描述」，不含合并权限\n"
    },
    {
      "id": 12,
      "title": "自主循环：没人盯的时候谁推进",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-010"
      ],
      "covers": [
        3
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/12",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n没人盯着的时候，什么触发下一轮工作？循环里的三道刹车（自动检查、自动评审、人工评审）怎么配比？跑到什么时候必须停下来等人？\n\n## Type\n\ngrilling / HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只定 loop 的触发、停止与刹车阈值。不定具体任务内容（那是流水线选择工单的事）。\n\n## Success condition\n\n一张 loop 图：trigger → run → 判断 → 再触发或停；三道刹车各自的阈值与升级条件；并写明「哪一类事情永远不该自动做」。\n\n## Evidence\n\n- 运营者要求：「不要人盯所有流程，最好全自动通过 loop 完成后续构建与管理，非必要不插手」\n- `software-factory`：「每个 trigger 都是油门」「一次只加一个触发器」「每圈最多试几次就交人」\n"
    },
    {
      "id": 13,
      "title": "仓库供给：客户需求怎么自动长成一个仓库",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-007"
      ],
      "covers": [
        2
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/13",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n一个客户需求进来之后，它的仓库怎么自动长出来？建在谁名下、叫什么名字、初始化哪些文件、交付后归谁？\n\n## Type\n\ngrilling / HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只定仓库的供给与生命周期（创建 / 初始化 / 交付 / 归档）。不定工单内容，不定流水线。\n\n## Success condition\n\n一张「需求进队列 → 仓库就绪」的步骤表，每一步都写明：谁执行、用什么凭证、失败怎么办；以及交付后仓库的归属与归档规则。\n\n## Evidence\n\n- 已确认：客户不接触 GitHub，仓库由服务端用 token 创建\n- 已确认：一客户一仓、一需求一分支、走 PR 合并\n- Sandcastle 的 planner 只读**当前仓库**的 issue，所以工单必须与代码同仓\n- `software-factory`：run 的机器是一次性的，唯一记忆是 ticket tracker、git host 和 orchestrator\n"
    },
    {
      "id": 14,
      "title": "运营者工作台：待办在哪看、怎么处理",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-013"
      ],
      "covers": [
        3
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/14",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n微信只负责通知，真正的待办放在哪看、在哪点？自建一个工作台，还是复用某个开源看板？\n\n## Type\n\ngrilling / HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只定「什么事件 → 在哪看 → 怎么处理」。不定具体技术实现，也不定通知内容。\n\n## Success condition\n\n一张对照表：事件类型、当前靠什么知道、工作台上长什么样、在上面能做什么动作。外加一个选型结论：自建还是复用哪个项目，并说明为什么不选另外两个。\n\n## Evidence\n\n- 运营者要求：微信只用于通知，待办另做工作台；可以结合 GitHub 上现成的开源项目快速满足\n- 已确认：技术闸门触发时要通知运营者（#11 的禁区清单）\n- `software-factory`：ticket tracker 本来就是工厂的人机接口，工作台需要考虑与它重复的部分\n"
    },
    {
      "id": 15,
      "title": "工作台选型：Orca 够不够用",
      "type": "research",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-012"
      ],
      "covers": [
        3
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/15",
      "labels": [
        "wayfinder:research"
      ],
      "body": "## Question\n\n运营者的工作台，能不能直接用 Orca？如果不能，哪个开源看板够用？两者都不行才自建。\n\n## Type\n\nresearch / AFK\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只做选型评估，不搭环境、不做原型。原型是选型之后的动作。\n\n## Success condition\n\n一张评分表：四个必需动作（点选技术选择、批准或驳回验收、给客户回一句、看 agent 干了什么）在各个候选上能不能做、怎么做。加一个结论：用哪个，以及如果要用 Orca 之外的东西，需要先给运营者看什么原型。\n\n## Evidence\n\n- 运营者要求：优先 Orca；用其他开源项目要先做原型给他审；不满足再自建\n- 本机已装 Orca（`/Applications/Orca.app`），有 `orca` CLI 与 orca-cli 技能\n- 已确认：工作台要在手机上也能操作；技术闸门在工作台里逐点点选\n"
    },
    {
      "id": 16,
      "title": "澄清层实现：题、示意图、原型页在网页上怎么出",
      "type": "prototype",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-016"
      ],
      "covers": [],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/16",
      "labels": [
        "wayfinder:prototype"
      ],
      "body": "第 6 条（客户本机三档分流）已于 2026-11-06 废除，见当日评论。其余不动。\n\n## Question\n\n澄清层在网页上怎么实现？客户每一轮看到的题、选项和示意图，由谁生成，怎么画出来。客户点「看不懂」之后，重讲和原型页怎么出。\n\n## Type\n\nprototype / HITL\n\n## Direct blockers\n\nNone\n\n## 已定的前提（2026-11-03，`docs/异议记录.md` G-005、G-006）\n\n- 三级台阶。第 0 级：agent 出数据，固定组件渲染。第 1 级：wait-what，用客户的词重讲。第 2 级：单文件 HTML 原型放进隔离小窗。第 3 级先不做。\n- 网页 agent 只给写文件工具，不给 shell。只能写进一个专用目录。\n- 原型页放 `iframe`，只开 `allow-scripts`，不开 `allow-same-origin`。页面头加内容安全策略，禁网络请求和外部脚本。\n- 先用模板。客户说「都不像」，再现场生成一版。现场生成并行发请求，真流式，先出骨架。依据：[网页里生成看得见的预览：成本与延迟](https://github.com/Lil-BobCN/grilling-remote/issues/4)。\n\n## 要回答的\n\n1. agent 每轮输出的数据长什么样。至少有题号、标题、正文、选项、推荐答案、谁来答、示意图。固定组件要有哪几种。\n2. 每一级客户要等多久。首 token 时间还没测过。\n3. 中文版 wait-what 的重讲规则怎么写。原文要求英文受控语法。\n4. 隔离小窗能不能挡住带恶意指令的页面。\n5. 事实归 agent 查，在后台跑时，页面怎么显示「这题等我查完」。\n6. 客户本机环境的单子按三档分流：多数单不碰客户电脑；只取信息的，用一步一屏的网页指引加上传；要长期跑在客户机器上的，转人工确认环境和授权。此规则已于 2026-11-04 确认。\n\n## Success condition\n\n一张对照表：客户状态（看选项、看不懂、还不懂）对应网页给什么、谁生成、等多久。再加一次真实调用的记录：首 token 时间、总时长、失败次数。\n\n## 参考\n\n- `docs/流程 v4.md` A2a\n- `prototype/product.html`：现在的原型没有任何网络请求，选项写死在页面里。\n\n"
    },
    {
      "id": 17,
      "title": "基础设施自动供给：服务器、域名、证书哪几步能不要人",
      "type": "research",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-015"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/17",
      "labels": [
        "wayfinder:research"
      ],
      "body": "这一单要查清：客户需求要新服务器和域名时，哪几步能不要人，哪几步必须有人点头。\n\n## 背景\n\n#7 做完了。买服务器、买域名、配 DNS、开端口、装证书，这些步骤里有 6 处要人动手。地图的目标形态是全自动推进，非必要不插手。客户的需求如果恰好需要新基础设施，现在的做法撑不住。\n\n## 要查的事\n\n| 步骤 | #7 里为什么要人 | 要查什么 |\n|---|---|---|\n| 买服务器 | 付款 | 厂商有没有 API。能不能预存额度，或用限额的付款方式 |\n| 买域名 | 付款 | Cloudflare 注册接口的创建注册能不能用。需要多大的授权范围 |\n| 登录与授权 | 验证码和同意按钮 | 能不能让人只做一次，建一个范围明确的 API 令牌 |\n| 配安全组 | 只有网页界面 | 厂商 API 或基础设施描述工具能不能做 |\n| sudo 密码 | 项目规矩要求运营者手敲 | 建机时用 cloud-init（开机初始化脚本）写入公钥，再给部署账号限定命令的免密 sudo，行不行 |\n| 核对主机指纹 | 防中间人攻击 | 建机时预置主机密钥，指纹提前已知，行不行 |\n\n## 初步想法（没验）\n\n钱和不可逆操作设三道线：\n\n1. 单笔和月度额度上限。\n2. 只许白名单动作：买域名、开机器、改 DNS、装指定软件。删除和改价不许。\n3. 超额、换厂商、换后缀时，agent（自动干活的程序）发通知，等运营者点一下。\n\n买域名之前，用域名可用性检查接口实时报价，批准一次，之后全自动。\n\n## 风险（凭记忆，没验）\n\n- 部分域名后缀要实名或资质。\n- 内地服务器要备案，香港不要。\n- #7 用的服务器厂商有没有 API，不清楚。\n\n## 和其他议题的关系\n\n- #10 把花钱归运营者定。这一单查出能自动到哪一步，额度线怎么划，可能要另开一单决定。\n- #12 管没人盯的时候谁推进。这一单的结果要接进去。\n- #7 已关闭，是这一单现成的样本。\n\n## 完成条件\n\n一份结论，逐步写明：全自动、人只做一次、每次都要人。每条附证据。结论里写明还缺哪些决定。\n\n## 不在范围内\n\n不写产品代码，不真的买东西，不创建新资源。服务器地址、域名、账号标识只放在本地被 git 忽略的文档里，不写进议题。\n"
    },
    {
      "id": 18,
      "title": "网页 agent 用哪个：DeepSeek Harness 能不能担当",
      "type": "research",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-017"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/18",
      "labels": [
        "wayfinder:research"
      ],
      "body": "## Question\n\n网页 agent 用 DeepSeek Harness（`dsh`，DeepSeek 开源的 agent 运行时）跑，能不能担当客户澄清阶段的引擎。\n\n## Type\n\nresearch\n\n## Direct blockers\n\nNone\n\n## 已定的前提（2026-11-05，见 #16 的结论评论）\n\n- 引擎选 DeepSeek Harness，前端要改。\n- 网页 agent 挂好 grilling、wayfinder 等技能，题走普通聊天，题数按 grilling 原文。\n- G-006：只给写文件，不给 shell，只能写进专用目录。\n\n## 要回答的\n\n1. 能不能只给读写文件的工具，不给 shell。能不能把写入限定在一个目录。\n2. 多个客户同时用，会话怎么隔离。有没有登录。\n3. 创造模式能不能在客户会话里关掉。本机试跑日志里，一轮跑了 37 次 bash，批准策略被改成了 never。\n4. 联网查事实要不要官方 key。社区讨论说内置搜索没有官方 key 会返回 401。\n5. 一轮题、一页原型各要等多久。目前只有两次出卡片的耗时，7.6 秒和 9.3 秒，各 1 次。#16 里的 14.3 秒和 59.2 秒是 Claude Code 加中转站测的，不能直接用。\n6. 原文 grilling 能不能直接放进技能目录使用。\n\n## Success condition\n\n一张表，列出以上六问的答案、依据和实测次数。没验证的写没验证。\n\n## 参考\n\n- #16 结论评论：https://github.com/Lil-BobCN/grilling-remote/issues/16#issuecomment-6648095233\n- 本机版本 0.2.1-rc.5。官网没写登录、多用户和沙箱。\n- 社区讨论 #1747：创造模式的插件只在内存里，重启后消失。\n"
    },
    {
      "id": 19,
      "title": "议题功能怎么做、怎么展示：要不要还原 GitHub 议题",
      "type": "prototype",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-018"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/19",
      "labels": [
        "wayfinder:prototype"
      ],
      "body": "## Question\n\n客户用 wayfinder 时，地图和子议题怎么用前端展示得更直观。要不要还原 GitHub 议题的功能，做到哪一步。\n\n## Type\n\nprototype / HITL\n\n## Direct blockers\n\nNone\n\n## 已定的前提（2026-11-05）\n\n- 客户和运营者看到的内容一样，包括议题评论。\n- 接单阶段不用 GitHub，客户没有账号。地图和议题用本地 Markdown 跟踪器：`.scratch/<effort>/map.md` 和 `issues/NN-slug.md`。\n- 我们自己的开发地图留在 GitHub。\n\n## 要回答的\n\n1. 技能自带的本地跟踪器管存放和读写。缺的是给人看的界面：地图、议题列表、阻塞关系、当前能动手的议题、评论。最少要做哪几块。\n2. 现成网页 agent 的文件浏览够不够用。pi-web 只能看单个文件，未验证。DeepSeek Harness 有没有类似功能，没查。\n3. 有一处冲突待你定：`docs/research/澄清层网页实现.md` 写着 `operator` 类的题不显示在客户页，而客户要看到全部内容。内部评论和技术闸门的题，对客户隐藏不隐藏。\n4. 本地跟踪器没有原生阻塞，依赖图靠文本推断。要不要手动纠正，在哪里纠正。\n\n## Success condition\n\n一份可点的页面原型，加一份清单：做哪几块，不做哪几块。\n\n## 参考\n\n- #16 结论评论：https://github.com/Lil-BobCN/grilling-remote/issues/16#issuecomment-6648095233\n- 技能库 `issue-tracker-local.md` 的 Wayfinding operations 一节。\n"
    },
    {
      "id": 20,
      "title": "接单阶段的文件存哪、用完去哪",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-019"
      ],
      "covers": [
        1,
        2
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/20",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n接单阶段，客户的地图、议题、确认单、原型页存在哪，客户点头建仓之后哪些要搬、哪些丢掉。\n\n## Type\n\ngrilling / HITL\n\n## Direct blockers\n\nNone。`proto/` 能不能限住取决于引擎那张议题，建好后再连阻塞。\n\n## 已定的前提（2026-11-05）\n\n- 接单阶段不用 GitHub，客户没有账号。\n- 服务器上每个客户一个目录，用本地 Markdown 跟踪器。\n- 我们自己的开发地图留在 GitHub。\n\n## 要回答的\n\n1. 地图、议题、确认单、原型页放同一个目录，还是分开。\n2. 原型页用完怎么处理：用完即丢，按客户存档不进客户仓，或客户点头后拷一份进客户仓的一次性分支。倾向最后一种，没定。\n3. 保留多久，谁能读。多个客户的目录怎么隔离。\n4. 建仓顺序是先建仓、再建 parent issue（父工单）。点头之后，哪些文件搬进客户仓，搬原文还是摘要。\n5. `proto/` 的写入限制：11-03 实测，写出的文件落在了当前目录，没有限定专用目录（`docs/工厂流程.md` 第十四节第 15 条）。\n\n## Success condition\n\n一张表：每类文件存在哪、留多久、点头后去哪。同时清掉地图里 Not yet specified 的「wayfinder 的图放哪」一条。\n\n## 参考\n\n- #16 结论评论：https://github.com/Lil-BobCN/grilling-remote/issues/16#issuecomment-6648095233\n- `docs/工厂流程.md` A2a、B1。\n- 技能库文档提醒：本地 Markdown 放进代码仓库，材料容易意外留下。我们放在服务器目录，不进仓库。\n"
    },
    {
      "id": 21,
      "title": "客户聊天页怎么接：题、卡片、原型什么时候出",
      "type": "prototype",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-020"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/21",
      "labels": [
        "wayfinder:prototype"
      ],
      "body": "## Question\n\n客户在网页上和 agent 聊天，题、选项卡片、原型页怎么显示。前端用 DeepSeek Harness 自带页面改，还是自己做聊天页去接它。\n\n## Type\n\nprototype / HITL\n\n## Direct blockers\n\nNone。聊天页接什么，最终取决于引擎那张议题的结论。\n\n## 已定的前提（2026-11-05，见 #16 的结论评论）\n\n- 题走普通聊天，问法照 grilling 原文，题数由 agent 想问几题就几题。\n- 原型随时能点。agent 判断信息够不够，不够就列出缺哪几题，答完再出。\n- 原型分两档：模板出粗稿，现场写完整版。\n- 本机试跑过创造模式做出的选项卡片，能点，点了会把字母发回去。\n\n## 要回答的\n\n1. 试跑的卡片缺背景、推荐理由、「我自己说」和「看不懂」。卡片样式怎么固定下来。\n2. 点选项后是直接发出，还是只填进输入框，等客户按发送键一起发。终端里是后一种。\n3. 一轮多题怎么显示。试跑只测过一次一题。\n4. 卡片现在画在输入框上方，答完消失。客户回头看不到当时的选项，接不接受。\n5. 创造模式用到哪一步：只在我们开发机上造好固定组件，还是客户会话里开着。待定，要看引擎那张的查证结果。\n6. 原型页怎么放进隔离小窗，agent 只写一个文件。\n7. 「看不懂」怎么触发中文重讲。\n\n## Success condition\n\n一个可点的聊天页原型，客户能走完一轮题。再附一份对照表：客户状态、页面给什么、谁生成、等多久。\n\n## 参考\n\n- #16 结论评论：https://github.com/Lil-BobCN/grilling-remote/issues/16#issuecomment-6648095233\n- 终端问法已移进 `prototype/clarify.html`，该文件改动未提交。\n- 本机试跑日志里，一次出卡片耗时 7.6 秒和 9.3 秒，各 1 次。\n"
    },
    {
      "id": 22,
      "title": "客户澄清遇到技术题（备案、后端服务）：谁答、怎么答",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-021"
      ],
      "covers": [
        1,
        2
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/22",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n客户在澄清对话里被问到技术题时，谁来答，Agent 怎么处理，答案记在哪？例子：网站备案走哪条路线，后端用 Supabase 还是腾讯云 CloudBase。\n\n## Type\n\nwayfinder:grilling，HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n要定四件事。\n1. 哪几类技术题，Agent 不许直接问客户。\n2. Agent 改做什么：给一个默认推荐，记进 map.md 的“仍不清楚”，标明待运营者确认。\n3. 面向中国大陆客户的默认值由谁维护、放在哪。先覆盖三项：备案路线、后端服务、托管地域。\n4. 和已定的技术闸门怎么分工：客户这边只记录，运营者在开工前一次拍板。\n\n不定两件事。Supabase 和 CloudBase 实际选哪个，备案具体怎么办。这两项事实还没查清，定题后各开一张 research 票。\n\n## Success condition\n\n拿到三样东西。\n1. 一份“客户不用答的技术题”清单，每题有默认值，或写明升级运营者。\n2. 一条能写进客户 AGENTS.md 的规则，两三句话。\n3. 一句话说明它和技术闸门各管什么。\n\n## Evidence\n\n- 2026-11-05 对话：运营者指出，Agent 在澄清中会问备案、数据库选型这类题，客户答不了。\n- 地图 Notes 已写“技术类问题先给客户推荐选项，搞不定升级给运营者”，但没有具体清单和默认值。\n- [技术闸门：哪些问题必须你拍板](https://github.com/Lil-BobCN/grilling-remote/issues/10) 已定五类问题归运营者，含技术栈、部署、第三方与账号、数据与合规。\n- 在 docs 里搜过 ICP、备案、Supabase、CloudBase，没有记录。"
    },
    {
      "id": 23,
      "title": "客户本机怎么装：技能包放哪、装配提示词、客服怎么带",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-016",
        "M1-017"
      ],
      "produces": [
        "M1-022"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/23",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n客户在自己电脑上装好 DeepSeek Harness（`dsh`）、八个技能和 AGENTS.md，要走哪几步？谁带他走？\n\n## Type\n\nwayfinder:grilling，HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n要定六件事。\n1. 技能包放哪里下载。官网一个 zip，发布和 URL 归 #35；懂开发、有 GitHub 的客户可走 GitHub 原版技能包。\n2. 压缩包里放什么：八个技能。`grilling`、`domain-modeling`（带 `GLOSSARY-FORMAT.md` 和 `ADR-FORMAT.md`）、`wayfinder`、`prototype`（带 `LOGIC.md` 和 `UI.md`）、`research`、`setup-matt-pocock-skills`、`wait-what`、`ask-matt`。\n3. 装配提示词（提示词①）做哪几件事：建工作文件夹，装八个技能，写 `AGENTS.md`，写 `docs/agents/` 两个文件，建 `.scratch/`。已有同名文件就跳过，不覆盖。\n4. 装好后要不要关掉 `dsh` 重开。`dsh` 在会话第一次请求时才读 AGENTS.md，当前会话读不读得到没验证。\n5. 人工客服先怎么带客户装：看哪几处截图（清单在 `customer-kit/安装步骤.md`），卡在哪一步找谁。运营者改了推荐答案时，客服怎么补问（通道归 #25）。\n6. 支持哪些操作系统：Windows 64 位、macOS 双芯片，Linux 不支持。Windows、Intel Mac、默认 `workspace-write` 的实测归 #36。\n\n不定两件事。AGENTS.md 正文，见 #25。进度文件怎么回传，见 #24。\n\n## Success condition\n\n拿到五样东西。\n1. 一份从“什么都没装”到“能粘贴启动提示词”的步骤清单，每步有检查办法和截图点。\n2. 技能包的存放位置和发布去向（地址归 #35）。\n3. 提示词①的定稿方案。\n4. 客服带装和带话流程的一句话版；带话通道归 #25。\n5. 技术题按 #22：可以问，客户可以不答。\n\n## Evidence\n\n- 2026-11-05 对话：运营者说客户会下载软件，难点是装技能和配置追踪。\n- 运营者的 Gitee 和极狐账号被封，GitHub 在大陆连接不稳。\n- `dsh` 读 AGENTS.md 的依据：`@deepseek-ai/dsh-agent-instructions` 的 `README.zh.md`，以及 `lib/index.js:574-582`。\n- 已装的 `wayfinder/SKILL.md` 开头有 `disable-model-invocation: true`，`dsh` 认不认没验证。\n- 2026-11-05 补查漏：技术题按 #22「可以问、客户可不答」；客服带话通道归 #25；官网发布归 #35；Windows/Intel/默认 `workspace-write` 实测归 #36。\n- `customer-kit/安装步骤.md` 补了客服带话、截图清单、怎么看 `.scratch/` 文件。本次文档改动在工作区，git index 在沙箱外，未提交。\n- 旁支记录：`docs/research/客户澄清改走本机安装（旁支记录）.md`（还没提交）。\n"
    },
    {
      "id": 24,
      "title": "客户本机的进度文件怎么回到我们这里",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-016",
        "M1-017"
      ],
      "produces": [
        "M1-023"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/24",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n客户在本机用 `.scratch/` 记完澄清进度后，这些文件怎么到我们手里，再变成 GitHub Issue 接上 to-spec？\n\n## Type\n\nwayfinder:grilling，HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n要定四件事。\n1. 回传方式：客户发压缩包、网页上传、客服代传，或别的。\n2. 什么时候回传：每解决一张票一次，还是全部做完一次。\n3. 谁转成 GitHub Issue：运营者手动，还是脚本。\n4. 原型 HTML 文件和客户的邮箱信息，怎么跟着一起回传并对得上。\n\n不定 to-spec 以后的流程，已有的票覆盖。\n\n## Success condition\n\n拿到三样东西。\n1. 一条选定的回传路径，客户要做的动作不超过两步。\n2. 一句话说明谁、何时、怎么把文件转成 GitHub Issue。\n3. 回传失败时的兜底做法。\n\n## Evidence\n\n- 地图 Notes 已定：接单阶段不用 GitHub，客户不接触 GitHub，客户信息必须含邮箱。\n- 本地 Markdown 追踪器的约定来自本机的 `setup-matt-pocock-skills/issue-tracker-local.md`：任务放 `.scratch/`，不管文件怎么离开客户机器。\n- 2026-11-05 对话：客户本机的 `.scratch/` 怎么回到我们这里，目前没有答案。\n- 旁支记录：`docs/research/客户澄清改走本机安装（旁支记录）.md`（还没提交）。"
    },
    {
      "id": 25,
      "title": "客户 AGENTS.md 里写什么：谁管什么、跳步怎么回应",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-016",
        "M1-017"
      ],
      "produces": [
        "M1-024"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/25",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n客户工作目录里的 AGENTS.md 要写哪些规则，才能让 Agent 在每个新会话里自动守规矩，客户不用再粘贴提示词？\n\n## Type\n\nwayfinder:grilling，HITL\n\n## Direct blockers\n\nNone。技术题那两三句话要等 [客户澄清遇到技术题（备案、后端服务）：谁答、怎么答](https://github.com/Lil-BobCN/grilling-remote/issues/22) 的结论，先在正文里留位置。\n\n## Scope\n\n要定九件事。\n1. 谁管什么。客户管终点、每个结论对不对、脑子里冒出的想法。Agent 管先做哪张票、用什么技能、做什么产物、什么时候让客户新开对话。\n2. 每个会话开头和结尾，用三句话说明：终点、已定几条、下一步。\n3. 客户想跳步时怎么回应：说明这件事排在哪一步，记进 `map.md` 的“仍不清楚”或新建一张票，再回到当前问题。提醒满 3 次客户仍坚持，就照客户的做，并在 `map.md` 记一笔。\n4. A、B、C 三档选档规则。\n5. 一个会话最多解一张票，解完提醒客户新开对话。\n6. 原型默认被动做：地图里有 prototype 票才做。客户主动要，先劝“现在还不能做”，把当前问题答完；不要马上建票，也不要现场做。客户坚持就按跳步规则记下来。\n7. 讨论偏出当前票时，先把偏出去的内容存成独立文件，再往 `map.md` 加一行指针。\n8. 技术题怎么处理，等上面那张票。\n9. 提示词②（启动）缩到只剩什么。\n\n## Success condition\n\n1. AGENTS.md 正文定稿，篇幅不设硬上限，以客户能读完为准。\n2. 提示词②定稿。\n3. 每条规则写明为什么放在 AGENTS.md，而不是一次性提示词。\n\n## Evidence\n\n- 2026-11-05 对话：运营者说自己也会跳步，本质上是在和 Agent 抢指挥权，客户也会这样。要让客户安心照做，客户混乱时要及时提醒。\n- `dsh` 在第一次请求时注入 AGENTS.md，注入文本写明不覆盖用户的直接指令，所以它只能提醒，拦不住。依据：`@deepseek-ai/dsh-agent-instructions` 的 `README.zh.md`。\n- 上下文压缩后 AGENTS.md 还在不在，没验证。\n- 篇幅不设硬上限。结构可参考 `docs/research/项目脚手架分层.md`，但不按 40 行截断。\n- `docs/客户澄清启动提示词.md`（v1，还没提交）已有选档规则和追踪器约定。\n"
    },
    {
      "id": 26,
      "title": "实测客户提示词：小需求和其余的分流、跳步提醒、装配后要不要重开",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-016",
        "M1-017",
        "M1-021"
      ],
      "produces": [
        "M1-041"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/26",
      "labels": [
        "wayfinder:task"
      ],
      "body": "## Question\n\n把启动提示词和 AGENTS.md 装进 `dsh`，用三句话测分流（小需求和其余），再测跳步提醒，哪些规则能用，哪些要改？\n\n## Type\n\nwayfinder:task，HITL（运营者在 `dsh` 里操作）\n\n## Direct blockers\n\n[客户包收尾：回传打包、五组技术题、原型口径、模板逐条审](https://github.com/Lil-BobCN/grilling-remote/issues/44)改完并重打包后再测。第 11 项原来等的[客户工作区里 AGENTS.md、GLOSSARY.md、docs/agents/ 各归谁写，setup 会不会撞](https://github.com/Lil-BobCN/grilling-remote/issues/39)已经挡在它前面，这里不再单列。[客户 AGENTS.md 里写什么：谁管什么、跳步怎么回应](https://github.com/Lil-BobCN/grilling-remote/issues/25)已于 2026-11-05 关闭。\n\n## Scope\n\n2026-11-06 改：分流由 A、B、C 三档改成小需求和其余两类，见 #6。\n\n要测八项。\n1. 分流。两类：同时满足三条才算小需求（改动落在一个已有功能里、一个会话做得完、验收条件客户已说清），其余走 wayfinder。三句测试语：“我想给公司官网加一个联系表单”（预期小需求，前提是客户说得清验收条件）、“我想做会员系统，会员、客户、账号这几个词我自己都分不清”（预期其余）、“我想做一个连锁门店的线上订货平台，包括总部、门店、供应商”（预期其余）。预期是估的，分到别的类要看理由站不站得住。拿不准时应走 wayfinder。\n2. 走 wayfinder 的单子是否按两段开场词讲：开口前一段，说完想法后小的说一句、大的讲「已经确定需要拆分」那段；是否只领取一个子任务，做完停下。\n3. 新开会话只发「继续：需求名 编号 票名」，Agent 是否直接做那张票。只发「继续」二字，是否由 `next` 选票。\n4. 跳步。在第一个子任务里说“先给我做个原型看看”，看 Agent 有没有说明排在哪一步、记下想法、回到当前问题。再连续坚持，看是否提醒满 3 次才照做并记一笔。\n5. 第一次打开的自检。删掉 `docs/agents/` 或 `.dsh/skills/` 再开，Agent 是否报缺什么并停下。三句硬触发（每次开工用 `next`，写结论前用 `map-gate`，收尾用 `wrap-up`）是否每次都做。提示词①已取消，原来问的「提示词①写出 AGENTS.md 后读不读得到」作废。\n6. `wayfinder/SKILL.md` 开头的 `disable-model-invocation: true`，`dsh` 认不认。认就在副本里删掉那一行。\n7. 会话变长、触发压缩后，AGENTS.md 的规则还在不在。测不到就记为没测到。\n8. dsh 卡片行为：点选后直接发还是填输入框、一轮多题怎么显示、答完能不能回看、创造模式用不用。\n\nResearch 仍 AFK；Task 加兜底：客户明确不会做、不愿意折腾，先安抚，按 agent 指示一步步带，实在不行再转人工。安装实测（Windows、Intel Mac、默认 `workspace-write`）归 #36。\n\n## 补测三项（2026-11-05）\n\n9. 小需求的需求草稿。说“我想给公司官网加一个联系表单”，检查 `.scratch/{需求名}/需求草稿.md` 是否有五段、`Status` 是否正确，客户确认后再上传。\n10. `wait-what`。说“看不懂”，看 Agent 会不会自动调用；再手动 `/wait-what`，看是否也能用。官网包是 `false`，本机副本仍是 `true`。\n11. 作废。客户包已不含 `setup-matt-pocock-skills`。\n\n## 补测四项（2026-11-05 评论补入，见 [客户澄清遇到技术题（备案、后端服务）：谁答、怎么答](https://github.com/Lil-BobCN/grilling-remote/issues/22)）\n\n12. 技术题标注：Agent 会不会在偏技术的题旁加一句提示。\n13. 联网查证：Agent 会不会联网查证并写出处，查不到写「未核验」。客户机上联网搜索能不能用，也在这里测。\n14. 子代理：客户机上能不能起独立子代理（`subagent_fork`）。\n15. 配置档：客户直接运行 `dsh` 时走哪个 profile（配置档）。\n\n## 补测一项（2026-11-07）\n\n16. 词表和 ADR。第一次定词义时，是否在根目录建 `GLOSSARY.md`，一个工作区一份；改词是否原地改、不加「已被第 N 张取代」；难回退的决定是否写进票的 `## 结论` 和地图，不建 `docs/adr/`。\n\n17. 问题树（2026-11-07 按 #30 新增）。客户侧 agent 会不会在提问时写 `.scratch/{需求名}/问题树.md`，每题的编号、依赖、状态对不对；改一条答案后，会不会按依赖边重判。格式见 `docs/adr/0007-问题树单独存一份.md`。 两套编号（`pending.md` 条目号和树号）也对得上吗。\n\n## Success condition\n\n一张结果表。每项写通过、失败或没测到。失败的写原因和要改的规则。\n\n## Evidence\n\n- 三句测试语和预期类别，来自 2026-11-05 对话里的分流方案。\n- `docs/客户澄清启动提示词.md`（v1，还没提交）。\n- `docs/research/DeepSeek Harness 澄清引擎验证.md` 记了研究时的放法：复制到隔离目录 `$DSH_AGENTS_HOME/skills/`。客户机上装在工作文件夹的 `.dsh/skills/`，见[客户本机怎么装：技能包放哪、装配提示词、客服怎么带](https://github.com/Lil-BobCN/grilling-remote/issues/23)。\n\n2026-11-06 按[客户包收尾：回传打包、五组技术题、原型口径、模板逐条审](https://github.com/Lil-BobCN/grilling-remote/issues/44)更新：阻塞改为整票等它改完并重打包；「预期档位」改称「预期类别」；技能目录路径写明研究环境与客户机的区别；补测四项并进正文。\n\n2026-11-06 按[客户侧 map 的每张票怎么标类型和任务：写进索引，还是解票前先澄清](https://github.com/Lil-BobCN/grilling-remote/issues/55)更新：Scope 第 2 项从「先讲四条规则」改成「按两段开场词讲」。\n\n测试先不管，运营者之后会清空 dsh 里的全部技能再测。运营者版 `next`、`map-gate`、`wrap-up` 不装进 `~/.dsh/skills`，装了会和客户版同名。这一点是推测，没实测。\n\n按 [客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63) 更新。\n\n2026-11-07 按[客户工作区里 AGENTS.md、GLOSSARY.md、docs/agents/ 各归谁写，setup 会不会撞](https://github.com/Lil-BobCN/grilling-remote/issues/39)更新：补 Scope 第 16 项。原文里「#39 挡在前面」现在已关闭，阻塞仍只有[客户包收尾](https://github.com/Lil-BobCN/grilling-remote/issues/44)。\n\n2026-11-07 按 [客户澄清的问题树：题与题的依赖怎么存、怎么重算](https://github.com/Lil-BobCN/grilling-remote/issues/30) 更新：补 Scope 第 17 项。\n\n2026-11-07 按 #30 的 wrap-up 更新：第 17 项补两套编号的对齐测试。\n"
    },
    {
      "id": 27,
      "title": "客户要看原型时在本机怎么出：单个 HTML 能不能撑住",
      "type": "prototype",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-003",
        "M1-016"
      ],
      "produces": [
        "M1-025"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/27",
      "labels": [
        "wayfinder:prototype"
      ],
      "body": "## Question\n\n客户要看原型时，在本机只用一个 HTML 文件，能不能同时撑住“流程演示”和“三个版本对比”两种问法？\n\n## Type\n\nwayfinder:prototype，HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n做两个样品，让运营者判断客户看不看得懂。\n1. 流程演示：状态逻辑写成不碰页面的纯脚本。页面有当前状态、自由点按钮、2 到 3 个引导场景，其中一个是容易出错的情况。依据 `prototype` 技能的 `LOGIC.md`。\n2. 三个版本对比：版面结构不同的 3 个版本，页面底部有浮动切换栏（左右箭头加版本名，键盘左右键也能切）。这是把 `UI.md` 改成单文件的做法，技能原文没有。`UI.md` 原文要现成项目和开发服务，客户的空目录里跑不了。\n\n共同限制：单个 HTML，样式和脚本写在文件里，不引用网络地址，不用框架，不起服务，用假数据，页面顶部写明要回答的问题，文件放 `.scratch/{简称}/prototypes/`，400 行以内。\n\n不定原型怎么回传，见客户本机进度文件那张票。\n\n## Success condition\n\n1. 两个样品各一份，用浏览器双击能打开。\n2. 记录实际行数和生成耗时。\n3. 运营者给一句判断：客户看不看得懂，哪里要改规则。\n\n## Evidence\n\n- `prototype` 技能的 `LOGIC.md`、`UI.md` 原文。\n- 400 行上限是按 `docs/research/DeepSeek Harness 澄清引擎验证.md` 里两次一页原型的耗时（218.2 秒 1399 行，109.7 秒 374 行）估的，没有别的依据。\n- 2026-11-05 对话：运营者问原型是主动做还是被动做。读完技能原文的结论是被动做，地图里有 prototype 票才做。"
    },
    {
      "id": 30,
      "title": "客户澄清的问题树：题与题的依赖怎么存、怎么重算",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-019"
      ],
      "produces": [
        "M1-033"
      ],
      "covers": [
        1,
        2
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/30",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\ngrilling 会话里，题和题互相依赖。运营者改一条推荐答案，依赖它的题要跟着重判。这些依赖存在哪，问题树谁来生成，改一条后怎么重算？\n\n## Type\n\nwayfinder:grilling，HITL\n\n## Direct blockers\n\nBlocked by: 无。#22 已于 2026-11-05 关闭，`pending.md` 的六项格式和三种标签见 #22 结论。\n\n## Scope\n\n先分清两种树。\n\nissue 树管票和票的先后。wayfinder 已经记了：原生依赖，或本地 Markdown 的 `Blocked by:`。本票不管它。\n\n问题树管题和题的依赖。例子：“要不要备案”依赖“托管在国内还是海外”。这种依赖现在没有地方记。小需求的会话里没有，其余每张 grilling 票内部也没有。所以两类都要管。\n\n要定六件事。\n1. 依赖怎么记。#22 暂定每条写 `依赖第 N 条`，只指向编号更小的条目。这里确认够不够用，漏记的隐含依赖怎么补。\n2. 谁在什么时候生成问题树。倾向运营者这侧的技能，读回传文件生成。客户机不加技能。\n3. 运营者拿到的视图，分三堆：没定的；客户不懂、走了推荐答案的；已定但要核实的技术题。\n4. 重算规则。运营者改第 N 条，从第 N+1 条往后扫，列出依赖被改条目的题。运营者逐条判：仍成立、作废、要补问客户。再改一条就再扫，扫到不再变为止。\n5. 回传哪些文件才够生成。对话记录回不回，归 #24。\n6. 有没有现成技能能用。\n\n不定两件事。`pending.md` 的条目格式，归 #22。Supabase、CloudBase 和备案只是 #22 里的举例，不单独开 research 票。\n\n## Success condition\n\n1. 一页说明：问题树的节点和边怎么存。\n2. 一套生成和重算的步骤，运营者每改一条都能照着跑。\n3. 运营者视图的一个完整例子。\n4. 一句话说明客户机上要不要加东西。倾向不加。\n\n## Evidence\n\n- 2026-11-05 对话：运营者说，grilling 里的问题互相依赖，改一个关键技术题可能让整张图推倒重来。他说这叫问题树，不叫 issue 树。\n- wayfinder 的 `SKILL.md` 第 91 行：阻塞用原生依赖。第 168 行：只在解完一张票、关票前处理作废的部分。这两处管的都是票，管不到题。\n- grilling 的 `SKILL.md` 只在对话里排题，不写文件。\n- 本机技能名单里没有名字指向重算的。命中 `frontier` 等词的六个文件里，只读了 grilling 和 wayfinder 的相关行。to-tickets、implement-spec、tdd、ask-matt 没细读，未验证。\n- 已知风险：Agent 写条目时可能漏记依赖。运营者这侧只读得到文件，读不到对话，补得不全。\n\n2026-11-06 按[流水线选择：什么单子走哪条技能链](https://github.com/Lil-BobCN/grilling-remote/issues/6)更新：三档叫法退役。\n"
    },
    {
      "id": 31,
      "title": "教程页做成什么样：安装步骤、截图和启动句怎么放",
      "type": "prototype",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-046"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/31",
      "labels": [
        "wayfinder:prototype"
      ],
      "body": "## Question\n\n客户第一次打开官网，怎样从「下载 dsh」走到「解压工作区 zip、用 dsh 打开」，再走到「说开始需求澄清」？教程页要分几步、放哪几张截图、两句启动句怎么给、下载按钮放哪。\n\n## Type\n\nwayfinder:prototype，HITL\n\n## Direct blockers\n\n#35（技能包发布地址；#23、#25 已关闭）\n\n## Scope\n\n要定五件事。\n\n1. 页面结构：单页还是分步页，首屏放什么，一屏放几步。安装步骤已删掉装配提示词和退出重开两步，改成下载、解压到空文件夹、用 dsh 打开并说一句话，客服版和截图清单见 `customer-kit/安装步骤.md`。页面分几屏由本票定，步骤内容以 `customer-kit/安装步骤.md` 为准。\n2. 截图：哪几步要图，图里标什么，Mac 和 Windows 各拍哪几张。\n3. 启动句怎么给：装配提示词已取消，只剩两句。第一次说「开始需求澄清」，之后复制收尾给的一行。代码块加复制按钮，还是下载 `.txt`，放哪一屏。\n4. 下载：桌面版两个安装包和工作区 zip 的按钮（zip 地址由 #35 给），下载后怎么确认文件没坏。\n5. 卡住怎么办：每一屏的找客服入口和一句话话术。\n\n补四件事（2026-11-05、06 评论补入）：\n\n6. 下载分两条路：会编程的客户用 `mattpocock/skills` 原版技能包，不会编程的下载官网技能包。两条路分开放，不混在一个下载按钮里。文案不写「客户不接触 GitHub」。\n7. 官网写一句：遇到完全不懂的技术题，要如实告诉 Agent，否则流程转不下去。\n8. 做完后把整个文件夹压缩，点官网上传页拖进去，填客户简称和邮箱，勾「已问完」。放上传页入口、「文件夹里的所有文件都会上传，请只放本项目的资料」这句隐私提示和客服微信号。上传页本身归 to-spec 出票，本票只放入口和话术。原写的是回传 `.scratch/{简称}/` 加 `meta.json`，已取代。\n9. 教程页写到上传成功、等我们联系为止，不承诺后续自动流程。\n10. 教程页上线后，替换服务器根路径的临时 `ok` 占位页（`/data/www/index.html`）。\n\n不做：官网其他页面、账号系统、支付。\n\n## Success condition\n\n1. 一份能在浏览器打开的静态页样品，可以是单个 HTML。\n2. 运营者按页面从头走一遍，能从下载走到启动句，再走到上传页入口，中途不用问人。\n3. 交一份截图清单和逐步文案，客服能照着拍。\n\n## Evidence\n\n- #23 的步骤清单和安装方式：技能包装进客户工作文件夹的 `.dsh/skills/`；截图清单见 `customer-kit/安装步骤.md`；技能包地址见 #35。\n- #25 的 AGENTS.md 正文和启动句。\n- 地图 #1 Destination：网站只放教程和提示词。\n- 官网已有桌面版下载页 `https://www.deepseek.com/harness`，没有给客户看的安装教程。\n\n2026-11-06 把评论补的四件事并进正文，并说明「五步」不是定数，见本票评论。\n\n2026-11-06 按[教程页加一节：客户第一次对话会遇到什么](https://github.com/Lil-BobCN/grilling-remote/issues/58)更新：新增阻塞，第一次对话那一节的样品由它出。\n\n补两条：一，多套一层文件夹不留兜底提示词。教程第 2 步写「解压后文件列表里要能直接看到 `AGENTS.md`」，看不到就是多套了一层。二，v1 不做升级，每次下载当时的最新版，新单开新文件夹。边上还挂着 #58，#58 出的「第一次对话会遇到什么」样品并进本票这一页。\n\n按 [客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63) 更新。\n\n2026-11-07 按 [教程页加一节：客户第一次对话会遇到什么](https://github.com/Lil-BobCN/grilling-remote/issues/58) 更新：标题和正文里的「两条提示词」改成「启动句」；第一次对话那一节的样品已在 #58 出，在 PR #70，等 #35 完成后并入这一页。\n\n2026-11-07 按[官网技能包发布：定稿后重打包、上传、给 URL 和 SHA256](https://github.com/Lil-BobCN/grilling-remote/issues/35) 更新：下载地址已给，补第 10 条。\n"
    },
    {
      "id": 35,
      "title": "官网技能包发布：定稿后重打包、上传、给 URL 和 SHA256",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-045"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/35",
      "labels": [
        "wayfinder:task"
      ],
      "body": "## Question\n\n客户在官网点的技能包下载，最终从哪个地址拿？谁在 #25、#27 定稿后重打包、上传、给校验值？\n\n## Type\n\nwayfinder:task，HITL（运营者发布）\n\n## Direct blockers\n\n[客户要看原型时在本机怎么出：单个 HTML 能不能撑住](https://github.com/Lil-BobCN/grilling-remote/issues/27)（`prototype/UI.md` 单文件版验证）、[客户包收尾：回传打包、五组技术题、原型口径、模板逐条审](https://github.com/Lil-BobCN/grilling-remote/issues/44)（改模板并重打包）、[实测客户提示词：小需求和其余的分流、跳步提醒、装配后要不要重开](https://github.com/Lil-BobCN/grilling-remote/issues/26)（实测可能让包再变）。[客户 AGENTS.md 里写什么：谁管什么、跳步怎么回应](https://github.com/Lil-BobCN/grilling-remote/issues/25)已于 2026-11-05 关闭。包源在 `customer-kit/`。2026-11-07 补 [按 #26 实测修客户规则：收尾 next、子代理复核、问题树分工](https://github.com/Lil-BobCN/grilling-remote/issues/95)：客户包规则改了，必须重打包。\n\n## Scope\n\n1. 等[客户包收尾：回传打包、五组技术题、原型口径、模板逐条审](https://github.com/Lil-BobCN/grilling-remote/issues/44)改完 `AGENTS.md`、`wayfinder/SKILL.md`、`docs/agents/issue-tracker.md` 三份文件、[客户要看原型时在本机怎么出：单个 HTML 能不能撑住](https://github.com/Lil-BobCN/grilling-remote/issues/27)定稿 `prototype/UI.md`、[实测客户提示词：小需求和其余的分流、跳步提醒、装配后要不要重开](https://github.com/Lil-BobCN/grilling-remote/issues/26)实测完成、[按 #26 实测修客户规则：收尾 next、子代理复核、问题树分工](https://github.com/Lil-BobCN/grilling-remote/issues/95)改完客户包规则后，重跑 `bash customer-kit/build.sh`，取新 zip 和 SHA256。不再用 #44 记录的旧 zip。把新的大小和 SHA256 写回那张票和[客户机安装实测：Windows、Intel Mac、默认 workspace-write](https://github.com/Lil-BobCN/grilling-remote/issues/36)。#95 之后必须重打包，以最后一次打包记录的 SHA256 为准。\n2. 把 `客户工作区-v1.zip` 和 `.sha256` 上传到官网，给出客户可点的 URL。包名从 `customer-kit/manifest.json` 的版本号读。\n3. 记录上传时间、文件大小、SHA256，写回本票和 #31。\n4. 确认 zip 里的 `README.txt`、`NOTICE.md`、`LICENSE`、`技能清单.md` 与源文件一致。`技能清单.md` 由构建生成，不在 git 里。\n\n不定：官网页面怎么排，归 #31。\n\n## Success condition\n\n1. 一个客户能直接下载的 URL。\n2. 一份 SHA256 和文件大小。\n3. #31 的下载按钮能直接用这个 URL。\n\n## Evidence\n\n- #23 结论：`customer-kit/dist/grilling-skills-v1.zip`，本地 34K，SHA256 见同目录 `.sha256`。（旧包名，已取代。现在包名是 `客户工作区-v1.zip`，见 [客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63)。）\n- #31 的 Direct blockers 写着要 #23 的“技能包地址”。\n- 2026-11-05 运营者定：等 #25、#27 定稿后统一上传。\n\n2026-11-06 按[客户包收尾：回传打包、五组技术题、原型口径、模板逐条审](https://github.com/Lil-BobCN/grilling-remote/issues/44)、[实测客户提示词：小需求和其余的分流、跳步提醒、装配后要不要重开](https://github.com/Lil-BobCN/grilling-remote/issues/26)更新：阻塞加上这两张票；上传的包取自前者记录的 zip，核对 SHA256 一致才上传。\n\n静态页放本仓库 `site/`，和 `manifest.json` 同源，部署到 #7 那台服务器。上传接收端点另开仓库。依据是 `docs/客户工作区方案.md` 第七节，方案还是草案。\n\n按 [客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63) 更新。\n\n\n\n2026-11-07 按 [客户澄清的问题树：题与题的依赖怎么存、怎么重算](https://github.com/Lil-BobCN/grilling-remote/issues/30) 更新：客户包 `AGENTS.md`、`.dsh/skills/grilling/SKILL.md`、`.dsh/skills/research/SKILL.md` 加问题树规则；重打包时一并，重算 SHA256。\n\n2026-11-07 按[客户包收尾：回传打包、五组技术题、原型口径、模板逐条审](https://github.com/Lil-BobCN/grilling-remote/issues/44)更新：本机的 `客户工作区-v1.zip` 只在 issue-44 工作树的 `customer-kit/dist/` 里，主仓库没有，该目录被 `.gitignore` 忽略。上传前不要清理这个工作树，也不要重打：同内容重打 SHA256 会变。上传的包以那张票末尾最后一条打包记录为准。\n\n2026-11-07 按 [按 #26 实测修客户规则：收尾 next、子代理复核、问题树分工](https://github.com/Lil-BobCN/grilling-remote/issues/95) 更新：Direct blockers 补 #95；客户包规则改了，Scope 第 1 项改成重跑 `build.sh` 取新 zip。\n"
    },
    {
      "id": 36,
      "title": "客户机安装实测：Windows、Intel Mac、默认 workspace-write",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/36",
      "labels": [
        "wayfinder:task"
      ],
      "body": "## Question\n\n客户技能包在 Windows、Intel Mac、客户机默认 `workspace-write` 沙箱下，能不能从空文件夹装到“可以粘贴下一条提示词”？\n\n## Type\n\nwayfinder:task，HITL（需要实机或虚拟机）\n\n## Direct blockers\n\n[客户包收尾：回传打包、五组技术题、原型口径、模板逐条审](https://github.com/Lil-BobCN/grilling-remote/issues/44)改完并重打包后再测。2026-11-07 [按 #26 实测修客户规则：收尾 next、子代理复核、问题树分工](https://github.com/Lil-BobCN/grilling-remote/issues/95) 改完客户包规则后再测。本机已打过一个 `客户工作区-v1.zip`，在 `customer-kit/dist/`，不进 git，以最后一次打包为准。[实测客户提示词：小需求和其余的分流、跳步提醒、装配后要不要重开](https://github.com/Lil-BobCN/grilling-remote/issues/26)也要先做完：那张票第 5 项测第一次打开的自检，本票要用同一个包。实测前用改完后的新包，核对 zip 的 SHA256 与最后一次打包记录一致。下载已按 #101 改为 no-cache，重复下载不会拿到旧包；SHA256 不一致按打包或上传问题查，不用清浏览器缓存。#44、#26 已关闭。包源在 `customer-kit/`。\n\n## Scope\n\n1. Windows 64 位：解压、路径、资源管理器/PowerShell 操作，用 dsh 打开后第一次自检。\n2. macOS Intel：与 Apple 芯片同一套步骤，确认 dmg 和路径。\n3. 客户机默认 `workspace-write`：不用 `danger-full-access`，看解压后第一次自检，以及建 `.scratch/` 写需求目录是否被拦。\n4. 失败分支：zip 缺失、解压失败、权限弹窗，以及隐藏目录 `.dsh` 看不到、中文路径、多套一层、没解压。\n5. 右键压缩整个工作区：Mac 和 Windows 是否带上隐藏的 `.scratch/` 和 `.dsh`，运营者解压后能否读到 `.scratch/`。\n6. 记录每项通过、失败或没测到，写回本票。\n\n不定：Linux，不支持。\n\n## Success condition\n\n一张结果表，覆盖三个环境；失败的写报错原文和要改的步骤。\n\n## Evidence\n\n- #23 测试记录：macOS Apple 芯片通过；Windows、Intel Mac、默认 `workspace-write` 未测。\n- #23 结论：测试时这台机器的 `sandbox-exec` 坏了，用了 `danger-full-access`。\n- 2026-11-05 运营者定：Windows 64 位、macOS 双芯片支持，Linux 不支持。\n\n2026-11-06 按[客户包收尾：回传打包、五组技术题、原型口径、模板逐条审](https://github.com/Lil-BobCN/grilling-remote/issues/44)、[实测客户提示词：小需求和其余的分流、跳步提醒、装配后要不要重开](https://github.com/Lil-BobCN/grilling-remote/issues/26)更新：阻塞改为等这两张票；本机没有现成的 zip，实测前核对 SHA256。\n\n按 [客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63) 更新。\n\n\n2026-11-07 按 [客户澄清的问题树：题与题的依赖怎么存、怎么重算](https://github.com/Lil-BobCN/grilling-remote/issues/30) 更新：测的客户包内容变了，用 #44 重打后的新包测；安装步骤不变。\n\n2026-11-07 按 [按 #26 实测修客户规则：收尾 next、子代理复核、问题树分工](https://github.com/Lil-BobCN/grilling-remote/issues/95) 更新：客户包规则改了，用 #95 后的新包；原生阻塞边补 #95。\n2026-11-07 按 [下载链接的浏览器缓存：4 小时要不要改成尊重源站](https://github.com/Lil-BobCN/grilling-remote/issues/101) 更新：下载已改为 no-cache，测试时不用清浏览器缓存。\n"
    },
    {
      "id": 39,
      "title": "客户工作区里 AGENTS.md、GLOSSARY.md、docs/agents/ 各归谁写，setup 会不会撞",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-022"
      ],
      "produces": [
        "M1-031"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/39",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n客户工作区同时有 `AGENTS.md`、`GLOSSARY.md`、`docs/agents/` 三处配置。执行 `setup-matt-pocock-skills` 时，谁写哪个文件？会不会互相覆盖，或者让客户侧 Agent 分不清规则放哪？\n\n## Type\n\nwayfinder:grilling，HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n要定四件事。\n\n1. 定一张文件归属表：`AGENTS.md`、`GLOSSARY.md`、`docs/agents/*`、`.scratch/` 各由谁写、谁读。\n2. 已作废，见 [客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63)：客户包不含 `setup-matt-pocock-skills`，`docs/agents/` 已预生成。原写：定客户 `AGENTS.md` 要不要加上游的 `## Agent skills` 指针块。上游 setup 会写这个块，客户模式现在跳过。\n3. 已作废，同上。原写：定 `setup-matt-pocock-skills` 客户模式的触发条件怎么改。现在只看有没有 `.git`；客户文件夹一旦有 `.git`，会走通用流程，往 `AGENTS.md` 写块。\n4. 定 `GLOSSARY.md` 放根目录还是 `.scratch/{简称}/`。`domain.md` 和模板现在都说根目录；一个需求一个目录时，根目录词表会把多个需求的词混在一起。同时写明词表只放词义，不放规则。\n\n## Success condition\n\n1. 一张归属表，四个文件各一行，写清谁写、谁读。\n2. 已作废，见 [客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63)：客户包不含 setup。 原写：客户模式在 `.git` 存在时也不碰 `AGENTS.md`。\n3. 一句话说明 `GLOSSARY.md` 和 `AGENTS.md` 的分工，以及词表放哪。\n4. 已作废，同上。 原写：客户 `AGENTS.md` 加不加 `## Agent skills` 块，有结论。\n\n## Evidence\n\n- `setup-matt-pocock-skills/SKILL.md` 客户模式第 4 条：不写 `AGENTS.md`，不写 `CLAUDE.md`。触发条件是“当前目录没有 `.git`”。\n- 上游 `setup-matt-pocock-skills` 仍把 `## Agent skills` 块写进 `CLAUDE.md` 或 `AGENTS.md`，优先 `CLAUDE.md`。上游仓库同时保留两份，内容一样。\n- `dsh` 的指令文件候选只有 `AGENTS.md` 和 `CLAUDE.md`，不注入 `GLOSSARY.md`。依据：`@deepseek-ai/dsh-agent-instructions` 的 `README.zh.md`。\n- `domain-modeling` 原文：`GLOSSARY.md` 只放词义，不放实现决定。\n- #25 已定客户侧只落澄清材料，不写 spec。\n\n本票改成确认票：客户包里 `AGENTS.md` 是成品，`docs/agents/` 预生成，没有 `setup`。运营者 2026-11-07 在 wrap-up 里认了这个方向。Scope 1（文件归属表）和 Scope 4（`GLOSSARY.md` 放哪）仍然开放。\n\n按 [客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63) 更新。\n\n"
    },
    {
      "id": 41,
      "title": "服务器复核：SSH、域名、HTTPS，含一次重启",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-029"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/41",
      "labels": [
        "wayfinder:task"
      ],
      "body": "## Question\n\n#7 开通的服务器、域名和 HTTPS，现在还能正常用吗？重启一次后能自己恢复吗？\n\n## Type\n\ntask / HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只做复核和一次重启。不部署应用，不改域名，不换证书。\n\n仓库是公开的。命令输出里的 IP、密钥、口令先遮掉再贴。服务器资料不进仓库，不写进本票。\n\n## Success condition\n\n下面四项都有命令输出或截图为证：\n\n1. SSH 能登录。\n2. 域名解析到服务器。\n3. HTTPS 证书有效。\n4. 重启一次后，前三项仍然正常。\n\n## Evidence\n\n- 运营者 2026-11-06 答复：接受重启一次，现在就可以测试。\n- 依据：#7 的成功条件，和 2026-11-06 交接稿的第 5 个未定项。\n"
    },
    {
      "id": 44,
      "title": "客户包收尾：回传打包、五组技术题、原型口径、模板逐条审",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-036"
      ],
      "covers": [
        2
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/44",
      "labels": [
        "wayfinder:task"
      ],
      "body": "## Question\n\n客户拿到 zip 以后，能不能按 `AGENTS.md` 一路走到打包回传？现在有四处没落进客户包。\n\n## Type\n\ntask / HITL（运营者审文字）\n\n## Direct blockers\n\nNone。原等的[客户工作区里 AGENTS.md、GLOSSARY.md、docs/agents/ 各归谁写，setup 会不会撞](https://github.com/Lil-BobCN/grilling-remote/issues/39)和[客户侧 map 的每张票怎么标类型和任务：写进索引，还是解票前先澄清](https://github.com/Lil-BobCN/grilling-remote/issues/55)都已关闭，词表结论已写进 Scope 7。发布归[官网技能包发布：定稿后重打包、上传、给 URL 和 SHA256](https://github.com/Lil-BobCN/grilling-remote/issues/35)，实测归[实测客户提示词：小需求和其余的分流、跳步提醒、装配后要不要重开](https://github.com/Lil-BobCN/grilling-remote/issues/26)，两者被本票挡着。\n\n## Scope\n\n1. 已作废，见 [客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63) 和 `docs/客户工作区方案.md` 第六节：回传改整个工作区，不写 `meta.json`。原写：回传打包。`AGENTS-TEMPLATE.md` 的「会话结尾」补四步：判断是否问完；写 `meta.json`；把 `.scratch/{简称}/` 和 `meta.json` 打成 `回传-{简称}-{日期}.zip`，放工作文件夹根目录；打开文件夹，给官网上传页链接。\n2. 已作废，同上，取消 `meta.json`。原写：`meta.json` 模板。字段写全：`schema`、简称、称呼、邮箱、类别、`complete`、`requirement_id`、文件清单、原型清单。旧的「档位」改成「类别：小需求 / 其余」，A、B、C 三档已退役。写清 `requirement_id` 首次由谁生成、之后不变，`complete` 怎么判。给出 zip 根目录布局。文件放 `customer-kit/package/`。\n3. 已在提交 53d538b 写进 `AGENTS.md`，PR 62 已于 2026-11-07 合并，没实测。原写：五组技术题。模板「技术题」一节写五组，每组一个例子：技术栈、部署环境、第三方服务与账号、数据与合规、花钱。技能里只留一句「判据见 AGENTS.md」。\n4. 已在提交 53d538b 统一：`AGENTS.md` 和 `wayfinder` 都写满 3 次仍坚持就照做，`ask-matt` 已删。没实测。原写：原型口径。模板写「满 3 次仍坚持，就照客户做，记一笔」。`wayfinder/SKILL.md` 写「坚持也不做」，`ask-matt/SKILL.md` 只写先劝。三处改成同一句。\n5. 已在提交 53d538b 改完，没实测。原写：模板正文逐条审。148 行、7500 字节，和 2026-11-06 已定的流程口径对一遍，一次改完。按 [客户侧 map 的每张票怎么标类型和任务：写进索引，还是解票前先澄清](https://github.com/Lil-BobCN/grilling-remote/issues/55) 的结论，另改七处：\n   - `AGENTS-TEMPLATE.md` 第 21 到 31 行：会话开头换成「我先说说这件事接下来会怎么走」那段。\n   - 第 45 到 63 行：分两类换成两个分支，小的说一句，大的说「已经确定需要拆分」那段。\n   - 第 65 到 71 行：补一句，新开对话说「继续」，Agent 自己接上。\n   - `wayfinder/SKILL.md`：地图六段（加「接下来」）、票正文骨架、读正文 `Type:` 行、Chart the map 的两段开场词、Work through the map 的开工第一句，四类票各给一句例句。\n   - `issue-tracker-local.md`：地图六段、子票骨架、选票按地图行序、四词对四类票写成四行表，不靠顺序。\n   - `AGENTS-TEMPLATE.md` 第 67 行：「一次对话最多解决一张票」后面补一句，第一次建图不算解票。\n   两段开场词和三件忌讳的原文见 `docs/客户侧流程样本.md`。\n6. 已做完（2026-11-07）。`build.sh` 和 `manifest.json` 已改，最后一次打包已跑，大小和 SHA256 见本票末尾最后一条打包记录。原写：重打包。改完跑 `bash customer-kit/build.sh`，把 zip 大小和 SHA256 写进本票。#35 拿去上传，#36 用新包实测。\n\n7. 词表和归属（按[客户工作区里 AGENTS.md、GLOSSARY.md、docs/agents/ 各归谁写，setup 会不会撞](https://github.com/Lil-BobCN/grilling-remote/issues/39)的结论）。\n   - `customer-kit/package/AGENTS.md` 第 112 行后加一句：词义表放根目录 `GLOSSARY.md`，一个工作区一份，只放词义，不放规则。第 203 行后加一句：词表不算旧文件，改词原地改，不加「已被第 N 张取代」，在改词的票里记一句。\n   - `customer-kit/package/docs/agents/domain.md`：删第 9 行的 `docs/adr/`，删布局里的 `docs/adr/`，补一句：本工作区不写 ADR，难回退的决定写进票的 `## 结论` 和地图 Decisions so far。\n   - `customer-kit/package/.dsh/skills/domain-modeling/SKILL.md`：第 3 行的 description 删掉「or recording or editing an ADR」；第 12 到 40 行的结构图加一句本工作区不建 `docs/adr/`；第 66 到 74 行的 ADR 段加一句本工作区不写 ADR。`ADR-FORMAT.md` 留着不删。\n   - `customer-kit/package/.dsh/skills/map-gate/SKILL.md` 第 14 行：读材料加根目录 `GLOSSARY.md`。第 20 行：文件矛盾说明补词表，和结论相反时问客户，改词原地改，不标废。\n   - `docs/客户工作区方案.md` 第 114 行补词表例外；第二节加一张四行归属表（谁写、谁读）。\n   - `docs/客户 AGENTS.md 设计说明.md` 第 96 行：把「词表和 ADR」改成「词表」，理由改成「有词义要定时用；本工作区不写 ADR」。\n   验收：`AGENTS.md` 能查到词表位置和改词规则各一句；`domain.md` 和 `设计说明` 里没有 `docs/adr/` 路径，ADR 字样只出现在「本工作区不写 ADR」这一句里；`domain-modeling` 的 description 和 ADR 段都写明本工作区不写；`map-gate` 读到词表；方案里有归属表。\n\n8. 问题树（2026-11-07 按 #30 新增）。客户侧 `grilling` 加一条登记规则：每轮提问前，把本轮问题写进 `.scratch/{需求名}/问题树.md`，状态 `未定`；客户答完或记进 `pending.md` 后，改 `当前结论` 和 `状态`。`AGENTS.md` 的进度文件一节加一行。`research` 票回答了一个题时，补登同一份文件。格式和字段见 `docs/adr/0007-问题树单独存一份.md`。运营者侧新增 `.claude/skills/question-tree/SKILL.md`，负责三堆视图和沿边重算；它不进客户包。 同步改五份文档：`docs/客户工作区方案.md`（第四节加问题树一段）、`docs/客户 AGENTS.md 设计说明.md`（客户侧产出表和规则表加问题树）、`docs/工厂流程.md`（C1 读问题树）、`docs/介入点.md`（补缺口看三堆）、`customer-kit/安装步骤.md`（客服带话后跑 `question-tree`）。\n\n## Success condition\n\n1. 已作废，见 [客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63)：回传改整个工作区，不写 `meta.json`。原写：模板里有回传打包四步和 `meta.json` 模板，zip 布局只有一种写法。\n2. 五组技术题在模板里能看到组名和例子。 已在提交 53d538b 做完，没实测。\n3. 原型第 3 次坚持后的动作，`AGENTS.md` 和 `wayfinder` 两处一致，`ask-matt` 已从客户包删除。原写：原型第 3 次坚持后的动作，模板、`wayfinder`、`ask-matt` 三处一致。\n4. 重打后的 zip 有大小和 SHA256，写进本票。已做，见本票末尾最后一条打包记录。\n5. 地图六段、票骨架、选票规则、两段开场词都进了文件，`wayfinder/SKILL.md` 里「读标签，不读正文」的旧话删干净。 已在提交 53d538b 做完，包内搜不到「读标签」，没实测。\n6. 第 7 项改完：`AGENTS.md` 有词表位置和改词规则；`domain.md`、`domain-modeling` 的 description、`设计说明` 都没有 ADR 指引；`map-gate` 读根目录词表；方案有归属表。\n\n7. 问题树规则落进客户包：`grilling/SKILL.md` 有登记规则；`AGENTS.md` 进度文件一节有 `问题树.md`；`research/SKILL.md` 有补登规则。运营者侧 `question-tree` 技能能读出三堆，改一条后能沿边重算。验收用一张模拟问题树跑一遍，不要求客户机实测。 五份文档也能搜到问题树，步骤和 `question-tree/SKILL.md` 一致，ADR 0007 已加取代行。\n\n## Evidence\n\n- 回传链断在第一棒：模板「会话结尾」只有改 `Status` 和提醒新开对话，没有打包、`meta.json`、上传链接（`customer-kit/package/AGENTS-TEMPLATE.md:33-43`）。\n- `customer-kit/` 里没有 `meta.json` 模板，zip 根目录布局有两种说法。\n- 五组技术题只写在 #22 评论，模板「技术题」一节没有（`:115-126`）。\n- 原型两处写法相反：模板 `:107-113` 说第 3 次照做，`wayfinder/SKILL.md:79` 说本次不做。\n- 模板 148 行、7500 字节，比旧记录多 5 行。\n- #23、#24、#25 已定稿并关闭，本票只落文字，不重开。\n\n2026-11-06 按[客户工作区里 AGENTS.md、GLOSSARY.md、docs/agents/ 各归谁写，setup 会不会撞](https://github.com/Lil-BobCN/grilling-remote/issues/39)更新：阻塞改为等它定完，再改模板并重打包。\n2026-11-06 按[客户侧 map 的每张票怎么标类型和任务：写进索引，还是解票前先澄清](https://github.com/Lil-BobCN/grilling-remote/issues/55)更新：新增阻塞，模板和技能文字等票型结论。\n\n2026-11-06 按[客户侧 map 的每张票怎么标类型和任务：写进索引，还是解票前先澄清](https://github.com/Lil-BobCN/grilling-remote/issues/55)更新：Scope 5 加了五处落点，Success condition 加第 5 条。\n\n2026-11-06 按[客户侧新旧结论并存怎么防：要不要把运营者的查漏流程带到客户模板](https://github.com/Lil-BobCN/grilling-remote/issues/53)更新：新增阻塞，开场词第三忌等它定完再写死。\n\n补一条：本票还等 [客户侧新旧结论并存怎么防：要不要把运营者的查漏流程带到客户模板](https://github.com/Lil-BobCN/grilling-remote/issues/53) 的结论，三个客户版技能是它的候选答案。[客户工作区里 AGENTS.md、GLOSSARY.md、docs/agents/ 各归谁写，setup 会不会撞](https://github.com/Lil-BobCN/grilling-remote/issues/39) 的 Scope 2、3 因 setup 不进包已不成立，等它缩小后，再判这条阻塞边要不要留。\n\n按 [客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63) 更新。\n\n2026-11-07 按[客户工作区里 AGENTS.md、GLOSSARY.md、docs/agents/ 各归谁写，setup 会不会撞](https://github.com/Lil-BobCN/grilling-remote/issues/39)更新：新增 Scope 7 和 Success condition 6；Direct blockers 清空。原文里的 setup 相关前提按[客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63)已废。\n\n2026-11-07 按 [客户澄清的问题树：题与题的依赖怎么存、怎么重算](https://github.com/Lil-BobCN/grilling-remote/issues/30) 更新：新增 Scope 第 8 项和 Success condition 第 7 条。\n\n2026-11-07 按 #30 的 wrap-up 更新：Scope 第 8 项补五份文档，Success condition 第 7 条补文档验收。\n\n2026-11-07 按本票会话里运营者的决定更新：Scope 7 的验收改为 `domain.md` 和 `设计说明` 里没有 `docs/adr/` 路径，ADR 字样只出现在「本工作区不写 ADR」这一句里。\n\n2026-11-07 最后一次打包记录（按 Scope 第 6 项）：`customer-kit/dist/客户工作区-v1.zip`，43662 字节，33 个文件，SHA256 `f8d183255305c6f6dfb65ee6f282a71c14024a8668c5d5c46f468fc3ebf59f41`。已查：`shasum -a 256 -c` 通过，`unzip -t` 无错，包内没有 `question-tree`、`ask-matt`、`docs/adr`，包内 `AGENTS.md` 与源文件逐字节一致。没在客户机上装过。\n\n用这个包要注意两点。一，它是用本地未提交的文件打的，`customer-kit/dist/` 在 `.gitignore` 里，zip 只在这台机器的这个工作树里；[官网技能包发布：定稿后重打包、上传、给 URL 和 SHA256](https://github.com/Lil-BobCN/grilling-remote/issues/35) 要上传，就用这个文件，不要重打。二，同样内容重打，SHA256 会变：本次和更早一次验证打包都是 43662 字节，两次之间包内文件没改，SHA256 却不同。合理推测是 zip 里带文件时间，没验证。\n\n2026-11-07 更正并更新打包记录。上一条记录（43662 字节，SHA256 `f8d18325…`）作废：之后改了 `customer-kit/manifest.json` 和 `customer-kit/package/AGENTS.md`，去掉 `domain-modeling` 的「难改的决定」，包已重打。\n\n另更正上一条里「两次之间包内文件没改」：`build.sh` 每次都重写 `技能清单.md`，这次包内它的时间戳是 12:58:36，晚于 `AGENTS.md` 的 12:57:30，是打包时刻，所以内容相同的重打 SHA256 也会变。这是从时间戳推出来的，没有拿两个 zip 逐字节比对。\n\n最后一次打包：`customer-kit/dist/客户工作区-v1.zip`，43625 字节，33 个文件，SHA256 `9fedd60ae0bef8318c64d10e2537e35284be2d96fdf9d691d24a5f372ef1cc78`。已查：`shasum -a 256 -c` 通过，`unzip -t` 无错，包内没有 `question-tree`、`ask-matt`、`docs/adr`，包内 `AGENTS.md` 与源文件一致，包内 `技能清单.md` 含「写进词表」，包内文本里搜不到「难改的决定」。没在客户机上装过。\n\nzip 仍只在 issue-44 工作树的 `customer-kit/dist/`，被 `.gitignore` 忽略，改动也都没提交。上传以这条为准，不要重打。此后再改包内任何文件，这个 SHA256 就作废。\n"
    },
    {
      "id": 45,
      "title": "工单模型落地：客户仓 Issue 模板、四档状态、改口追加",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-038"
      ],
      "covers": [
        2
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/45",
      "labels": [
        "wayfinder:task"
      ],
      "body": "## Question\n\n#5 已定：一客户一仓；一需求 = 一个 Issue 加一条分支加一个 worktree；需求书、验收条件进 Issue；四档状态由标签驱动，只有调度器能写。这些规则还停在评论里，没有模板、没有标签表、没有迁移规则。本票把它们写成可执行的契约，并手工演练一遍。\n\n客户网页已取消（ADR 0001：网站只放教程和提示词）。四档状态只给调度器和运营者看，不做网页映射。\n\n## Type\n\ntask / HITL（运营者点模板和标签）\n\n## Direct blockers\n\n无。\n\n## Scope\n\n1. Issue 模板。父工单正文五段：客户原话、客户确认的结论（小需求取自 `需求草稿.md` 的「已经定下的」，其余取自 `map.md` 的 Decisions）、验收条件、不做清单、需求全文链接。子票正文：垂直切片、验收条件、阻塞边。\n2. 四档状态标签：`状态:已提交`、`状态:排队中`、`状态:开发中`、`状态:待验收`。写清每档谁写、什么时候写。只有调度器能改。\n3. 迁移：提交 → 排队 → 开发 → 待验收。客户驳回 → 回开发中，另开分支修，不重开单。\n4. 客户改口：追加评论并改验收条件，不新建 Issue。旧验收条件在评论里留档。\n5. 落文件：`docs/工单模型.md` 写模板、标签表、迁移表；`docs/工厂流程.md` 的建仓建单一节加指针。\n6. 手工演练：在一个测试客户仓建一张父单、两张子票，走完提交到驳回的迁移，记下 `gh` 命令和结果。\n\n## Success condition\n\n1. `docs/工单模型.md` 能让人不开 #5 就建出合规的父单和子票。\n2. 四个标签在测试仓建好，颜色和说明写进文档。\n3. 演练记录覆盖：提交、排队、开发、待验收、驳回、回开发中。\n4. `docs/工厂流程.md` 能查到这套映射。\n\n## Evidence\n\n- #5 结论（2026-11-01）：一客户一仓；一需求 = 一个 Issue 加一条分支加一个 worktree；四档状态全由标签驱动，只有调度器能写；驳回不重开单。\n- `docs/工厂流程.md:302-304` 已写建仓建单的顺序和父单正文，但没有模板、标签名和迁移规则。\n- 仓库里没有 `.github/ISSUE_TEMPLATE/`，也没有状态标签表。\n\n2026-11-06 按运营者流程口径更新：客户看不到工单；确认单不单独出，见[客户 AGENTS.md 里写什么：谁管什么、跳步怎么回应](https://github.com/Lil-BobCN/grilling-remote/issues/25)。\n"
    },
    {
      "id": 52,
      "title": "客户交完之后怎么知道进度：谁、用什么方式、在哪几个节点告诉客户",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-023"
      ],
      "produces": [
        "M1-050"
      ],
      "covers": [
        2,
        4
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/52",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n客户上传回传包之后、成品交付之前，谁、用什么方式、在哪几个节点告诉客户订单走到哪了？客户看不到工单，也没有网页。\n\n## Type\n\nwayfinder:grilling，HITL\n\n## Direct blockers\n\n无。\n\n## Scope\n\n要定四件事。\n\n1. 哪几个节点要告诉客户。例如上传成功、拆票点头、开工、待验收。\n2. 谁来说。运营者本人，还是人工客服带话。\n3. 用什么方式。微信、邮件，还是别的。客服带话已有微信为主、电话兜底的通道，见 [客户 AGENTS.md 里写什么：谁管什么、跳步怎么回应](https://github.com/Lil-BobCN/grilling-remote/issues/25)。那条通道的用途是补问业务事实，不是通报进度。\n4. 说什么。是否只说「收到了」「在做」「请你试用」三类，不给报错原文。\n\n不做：本票不做实现，进度模块另票。客户读不到工单。\n\n## Success condition\n\n1. 一张表：节点、谁说、用什么方式、说什么。\n2. `to-spec` 做回传和交付这一块时，不用再自己编一个通知方式。\n3. `docs/工厂流程.md` 里「客户怎么收到进度」那几处待定，改成指向本票的结论。\n\n## Evidence\n\n- `docs/工厂流程.md` 第 84、296 行原来把这件事标成待定，现在改成指向本票结论；第 620、713 行的待定已删。旧文曾指给 [客户 AGENTS.md 里写什么：谁管什么、跳步怎么回应](https://github.com/Lil-BobCN/grilling-remote/issues/25) 和 [客户本机的进度文件怎么回到我们这里](https://github.com/Lil-BobCN/grilling-remote/issues/24)，两张票已关闭，评论里都没有进度的答案。\n- [教程页做成什么样：五步安装、截图和两条提示词怎么放](https://github.com/Lil-BobCN/grilling-remote/issues/31) 的评论：教程页写到上传成功、等我们联系为止。没说谁联系、怎么联系。\n- [工单模型落地：客户仓 Issue 模板、四档状态、改口追加](https://github.com/Lil-BobCN/grilling-remote/issues/45)：四档状态只给调度器和运营者看。\n- 运营者 2026-11-06 的流程口径：客户读不到客户仓的工单；验收后成品部署好，回传给客户测。\n\n2026-11-07 按本票结论更新。\n"
    },
    {
      "id": 53,
      "title": "客户侧新旧结论并存怎么防：要不要把运营者的查漏流程带到客户模板",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-026",
        "M1-036"
      ],
      "produces": [
        "M1-027"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/53",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n客户在本机用 `wayfinder` 澄清时，新结论可能推翻已有结论，新旧结论会并存。客户的工程水平可能不如运营者。客户侧要不要防这件事，防到什么程度？\n\n## Type\n\nwayfinder:grilling，HITL\n\n## Direct blockers\n\n无。\n\n## Scope\n\n要定三件事。\n\n1. 要不要在客户侧防新旧结论并存。回传后运营者本来就跑 `/map-gate`，能抓到客户侧漏的，但判断的工作量全在运营者一边。\n2. 防到什么程度。三种做法：不加；只在模板「写结论前查漏」一节补一条，让子代理再列「这次结论推翻了哪些已有结论」；把运营者那套对账、读全图、逐条判的流程整套搬到客户侧。\n3. 放在哪。放进 `AGENTS.md`（每个新会话都会读），放进技能，还是放进提示词。\n\n不定：具体选哪种。下面的草稿只是备选，不是结论。\n\n## Success condition\n\n1. 三种做法选定一种，写明理由。\n2. 选了要加的，给出落进模板或技能的具体文字，写明改哪份文件、谁来改。\n\n## Evidence\n\n- 模板「写结论前查漏」一节（`customer-kit/package/AGENTS-TEMPLATE.md` 第 134 到 141 行）现在查的是该新增、该改、该合并、该删的票，和客户说过但没记下的话。没有「这次结论推翻了哪些已有结论」这一项。模板里也没有「旧结论标已废」的写法（搜「推翻」「已废」「索引行」没有结果）。\n- [客户 AGENTS.md 里写什么：谁管什么、跳步怎么回应](https://github.com/Lil-BobCN/grilling-remote/issues/25) 的 Evidence：`dsh` 注入 `AGENTS.md` 时写明不覆盖用户的直接指令，只能提醒，拦不住。上下文压缩后 `AGENTS.md` 还在不在，没验证。\n- `AGENTS.md` 越长，agent 漏做的可能越大。这是推测，[实测客户提示词：小需求和其余的分流、跳步提醒、装配后要不要重开](https://github.com/Lil-BobCN/grilling-remote/issues/26) 没有测这一项。\n- 模板逐条审归 [客户包收尾：回传打包、五组技术题、原型口径、模板逐条审](https://github.com/Lil-BobCN/grilling-remote/issues/44) 的 Scope 5。本票有结论后再并进去。两张票之间要不要挂阻塞边，等本票有结论再看。\n\n## 备选草稿（只对应第二种做法，未采纳）\n\n走 `wayfinder` 时，让子代理再列：这次结论推翻了哪些已有结论。旧结论在 `map.md` 的索引行标「已废，见 `issues/NN-*.md`」。还依赖旧前提的开放票，改掉或记下来。\n\n2026-11-06 按[客户侧 map 的每张票怎么标类型和任务：写进索引，还是解票前先澄清](https://github.com/Lil-BobCN/grilling-remote/issues/55)更新：客户侧开场词第二段第三忌已经对客户许诺「要改就说，我去改当初那一张，在地图上记一笔，不在新议题里悄悄改」。这几句先写了做法。本票结论要能兑现它，或者推翻后回改开场词；两句不能并存。开场词原文见 `docs/客户侧流程样本.md`。\n"
    },
    {
      "id": 55,
      "title": "客户侧 map 的每张票怎么标类型和任务：写进索引，还是解票前先澄清",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-026"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/55",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n客户在本机用 wayfinder 澄清时，一张票的类型（Task、Research、Grilling、Prototype）和它要解决的任务，怎么让 agent 和客户一眼看到？是写进 `map.md` 的索引行和票正文，还是 agent 拿到票后先澄清这两件事？\n\n## Type\n\nwayfinder:grilling，HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n1. 两种做法选一种或组合：`map.md` 索引行和票正文标明类型与一句话任务；或解票第一步先复述类型和任务，等客户确认。\n2. 写进哪份文件：客户侧 `wayfinder/SKILL.md`、`issue-tracker-local.md`、`AGENTS.md` 模板，还是 `map.md` 格式。\n3. 接上现有写法。客户侧没有 GitHub 标签，类型只能落在票正文的 `Type:` 行；`wayfinder/SKILL.md` 现在却让 agent「读标签，不要读正文」，和本地 Markdown 的写法对不上。\n4. `map.md` 现在只有五段，没有开放票清单。选「map 上标」时，要定加一段索引还是只改票正文；选「开场澄清」时，要定 agent 怎么读 `Type:` 行。\n5. 用一张现有客户侧票做例子，写出改后的样子。\n6. 结论的去处：并进「客户包收尾」的模板和客户侧 wayfinder 技能文字。新票挡住「客户包收尾」，等结论定完再动。\n\n不定：具体措辞。\n\n## Success condition\n\n1. 选定做法，写明理由。\n2. 给出客户侧 `map.md` 索引行和票正文的模板文字，或 agent 开场澄清的具体问法。\n3. 说明改哪份文件、谁来改。\n\n## Evidence\n\n- 2026-11-06 运营者原话：「一个 Map 里面会有四个票据……四种类型……每个代表不同的含义。我觉得吧，在给客户的这些 Skills 里面，要不就在 Map 里面标注出来，这个票据是一是什么类型，二它要解决的任务到底是什么。要么呢，就是在解决票的时候，第一步先澄清这个 Issue……是属于哪个类型，接下来的任务是什么。」\n- `customer-kit/package/skills/wayfinder/SKILL.md` 的票正文模板只写 `## Question`，第 66 行说每张票带 `wayfinder:<type>` 标签，第 125 行说「读标签，不要读正文，正文从不写类型」。\n- 但客户侧 `customer-kit/package/skills/setup-matt-pocock-skills/issue-tracker-local.md` 的「Wayfinder 用法」写的是：票正文 `Type:` 行写 `research`、`prototype`、`grilling`、`task` 之一，没有 GitHub 标签。两处对不上。\n- `customer-kit/package/skills/wayfinder/SKILL.md` 第 30 行：开放票不列在地图上，靠查询子票找。客户侧没有查询工具，`map.md` 只有 Destination、Notes、Decisions so far、Not yet specified、Out of scope 五段，没有开放票清单。\n- `customer-kit/package/AGENTS-TEMPLATE.md` 的进度文件一节只写 `map.md` 和 `issues/NN-*.md`，没写票类型或开放票清单怎么呈现。\n"
    },
    {
      "id": 58,
      "title": "教程页加一节：客户第一次对话会遇到什么",
      "type": "prototype",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-025",
        "M1-046"
      ],
      "produces": [
        "M1-032"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/58",
      "labels": [
        "wayfinder:prototype"
      ],
      "body": "## Question\n\n客户装好技能、粘贴提示词②之后，怎么让他提前知道第一次对话会发生什么？教程页要加一节讲这件事：讲哪几步、配图还是文字、和 Agent 开场说的话怎么保持一致。\n\n## Type\n\nwayfinder:prototype，HITL\n\n## Direct blockers\n\n无。落点是 [教程页做成什么样：五步安装、截图和两条提示词怎么放](https://github.com/Lil-BobCN/grilling-remote/issues/31)，本票出的样品再并进那一页。\n\n## Scope\n\n要定四件事。\n\n1. 位置。放在教程页哪一屏：提示词②之前还是之后；和上传页那一步的先后。\n2. 内容。第一次对话的六步：Agent 讲流程、客户说想法、判断大小、定终点、拆成票、给清单定顺序。还有「每次新对话复制收尾给的一行，形如继续：需求名 编号 票名」和三条忌讳。哪几步客户要看，哪几步可以略过。\n3. 形式。流程图、分块文字、还是对照表；要不要配一张 dsh 窗口示意图。\n4. 口径一致。教程写的和 Agent 开场说的要一样。两边以 `docs/客户侧流程样本.md` 为准；那边改，这边跟着改。\n\n不写：技能名、命令、时间承诺、价格承诺。\n\n## Success condition\n\n1. 一份能打开看的样品，可以是单个 HTML 或 Markdown，单独一节。\n2. 运营者从头读一遍，能说出「第一次对话分几步、我每次要做什么」。\n3. 和开场词逐句对齐，没有两套说法。\n\n## Evidence\n\n- 运营者 2026-11-06 原话：「直接把整个教程复制给他，我这个教程指的是就是如何让他明白 wayfinder 该怎么使用。」\n- 开场词两段、第一次对话的流程：`docs/客户侧流程样本.md`。\n- 教程页现有范围只到「粘贴提示词②」和上传页入口，见 [教程页做成什么样：五步安装、截图和两条提示词怎么放](https://github.com/Lil-BobCN/grilling-remote/issues/31) 的 Scope。\n- 本票只出这一节的内容样品，不重做整页。\n\n补一条：入口句只剩「开始需求澄清」。第一次打开时 Agent 先自检，缺文件就停下，不问需求，这一步客户会遇到，教程要写。收尾的固定句由 `next` 输出，教程和它保持一致。\n\n按 [客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63) 更新。\n"
    },
    {
      "id": 63,
      "title": "客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-036"
      ],
      "produces": [
        "M1-028"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/63",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "官网改发摆好的工作区 zip，回传改整个工作区。本票取代 [客户本机怎么装：技能包放哪、装配提示词、客服怎么带](https://github.com/Lil-BobCN/grilling-remote/issues/23) 和 [客户本机的进度文件怎么回到我们这里](https://github.com/Lil-BobCN/grilling-remote/issues/24) 里已被推翻的部分。\n\n## Question\n\n客户包从「提示词①装配」改成「预装工作区 zip」之后，装配和回传两处旧决定怎么处理？\n\n## Type\n\nwayfinder:grilling，HITL\n\n## Direct blockers\n\n无。\n\n## 结论\n\n依据和逐题问答在 `docs/客户工作区方案.md`。方案状态是草案，运营者 2026-11-07 在 wrap-up 里认了新建本票。\n\n1. 官网发一个摆好的工作区 zip，根目录直接是工作区。客户解压后用 dsh 打开，说「开始需求澄清」。没有提示词①，第一次打开由 `AGENTS.md` 自检。\n2. 回传范围改成整个工作区。客户压缩整个文件夹上传，取消 `meta.json`。上传页填客户简称和邮箱，勾「已问完」，并提示文件夹里的所有文件都会上传。\n3. 对话记录在 `~/.dsh/sessions/`，不在工作区里，v1 不回传。\n4. 新开对话的触发语改成「继续：需求名 编号 票名」。固定收尾句由 `next` 输出。\n5. 「简称」分成两个词。上传页填客户简称，工作区里的目录叫需求名。方案第十二节把这一条记为合理推测。\n6. v1 不做升级。每单下载当时的最新版，新单开新文件夹。\n\n## 取代了什么\n\n| 旧决定 | 现在 |\n| --- | --- |\n| [客户本机怎么装：技能包放哪、装配提示词、客服怎么带](https://github.com/Lil-BobCN/grilling-remote/issues/23)：提示词①解压、装八个技能、写 `AGENTS.md` | 预装。九个技能，`setup` 和 `ask-matt` 不进包 |\n| [客户本机的进度文件怎么回到我们这里](https://github.com/Lil-BobCN/grilling-remote/issues/24)：回传 `.scratch/{简称}/` 加 `meta.json` | 整个工作区，没有 `meta.json` |\n| `docs/adr/0003-回传走官网上传页.md`、`docs/adr/0004-客户规则放-agents-文件.md` | 原文不动，开头加取代说明 |\n\n## Evidence\n\n- `docs/客户工作区方案.md` 第一、二、六、十一、十三节。\n- 实现在 [PR 62](https://github.com/Lil-BobCN/grilling-remote/pull/62)，提交 `53d538b`。没有在 dsh 里实测。\n"
    },
    {
      "id": 72,
      "title": "服务器运维：操作手册、例行检查、闲置凭据",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-030"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/72",
      "labels": [
        "wayfinder:task"
      ],
      "body": "## Question\n\n这台服务器的运维知识（谁能登录、怎么复核、时钟、证书续期、备份、两把密钥）现在只在对话里。怎么收敛成一份可查的手册，并把欠账补上？\n\n## Type\n\ntask / HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只碰这台机器：写手册、修时钟、定备份做法、处置两把密钥、定 agent 怎么拿受限权限。不部署应用，不改域名，不换证书，不碰客户数据。\n\n手册进仓库，但不写 IP、域名、密钥内容，只写路径、类型和命令。\n\n## Success condition\n\n1. `docs/服务器操作手册.md` 存在，至少含：身份与权限、复核命令、服务清单、重启后的预期、凭据清单。\n2. `NTPSynchronized` 为 yes。\n3. 备份有结论：要么有任务且最近一次成功，要么手册写明「不做备份」和理由。\n4. 两把密钥处置完，留哪把写进手册。\n5. agent 拿受限权限的方式选定：NOPASSWD 白名单、独立 ops 账号、或每次人工输入，写进手册。\n\n## Evidence\n\n- #41 的复核评论：2026-11-07 实测，`dev` 可登录，root 密钥登录被拒，两把密钥都有效，`/data` 挂在 vdb1 但为空，无备份，时钟未同步。\n- 复核口径的坑：本机 DNS 被代理接管（返回 `198.18.0.51`），DNS 必须走公共 DoH，HTTPS 必须 `--resolve` 直连真实 IP，否则会误判成域名坏了。\n- `output/gap-audit` 的 F-S23-13（手册只存在于交接稿）和 F-S06-14（第二把密钥删还是留）。\n"
    },
    {
      "id": 73,
      "title": "官网和回传服务放哪：还用这台，还是另开",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-034"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/73",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n官网页面和回传上传页跑在哪？现在这台机器只回 `ok`，官网没地方放，发布和教程页两张票都卡在这。\n\n## Type\n\ngrilling / HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只定位置和边界：放哪台机器、谁维护、域名怎么分。不写页面代码，不定设计，不配上传端点。\n\n## Success condition\n\n一句话能回答：官网和上传页分别跑在哪个地址，谁来发布；现有这台服务器保留还是退掉。\n\n## Evidence\n\n- #41 复核：这台机器现在只跑 caddy，返回 `ok`，没有站点，80G 数据盘空着。\n- 地图下「官网技能包发布」需要 URL 才能发，「教程页做成什么样」等它。\n- `docs/客户工作区方案.md` 第六节提到官网代码不在本仓库。\n"
    },
    {
      "id": 78,
      "title": "服务器清理：移除 Claude Code 和中转站配置",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-035"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/78",
      "labels": [
        "wayfinder:task"
      ],
      "body": "## Question\n\n这台机器要放官网和上传服务。机器上还留着 Claude Code 和中转站配置，和「只做托管」的边界冲突。怎么清掉，并确认没有常驻 agent？\n\n## Type\n\ntask / HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只碰这台机器上的 agent 身份：\n\n- 移除 Claude Code 和中转站配置。\n- 确认没有常驻 agent 进程或服务。\n- 保留 #72 的 `dev` 用户、sudo 四命令白名单和一把密钥，用于运维。\n- 不部署应用，不改域名和证书，不碰客户数据。\n- 两把密钥的处置已归 #72，本票不重做。\n- 清理后把 Node 26 和清理结果补进 `docs/服务器操作手册.md` 的服务清单。\n\n手册和命令输出不写 IP、域名、密钥内容，只写路径、类型和命令。\n\n## Success condition\n\n1. 机器上找不到 Claude Code 和中转站配置。\n2. 没有常驻 agent 进程或服务。\n3. `dev` 用户和 sudo 四命令白名单仍在；`dev-hk-server` 仍是唯一密钥。\n4. 清理命令和脱敏后的输出贴在票里。\n5. #72 的手册能引用本票的结果。\n\n## Evidence\n\n- #73 的结论：机器只做托管；上传服务用独立用户，token 只给该用户。\n- #72 的结论：`dev` 加 sudo 四命令白名单；只留一把密钥；不做备份。手册已合进 main（PR #77），服务清单只列了 caddy、timesyncd、ssh、unattended-upgrades，漏了 Node、Claude Code 和中转站；清理后一并补。\n- 本地审计记录 F-S11-02、F-S11-03：记录说只装了 caddy，实际有 Node 26、Claude Code 2.1.317、中转站配置和 ufw。`output/gap-audit` 不在本仓库。\n- #41 复核只测了 SSH、DNS、HTTPS、重启，没列服务。\n\n## 做法（HITL，运营者执行）\n\n1. `systemctl list-units --type=service --state=running`，确认没有 agent 服务。\n2. `ps aux | grep -Ei 'claude|relay'`，确认没有进程。\n3. `ls -la ~/.claude`，`cat ~/.claude/settings.json`，找出中转站配置；不贴密钥。\n4. 卸载 Claude Code，删 `~/.claude` 里的中转站配置；要留证据先拷到本机 `private/`。\n5. `ufw status` 确认没多开端口；Node 26 保留，上传服务要用。\n6. 把命令和脱敏输出贴回本票。\n\n## 不做\n\n- 不碰 #72 的 sudo 白名单、`dev` 用户和密钥。\n- 不部署上传服务，不配 Caddy，不改 DNS。\n"
    },
    {
      "id": 80,
      "title": "文档修正：服务器现状、Claude Code 已验、官网代码位置",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-047"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/80",
      "labels": [
        "wayfinder:task"
      ],
      "body": "## Question\n\n#73 和 #72 收尾后，仓库里还有三处说法和现状不符：服务器现状、Claude Code 的已验记录、官网代码位置。怎么一次改完，并等 #78 的结果补手册服务清单？\n\n## Type\n\ntask / AFK\n\n## Direct blockers\n\nNone。#78 已关，手册服务清单的清理结果可以写了。\n\n## Scope\n\n1. ~~`docs/工厂流程.md:699`：「服务器上只装了 caddy，没部署应用」改成「caddy、Node 26、ufw；Claude Code 和中转站按 #78 移除」。~~ 已在 [PR #83](https://github.com/Lil-BobCN/grilling-remote/pull/83) 做完，提交 `fd5a5eb`。写的是「caddy 和 node 26，没部署应用；防火墙只放 22、80、443，云安全组待核（见 #84）」，另补了「旧 agent 已清」。\n2. ~~`docs/工厂流程.md:616`：「服务器上的 Claude Code 能完成只读检查这类真实任务」加注「2026-11-07 按 #78 移除」，保留历史。~~ 已在 [PR #79](https://github.com/Lil-BobCN/grilling-remote/pull/79) 做完，提交 `aa79500`。\n3. `docs/客户工作区方案.md:266`：「官网代码和官网技能清单的来源，仓库里没找到」改成「官网静态页按第七节放本仓库 `site/`，还没写；技能清单来源是 `customer-kit/manifest.json`」。\n4. `docs/服务器操作手册.md` 服务清单：~~加 `ufw`~~ 已加（[PR #83](https://github.com/Lil-BobCN/grilling-remote/pull/83)）。剩下：补 Node 26；#78 关后写「Claude Code 和中转站已移除」；删「其余是 Ubuntu 默认带的，没配过」。\n5. `docs/工厂流程.md:62`「不跑 agent」不改；#78 做完后自然一致。\n\n不碰代码、票、服务器。改完走一个 docs PR。\n\n## Success condition\n\n1. 第 3 条改完，措辞和 #73 的结论不冲突；第 1、2 条已完成，验收时一起看。\n2. `docs/服务器操作手册.md` 有 Node 26；#78 关后有「Claude Code 和中转站已移除」，不再写「没配过」。\n3. `docs/工厂流程.md:62` 保持原样，PR 说明里写「等 #78 后自然一致」。\n4. 一个 PR，运营者能照着 diff 看。\n\n## Evidence\n\n- #73 的结论：机器只做托管；官网静态页在本仓库 `site/`；清旧 agent 另开 #78。\n- #78 的范围和评论：清 Claude Code 和中转站；手册服务清单的修法从 #78 移到这里。\n- #72 的手册 `docs/服务器操作手册.md` 已合进 main；服务清单只有 caddy、timesyncd、ssh、unattended-upgrades，漏了 Node、Claude Code、中转站。\n- #41 复核只测了 SSH、DNS、HTTPS、重启，没列服务。\n\n按 [服务器清理](https://github.com/Lil-BobCN/grilling-remote/issues/78) 更新。\n"
    },
    {
      "id": 81,
      "title": "Cloudflare 代理和防护：域名现在开没开，v1 要不要开",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-037"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/81",
      "labels": [
        "wayfinder:task"
      ],
      "body": "## Question\n\n我们自己的域名现在到底有没有 Cloudflare 的代理和防护？v1 要不要开？开了 Caddy 的证书怎么办？\n\n## Type\n\ntask / HITL（运营者在 Cloudflare 控制台查）\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只查和决定，不改：\n\n- 查这个域的 A 记录是橙色云（代理）还是灰色云（只 DNS）。\n- 查有没有 WAF、安全规则、Bot 防护、SSL/TLS 模式。\n- 查现在的证书是不是 Caddy 直接向 Let's Encrypt 申请的；代理开了会不会影响续期。\n- 决定 v1 开不开；要开就写清 Caddy 改 DNS-01 或换源站证书的步骤，另开实现票。\n\n不改 DNS、TLS、Cloudflare 设置；不碰服务器。账号信息、IP、域名不写进公开票，只写结论。\n\n## Success condition\n\n1. 一句话：域名现在是不是 Cloudflare 代理，有没有 WAF/安全规则，SSL/TLS 是什么模式。\n2. 一句话：v1 开不开代理；要开，Caddy 的证书方案是什么。\n3. 结论和依据写在票里；需要改的设置另开票。\n\n## Evidence\n\n- #73 的结论：v1 代理先关；以后要开再单说。这张票就是「再单说」。\n- #7 的记录：2026-11-03 在 Cloudflare 买域名、加 A 记录，代理关闭；#41 复核 Caddy 的 Let's Encrypt 证书有效。\n- 运营者 2026-11-07：「不知道做没做防护」。\n"
    },
    {
      "id": 84,
      "title": "服务器：核对云安全组放行，和 ufw 对一遍",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-040"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/84",
      "labels": [
        "wayfinder:task"
      ],
      "body": "## Question\n\n云控制台的安全组现在实际放行哪些端口？和机器上的 `ufw` 对得上吗？\n\n## Type\n\ntask / HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只核这一台机器：读云控制台的安全组入站规则，和 `sudo ufw status verbose` 对一遍。不改规则，发现多余放行先报给运营者。云控制台的账号由运营者持有。\n\n## Success condition\n\n1. 安全组的入站规则列出来，写清端口和来源。\n2. 和 ufw 的 22、80、443 逐条比对，结论写成「一致」或列出差集。\n3. 结论写进 `docs/服务器操作手册.md` 的防火墙一节。\n\n## Evidence\n\n- #78 实测：`ufw` 默认拒绝入站，只放行 22、80、443，IPv4 和 IPv6 各一套。\n- #41 复核留了一条没验：「防火墙或云安全组是否放行 22」。\n- 手册第二节只写了机器上的 `ufw`，云侧没写。\n\n\n## 开工核对（2026-11-07）\n\n按 [Cloudflare 代理和防护：域名现在开没开，v1 要不要开](https://github.com/Lil-BobCN/grilling-remote/issues/81) 更新：v1 要开 Cloudflare 代理，源站换 Origin CA，SSL 调 strict。核实时把 80、443 的来源一起记下来，看是不是 `0.0.0.0/0`。收窄来源的动作归 [开 Cloudflare 代理：源站换 Origin CA 证书、SSL 调 strict、补 WAF 和限速](https://github.com/Lil-BobCN/grilling-remote/issues/88)，本票不改规则。\n\n另：服务器只有 IPv4 路由（手册第六节），IPv6 那套规则实际用不上，但要确认有没有配。\n"
    },
    {
      "id": 88,
      "title": "开 Cloudflare 代理：源站换 Origin CA 证书、SSL 调 strict、补 WAF 和限速",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-039"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/88",
      "labels": [
        "wayfinder:task"
      ],
      "body": "## Question\n\n把代理开起来，并且开完不留坑：源站证书、SSL 模式、真实访客 IP、上传体积上限、WAF 和限速，一次配齐并验证。\n\n## Type\n\ntask / HITL（cf 登录要运营者在浏览器点一次同意；其余步骤 agent 可做）\n\n## Direct blockers\n\nNone\n\n## Scope\n\n域名、地址、密钥位置见本地 `private/服务器.md`，票里不写。\n\n1. 服务器上生成私钥和 CSR，域名加一级通配。私钥留在 `/etc/caddy/certs/`，不进仓库、不外传。\n2. 用 `cf ssl origin-ca-certificates create` 签一张 15 年 Origin CA 证书，`origin.pem` 写回服务器。cf 令牌没这个权限就在控制台签，CSR 一样。\n3. Caddyfile 给裸域和上传子域都指定 `tls /etc/caddy/certs/origin.pem /etc/caddy/certs/origin.key`（2.6.2 支持），重载后确认 Caddy 不再向 Let's Encrypt 申请。\n4. Cloudflare 侧：SSL/TLS 模式 `full` 改 `strict`；最低 TLS 1.0 改 1.2；Always Use HTTPS 打开；部署 Free Managed Ruleset；开 Bot Fight Mode；试加一条上传路径的限速规则，免费版加不上就记一句。\n5. A 记录改成 proxied。注意：开代理不追溯，旧 IP 已经进过公共 DNS 和证书透明度日志，别指望从此隐身；能防的是后面的直连攻击，不是过去的记录。\n6. 真实访客 IP：服务器上 Caddy 是 2.6.2，没有 `trusted_proxies`，不升级。官网静态页不需要访客 IP；上传服务在 Node 里读 `CF-Connecting-IP`，头缺失时退回 `req.socket.remoteAddress`。\n7. 更新 `docs/服务器操作手册.md`：访问链路、证书位置与有效期、真实 IP 的取法、上传上限。第 60、129、142 行关于「证书自动续期」的说法要改。第 70 行本机 DNS 接管那一段已在 [PR #90](https://github.com/Lil-BobCN/grilling-remote/pull/90) 改完，不重做。\n\n不做：不改 SSH、不动 `/data`、不动云安全组（归 #84）、不做页面、不换机器。\n\n## Success condition\n\n1. 公共 DNS 返回 Cloudflare 任播地址，`cf dns records list` 里 `proxied` 为 true。\n2. 请求响应头有 `cf-ray`，`server` 不再是 Caddy。\n3. SSL 模式为 `strict`，最低 TLS 1.2，Bot Fight Mode 为 true，`http_request_firewall_managed` 入口规则集存在。\n4. 服务器上 Caddy 加载的是 Origin CA 证书，到期年份在 2041 年，`/var/lib/caddy` 下没有还要续的 Let's Encrypt 证书。\n5. 手册改完，第 60、129、142 行不再说「自动续期」。\n6. 上传 50 MB 以内能通；超过 Cloudflare 100 MB 上限会失败，这点写进手册。\n\n## Evidence\n\n- #81 的结论；本票是它的实现。\n- 2026-11-07 用 API 读到的现状：A 记录灰云；WAF 三个 phase 都没有入口规则集；Bot 防护全关；SSL 模式 `full`、最低 TLS 1.0、Always Use HTTPS 关。\n- Universal SSL 已签，覆盖裸域和一级通配，2027-02-01 到期。代理开起来就有边缘证书，不用另申请。\n- 免费版上传单次上限 100 MB：<https://developers.cloudflare.com/support/troubleshooting/http-status-codes/4xx-client-error/error-413/>\n- 代理在中间时 TLS-ALPN-01 必失败，只能靠 HTTP-01 或换证书：<https://caddy.community/t/caddy-cloudflare-tls-challenge-fails/31130>\n\n"
    },
    {
      "id": 92,
      "title": "服务器：收窄云安全组入站，只留 22、80、443 和 ICMP",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-043"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/92",
      "labels": [
        "wayfinder:task"
      ],
      "body": "## Question\n\n安全组入方向现在全开：`all_tcp 1-65535` 一条，加 RDP 3389、UDP3389、UDP22 三条 Linux 用不上的。收窄成只放 22、80、443 的 TCP 加 ICMP，怎么改、改完怎么验？\n\n## Type\n\ntask / HITL。控制台要运营者登录，agent 没有账号。\n\n## Direct blockers\n\nNone\n\n## Scope\n\n1. 在控制台删掉四条入方向规则：`all_tcp 1-65535`（描述「HTTP 证书 HTTPS」）、RDP 3389、UDP3389、UDP22。\n2. 保留 SSH 22、HTTP 80、HTTPS 443、ICMP，来源先留 `0.0.0.0/0`。\n3. 改完从外网验：22、80、443 通，3389 和另外几个常见端口不通，ping 通，站点回 `ok`。\n4. 结论写进 `docs/服务器操作手册.md` 第二节，删掉那段「待定」，复核表那一行改成实际状态。\n\n不做：不动 `ufw`，不动 #88 的 Cloudflare 代理和 Origin CA。80、443 的来源以后要不要收窄到 Cloudflare 段，归 #88 或另开票。\n\n## Success condition\n\n1. 控制台入方向只剩 SSH 22、HTTP 80、HTTPS 443、ICMP 四条。\n2. 外网探测：22、80、443 通，3389 和其余常见端口不通，ping 通，`curl` 站点回 `ok`。\n3. 手册第二节的「待定」一段删掉，写清收窄后的四条规则；复核表「云安全组」那行改成实际状态。\n\n## Evidence\n\n- [服务器：核对云安全组放行，和 ufw 对一遍](https://github.com/Lil-BobCN/grilling-remote/issues/84) 的结论：安全组入方向八条、来源全是 `0.0.0.0/0`；`ufw` 只放 22、80、443；外网实际只有 22、80、443 通。\n- 同票证据：`/var/log/ufw.log` 11-03 到 11-07 共 17822 条拦包，涉及 11756 个不同端口。包能到内核，说明确实全开。\n- 风险：现在只有 `ufw` 一层，它一停整机 1-65535 全裸。\n- 手册第二节已写清现状和待定项，见 [PR #91](https://github.com/Lil-BobCN/grilling-remote/pull/91)。\n"
    },
    {
      "id": 95,
      "title": "按 #26 实测修客户规则：收尾 next、子代理复核、问题树分工",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-041"
      ],
      "produces": [
        "M1-042"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/95",
      "labels": [
        "wayfinder:task"
      ],
      "body": "## Question\n\n按 #26 的实测结果改客户工作区规则，让两条真缺口不再出现，并把几处旧说法改成实测结论。\n\n## Type\n\nwayfinder:task，HITL（改客户看得到的话，运营者要审）\n\n## Direct blockers\n\nNone。\n\n## Scope\n\n1. 收尾顺序：wrap-up 之后必须再跑 next；收尾前检查给客户的那一行指向没做完的票。改 `customer-kit/package/AGENTS.md` 的三句触发一节，必要时改 `wrap-up` 技能。\n2. 小需求收尾：`subagent_fork` 复核写成可检查的一步；起不来时写「查过（自查）」。改 `AGENTS.md` 的小需求一段。\n3. 问题树：票面拆成「客户侧登记」和「运营者侧重判」两项；客户侧只登记，重判归运营者侧 `question-tree`。改 #26 的写法说明，不改代码。\n4. `问答记录.md`：写进 `AGENTS.md` 和客户侧 `docs/agents/issue-tracker.md`，或者让 Agent 不建。二选一，运营者定。\n5. 票完成时删掉 `Blocked by` 行。改 `issue-tracker.md`。\n6. 跨票产出的归属：写清产出文件算哪张票。改 `AGENTS.md` 的「产出文件」一行。\n7. 同步旧说法：`docs/客户澄清启动提示词.md`、`docs/客户 AGENTS.md 设计说明.md`、`docs/客户工作区方案.md`、`docs/工厂流程.md`、`docs/讲解.md`、`customer-kit/README.md`、`customer-kit/安装步骤.md` 里「归 #26」「没实测」的旧句，加实测结论或改指向本票。\n\n不做：桌面版卡片、客户机联网、自然压缩的复测。它们归 #36 或另开。\n\n## Success condition\n\n客户包源文件改完并逐条核对；七处旧说法不再说「没实测」或「归 #26」。重打包和发布归 #35。\n\n## Evidence\n\n- #26 的结果表在 `customer-kit/测试记录.md` 的「2026-11-07 #26」一节，PR #94。\n- 收尾漏 next：01 票会话的技能调用只有开头一次 next，wrap-up 后没有再跑，最后让客户沿用已完成的 01 行。\n- 小需求漏子代理：contact-hours 会话日志没有 `subagent` 或 `subagent_fork` 调用。\n- 问答记录：`.scratch/huiyuan/问答记录.md` 是 Agent 自己建的，规则里没有。\n- Blocked by：03 票 resolved 后票头还留 `Blocked by: 01`。\n"
    },
    {
      "id": 96,
      "title": "服务器：把源站 80、443 的来源收窄到 Cloudflare 段",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-044"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/96",
      "labels": [
        "wayfinder:task"
      ],
      "body": "## Question\n\n源站 80、443 现在任意来源都能直连，绕开 Cloudflare 的 WAF、Bot 防护和限速。要不要只放行 Cloudflare 的 IP 段？怎么改、怎么验？\n\n## Type\n\ntask / HITL。控制台要运营者登录，agent 没有账号；改安全组和 ufw 要 sudo。\n\n## Direct blockers\n\n[服务器：收窄云安全组入站，只留 22、80、443 和 ICMP](https://github.com/Lil-BobCN/grilling-remote/issues/92)（先把安全组从全开收窄到 22、80、443 和 ICMP；本票再收 80、443 的来源）\n\n## Scope\n\n1. 取 Cloudflare 当前发布的 IPv4、IPv6 段，记下日期和来源：<https://www.cloudflare.com/ips/>。\n2. 云控制台安全组：80、443 的来源从 `0.0.0.0/0` 改成 Cloudflare 段。22 不动，ICMP 不动。\n3. 如果安全组不方便按段写，才考虑在 ufw 层做；两层不要只改一层。\n4. 改完从非 Cloudflare 网络直连源站 IP 的 80、443，确认不通；`https://afkfactory.dev` 仍回 `ok`，响应头有 `cf-ray`。\n5. 手册第二节和复核表写清：源站 80、443 只接受 Cloudflare 段，段的来源和更新日期。\n\n不做：不改 SSH，不动 22、ICMP，不改 Cloudflare 设置，不换机器。\n\n## Success condition\n\n1. 安全组里 80、443 的来源只剩 Cloudflare 的 IPv4、IPv6 段，日期和来源写在手册。\n2. 非 Cloudflare 网络直连源站 80、443 不通。\n3. 经 Cloudflare 访问仍回 `ok`，`cf-ray` 在。\n4. 手册第二节和复核表改完。\n\n## Evidence\n\n- #84 的结论：安全组入方向全开，实际只有 ufw 在挡；80、443 来源要不要收窄到 Cloudflare 段，留给 #88 或另开票。\n- #88：代理已开，源站换 Origin CA；源站仍可直连，不经过 Cloudflare 的请求不受 WAF、Bot 防护和限速约束。\n- Cloudflare 官方 IP 段：<https://www.cloudflare.com/ips/>\n- 风险：只靠 ufw 一层时，ufw 一停整机全裸；收窄来源能把直连攻击面压到 Cloudflare 段。"
    },
    {
      "id": 101,
      "title": "下载链接的浏览器缓存：4 小时要不要改成尊重源站",
      "type": "grilling",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-048"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/101",
      "labels": [
        "wayfinder:grilling"
      ],
      "body": "## Question\n\n下载链接在浏览器侧带 `max-age=14400`。客户刚下过、4 小时内又下，可能拿到旧包，和页面上的 SHA256 对不上。要不要把 Cloudflare 的浏览器缓存 TTL 改成「尊重源站」，还是用别的办法？\n\n## Type\n\nwayfinder:grilling，HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n定三件事：改不改；改哪一层（Cloudflare 的浏览器缓存 TTL、链接带版本查询串、页面文案兜底）；谁去改。不碰页面设计，归 [教程页做成什么样：安装步骤、截图和启动句怎么放](https://github.com/Lil-BobCN/grilling-remote/issues/31)。\n\n## Success condition\n\n一个决定，写明改不改、改哪层、谁执行，能直接照着做。\n\n## Evidence\n\n- 2026-11-07 实测：源站 Caddy 对 `/downloads/*` 回 `Cache-Control: no-cache`，经 Cloudflare 后头部变成 `max-age=14400`；`cf-cache-status` 每次是 `REVALIDATED`，边缘会回源校验。\n- 链接固定：https://afkfactory.dev/downloads/客户工作区-v1.zip。重打包后内容变、链接不变。\n- 出自 [官网技能包发布：定稿后重打包、上传、给 URL 和 SHA256](https://github.com/Lil-BobCN/grilling-remote/issues/35) 的验收记录，和 `deploy/README.md` 里缓存那一段。\n"
    },
    {
      "id": 104,
      "title": "源站回源加 mTLS：开 Authenticated Origin Pulls，只认 Cloudflare 客户端证书",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-ROOT"
      ],
      "produces": [
        "M1-049"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/104",
      "labels": [
        "wayfinder:task"
      ],
      "body": "## Question\n\n源站 80、443 已经只放 Cloudflare IPv4 段，但别的 Cloudflare 账号也能从 Cloudflare 网络回源，不受我们这层 WAF 约束。要不要开 Authenticated Origin Pulls（mTLS，源站校验 Cloudflare 的客户端证书）？怎么开、怎么验？\n\n## Type\n\ntask / HITL。Cloudflare 控制台要运营者登录，Caddy 配置要改。\n\n## Direct blockers\n\nNone。#96 已把来源收窄到 Cloudflare 段，本票在这层上再加身份校验。\n\n## Scope\n\n1. 在 Cloudflare 控制台开 Authenticated Origin Pulls。按 zone 开还是按 hostname 开，先查清再定。\n2. 源站 Caddy 配客户端证书校验，只接受 Cloudflare 的客户端证书。\n3. 验证三件事：经 Cloudflare 访问回 `ok`；不带客户端证书的请求在 TLS 握手阶段被拒；证书更换后仍能回源。\n4. 手册补一节：mTLS 的作用、证书放哪、怎么换、校验失败时客户端看到什么。\n\n不做：不改 SSH，不动 22、ICMP，不改现有 WAF 和限速规则。\n\n## Success condition\n\n1. 源站只接受带 Cloudflare 客户端证书的回源请求。\n2. 经 Cloudflare 访问仍回 `ok`，响应头有 `cf-ray`。\n3. 不带证书直连源站 443，TLS 握手被拒。\n4. 手册写清开启步骤、证书位置、更换方法。\n\n## Evidence\n\n- #96：源站 80、443 只放 Cloudflare IPv4 段。这层只认网络，不认是哪个 Cloudflare 账号。\n- 手册「访问链路」已记这条残留风险：Authenticated Origin Pulls 没开。\n- Cloudflare 文档：Authenticated Origin Pulls 用 mTLS 校验回源请求来自 Cloudflare。"
    },
    {
      "id": 109,
      "title": "客户进度模块：登录、四屏样品、五档状态",
      "type": "prototype",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-050"
      ],
      "produces": [
        "M1-051"
      ],
      "covers": [
        1,
        4
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/109",
      "labels": [
        "wayfinder:prototype"
      ],
      "body": "## Question\n\n客户在网站上怎么看订单进度？登录、订单列表、订单详情、管理列表四屏，客户看到五档状态，运营者看只读的管理视图。做成什么样，先出样品。\n\n## Type\n\nwayfinder:prototype，HITL\n\n## Direct blockers\n\n无。\n\n## Scope\n\n1. 出单文件 HTML 样品，至少四屏：登录、订单列表、订单详情、管理列表。\n2. 详情页放四个状态：正常开发中、校验未通过、待客户验收、驳回后第 2 轮。\n3. 客户视图：五档进度条，走过的节点打勾、带到达时间，当前高亮。悬停或点按，展开这一档的细步骤、到达时间、当前小步。细步骤用客户话写。\n4. 管理视图：全部单一行一单，列客户、需求名、当前档、内部细阶段、停留天数、卡住标记、交付地址；带小进度条；只读，点进 GitHub 工单；标「该发消息了」。答闸门、拆票仍在 GitHub 和 Orca。\n5. 登录态：账号我们建，密码微信发，忘了找客服重设。上传页改用登录态认人，不再手填简称和邮箱；教程加一步登录；保留「已问完」和隐私提示。\n6. 转档状态格式：调度器每次转档写一句状态，页面读它。写在哪、什么格式，本票定。\n7. 驳回后进度条退回「开发中」，挂「第 2 轮」；上一轮的时间收进「经历」。\n8. 旧说法统一：把「填客户简称和邮箱」改成「登录后传，简称和邮箱由账号带出」。涉及 `docs/客户侧流程样本.md`、`docs/讲解.md`、`docs/客户工作区方案.md`、`docs/客户 AGENTS.md 设计说明.md`、`customer-kit/package/AGENTS.md`、`customer-kit/安装步骤.md`、`docs/介入点.md`、`prototype/issue-31/`。研究记录放着不改。\n\n不做：写实现，实现归 `to-spec` 出的票。管理视图不做成看板，不推翻 #14。\n\n## Success condition\n\n1. 四屏样品能用浏览器双击打开，运营者看得懂。\n2. 详情页四个状态都能看到，客户视图和管理视图对得上 `docs/客户进度.md`。\n3. 转档状态写在哪、什么格式，有一句结论。\n4. 运营者给一句判断：样品能不能拿去 `to-spec`，哪里要改。\n\n## Evidence\n\n- `docs/客户进度.md` 第三、四、五节。\n- [#52 的结论评论](https://github.com/Lil-BobCN/grilling-remote/issues/52#issuecomment-6706018564)：五档状态、三条消息、通道和账号方向。\n- [工单模型落地：客户仓 Issue 模板、四档状态、改口追加](https://github.com/Lil-BobCN/grilling-remote/issues/45)：四档状态只给调度器和运营者看。\n- [运营者工作台：待办在哪看、怎么处理](https://github.com/Lil-BobCN/grilling-remote/issues/14)：不做看板。\n- [客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63)：上传页原来填客户简称和邮箱。\n- 2026-11-07 运营者点头：客户邮件服务归 `to-spec`；转档状态写一句，并入本票。\n"
    },
    {
      "id": 113,
      "title": "客户包重打并发布：含 #109 登录后上传说法",
      "type": "task",
      "state": "closed",
      "work": "已完成",
      "mapId": 1,
      "derivedFrom": [
        "M1-028",
        "M1-045"
      ],
      "produces": [
        "M1-052"
      ],
      "covers": [
        1
      ],
      "splitReason": "",
      "url": "https://github.com/Lil-BobCN/grilling-remote/issues/113",
      "labels": [
        "wayfinder:task"
      ],
      "body": "## Question\n\n`customer-kit/package/AGENTS.md` 已按 [客户进度模块：登录、四屏样品、五档状态](https://github.com/Lil-BobCN/grilling-remote/issues/109) 改成「登录后拖进去，简称和邮箱由账号带出」，官网 `客户工作区-v1.zip` 还是旧句「填你的简称和邮箱」。需要重打、核对、发布。\n\n## Type\n\nwayfinder:task\n\n## Direct blockers\n\n无。动手前先合 `windows-intel-mac-workspace-write` 里对 `customer-kit/README.md` 的未提交改动，避免同文件冲突。\n\n## Scope\n\n1. 跑 `bash customer-kit/build.sh`，确认包内 `AGENTS.md` 第 200 行是「登录后拖进去，简称和邮箱由账号带出」。\n2. 核对 20 个文件、`diff -r` 与 `package/` 一致、`shasum -c` 通过。按现在内容重打是 41471 字节，SHA256 `0996ab98cb9e0ce8bb58221e4bb00798d22ea6e792d50e117ee26ff0915350ef`；以实际重打为准。\n3. 发布到 `https://afkfactory.dev/downloads/客户工作区-v1.zip`，更新官网下载页的 SHA256。\n4. 在 `customer-kit/README.md` 记第三次构建的字节数、SHA256 和核对结果。\n5. 给 `docs/客户工作区改版简报.md` 开头加一句「2026-11-07 部分已废：回传改整包见 [#63](https://github.com/Lil-BobCN/grilling-remote/issues/63)；上传页改登录态见 [#109](https://github.com/Lil-BobCN/grilling-remote/issues/109)」，那个文件还写着「上传页不改」。\n6. 包内 `README.txt` 的 Windows 口径按 `customer-kit/README.md:77` 的待办处理；不在必须项里。\n\n## Success condition\n\n1. 官网下载的 zip 解压后，`AGENTS.md` 第 200 行是新说法。\n2. `customer-kit/README.md` 有第三次构建记录，字节数和 SHA256 与官网包一致。\n3. 官网下载页的 SHA256 和 `.sha256` 文件一致。\n\n## Evidence\n\n- #109 的四屏样品和登录说法：`prototype/issue-109/README.md`。\n- [官网技能包发布：定稿后重打包、上传、给 URL 和 SHA256](https://github.com/Lil-BobCN/grilling-remote/issues/35) 的发布记录：41461 字节，SHA256 `49d3d89a8ccea55c76c19b84e1fbe6375d33b3d2a2f3fc9922a7533ae97038a6`。\n- [客户包改发预装工作区 zip，回传改整包：取代装配提示词和 meta.json](https://github.com/Lil-BobCN/grilling-remote/issues/63)：取消 `meta.json`，回传改整包。\n- wrap-up 核对：官网包第 200 行仍是「填你的简称和邮箱」；按现在内容在临时目录重打两次，SHA256 都是 `0996ab98…`。\n"
    }
  ],
  "premises": [
    {
      "id": "M1-P1",
      "decision": "M1-ROOT",
      "statement": "运营者的数据只在一台机器上产生",
      "state": "成立",
      "evidence": [
        "#140 正文：数据放 ~/.grilling/中台/",
        "原话：只有一个权威状态，agent 通过 CLI 读"
      ],
      "lastJudge": null
    }
  ],
  "coverage": [
    {
      "frag": 1,
      "text": "客户在本机装 DeepSeek Harness（`dsh`），用自然语言和原型把「我想要什么」问到清楚，卡住时找你，文件写在本地 `.scratch/`；网站放教程、提示词和回传上传页。",
      "tickets": [
        3,
        7,
        8,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        30,
        31,
        35,
        36,
        39,
        41,
        53,
        55,
        58,
        63,
        72,
        73,
        78,
        80,
        81,
        84,
        88,
        92,
        95,
        96,
        101,
        104,
        109,
        113
      ],
      "status": "已落"
    },
    {
      "frag": 2,
      "text": "回传后需求落成 GitHub Issue 工单，运营者解压回传包，agent 读文件并列出未决策问题，运营者决策完后手动跑 to-spec。",
      "tickets": [
        5,
        9,
        10,
        13,
        20,
        22,
        30,
        44,
        45,
        52
      ],
      "status": "已落"
    },
    {
      "frag": 3,
      "text": "拆票经运营者点头后，调度器点火实现，进度回写工单，并由 Grok Bot 推给你。",
      "tickets": [
        2,
        6,
        11,
        12,
        14,
        15
      ],
      "status": "已落"
    },
    {
      "frag": 4,
      "text": "客户在网站登录后看订单进度：五档状态，微信加邮件三条消息。",
      "tickets": [
        2,
        52,
        109
      ],
      "status": "已落"
    },
    {
      "frag": 5,
      "text": "地图终点 = **可施工**：决策锁定、规格成形、工单拆好。",
      "tickets": [],
      "status": "缺口"
    }
  ],
  "impact": {
    "id": "",
    "triggerPremise": "",
    "items": [],
    "decisions": [],
    "tickets": []
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
