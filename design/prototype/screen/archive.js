window.PROTO_ARCHIVE = {
  tickets: {
    140: {
      background: {
        summary: "这张票定中台的数据放哪、由哪个程序写、谁能读。根决定第 1 句是「中台在本机跑起来」，要让这句话落地，得先定数据目录、写入路径和失败时的表现，所以从 D-ROOT 第 1 句拆出这张票。范围只到存储和访问路径；事件内容、屏幕交互、多机同步都不在这张票里。",
        body: "Part of #139\n\n## Question\n\n事件日志、board.db、服务、CLI 四者的边界定清楚：\n\n- events.jsonl 和 board.db 的绝对路径，是否就是 `~/.grilling/中台/`\n- 服务监听哪个端口，CLI 是服务客户端还是直接读文件\n- 服务没启动、崩溃、重启时，CLI 和屏幕分别怎么表现\n- events.jsonl 的 git 快照由谁提交、提交到哪条分支或哪个数据仓\n- 备份和损坏恢复的最小做法\n\n## Type\n\nwayfinder:grilling，HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只定存储和访问路径，不定事件内容，不定屏幕交互。\n\n## Success condition\n\n一个决定，写清路径、端口、读写入口、失败时的行为和 git 提交路径，能直接照着实现。\n\n## Evidence\n\n- 设计初稿 `中台/设计.md`「写入路径」「读取路径」两节。\n- 本机 12 个 worktree 共用同一仓库，台账在各分支行数不同。",
        sourceLabel: "#140 正文",
        sourceUrl: "https://github.com/Lil-BobCN/grilling-remote/issues/140"
      },
      roles: {
        "D-0010": "主决定：数据放哪、谁是权威、怎么覆盖",
        "D-0010a": "服务与 CLI 的访问路径",
        "D-0010b": "数据仓与提交节奏",
        "D-0010c": "事件写入与损坏恢复",
        "D-0010d": "服务不在、写失败、重启时的表现"
      },
      decisions: {
        "D-0010": {
          basis: "数据放在仓库外，是为了让中台有一份不跟 git 分支跑的权威状态：`events.jsonl` 由本机服务单写，CLI 和屏幕都通过服务读写；`board.db` 只是索引，删掉能从事件重建；`GRILLING_HOME` 留一个改根目录的口子。单写者让并发写有一个排队点，代价是服务必须一直在。",
          premiseContext: {
            "P-0001": {
              fact: "运营者的数据只在一台机器上产生。",
              newFact: "第二台机器也要读事件日志。",
              source: "#140 正文和 `中台/设计.md` 的「只有一个权威状态」；原话：只有一个权威状态，agent 通过 CLI 读。",
              reason: "2026-11-10 15:20 由运营者判已破：第二台机器也要读事件日志，单机单写者的假设不成立。"
            }
          }
        }
      },
      excerpts: [
        {
          id: "Q-0001",
          supports: ["D-0010"],
          question: "events.jsonl 和 board.db 的绝对路径，是否就是 `~/.grilling/中台/`？",
          answer: "数据默认放 `~/.grilling/中台/`；`events.jsonl` 是权威记录，`board.db` 可随时重建，`GRILLING_HOME` 可覆盖根目录。",
          sourceLabel: "#140 正文 · 关票评论",
          sourceUrl: "https://github.com/Lil-BobCN/grilling-remote/issues/140#issuecomment-6755378250"
        },
        {
          id: "Q-0002",
          supports: ["D-0010"],
          question: "服务没启动、崩溃、重启时，CLI 和屏幕分别怎么表现？",
          answer: "CLI 发现服务未启动就后台拉起并等 5 秒；写失败不自动重试，报结果未知；屏幕断线显示重连条并禁用动作；服务重启按锁、重放、哈希、重建自检。",
          sourceLabel: "#140 正文 · 关票评论",
          sourceUrl: "https://github.com/Lil-BobCN/grilling-remote/issues/140#issuecomment-6755378250"
        },
        {
          id: "Q-0003",
          supports: ["P-0001"],
          question: "第二台机器也要读事件日志吗？",
          answer: "要。单机单写者的前提不成立，所以 P-0001 判破，D-0010 这一组决定要重看。",
          sourceLabel: "本地会话 2026-11-11 21:45 · 内容层访谈（示例）",
          sourceUrl: ""
        }
      ],
      groups: [
        {name:"访问与读写", ids:["D-0010a"]},
        {name:"数据仓与提交", ids:["D-0010b"]},
        {name:"事件写入与恢复", ids:["D-0010c"]},
        {name:"故障行为", ids:["D-0010d"]}
      ],
      unresolved: [
        "第二台机器怎么读事件日志：只读拉取、还是也能写，还没定。",
        "备份和损坏恢复的最小做法：残片截断和 `board.db` 重建已定，跨机备份还没定。"
      ]
    },
    141: {
      background: {
        summary: "这张票定事件的格式：有哪些 op、每个 op 的 payload、状态怎么按 seq 折叠、哈希怎么规范化、actor 怎么记、编号怎么发。根决定要求所有状态由事件折叠出来，所以先把事件格式定死。范围只到事件和折叠；存储路径、屏幕排布、同步重试不在票里。",
        body: "Part of #139\n\n按《中台 v1：本机 issue 主记录，GitHub 做镜像》更新（2026-11-10）：op 清单覆盖地图、子票、评论、标签、状态、关系和同步结果。\n\n## Question\n\n事件模型定清楚：\n\n- op 有哪些值：导入、地图/子票的创建与编辑、关闭/重开、标签、父子、阻塞、评论的创建/编辑/删除、加前提、判前提、推翻、同步结果。\n- 每个 op 的 payload 结构。\n- 折叠顺序，遇到不认识的 op 怎么办。\n- 状态哈希怎么规范化：字段顺序、数组顺序、是否含时间戳。\n- actor 从哪来，能不能区分人和 agent。\n- 新建实体时编号由谁分配，和 GitHub 编号怎么对应。\n\n## Type\n\nwayfinder:grilling，HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只定事件和折叠，不定存储路径，不定屏幕排布，不定同步的重试策略（由《导入与同步：中台主记录，GitHub 镜像》定）。\n\n## Success condition\n\n同一份 events.jsonl 折叠两次哈希相同；删掉 board.db 重建结果不变；op 清单覆盖 v1 的写动作，payload 结构能直接写成代码。\n\n## Evidence\n\n- 地图《中台 v1：本机 issue 主记录，GitHub 做镜像》的 Destination 和 Notes。\n- 设计初稿 `中台/设计.md`「数据模型·事件」「写入路径」「验收」第 2 条。\n- 现有 `scripts/decisions` 没有事件日志。",
        sourceLabel: "#141 正文",
        sourceUrl: "https://github.com/Lil-BobCN/grilling-remote/issues/141"
      },
      roles: {
        "D-0011": "主决定：事件日志是唯一权威",
        "D-0011a": "状态哈希怎么规范化",
        "D-0011b": "actor 怎么记",
        "D-0011c": "编号怎么发",
        "D-0011d": "同步状态放哪",
        "D-0011e": "op 清单",
        "D-0011f": "决定不改，只取代",
        "D-0011g": "导入实验"
      },
      decisions: {
        "D-0011": {
          basis: "事件日志是唯一权威，状态按 `seq` 折叠。一次操作写一条事件，创建时把初始字段全带上，避免后面靠补事件修状态。遇到未知 op、未知版本、payload 缺字段或多字段，直接拒绝启动：宁可停下来修，也不猜着折叠。",
          premiseContext: {
            "P-0002": {
              fact: "事件日志的量级能用 JSONL 单文件承载。",
              newFact: "全量导入实验 57,814 字节，单文件够用。",
              source: "#141 关票评论：全量导入约 57KB；D-0011g 实验 57,814 字节。",
              reason: "2026-11-10 01:10 由运营者判成立：导入实验 57,814 字节，单文件够用。"
            }
          }
        }
      },
      excerpts: [
        {
          id: "Q-0004",
          supports: ["D-0011"],
          question: "op 有哪些值？",
          answer: "14 个 op，覆盖票、评论、决定和前提；点号命名，target 指事件主角，评论单独写事件。",
          sourceLabel: "#141 正文 · 关票评论",
          sourceUrl: "https://github.com/Lil-BobCN/grilling-remote/issues/141#issuecomment-6756106781"
        },
        {
          id: "Q-0005",
          supports: ["D-0011"],
          question: "遇到不认识的 op 怎么办？",
          answer: "拒绝启动。未知 op、未知版本、payload 缺字段或多字段都不折叠。",
          sourceLabel: "#141 关票评论",
          sourceUrl: "https://github.com/Lil-BobCN/grilling-remote/issues/141#issuecomment-6756106781"
        },
        {
          id: "Q-0006",
          supports: ["P-0002"],
          question: "事件日志的量级用 JSONL 单文件够吗？",
          answer: "够。全量导入实验 57,814 字节，解析和重放哈希通过。",
          sourceLabel: "#141 关票评论 · D-0011g",
          sourceUrl: "https://github.com/Lil-BobCN/grilling-remote/issues/141#issuecomment-6756106781"
        }
      ],
      groups: [
        {name:"事件格式", ids:["D-0011a", "D-0011e"]},
        {name:"编号与追溯", ids:["D-0011b", "D-0011c"]},
        {name:"同步", ids:["D-0011d"]},
        {name:"决定编辑", ids:["D-0011f"]},
        {name:"导入实验", ids:["D-0011g"]}
      ],
      unresolved: [
        "无。事件模型 v2 的字段由 #149 补，已落 ADR 0003。"
      ]
    },
    142: {
      background: {
        summary: "这张票定前提怎么记、怎么判、判破后怎么触发影响清单。根决定要求决定记前提、一变就算影响，所以先定前提本身和命令形状。范围只到前提；影响面算法和屏幕排布不在票里。",
        body: "Part of #139\n\n按《中台 v1：决策看板，GitHub 做镜像》更新（2026-11-10）：前提是影响案的上游，判定结果要能触发范围计算。\n\n## Question\n\n前提模型定清楚：\n\n- P- 编号规则。\n- 初始状态，以及未验 / 成立 / 已破 / 未知四值的含义。\n- 判定四档（仍成立 / 需修改 / 作废 / 要补问）怎么落到状态。\n- 「需修改」是新建前提、新建决定，还是追加事件。\n- 命令行形状：`premise add`、`premise judge`。\n- 证据字段存什么。\n- 前提判破时怎么让影响案知道：直接触发，还是下一次命令触发？\n\n## Type\n\nwayfinder:grilling，HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只定前提本身和它的命令。不定影响面算法，不定屏幕排布。\n\n## Success condition\n\n能给 D-0009 挂 P-9，判 broken，`impact` 能算出受影响面。四档判定各有明确的落点和后续动作。前提判破后，影响案能收到触发。\n\n## Evidence\n\n- 设计初稿 `中台/设计.md`「数据模型·前提」「推翻的时候发生什么」「验收」第 3 条。\n- 现有台账没有前提列。\n- 地图 #139 新 Destination 和 Notes。",
        sourceLabel: "#142 正文",
        sourceUrl: "https://github.com/Lil-BobCN/grilling-remote/issues/142"
      },
      roles: {
        "D-0013": "主决定：前提是独立记录",
        "D-0013a": "前提状态四个值",
        "D-0013b": "判定词三个",
        "D-0013c": "决定四档不归前提",
        "D-0013d": "谁写、谁审",
        "D-0013e": "判过锁陈述",
        "D-0013f": "证据存引用",
        "D-0013g": "判破触发影响清单",
        "D-0013h": "一条前提只挂一条决定",
        "D-0013i": "编号与命令"
      },
      decisions: {
        "D-0013": {
          basis: "前提是独立记录，有自己的 `P-` 编号，一条前提只挂一条决定。状态四个，判定词三个。判破只改前提状态并发出触发，系统不自动改决定：决定怎么处理由人来判。",
          premiseContext: {
            "P-0004": {
              fact: "判过的前提不需要再改陈述。",
              newFact: "实际使用时改措辞的频率还不知道。",
              source: "#142 关票评论；D-0013e。",
              reason: "2026-11-10 16:40 判未知：实际使用时改措辞的频率还不知道。"
            }
          }
        }
      },
      excerpts: [
        {
          id: "Q-0007",
          supports: ["D-0013"],
          question: "判定四档（仍成立 / 需修改 / 作废 / 要补问）怎么落到前提状态？",
          answer: "那四档是决定被推翻后的处理动作，不是前提的判定。前提只有成立 / 已破 / 未知三个词，归影响案模型。",
          sourceLabel: "#142 正文 · 关票评论",
          sourceUrl: "https://github.com/Lil-BobCN/grilling-remote/issues/142#issuecomment-6763302189"
        },
        {
          id: "Q-0008",
          supports: ["D-0013"],
          question: "判破之后系统会自动改决定吗？",
          answer: "不会。判破写一条 `premise.judge`，状态立刻变，触发影响案；系统只列名单，人判。",
          sourceLabel: "#142 关票评论",
          sourceUrl: "https://github.com/Lil-BobCN/grilling-remote/issues/142#issuecomment-6763302189"
        },
        {
          id: "Q-0009",
          supports: ["P-0004"],
          question: "判过的前提能不能改陈述？",
          answer: "锁住。要换说法就新建一条，旧前提留在决定上，作为当时判定的记录。",
          sourceLabel: "#142 关票评论",
          sourceUrl: "https://github.com/Lil-BobCN/grilling-remote/issues/142#issuecomment-6763302189"
        }
      ],
      groups: [
        {name:"前提状态与判定", ids:["D-0013a", "D-0013b"]},
        {name:"归属与范围", ids:["D-0013c", "D-0013h"]},
        {name:"写入与审阅", ids:["D-0013d", "D-0013e"]},
        {name:"证据与触发", ids:["D-0013f", "D-0013g"]},
        {name:"编号", ids:["D-0013i"]}
      ],
      unresolved: [
        "无。影响清单范围由 #151 定。"
      ]
    },
    149: {
      background: {
        summary: "这张票定地图、票、评论各有哪些字段，靠哪些因果边连起来，哪些 GitHub 功能不搬。根决定要求地图的终点存成根决定、票写拆票理由和 `derived_from`，所以先把实体和边定清楚。范围只到字段、因果边和编辑规则；事件信封、影响清单算法、同步机制、屏幕排布都不在票里。",
        body: "Part of #139\n\n按《中台 v1：决策看板，GitHub 做镜像》新终点更新（2026-11-10）：加入 Destination 主句根决定、覆盖表、拆票理由和因果边。\n\n## Question\n\n图、票和评论定清楚：\n\n- 地图和根决定有哪些字段：地图标题、正文、状态、标签；Destination 主句怎么存成根决定。\n- 覆盖表怎么表达：主句片段 → 票 → 拆票理由。每一句能不能落多张票。\n- 票有哪些字段：标题、正文、状态、标签、作者、时间、父子、阻塞、拆票理由、`derived_from`。\n- 每张票创建时怎么写拆票理由；一张票能不能由多条决定产生；`derived_from` 指向哪些决定。\n- 票产出决定时怎么记 `source_ticket`；决定取代和派生怎么记。\n- 票型是独立字段还是 `wayfinder:` 标签。\n- 评论有哪些字段：作者、时间、正文；能不能编辑、删除。\n- 哪些字段可改，每种修改记成什么动作。\n- 标签是固定集合还是自由文本。\n- 父子、阻塞关系怎么表达，和 GitHub 的 sub-issue、blocked-by 怎么对应。\n- 新建地图和票时，编号怎么分配；和 GitHub issue 编号怎么映射。\n- 哪些 GitHub tracker 功能不做：assignees、milestones、projects、reactions、通知。\n\n## Type\n\nwayfinder:grilling，HITL\n\n## Direct blockers\n\nNone\n\n## Scope\n\n只定实体字段、因果边和编辑规则。不定事件信封，不定影响案算法，不定同步机制，不定屏幕排布。\n\n## Success condition\n\n能列出 v1 的根决定、票、评论、覆盖表字段和每种编辑动作，直接写成数据结构和命令。和事件模型的 op 清单对得上。拆票理由和 `derived_from` 有明确落点。\n\n## Evidence\n\n- 地图 #139 新 Destination 和 Notes。\n- 地图 #117 的 10 张子票、17 条评论、31 条决定、24 句覆盖表。\n- 关票评论的四列表：能重建 `source_ticket`，不能重建决定→票的因果。\n- 设计初稿 `中台/设计.md`「数据模型」。",
        sourceLabel: "#149 正文",
        sourceUrl: "https://github.com/Lil-BobCN/grilling-remote/issues/149"
      },
      roles: {
        "D-0012": "主决定：地图和票共用一个 issue 实体",
        "D-0012a": "根决定与拆句",
        "D-0012b": "covers 与覆盖表",
        "D-0012c": "derived_from 与派生",
        "D-0012d": "票型与标签",
        "D-0012e": "票字段与必填",
        "D-0012f": "评论字段",
        "D-0012g": "编辑动作",
        "D-0012h": "建地图一条事件",
        "D-0012i": "编号",
        "D-0012j": "阻塞",
        "D-0012k": "不搬的 GitHub 功能"
      },
      decisions: {
        "D-0012": {
          basis: "地图和票共用一个 issue 实体，用 `kind` 区分；根决定存主句和拆句，终点变更走新根决定取代。覆盖是票上的 `covers[]`，派生由 `source_ticket` 加票的 `derived_from` 算出，不单存决定到决定的边。这样同一件事只写一遍，边能从记录重算。",
          premiseContext: {
            "P-0003": {
              fact: "地图和票可以共用一个 issue 实体，不需要拆成两张表。",
              newFact: "还没有真实数据跑过。",
              source: "#149 关票评论；ADR 0003。",
              reason: "2026-11-10 06:00 判未知：还没有真实数据跑过，先按合并实体做。"
            }
          }
        }
      },
      excerpts: [
        {
          id: "Q-0010",
          supports: ["D-0012"],
          question: "地图和根决定怎么存？",
          answer: "地图是 `kind: map` 的 issue；根决定存 `statement` 和 `fragments[]`，`root_of` 指地图；地图正文只放 Notes、未定、范围外和索引。",
          sourceLabel: "#149 正文 · 关票评论",
          sourceUrl: "https://github.com/Lil-BobCN/grilling-remote/issues/149#issuecomment-6760414759"
        },
        {
          id: "Q-0011",
          supports: ["D-0012"],
          question: "覆盖表怎么表达？",
          answer: "票上的 `covers[]` 指根决定的拆句 id；覆盖表由拆句、票和拆票理由联接算出，一句可落多张票。",
          sourceLabel: "#149 关票评论",
          sourceUrl: "https://github.com/Lil-BobCN/grilling-remote/issues/149#issuecomment-6760414759"
        },
        {
          id: "Q-0012",
          supports: ["P-0003"],
          question: "地图和票要不要拆成两个实体？",
          answer: "先不拆。共用一个 issue 实体，用 `kind` 区分；还没有真实数据跑过，P-0003 判未知。",
          sourceLabel: "#149 关票评论",
          sourceUrl: "https://github.com/Lil-BobCN/grilling-remote/issues/149#issuecomment-6760414759"
        }
      ],
      groups: [
        {name:"实体与编号", ids:["D-0012a", "D-0012h", "D-0012i"]},
        {name:"覆盖与派生", ids:["D-0012b", "D-0012c"]},
        {name:"票与评论字段", ids:["D-0012d", "D-0012e", "D-0012f"]},
        {name:"编辑与阻塞", ids:["D-0012g", "D-0012j"]},
        {name:"不搬的功能", ids:["D-0012k"]}
      ],
      unresolved: [
        "无。事件模型 v2 的具体字段已并入 ADR 0003。"
      ]
    }
  }
};
