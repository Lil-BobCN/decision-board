"use strict";

/* 侧边栏理由显示测试：四类理由、未记录、编辑入口和旧图提示。用真实 panels.js，不联网。 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const web = path.join(__dirname, "..", "web");
global.window = {};
vm.runInThisContext(fs.readFileSync(path.join(web, "util.js"), "utf8"));
vm.runInThisContext(fs.readFileSync(path.join(web, "panels.js"), "utf8"));

function board(overrides) {
  const base = {
    map: { id: "1", title: "理由测试", split_rationale: "地图拆票理由原文", imported: true },
    root: {
      id: "D-ROOT", statement: "根决定", status: "active", root_of: "1",
      premises: [], rationale: "",
    },
    fragments: [{ id: "D-ROOT#1", index: 1, text: "第一句。" }],
    groups: [
      { key: "decision:D-ROOT", root: true, ticket: null, main: "D-ROOT", decisions: ["D-ROOT"] },
      { key: "decision:D-1", root: false, ticket: "T1", main: "D-1", decisions: ["D-1"] },
    ],
    decisions: [
      {
        id: "D-ROOT", statement: "根决定", status: "active", root_of: "1",
        premises: [], rationale: "",
      },
      {
        id: "D-1", statement: "有依据的决定", status: "active", source_ticket: "T1",
        rationale: "决定级理由。", rationale_source: "C-0018",
        premises: [{
          id: "P-1", state: "已破", statement: "前提", evidence: [],
          last_judged_at: "2026-01-01T00:00:00Z", last_judged_by: "human:test",
          last_judged_reason: "判定理由。",
        }],
      },
      {
        id: "D-2", statement: "没有依据的决定", status: "active",
        premises: [{
          id: "P-2", state: "已破", statement: "前提二", evidence: [],
          last_judged_at: "2026-01-01T00:00:00Z", last_judged_by: "human:test",
          last_judged_reason: "",
        }],
      },
    ],
    tickets: [
      {
        id: "T1", title: "票一", type: "task", state: "open", parent: "1", work: "未领取",
        split_reason: "票级理由。", derived_from: ["D-ROOT"], derived_from_inferred: [],
        covers: [], produces: ["D-1"], comments: [], blocked_by: [],
        sync: { state: "未同步" },
      },
      {
        id: "T2", title: "票二", type: "task", state: "open", parent: "1", work: "未领取",
        split_reason: "", derived_from: ["D-ROOT"], derived_from_inferred: [],
        covers: [], produces: [], comments: [], blocked_by: [],
        sync: { state: "未同步" },
      },
    ],
    coverage: [],
    impact_cases: [],
    signals: [],
    counts: { groups: 2, decisions: 3, tickets: 2, open: 2, impact_open: 0 },
  };
  return Object.assign(base, overrides || {});
}

const b = board();

const withRationale = window.BoardPanels.decisionPanel(b, "D-1");
assert.ok(withRationale.indexOf("决定依据：决定级理由。") >= 0, "决定侧边栏显示决定依据");
assert.ok(withRationale.indexOf("来源：C-0018") >= 0, "决定侧边栏显示依据来源");
assert.ok(withRationale.indexOf("编辑依据") >= 0, "决定侧边栏有编辑依据入口");
assert.ok(withRationale.indexOf("判定理由：判定理由。") >= 0, "前提显示判定理由");
assert.ok(withRationale.indexOf("改判定理由") >= 0, "前提有改判定理由入口");

const missing = window.BoardPanels.decisionPanel(b, "D-2");
assert.ok(missing.indexOf("决定依据：未记录") >= 0, "缺决定依据显示未记录");
assert.ok(missing.indexOf("判定理由：未记录") >= 0, "缺判定理由显示未记录");

const rootPanel = window.BoardPanels.decisionPanel(b, "D-ROOT");
assert.ok(rootPanel.indexOf("拆票理由：地图拆票理由原文") >= 0, "根决定侧边栏显示地图拆票理由");
assert.ok(rootPanel.indexOf("编辑拆票理由") >= 0, "根决定侧边栏有编辑拆票理由入口");

const ticket = window.BoardPanels.ticketPanel(b, "T2");
assert.ok(ticket.indexOf("拆票理由：未记录") >= 0, "票缺拆票理由显示未记录");
assert.ok(ticket.indexOf("（没有拆票理由）") < 0, "旧占位文案已换掉");

const notice = window.BoardPanels.rationaleNotice(b);
assert.ok(notice.indexOf("旧图导入，理由可能缺失") >= 0, "有缺失时显示旧图提示");
assert.ok(notice.indexOf("4 处未记录") >= 0, "提示写明缺失处数（根决定也算一条）");

const complete = board({
  decisions: [
    Object.assign({}, b.decisions[0], { rationale: "补上了。" }),
    Object.assign({}, b.decisions[1], { premises: [] }),
    Object.assign({}, b.decisions[2], {
      rationale: "补上了。",
      premises: [Object.assign({}, b.decisions[2].premises[0], { last_judged_reason: "补上了。" })],
    }),
  ],
  tickets: [
    b.tickets[0],
    Object.assign({}, b.tickets[1], { split_reason: "补上了。" }),
  ],
});
assert.strictEqual(window.BoardPanels.rationaleNotice(complete), "", "没有缺失时不显示旧图提示");

const fresh = board({
  map: { id: "I-0009", title: "新建地图", split_rationale: "", imported: false },
});
assert.strictEqual(window.BoardPanels.rationaleNotice(fresh), "", "新建地图不显示旧图提示");

const closing = board({
  tickets: [
    Object.assign({}, b.tickets[0], {
      work: "等合并",
      close_record: {
        id: "CL-0001", ticket: "T1", pr: 187, sha: "a".repeat(40),
        status: "等合并", verify: null, last_check: null,
        written_by: "agent:claude", written_at: "2026-01-01T00:00:00Z",
        comments: ["四列表 D-3", "改动文件清单", "依据", "五类检查"],
        decisions: [{ id: "D-3", statement: "自动关票：合并后展开记录" }],
      },
    }),
    b.tickets[1],
  ],
});
const closingPanel = window.BoardPanels.ticketPanel(closing, "T1");
assert.ok(closingPanel.indexOf(">关票<") >= 0, "有待关票记录时显示关票一节");
assert.ok(closingPanel.indexOf("CL-0001") >= 0, "关票一节显示记录号");
assert.ok(closingPanel.indexOf("等合并") >= 0, "关票一节显示等合并");
assert.ok(closingPanel.indexOf("PR #187") >= 0, "关票一节显示 PR 号");
assert.ok(closingPanel.indexOf("D-3") >= 0, "关票一节显示决定草稿");
assert.ok(closingPanel.indexOf("关票评论草稿") >= 0, "关票一节列出四条评论草稿");
assert.ok(closingPanel.indexOf("评论 4") >= 0, "关票一节把四条评论都列出来");
assert.ok(window.BoardPanels.ticketPanel(b, "T2").indexOf(">关票<") < 0,
  "没有待关票记录时不显示关票一节");

const sigPanel = window.BoardPanels.signalPanel({
  signals: [{ key: "close-expired", label: "待关票记录过期", tone: "red",
              hint: "提示", count: 0, targets: [] }],
});
assert.ok(sigPanel.indexOf("1 类视觉信号") >= 0, "信号面板标题按信号条数生成");

console.log("ok 侧边栏理由：四类显示、未记录、编辑入口、旧图提示、关票记录");
