"use strict";

/* 图布局测试：根 → 票 → 决定 → 票 → 决定，五层。用真实 graph.js，不联网。 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const web = path.join(__dirname, "..", "web");
global.window = {};
global.document = { querySelector: function () { return null; } };
vm.runInThisContext(fs.readFileSync(path.join(web, "util.js"), "utf8"));
vm.runInThisContext(fs.readFileSync(path.join(web, "graph.js"), "utf8"));

const board = {
  map: { id: "1", title: "五层测试", fragments: ["一。", "二。"] },
  root: {
    id: "D-ROOT", statement: "根决定", fragments: [
      { id: "D-ROOT#1", index: 1, text: "一。" },
      { id: "D-ROOT#2", index: 2, text: "二。" },
    ],
  },
  fragments: [
    { id: "D-ROOT#1", index: 1, text: "一。" },
    { id: "D-ROOT#2", index: 2, text: "二。" },
  ],
  groups: [
    { key: "decision:D-ROOT", root: true, ticket: null, main: "D-ROOT", decisions: ["D-ROOT"] },
    { key: "decision:D-1", root: false, ticket: "T1", main: "D-1", decisions: ["D-1"] },
    { key: "decision:D-2", root: false, ticket: "T0", main: "D-2", decisions: ["D-2"] },
    { key: "decision:D-3", root: false, ticket: "T2", main: "D-3", decisions: ["D-3"] },
  ],
  decisions: [
    { id: "D-ROOT", statement: "根决定", status: "active", premises: [], root_of: "1" },
    { id: "D-1", statement: "第一层决定", status: "active", premises: [
      { id: "P-1", state: "已破", statement: "前提一句。", evidence: ["证据 1"] },
      { id: "P-2", state: "成立", statement: "前提二句。", evidence: [] },
      { id: "P-3", state: "未知", statement: "前提三句。", evidence: [] },
      { id: "P-4", state: "未验", statement: "前提四句。", evidence: ["证据 4"] },
    ], source_ticket: "T1" },
    { id: "D-2", statement: "同层第二来源", status: "active", premises: [], source_ticket: "T0" },
    { id: "D-3", statement: "第三层决定", status: "active", premises: [], source_ticket: "T2" },
  ],
  tickets: [
    { id: "T0", title: "票 0", type: "task", state: "open", work: "未领取",
      derived_from: ["D-ROOT"], derived_from_inferred: [], covers: [], produces: ["D-2"], split_reason: "" },
    { id: "T1", title: "票 1", type: "task", state: "open", work: "未领取",
      derived_from: ["D-ROOT"], derived_from_inferred: [], covers: [], produces: ["D-1"], split_reason: "" },
    { id: "T2", title: "票 2", type: "task", state: "open", work: "未领取",
      derived_from: ["D-ROOT"], derived_from_inferred: ["D-1", "D-2"],
      covers: [], produces: ["D-3"], split_reason: "" },
  ],
  edges: [
    { kind: "derived", from: "decision:D-ROOT", to: "ticket:T0" },
    { kind: "derived", from: "decision:D-ROOT", to: "ticket:T1" },
    { kind: "produced", from: "ticket:T0", to: "decision:D-2" },
    { kind: "produced", from: "ticket:T1", to: "decision:D-1" },
    { kind: "derived", from: "decision:D-ROOT", to: "ticket:T2" },
    { kind: "derived", from: "decision:D-1", to: "ticket:T2", inferred: true },
    { kind: "derived", from: "decision:D-2", to: "ticket:T2", inferred: true },
    { kind: "produced", from: "ticket:T2", to: "decision:D-3" },
  ],
};

const model = window.BoardGraph.build(board, {});

assert.ok(model, "build 应返回布局模型");
const nodes = model.nodes;
assert.strictEqual(nodes["decision:D-ROOT"].level, 0, "根在 0 层");
assert.strictEqual(nodes["ticket:T0"].level, 1, "票 0 在 1 层");
assert.strictEqual(nodes["ticket:T1"].level, 1, "票 1 在 1 层");
assert.strictEqual(nodes["decision:D-1"].level, 2, "决定 1 在 2 层");
assert.strictEqual(nodes["decision:D-2"].level, 2, "决定 2 在 2 层");
assert.strictEqual(nodes["ticket:T2"].level, 3, "推断来源把票 2 排到 3 层");
assert.strictEqual(nodes["decision:D-3"].level, 4, "决定 3 在 4 层");

assert.strictEqual(nodes["ticket:T0"].parent, "decision:D-ROOT", "票 0 的主父是根");
assert.strictEqual(nodes["ticket:T1"].parent, "decision:D-ROOT", "票 1 的主父是根");
assert.strictEqual(nodes["decision:D-1"].parent, "ticket:T1", "决定 1 挂在票 1 上");
assert.strictEqual(nodes["decision:D-2"].parent, "ticket:T0", "决定 2 挂在票 0 上");
assert.strictEqual(nodes["ticket:T2"].parent, "decision:D-1", "票 2 选最深的推断来源作主父");
assert.strictEqual(nodes["decision:D-3"].parent, "ticket:T2", "决定 3 挂在票 2 上");

assert.strictEqual(model.primary.T2, "D-1", "主来源记在模型里");
assert.strictEqual(model.primaryInferred.T2, true, "主来源是推断边");
assert.strictEqual(model.edgeModes["decision:D-1|ticket:T2"], "primary", "主来源边");
assert.strictEqual(model.edgeModes["decision:D-2|ticket:T2"], "secondary", "同层次要来源边");
assert.strictEqual(model.edgeModes["decision:D-ROOT|ticket:T2"], "skip", "跨层来源不画线");

assert.deepStrictEqual(model.rootTicketKeys, ["ticket:T0", "ticket:T1"],
  "根直接拆出的票走母线");
const html = window.BoardGraph.render(board, {}).html;
assert.ok(html.indexOf("bus-a") >= 0, "根到票画一条母线");
assert.ok(html.indexOf("branch-a") >= 0, "母线到票画短竖线");
assert.strictEqual((html.match(/edge-a derive primary(?! inferred)/g) || []).length, 0,
  "根直接拆出的票不再画长曲线");
assert.ok(html.indexOf("依赖前提 P-1 · 已破") >= 0, "节点画前提块");
assert.ok(html.indexOf("证据：证据 4") >= 0, "节点画证据");
assert.ok(html.indexOf("依赖前提 P-4") >= 0, "所有前提都画，不只前三条");
assert.ok(html.indexOf("由 #T1 产出 · 4 条前提") >= 0, "节点 meta 按原型写前提数");
assert.ok(html.indexOf("还有 ") < 0, "不再写「还有 N 条前提」");

console.log("ok 五层树：层数、父节点、主/次要/跨层边、根部母线、前提块");
