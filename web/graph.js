/* 决策图：树状分层排布，支持平移缩放。 */
(function () {
  "use strict";
  var U = window.U;

  var LAST = null;
  var VIEW = null;

  function groupOfDecisionMap(board) {
    var map = {};
    board.groups.forEach(function (g) {
      g.decisions.forEach(function (id) { map[id] = g.key; });
    });
    return map;
  }

  function build(board, opts) {
    var decisions = {};
    board.decisions.forEach(function (d) { decisions[d.id] = d; });
    var tickets = {};
    board.tickets.forEach(function (t) { tickets[t.id] = t; });
    var groupOf = groupOfDecisionMap(board);
    var groups = board.groups.slice();
    var rootGroup = null;
    groups.forEach(function (g) { if (g.root) rootGroup = g; });
    if (!rootGroup) return null;
    var rootKey = rootGroup.key;

    var nodes = {};
    function node(key, kind, obj) {
      nodes[key] = {
        key: key, kind: kind, obj: obj,
        x: 0, y: 0, w: 0, h: 0,
        level: null, parent: null, children: []
      };
      return nodes[key];
    }
    function ticketSources(t) {
      var out = [];
      (t.derived_from || []).forEach(function (id) {
        if (id && out.indexOf(id) < 0) out.push(id);
      });
      (t.derived_from_inferred || []).forEach(function (id) {
        if (id && out.indexOf(id) < 0) out.push(id);
      });
      return out;
    }
    groups.forEach(function (g) {
      node(g.key, "group", g);
    });
    board.tickets.forEach(function (t) {
      node("ticket:" + t.id, "ticket", t);
    });

    /* 层级：从根出发反复松弛，直到不再变化。环上或没接上的节点放到最底下一层。 */
    var level = {};
    level[rootKey] = 0;
    var changed = true, guard = 0;
    while (changed && guard++ < 80) {
      changed = false;
      board.tickets.forEach(function (t) {
        var key = "ticket:" + t.id;
        var found = [];
        ticketSources(t).forEach(function (did) {
          var gk = groupOf[did];
          if (gk && level[gk] != null) found.push(level[gk]);
        });
        if (found.length) {
          var next = Math.max.apply(null, found) + 1;
          if (level[key] !== next) { level[key] = next; changed = true; }
        }
      });
      groups.forEach(function (g) {
        if (g.root) return;
        var parentLevel = g.ticket ? level["ticket:" + g.ticket] : level[rootKey];
        if (parentLevel != null) {
          var next = parentLevel + 1;
          if (level[g.key] !== next) { level[g.key] = next; changed = true; }
        }
      });
    }

    var maxLevel = 0;
    Object.keys(nodes).forEach(function (key) {
      if (level[key] != null) maxLevel = Math.max(maxLevel, level[key]);
    });
    Object.keys(nodes).forEach(function (key) {
      if (level[key] == null) level[key] = maxLevel + 2;
      nodes[key].level = level[key];
    });

    /* 主来源：票的 confirmed + inferred 来源里取最深的一条；同层优先已确认。
       只有主来源画实线；同层次要来源画短虚线；跨层来源不画线，写在票卡上。 */
    var primary = {}, primaryKey = {}, primaryInferred = {}, edgeModes = {};
    board.tickets.forEach(function (t) {
      var key = "ticket:" + t.id;
      var confirmed = t.derived_from || [];
      var inferred = t.derived_from_inferred || [];
      var candidates = [];
      confirmed.forEach(function (did) {
        if (groupOf[did]) candidates.push({ id: did, inferred: false });
      });
      inferred.forEach(function (did) {
        if (groupOf[did] && confirmed.indexOf(did) < 0) {
          candidates.push({ id: did, inferred: true });
        }
      });
      var best = null;
      candidates.forEach(function (c) {
        var lv = level[groupOf[c.id]];
        if (lv == null) return;
        if (!best || lv > best.level ||
            (lv === best.level && best.inferred && !c.inferred)) {
          best = { id: c.id, inferred: c.inferred, level: lv, key: groupOf[c.id] };
        }
      });
      primary[t.id] = best ? best.id : null;
      primaryKey[t.id] = best ? best.key : rootKey;
      primaryInferred[t.id] = best ? best.inferred : false;
      nodes[key].parent = primaryKey[t.id];

      if (!best) return;
      var mark = function (did) {
        var gk = groupOf[did];
        if (!gk || gk === best.key) return;
        var mode = level[gk] === best.level ? "secondary" : "skip";
        var dedupe = gk + "|" + key;
        if (edgeModes[dedupe] !== "primary") edgeModes[dedupe] = mode;
      };
      ticketSources(t).forEach(function (did) {
        var gk = groupOf[did];
        if (!gk) return;
        if (did === best.id) edgeModes[gk + "|" + key] = "primary";
        else mark(did);
      });
    });
    groups.forEach(function (g) {
      if (g.root) return;
      nodes[g.key].parent = g.ticket ? "ticket:" + g.ticket : rootKey;
    });

    /* 根直接拆出的票不逐条拉线，改用一条水平母线加短竖线。 */
    var rootSource = rootGroup.main;
    var rootTicketKeys = board.tickets.filter(function (t) {
      return primary[t.id] === rootSource;
    }).map(function (t) {
      return "ticket:" + t.id;
    }).sort(function (a, b) {
      return U.natural(a.slice(7), b.slice(7));
    });
    var primaryChildren = {};
    board.tickets.forEach(function (t) {
      var pk = primaryKey[t.id];
      if (!pk || pk === rootKey) return;
      var key = "ticket:" + t.id;
      (primaryChildren[pk] = primaryChildren[pk] || []).push(key);
    });
    Object.keys(primaryChildren).forEach(function (key) {
      primaryChildren[key].sort(function (a, b) {
        return U.natural(a.slice(7), b.slice(7));
      });
    });

    Object.keys(nodes).forEach(function (key) {
      if (key === rootKey) return;
      var n = nodes[key];
      if (!n.parent || !nodes[n.parent]) n.parent = rootKey;
      nodes[n.parent].children.push(key);
    });
    function sortChildren() {
      Object.keys(nodes).forEach(function (key) {
        nodes[key].children.sort(function (a, b) {
          var na = nodes[a], nb = nodes[b];
          if (na.kind !== nb.kind) return na.kind === "ticket" ? -1 : 1;
          var ia = na.kind === "ticket" ? na.obj.id : na.obj.main;
          var ib = nb.kind === "ticket" ? nb.obj.id : nb.obj.main;
          return U.natural(ia, ib);
        });
      });
    }
    sortChildren();

    /* 环或断链上的节点到不了根，统一挂到根下的最底一层，保证 place() 能走到。 */
    (function flattenUnreachable() {
      var seen = {};
      (function walk(key) {
        if (seen[key]) return;
        seen[key] = true;
        nodes[key].children.forEach(walk);
      })(rootKey);
      var unseen = Object.keys(nodes).filter(function (key) { return !seen[key]; });
      if (!unseen.length) return;
      unseen.forEach(function (key) {
        nodes[key].parent = rootKey;
        nodes[key].level = maxLevel + 2;
      });
      Object.keys(nodes).forEach(function (key) { nodes[key].children = []; });
      Object.keys(nodes).forEach(function (key) {
        if (key !== rootKey && nodes[key].parent && nodes[nodes[key].parent]) {
          nodes[nodes[key].parent].children.push(key);
        }
      });
      sortChildren();
    })();

    /* 尺寸 */
    var ROOT_W = 560, GROUP_W = 348, TICKET_W = 320, GAP = 28, MARGIN = 30;

    Object.keys(nodes).forEach(function (key) {
      var n = nodes[key];
      if (n.kind === "group") {
        var g = n.obj;
        if (g.root) {
          var root = decisions[g.main];
          var rootLines = U.wrapLines(root ? root.statement : "", U.lineChars(ROOT_W, 14, 28)).length;
          n.w = ROOT_W;
          n.h = Math.round(76 + rootLines * 20);
        } else {
          n.w = GROUP_W;
          n.h = groupHeight(g, decisions);
        }
      } else {
        n.w = TICKET_W;
        n.h = ticketHeight(n.obj);
      }
    });

    /* 子树宽度 */
    var blockW = {};
    function subW(key) {
      if (blockW[key] != null) return blockW[key];
      var kids = nodes[key].children, sum = 0;
      kids.forEach(function (k) { sum += subW(k); });
      if (kids.length) sum += GAP * (kids.length - 1);
      blockW[key] = Math.max(nodes[key].w, sum);
      return blockW[key];
    }
    subW(rootKey);

    var levelMaxH = {}, levelY = {};
    Object.keys(nodes).forEach(function (key) {
      var n = nodes[key];
      levelMaxH[n.level] = Math.max(levelMaxH[n.level] || 0, n.h);
    });
    var y = MARGIN;
    for (var lv = 0; lv <= maxLevel + 2; lv++) {
      levelY[lv] = y;
      y += (levelMaxH[lv] || 0) + 64;
    }

    function place(key, left) {
      var n = nodes[key];
      var w = subW(key), kids = n.children;
      var sum = 0;
      kids.forEach(function (k) { sum += subW(k); });
      if (kids.length) sum += GAP * (kids.length - 1);
      var cursor = left + (w - sum) / 2, kidX = {};
      kids.forEach(function (k) { kidX[k] = cursor; cursor += subW(k) + GAP; });
      var px = left + (w - n.w) / 2;
      if (kids.length && key !== rootKey) {
        var first = kids[0];
        px = kidX[first] + (subW(first) - nodes[first].w) / 2;
        px = Math.max(left, Math.min(left + w - n.w, px));
      }
      n.x = px;
      n.y = levelY[n.level] || MARGIN;
      kids.forEach(function (k) { place(k, kidX[k]); });
    }
    place(rootKey, MARGIN);

    var worldW = Math.max(980, MARGIN * 2 + subW(rootKey));
    var worldH = Math.max(640, y - 64 + MARGIN);

    return {
      nodes: nodes, rootKey: rootKey, groupOf: groupOf,
      primary: primary, primaryKey: primaryKey,
      primaryInferred: primaryInferred, edgeModes: edgeModes,
      rootSource: rootSource, rootTicketKeys: rootTicketKeys,
      primaryChildren: primaryChildren, busRailY: levelY[1] != null ? levelY[1] - 24 : null,
      worldW: worldW, worldH: worldH
    };
  }

  function premiseBlockLines(p, w) {
    var chars = U.lineChars(w, 10, 40);
    var evChars = U.lineChars(w, 8.8, 40);
    var stmt = U.wrapLines(p.statement || "", chars);
    var ev = [];
    (p.evidence || []).forEach(function (e) {
      ev = ev.concat(U.wrapLines("证据：" + e, evChars));
    });
    var judge = [];
    if (p.last_judged_at || p.last_judged_by) {
      var who = p.last_judged_by || "—";
      var when = p.last_judged_at ? U.fmtTs(p.last_judged_at) : "";
      judge.push({ text: "判定：" + who + (when ? " · " + when : ""), cls: "pr-a-judge" });
      if (p.last_judged_reason) {
        U.wrapLines("理由：" + p.last_judged_reason, evChars).forEach(function (line) {
          judge.push({ text: line, cls: "pr-a-ev" });
        });
      }
    } else {
      judge.push({ text: "还没判过", cls: "pr-a-ev" });
    }
    return { stmt: stmt, ev: ev, judge: judge };
  }

  function premiseBlockHeight(p, w) {
    var l = premiseBlockLines(p, w);
    return Math.round(32 + l.stmt.length * 13 + l.ev.length * 11.5 + l.judge.length * 11.5 + 14);
  }

  function premiseBlockSvg(p, w, y) {
    var l = premiseBlockLines(p, w);
    var out = '<g class="pr-a" transform="translate(0,' + y + ')">' +
      '<line class="dec-sep" x1="12" x2="' + (w - 12) + '" y1="0" y2="0"></line>' +
      '<text class="pr-a-label" x="12" y="16">依赖前提 ' + U.esc(p.id) + " · " + U.esc(p.state) + "</text>";
    var yy = 32;
    l.stmt.forEach(function (line) {
      out += '<text class="pr-a-stmt" x="12" y="' + yy + '">' + U.esc(line) + "</text>";
      yy += 13;
    });
    l.ev.forEach(function (line) {
      out += '<text class="pr-a-ev" x="12" y="' + yy + '">' + U.esc(line) + "</text>";
      yy += 11.5;
    });
    l.judge.forEach(function (row) {
      out += '<text class="' + row.cls + '" x="12" y="' + yy + '">' + U.esc(row.text) + "</text>";
      yy += 11.5;
    });
    return out + "</g>";
  }

  function subRowHeight(d, w) {
    var lines = U.wrapLines(d.statement || "", U.lineChars(w, 10.5, 82)).length;
    return Math.max(24, Math.round(lines * 13.5 + 8));
  }

  function groupHeight(g, decisions) {
    var main = decisions[g.main] || { statement: "" };
    var lines = U.wrapLines(main.statement, U.lineChars(348, 12.5, 24)).length;
    var h = 44 + lines * 17.5 + 20;
    (main.premises || []).forEach(function (p) {
      h += premiseBlockHeight(p, 348);
    });
    var subs = g.decisions.length - 1;
    if (subs > 0) {
      h += 28;
      g.decisions.slice(1).forEach(function (id) {
        h += subRowHeight(decisions[id] || { statement: "" }, 348);
      });
    }
    return Math.round(h + 12);
  }

  function ticketHeight(t) {
    var w = 320;
    var tl = U.wrapLines(t.title, U.lineChars(w, 11.5, 22)).length;
    var why = t.split_reason || "";
    var wl = why ? U.wrapLines("拆票理由：" + why, U.lineChars(w, 9.5, 24)).length : 0;
    return Math.round(30 + tl * 15 + 8 + 28 + (why ? 6 + wl * 12.5 : 0) + 14);
  }

  function scopeHit(scope, key) {
    if (!scope) return true;
    var n = LAST.nodes[key];
    if (!n) return false;
    if (n.kind === "group") {
      return n.obj.decisions.some(function (d) { return scope.decisions.has(d); });
    }
    return scope.tickets.has(n.obj.id);
  }

  function filterHit(targets, key) {
    if (!targets) return true;
    var n = LAST.nodes[key];
    if (!n) return false;
    if (n.kind === "group") {
      return n.obj.decisions.some(function (d) { return targets.has("decision:" + d); });
    }
    return targets.has("ticket:" + n.obj.id);
  }

  function pendingHit(scope, key) {
    if (!scope || !scope.pendingDecisions || !scope.pendingTickets) return false;
    var n = LAST.nodes[key];
    if (!n) return false;
    if (n.kind === "group") {
      return n.obj.decisions.some(function (d) { return scope.pendingDecisions.has(d); });
    }
    return scope.pendingTickets.has(n.obj.id);
  }

  function selectedHit(sel, key) {
    if (!sel) return false;
    var n = LAST.nodes[key];
    if (!n) return false;
    if (n.kind === "group") {
      var did = sel.indexOf("decision:") === 0 ? sel.slice(9) : null;
      return did ? n.obj.decisions.indexOf(did) >= 0 : false;
    }
    return sel === "ticket:" + n.obj.id;
  }

  function nodeClass(key, extra) {
    var cls = ["node-a", extra || ""];
    if (!scopeHit(LAST.scope, key)) cls.push("dim");
    else if (LAST.scope) cls.push(pendingHit(LAST.scope, key) ? "impact" : "scoped");
    if (LAST.filterTargets && !filterHit(LAST.filterTargets, key)) cls.push("dim");
    if (selectedHit(LAST.sel, key)) cls.push("sel");
    return cls.join(" ");
  }

  function decisionGroupSvg(key) {
    var n = LAST.nodes[key], g = n.obj;
    var main = LAST.decisions[g.main] || { id: g.main, statement: "", status: "active", premises: [] };
    if (g.root) return rootSvg(n, main);
    var tone = U.decisionTone(main);
    var stmtLines = U.wrapLines(main.statement, U.lineChars(n.w, 12.5, 24));
    var stmt = stmtLines.map(function (line, i) {
      return '<tspan x="12" dy="' + (i === 0 ? 0 : 17.5) + '">' + U.esc(line) + "</tspan>";
    }).join("");
    var metaY = Math.round(44 + stmtLines.length * 17.5 + 14);
    var badge = main.status !== "active" ? U.statusLabel(main.status)
      : (tone === "red" ? "前提已破" : tone === "green" ? "前提全成立"
        : tone === "amber" ? "前提未验 / 未知" : "");
    if (main.supersedes && main.supersedes.length) {
      badge = "取代 " + main.supersedes.join("、") + (badge ? " · " + badge : "");
    }
    var premises = main.premises || [];
    var meta = "由 #" + U.esc(g.ticket || "—") + " 产出 · " +
      (premises.length ? premises.length + " 条前提" : "没有记录前提");
    var out = '<g class="' + nodeClass(key, tone) + '" data-act="select" data-val="decision:' + U.esc(main.id) + '" transform="translate(' + n.x + ',' + n.y + ')" title="' + U.esc(main.statement) + '">' +
      '<rect class="nrect-a" width="' + n.w + '" height="' + n.h + '" rx="11"></rect>' +
      '<text class="na-id" x="12" y="20">' + U.esc(main.id) + "</text>" +
      '<circle class="dot ' + U.toneClass(tone) + '" cx="' + (n.w - 14) + '" cy="16" r="4.5"></circle>' +
      '<text class="na-stmt" x="12" y="44">' + stmt + "</text>" +
      '<text class="na-meta" x="12" y="' + metaY + '">' + U.esc(meta) + "</text>" +
      (badge ? '<text class="na-badge" x="' + (n.w - 12) + '" y="' + metaY + '" text-anchor="end">' + U.esc(badge) + "</text>" : "");
    var cursor = metaY + 8;
    premises.forEach(function (p) {
      out += premiseBlockSvg(p, n.w, cursor);
      cursor += premiseBlockHeight(p, n.w);
    });
    var subs = g.decisions.slice(1);
    if (subs.length) {
      out += '<line class="dec-sep" x1="12" x2="' + (n.w - 12) + '" y1="' + cursor + '" y2="' + cursor + '"></line>';
      cursor += 18;
      out += '<text class="dec-sub-label" x="12" y="' + cursor + '">同一张票产出的另外 ' + subs.length + " 条决定</text>";
      cursor += 10;
      subs.forEach(function (id) {
        var d = LAST.decisions[id] || { id: id, statement: "", status: "active", premises: [] };
        var lines = U.wrapLines(d.statement, U.lineChars(n.w, 10.5, 82));
        var rowH = subRowHeight(d, n.w);
        out += '<g class="dec-extra-row" data-act="select" data-val="decision:' + U.esc(id) + '" transform="translate(0,' + cursor + ')">' +
          '<rect x="6" y="2" width="' + (n.w - 12) + '" height="' + (rowH - 2) + '" rx="5"></rect>' +
          '<circle class="dot ' + U.toneClass(U.decisionTone(d)) + '" cx="60" cy="12" r="3"></circle>' +
          '<text class="ex-id" x="12" y="16">' + U.esc(id) + "</text>" +
          lines.map(function (line, i) {
            return '<text class="dec-sub-stmt" x="70" y="' + (16 + i * 13.5) + '">' + U.esc(line) + "</text>";
          }).join("") + "</g>";
        cursor += rowH;
      });
    }
    return out + "</g>";
  }

  function rootSvg(n, root) {
    var tone = "root";
    var lines = U.wrapLines(root.statement || "", U.lineChars(n.w, 14, 28));
    var stmt = lines.map(function (line, i) {
      return '<tspan x="16" dy="' + (i === 0 ? 0 : 20) + '">' + U.esc(line) + "</tspan>";
    }).join("");
    var open = LAST.board.tickets.filter(function (t) { return t.state === "open"; }).length;
    var meta = "根决定 · " + (LAST.board.fragments || []).length + " 句拆句 · " +
      LAST.board.tickets.length + " 张票 · " + open + " 张开放";
    return '<g class="' + nodeClass(n.key, "root") + '" data-act="select" data-val="decision:' + U.esc(root.id) + '" transform="translate(' + n.x + ',' + n.y + ')" title="' + U.esc(root.statement) + '">' +
      '<rect class="nrect-a" width="' + n.w + '" height="' + n.h + '" rx="12"></rect>' +
      '<text class="na-id" x="16" y="22">' + U.esc(root.id) + "</text>" +
      '<circle class="dot accent" cx="' + (n.w - 16) + '" cy="18" r="5"></circle>' +
      '<text class="na-stmt" x="16" y="52">' + stmt + "</text>" +
      '<text class="na-meta" x="16" y="' + (n.h - 14) + '">' + U.esc(meta) + "</text></g>";
  }

  function fromLabel(t) {
    var confirmed = (t.derived_from || []).filter(Boolean);
    var inferred = (t.derived_from_inferred || []).filter(function (id) {
      return id && confirmed.indexOf(id) < 0;
    });
    if (!confirmed.length && !inferred.length) return "无来源决定";
    function nameOf(id, isInferred) {
      var d = LAST.decisions[id];
      var base = d && d.root_of ? "根决定" : id;
      if (!d) base = id + "（跨图）";
      return base + (isInferred ? "（推断）" : "");
    }
    var names = confirmed.map(function (id) { return nameOf(id, false); })
      .concat(inferred.map(function (id) { return nameOf(id, true); }));
    if (names.length === 1 && !inferred.length && confirmed.length === 1 &&
        LAST.decisions[confirmed[0]] && LAST.decisions[confirmed[0]].root_of) {
      return "从根决定拆出";
    }
    var label = names.length <= 2 ? "从 " + names.join("、") + " 拆出"
      : "从 " + names[0] + " 等 " + names.length + " 条决定拆出";
    return label;
  }

  function toLabel(t, decisions) {
    var ps = t.produces || [];
    if (!ps.length) return "还没有产出决定";
    if (ps.length <= 2) return "产出 " + ps.join("、");
    return "产出 " + ps[0] + " 等 " + ps.length + " 条";
  }

  function coverLabel(t) {
    var nums = (t.covers || []).map(U.fragNum).filter(function (n) { return n != null; });
    return nums.length ? "覆盖第 " + nums.join("、") + " 句" : "未接句";
  }

  function ticketSvg(key) {
    var t = LAST.nodes[key].obj;
    var n = LAST.nodes[key];
    var type = t.type || "task";
    var closed = t.state === "closed";
    var typeW = Math.max(34, type.length * 6.4 + 12);
    var work = t.work || "未领取";
    var lines = U.wrapLines(t.title, U.lineChars(n.w, 11.5, 22));
    var title = lines.map(function (line, i) {
      return '<tspan x="12" dy="' + (i === 0 ? 0 : 15) + '">' + U.esc(line) + "</tspan>";
    }).join("");
    var yRel = 42 + (lines.length - 1) * 15 + 20;
    var why = t.split_reason || "";
    var whyLines = why ? U.wrapLines("拆票理由：" + why, U.lineChars(n.w, 9.5, 24)) : [];
    var whySvg = whyLines.map(function (line, i) {
      return '<tspan x="12" dy="' + (i === 0 ? 0 : 12.5) + '">' + U.esc(line) + "</tspan>";
    }).join("");
    var toCls = (t.produces || []).length ? "tn-to" : "tn-to empty";
    var cls = ["tnode-a", closed ? "closed" : "open"];
    if (!scopeHit(LAST.scope, key)) cls.push("dim");
    else if (LAST.scope) cls.push(pendingHit(LAST.scope, key) ? "impact" : "scoped");
    if (LAST.filterTargets && !filterHit(LAST.filterTargets, key)) cls.push("dim");
    if (selectedHit(LAST.sel, key)) cls.push("sel");
    return '<g class="' + cls.join(" ") + '" data-act="select" data-val="ticket:' + U.esc(t.id) + '" transform="translate(' + n.x + ',' + n.y + ')" title="' + U.esc(type + " · " + work + " · " + t.title + (why ? " · " + why : "")) + '">' +
      '<rect class="trect" width="' + n.w + '" height="' + n.h + '" rx="10"></rect>' +
      '<rect class="tbar ' + (closed ? "done" : "wait") + '" x="1" y="7" width="3.5" height="' + (n.h - 14) + '" rx="1.75"></rect>' +
      '<rect class="type-pill type-' + U.esc(type) + '" x="12" y="8" width="' + typeW + '" height="17" rx="5"></rect>' +
      '<text class="tn-type type-' + U.esc(type) + '" x="' + (12 + typeW / 2) + '" y="20" text-anchor="middle">' + U.esc(type) + "</text>" +
      '<text class="tn-id" x="' + (12 + typeW + 7) + '" y="20">#' + U.esc(t.id) + "</text>" +
      '<text class="tn-meta" x="' + (n.w - 20) + '" y="20" text-anchor="end">' + U.esc(work) + "</text>" +
      '<circle class="dot ' + U.workTone(work) + '" cx="' + (n.w - 9) + '" cy="17" r="3.5"></circle>' +
      '<text class="tn-title" x="12" y="42">' + title + "</text>" +
      '<circle class="rel-dot from" cx="15" cy="' + (yRel - 3.5) + '" r="2.6"></circle>' +
      '<text class="tn-from" x="23" y="' + yRel + '">' + U.esc(fromLabel(t)) + "</text>" +
      '<circle class="rel-dot to" cx="15" cy="' + (yRel + 9.5) + '" r="2.6"></circle>' +
      '<text class="' + toCls + '" x="23" y="' + (yRel + 13) + '">' + U.esc(toLabel(t, LAST.decisions)) + "</text>" +
      '<text class="tn-cover" x="' + (n.w - 12) + '" y="' + (yRel + 13) + '" text-anchor="end">' + U.esc(coverLabel(t)) + "</text>" +
      (whySvg ? '<text class="tn-why" x="12" y="' + (yRel + 29) + '">' + whySvg + "</text>" : "") +
      "</g>";
  }

  function edgePath(a, b, kind) {
    var sx = a.x + a.w / 2, sy = a.y + a.h;
    var tx = b.x + b.w / 2, ty = b.y;
    if (ty > sy + 8) {
      var my = (sy + ty) / 2;
      return "M " + sx + " " + sy + " C " + sx + " " + my + ", " + tx + " " + my + ", " + tx + " " + ty;
    }
    if (kind === "supersedes") {
      var lift = Math.max(30, Math.abs(tx - sx) * 0.12);
      return "M " + sx + " " + sy + " C " + sx + " " + (sy + lift) + ", " + tx + " " + (ty - lift) + ", " + tx + " " + ty;
    }
    var side = tx >= sx ? 1 : -1;
    return "M " + sx + " " + sy + " C " + (sx + side * 60) + " " + (sy + 40) + ", " +
      (tx + side * 60) + " " + (ty - 40) + ", " + tx + " " + ty;
  }

  function edgesSvg() {
    var parts = [];
    var seen = {};
    LAST.board.edges.forEach(function (edge) {
      var fromKey = edge.from.indexOf("decision:") === 0 ? LAST.groupOf[edge.from.slice(9)] : edge.from;
      var toKey = edge.to.indexOf("decision:") === 0 ? LAST.groupOf[edge.to.slice(9)] : edge.to;
      if (!fromKey || !toKey || fromKey === toKey) return;
      var kind = edge.kind;
      var mode = null;
      if (kind === "derived") {
        mode = LAST.edgeModes[fromKey + "|" + toKey];
        if (mode !== "primary" && mode !== "secondary") return;
        if (mode === "primary" && LAST.rootTicketKeys.indexOf(toKey) >= 0) return;
      }
      var dedupe = kind + "|" + fromKey + "|" + toKey + "|" + (edge.inferred ? "i" : "c");
      if (seen[dedupe]) return;
      seen[dedupe] = true;
      var a = LAST.nodes[fromKey], b = LAST.nodes[toKey];
      if (!a || !b) return;
      var cls = ["edge-a"];
      if (kind === "produced") cls.push("strong");
      else if (kind === "derived") {
        cls.push("derive", mode);
        if (edge.inferred) cls.push("inferred");
      }
      else if (kind === "supersedes") cls.push("supersede");
      if (LAST.scope) {
        if (scopeHit(LAST.scope, fromKey) && scopeHit(LAST.scope, toKey)) {
          cls.push(pendingHit(LAST.scope, fromKey) || pendingHit(LAST.scope, toKey) ? "impact" : "scoped");
        } else {
          cls.push("dim");
        }
      }
      if (LAST.filterTargets && !(filterHit(LAST.filterTargets, fromKey) && filterHit(LAST.filterTargets, toKey))) cls.push("dim");
      if (LAST.sel) {
        var fromSel = selectedHit(LAST.sel, fromKey), toSel = selectedHit(LAST.sel, toKey);
        cls.push(fromSel || toSel ? "sel" : "dim");
      }
      var d;
      if (kind === "derived" && mode === "primary") {
        var kids = LAST.primaryChildren[fromKey] || [];
        var idx = kids.indexOf(toKey);
        if (idx < 0) idx = 0;
        var n = Math.max(1, kids.length);
        var sx = a.x + a.w * ((idx + 1) / (n + 1));
        d = "M " + sx + " " + (a.y + a.h) + " L " + (b.x + b.w / 2) + " " + b.y;
      } else if (kind === "produced") {
        d = "M " + (a.x + a.w / 2) + " " + (a.y + a.h) + " L " + (b.x + b.w / 2) + " " + b.y;
      } else {
        d = edgePath(a, b, kind);
      }
      parts.push('<g class="' + cls.join(" ") + '"><path d="' + d + '" marker-end="url(#arrowG)"></path></g>');
      if (kind === "supersedes") {
        var mx = (a.x + a.w / 2 + b.x + b.w / 2) / 2;
        var my = (a.y + a.h + b.y) / 2;
        parts.push('<text class="edge-label" x="' + mx + '" y="' + my + '" text-anchor="middle">取代</text>');
      }
    });
    return parts.join("");
  }

  /* 根直接拆出的票：一条水平母线，下面每个票一根短竖线，不画几十条长曲线。 */
  function busSvg() {
    var keys = LAST.rootTicketKeys || [];
    var root = LAST.nodes[LAST.rootKey];
    if (!keys.length || !root || LAST.busRailY == null) return "";
    var positions = keys.map(function (key) { return LAST.nodes[key]; }).filter(Boolean);
    if (!positions.length) return "";
    var busY = LAST.busRailY;
    var centerX = positions.map(function (n) { return n.x + n.w / 2; });
    var minX = Math.min.apply(null, centerX);
    var maxX = Math.max.apply(null, centerX);
    var trunkX = root.x + root.w / 2;

    var busCls = ["bus-a"];
    var rootSel = false;
    if (LAST.sel) {
      rootSel = selectedHit(LAST.sel, LAST.rootKey);
      var anyTicketSel = keys.some(function (key) { return selectedHit(LAST.sel, key); });
      busCls.push(rootSel || anyTicketSel ? "sel" : "dim");
    }
    if (LAST.scope && !keys.some(function (key) { return scopeHit(LAST.scope, key); })) {
      busCls.push("dim");
    }
    if (LAST.filterTargets && !keys.some(function (key) { return filterHit(LAST.filterTargets, key); })) {
      busCls.push("dim");
    }
    var parts = [
      '<g class="' + busCls.join(" ") + '">' +
      '<path d="M ' + trunkX + " " + (root.y + root.h) + " V " + busY +
      " M " + minX + " " + busY + " H " + maxX + '"></path>' +
      '<text class="bus-label-a" x="' + (trunkX + 8) + '" y="' + (busY - 7) + '">' +
      U.esc(LAST.rootSource) + " 拆出 " + keys.length + " 张票</text></g>"
    ];
    keys.forEach(function (key) {
      var n = LAST.nodes[key];
      if (!n) return;
      var cls = ["branch-a"];
      if (n.obj.state === "closed") cls.push("done");
      if (LAST.primaryInferred[n.obj.id]) cls.push("inferred");
      if (LAST.sel) cls.push(rootSel || selectedHit(LAST.sel, key) ? "sel" : "dim");
      if (LAST.scope && !scopeHit(LAST.scope, key)) cls.push("dim");
      if (LAST.filterTargets && !filterHit(LAST.filterTargets, key)) cls.push("dim");
      var x = n.x + n.w / 2;
      parts.push('<path class="' + cls.join(" ") + '" d="M ' + x + " " + busY + " V " + n.y + '"></path>');
    });
    return parts.join("");
  }

  function render(board, opts) {
    var model = build(board, opts);
    if (!model) return { html: "", ok: false };
    model.board = board;
    model.decisions = {};
    board.decisions.forEach(function (d) { model.decisions[d.id] = d; });
    model.scope = opts.scope || null;
    model.filterTargets = opts.filterTargets || null;
    model.sel = opts.sel || null;
    LAST = model;
    if (opts.view) VIEW = opts.view;
    var nodes = [];
    Object.keys(model.nodes).forEach(function (key) {
      var n = model.nodes[key];
      if (n.kind === "group") nodes.push(decisionGroupSvg(key));
      else nodes.push(ticketSvg(key));
    });
    var v = VIEW || { x: 0, y: 0, k: 1 };
    var html = '<div class="graph-a" data-graph="1"><svg class="graph-a-svg" role="img" aria-label="决策图">' +
      '<defs><marker id="arrowG" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
      '<path d="M 0 0 L 10 5 L 0 10 z" fill="var(--arrow)"></path></marker></defs>' +
      '<g id="graphWorld" transform="translate(' + v.x + "," + v.y + ") scale(" + v.k + ')">' +
      '<g class="edges-g">' + edgesSvg() + busSvg() + "</g>" +
      '<g class="nodes-g">' + nodes.join("") + "</g></g></svg>" +
      '<div class="graph-a-tools"><button data-act="zoom" data-val="out" aria-label="缩小">−</button>' +
      '<span class="zoom-pct">' + Math.round(v.k * 100) + '%</span>' +
      '<button data-act="zoom" data-val="in" aria-label="放大">＋</button>' +
      '<button data-act="zoom" data-val="fit">适应</button></div>' +
      '<div class="graph-a-hint">拖动空白平移 · 滚轮缩放 · 双击适应 · 点节点打开详情 · 根 → 票 → 决定 → 票 → 决定，实线主来源，短虚线同层次要来源，蓝色虚线推断来源，跨层来源写在票卡上</div></div>';
    return { html: html, ok: true };
  }

  function apply() {
    var g = document.getElementById("graphWorld");
    if (g && VIEW) g.setAttribute("transform", "translate(" + VIEW.x + "," + VIEW.y + ") scale(" + VIEW.k + ")");
    var pct = document.querySelector(".graph-a .zoom-pct");
    if (pct && VIEW) pct.textContent = Math.round(VIEW.k * 100) + "%";
  }

  function bounds() {
    if (!LAST) return { x: 0, y: 0, w: 1000, h: 700 };
    var minX = 0, minY = 0, maxX = LAST.worldW, maxY = LAST.worldH;
    Object.keys(LAST.nodes).forEach(function (key) {
      var n = LAST.nodes[key];
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.w);
      maxY = Math.max(maxY, n.y + n.h);
    });
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  function fit() {
    var wrap = document.querySelector(".graph-a");
    if (!wrap || !LAST) return;
    var rect = wrap.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var b = bounds(), pad = 26;
    var k = Math.min(1.05, (rect.width - pad * 2) / b.w, (rect.height - pad * 2) / b.h);
    k = Math.max(0.05, k);
    VIEW = {
      k: k,
      x: (rect.width - b.w * k) / 2 - b.x * k,
      y: (rect.height - b.h * k) / 2 - b.y * k
    };
    apply();
  }

  function focusTargets(keys) {
    var wrap = document.querySelector(".graph-a");
    if (!wrap || !LAST || !keys || !keys.length) return;
    var picked = {};
    keys.forEach(function (key) {
      var nodeKey = key.indexOf("decision:") === 0 ? LAST.groupOf[key.slice(9)] : key;
      if (LAST.nodes[nodeKey]) picked[nodeKey] = LAST.nodes[nodeKey];
    });
    var list = Object.keys(picked).map(function (k) { return picked[k]; });
    if (!list.length) return;
    var rect = wrap.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    list.forEach(function (n) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.w);
      maxY = Math.max(maxY, n.y + n.h);
    });
    var pad = 70, w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);
    var k = Math.min(1.05, (rect.width - pad * 2) / w, (rect.height - pad * 2) / h);
    k = Math.max(0.16, k);
    VIEW = {
      k: k,
      x: (rect.width - w * k) / 2 - minX * k,
      y: (rect.height - h * k) / 2 - minY * k
    };
    apply();
  }

  function initialView() {
    var wrap = document.querySelector(".graph-a");
    if (!wrap || !LAST) return;
    var rect = wrap.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var b = bounds(), pad = 22;
    var k = Math.min(1, Math.max(0.72, (rect.height - pad * 2) / Math.max(400, b.h)));
    var root = LAST.nodes[LAST.rootKey] || { x: 0, y: 0, w: 0 };
    VIEW = {
      k: k,
      x: rect.width / 2 - (root.x + root.w / 2) * k,
      y: pad - root.y * k
    };
    apply();
  }

  function zoomAt(factor, px, py) {
    var wrap = document.querySelector(".graph-a");
    if (!wrap) return;
    if (!VIEW) fit();
    if (!VIEW) return;
    var rect = wrap.getBoundingClientRect();
    if (px == null) px = rect.width / 2;
    if (py == null) py = rect.height / 2;
    var k = Math.min(2.4, Math.max(0.05, VIEW.k * factor));
    var wx = (px - VIEW.x) / VIEW.k, wy = (py - VIEW.y) / VIEW.k;
    VIEW = { k: k, x: px - wx * k, y: py - wy * k };
    apply();
  }

  function panBy(dx, dy) {
    if (!VIEW) fit();
    if (!VIEW) return;
    VIEW = { k: VIEW.k, x: VIEW.x + dx, y: VIEW.y + dy };
    apply();
  }

  function mount() {
    if (!VIEW) initialView(); else apply();
  }

  function setView(v) { VIEW = v; apply(); }
  function getView() { return VIEW; }
  function reset() { VIEW = null; }

  window.BoardGraph = {
    render: render, mount: mount, fit: fit, focusTargets: focusTargets,
    zoomAt: zoomAt, panBy: panBy,
    setView: setView, getView: getView, reset: reset,
    build: build
  };
})();
