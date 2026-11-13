/* 侧边栏、覆盖表、影响清单和信号面板。 */
(function () {
  "use strict";
  var U = window.U;

  function index(board) {
    var decisions = {}, tickets = {}, premises = {}, byDecision = {};
    board.decisions.forEach(function (d) { decisions[d.id] = d; });
    board.tickets.forEach(function (t) { tickets[t.id] = t; });
    board.decisions.forEach(function (d) {
      (d.premises || []).forEach(function (p) {
        premises[p.id] = p;
        (byDecision[d.id] = byDecision[d.id] || []).push(p);
      });
    });
    return { decisions: decisions, tickets: tickets, premises: premises, byDecision: byDecision };
  }

  function groupOf(board, decisionId) {
    for (var i = 0; i < board.groups.length; i++) {
      if (board.groups[i].decisions.indexOf(decisionId) >= 0) return board.groups[i];
    }
    return null;
  }

  function sourceTicket(board, decision) {
    return decision && decision.source_ticket ? (index(board).tickets[decision.source_ticket] || null) : null;
  }

  function signalBadges(board, key) {
    var out = [];
    (board.signals || []).forEach(function (s) {
      if ((s.targets || []).indexOf(key) >= 0) {
        out.push('<span class="chip ' + U.esc(s.tone) + '">' + U.esc(s.label) + "</span>");
      }
    });
    return out.join("");
  }

  function signalPanel(board) {
    var items = (board.signals || []).map(function (s) {
      return '<button class="sig" data-act="signal" data-val="' + U.esc(s.key) + '" title="' + U.esc(s.hint) + '">' +
        '<span class="sig-dot ' + U.esc(s.tone) + '"></span>' +
        '<span class="sig-label">' + U.esc(s.label) + "</span>" +
        '<span class="sig-count' + (s.count ? "" : " zero") + '">' + s.count + "</span></button>" +
        '<div class="sig-hint">' + U.esc(s.hint) + "</div>";
    }).join("");
    return '<div class="signal-panel"><h3>' + (board.signals || []).length + ' 类视觉信号</h3><div class="sig-list">' + items + "</div></div>";
  }

  function signalChips(board) {
    var items = (board.signals || []).map(function (s) {
      return '<button class="sig-chip" data-act="signal" data-val="' + U.esc(s.key) + '" title="' + U.esc(s.hint) + '">' +
        '<span class="sig-dot ' + U.esc(s.tone) + '"></span>' + U.esc(s.label) + "<b>" + s.count + "</b></button>";
    }).join("");
    return '<div class="sig-chips">' + items + "</div>";
  }

  function filterBanner(board, filter) {
    if (!filter) return "";
    var s = (board.signals || []).filter(function (x) { return x.key === filter; })[0];
    if (!s) return "";
    return '<div class="filter-banner"><b>信号：' + U.esc(s.label) + "</b><span>" + U.esc(s.hint) +
      "</span><span style=\"flex:1\"></span><button class=\"btn small ghost\" data-act=\"clear-filter\">清除</button></div>";
  }

  function premiseImpact(board, decisionId) {
    var cases = (board.impact_cases || []).filter(function (c) {
      return c.trigger_decision === decisionId;
    });
    if (!cases.length) return "";
    return cases.map(function (c) {
      var pending = c.items.filter(function (i) { return i.status === "待处理"; }).length;
      return '<div class="impact-line ' + (c.status === "open" ? "hot" : "") + '"><span class="il-k">影响清单</span>' +
        '<div class="il-v"><b>' + U.esc(c.id) + "</b> " +
        (c.status === "open" ? "开着，还有 " + pending + " 项待处理" : "已关闭") +
        ' · 触发：' + U.esc(triggerLabel(c.trigger)) + "</div></div>";
    }).join("");
  }

  function triggerLabel(t) {
    return { premise_broken: "前提判破", overturn: "决定被推翻", void: "决定作废", root_replaced: "终点换根" }[t] || t;
  }

  function checkLabel(t) {
    return {
      closed_without_merge: "PR 关闭未合并", sha_mismatch: "SHA 不符",
      gh_unavailable: "gh 调不到", merged: "已合并", waiting_merge: "还没合并"
    }[t] || t;
  }

  function decisionPanel(board, did, sel) {
    var ix = index(board);
    var d = ix.decisions[did];
    if (!d) return emptySidebar(board);
    var group = groupOf(board, did);
    var premises = d.premises || [];
    var ticket = sourceTicket(board, d);
    var supersededBy = d.superseded_by ? ix.decisions[d.superseded_by] : null;
    var supersedes = (d.supersedes || []).map(function (id) { return ix.decisions[id]; }).filter(Boolean);
    var derivedTickets = board.tickets.filter(function (t) {
      return (t.derived_from || []).indexOf(did) >= 0;
    });
    var siblings = group ? group.decisions.filter(function (id) { return id !== did; }) : [];

    var premRows = premises.map(function (p) {
      var tone = U.premiseTone(p);
      return '<details class="p-line ' + tone + '">' +
        '<summary><span class="pl-id">' + U.esc(p.id) + "</span>" + U.stateChip(p.state) +
        '<span class="pl-stmt">' + U.esc(p.statement) + "</span></summary>" +
        '<div class="pl-body"><ol class="p-timeline">' +
        '<li><span class="step-label">原前提</span><p>' + U.esc(p.statement) + "</p></li>" +
        '<li><span class="step-label">证据</span><p>' + (p.evidence && p.evidence.length ? U.esc(p.evidence.join(" · ")) : "没有记录证据") + "</p></li>" +
        '<li><span class="step-label">判定</span><p>' + (p.last_judged_at
          ? U.esc(U.fmtTs(p.last_judged_at)) + "，" + U.esc(p.last_judged_by || "未记") + " 判 " + U.esc(p.state)
          : "还没判过") + "</p></li>" +
        "</ol>" +
        '<div class="sb-quiet" style="margin-top:6px">判定理由：' +
        (p.last_judged_at ? (p.last_judged_reason ? U.esc(p.last_judged_reason) : "未记录") : "还没判过") +
        "</div>" +
        '<div class="sb-actions">' +
        '<button class="btn small" data-act="modal" data-val="judge-premise" data-arg="' + U.esc(p.id) + '">判前提</button>' +
        (p.last_judged_at ? '<button class="btn small" data-act="modal" data-val="annotate-premise" data-arg="' + U.esc(p.id) + '">改判定理由</button>' : "") +
        "</div></div></details>";
    }).join("");
    var premBody = premises.length ? premRows :
      '<div class="sb-empty">没有记录前提。这条决定不会被前提判破自动标红，只能靠人想起。</div>';

    var files = (d.output_files || []).length
      ? '<dl class="sb-kv" style="margin-top:9px"><dt>产出文件</dt><dd>' +
        d.output_files.map(function (f) { return '<code class="mono" style="font-size:11px">' + U.esc(f) + "</code>"; }).join("<br>") +
        "</dd></dl>"
      : "";
    var basis = '<p class="sb-lead">' + U.esc(d.statement) + "</p>" +
      '<div class="sb-quiet" style="margin-top:8px">' + (d.created_by ? U.esc(d.created_by) + " · " : "") + U.esc(U.fmtTs(d.created_at)) + "</div>" +
      '<p class="sb-p" style="margin-top:9px">决定依据：' + (d.rationale ? U.esc(d.rationale) : "未记录") + "</p>" +
      (d.rationale_source ? '<div class="sb-quiet">来源：' + U.esc(d.rationale_source) + "</div>" : "") +
      '<div class="sb-actions"><button class="btn small" data-act="modal" data-val="annotate-decision" data-arg="' + U.esc(d.id) + '">编辑依据</button></div>' +
      files;

    var relRows = [];
    if (ticket) {
      relRows.push('<div class="sb-quiet" style="margin-bottom:6px">来源票</div>' +
        '<div class="prod-row" data-act="select" data-val="ticket:' + U.esc(ticket.id) + '">' +
        '<span class="pr-id">#' + U.esc(ticket.id) + '</span><span class="pr-role">' + U.esc(ticket.title) + "</span></div>");
    } else if (!d.root_of) {
      relRows.push('<div class="sb-empty" style="margin-bottom:6px">没有来源票。这是无源决定。</div>');
    }
    if (supersedes.length) {
      relRows.push('<div class="sb-quiet" style="margin:8px 0 6px">取代了</div>' +
        supersedes.map(function (x) {
          return '<div class="prod-row" data-act="select" data-val="decision:' + U.esc(x.id) + '">' +
            '<span class="pr-id">' + U.esc(x.id) + '</span><span class="pr-role">' + U.esc(x.statement) + "</span></div>";
        }).join(""));
    }
    if (supersededBy) {
      relRows.push('<div class="sb-quiet" style="margin:8px 0 6px">被取代为</div>' +
        '<div class="prod-row" data-act="select" data-val="decision:' + U.esc(supersededBy.id) + '">' +
        '<span class="pr-id">' + U.esc(supersededBy.id) + '</span><span class="pr-role">' + U.esc(supersededBy.statement) +
        '</span><span class="pr-state">' + U.stateChip(supersededBy.status) + "</span></div>");
    }
    if (derivedTickets.length) {
      relRows.push('<div class="sb-quiet" style="margin:8px 0 6px">这张决定拆出 ' + derivedTickets.length + " 张票</div>" +
        derivedTickets.map(function (t) {
          return '<div class="prod-row" data-act="select" data-val="ticket:' + U.esc(t.id) + '">' +
            '<span class="pr-id">#' + U.esc(t.id) + '</span><span class="pr-role">' + U.esc(t.title) +
            '</span><span class="pr-state"><span class="chip">' + U.esc(t.type) + "</span></span></div>";
        }).join(""));
    }
    if (siblings.length) {
      relRows.push('<div class="sb-quiet" style="margin:8px 0 6px">同一张票产出的其他决定</div>' +
        siblings.map(function (id) {
          var x = ix.decisions[id];
          if (!x) return "";
          return '<div class="prod-row" data-act="select" data-val="decision:' + U.esc(id) + '">' +
            '<span class="pr-id">' + U.esc(id) + '</span><span class="pr-role">' + U.esc(x.statement) +
            '</span><span class="pr-state">' + U.stateChip(x.status) + "</span></div>";
        }).join(""));
    }
    var impact = premiseImpact(board, did);
    if (!impact && (board.impact_cases || []).some(function (c) { return c.items.some(function (i) { return i.kind === "decision" && i.ref === did; }); })) {
      impact = (board.impact_cases || []).filter(function (c) {
        return c.items.some(function (i) { return i.kind === "decision" && i.ref === did; });
      }).map(function (c) {
        var item = c.items.filter(function (i) { return i.kind === "decision" && i.ref === did; })[0];
        return '<div class="impact-line ' + (item.status === "待处理" ? "hot" : "") + '"><span class="il-k">影响</span>' +
          '<div class="il-v"><b>' + U.esc(c.id) + "</b> " + U.esc(c.status === "open" ? "开着" : "已关闭") +
          " · 这项" + U.esc(item.status) + (item.action ? "：" + U.esc(item.action) : "") + "</div></div>";
      }).join("");
    }
    if (!impact) impact = '<div class="sb-empty">没有影响记录。这条决定没有被已破前提或推翻扫到。</div>';

    var rootExtra = "";
    if (d.root_of) {
      var fragments = board.fragments || [];
      rootExtra = '<div class="sb-h"><span class="sb-n">01</span>这张地图<span class="sb-cnt">' + fragments.length + " 句</span></div>" +
        '<p class="sb-lead">' + U.esc(d.statement) + "</p>" +
        '<ul class="frag-list">' + fragments.map(function (f) {
          var row = (board.coverage || []).filter(function (r) { return r.fragment.id === f.id; })[0];
          var tickets = row ? row.tickets : [];
          return '<li><span class="frag-n">' + String(f.index).padStart(2, "0") + "</span><span>" + U.esc(f.text) +
            (tickets.length ? '<br><span class="sb-quiet">' + tickets.map(function (t) { return "#" + U.esc(t.id); }).join("、") + "</span>" : ' <span class="chip red">缺口</span>') +
            "</span></li>";
        }).join("") + "</ul>" +
        '<p class="sb-p" style="margin-top:8px">拆票理由：' + (board.map.split_rationale ? U.esc(board.map.split_rationale) : "未记录") + "</p>" +
        '<div class="sb-actions"><button class="btn small" data-act="modal" data-val="edit-map-rationale" data-arg="' + U.esc(board.map.id) + '">编辑拆票理由</button></div>';
    }

    return '<div data-focus="decision:' + U.esc(did) + '"><div class="sb-head">' +
      '<div class="sb-idrow"><span class="id">' + U.esc(d.id) + "</span>" +
      (d.root_of ? '<span class="chip accent">根决定</span>' : '<span class="chip accent">决定</span>') +
      U.stateChip(d.status) + (d.red ? '<span class="chip red">前提已破</span>' : "") +
      signalBadges(board, "decision:" + d.id) + "</div>" +
      "<h2>" + U.esc(d.statement) + "</h2>" +
      '<div class="sb-meta">' +
      (ticket ? '<button class="id-link" data-act="select" data-val="ticket:' + U.esc(ticket.id) + '">来源票 #' + U.esc(ticket.id) + "</button>"
        : d.root_of ? '<span>地图 #' + U.esc(d.root_of) + '</span>' : "<span>没有来源票</span>") +
      '<span class="sb-dot">·</span><span>' + (premises.length ? premises.length + " 条前提" : "没有记录前提") + "</span>" +
      '<span class="sb-dot">·</span><span>' + (group ? group.decisions.length + " 条同票决定" : "") + "</span>" +
      "</div>" +
      '<div class="sb-actions">' +
      '<button class="btn small primary" data-act="modal" data-val="add-premise" data-arg="' + U.esc(d.id) + '">加前提</button>' +
      (premises.length ? '<button class="btn small" data-act="modal" data-val="judge-premise" data-arg="' + U.esc(premises[0].id) + '">判前提</button>' : "") +
      '<button class="btn small" data-act="modal" data-val="overturn" data-arg="' + U.esc(d.id) + '">推翻决定</button>' +
      "</div></div>" + rootExtra +
      section(d.root_of ? "02" : "01", "支撑这个决定的前提", premBody, premises.length) +
      section(d.root_of ? "03" : "02", "依据与产出", basis) +
      section(d.root_of ? "04" : "03", "决定与决定的关系", relRows.join("") || '<div class="sb-empty">没有可显示的因果边。</div>') +
      section(d.root_of ? "05" : "04", "这个决定的影响", impact) +
      "</div>";
  }

  function section(n, title, body, count) {
    if (!body) return "";
    return '<div class="sb-h"><span class="sb-n">' + n + "</span>" + U.esc(title) +
      (count != null ? '<span class="sb-cnt">' + count + "</span>" : "") + "</div>" + body;
  }

  function ticketPanel(board, tid) {
    var ix = index(board);
    var t = ix.tickets[tid];
    if (!t) return emptySidebar(board);
    var produced = (t.produces || []).map(function (id) { return ix.decisions[id]; }).filter(Boolean);
    var derived = (t.derived_from || []).map(function (id) { return ix.decisions[id]; }).filter(Boolean);
    var fragments = board.fragments || [];
    var covers = (t.covers || []).map(function (id) {
      var f = fragments.filter(function (x) { return x.id === id; })[0];
      return f ? f : { id: id, index: U.fragNum(id), text: "（这一句不在当前根决定的拆句里）" };
    });
    var comments = t.comments || [];
    var blocked = (t.blocked_by || []).map(function (id) {
      return ix.tickets[id] || { id: id, title: "（不在本图）", state: "open" };
    });

    var inferred = (t.derived_from_inferred || []).map(function (id) {
      return ix.decisions[id];
    }).filter(Boolean);

    var fromRows = derived.length ? derived.map(function (d) {
      return '<div class="prod-row" data-act="select" data-val="decision:' + U.esc(d.id) + '">' +
        '<span class="pr-id">' + U.esc(d.id) + '</span><span class="pr-role">' + U.esc(d.statement) +
        '</span><span class="pr-state">' + U.stateChip(d.status) + "</span></div>";
    }).join("") : '<div class="sb-empty">' + (inferred.length
      ? "没有已确认的来源决定。下面列的是推断来源，确认后才算事实。"
      : "没有 derived_from。这是无主票。") + "</div>";
    var inferredRows = inferred.length ? inferred.map(function (d) {
      return '<div class="prod-row">' +
        '<span class="pr-id">' + U.esc(d.id) + '</span>' +
        '<span class="pr-role">' + U.esc(d.statement) +
        ' <span class="chip amber">来源未确认</span></span>' +
        '<span class="pr-state"><button class="btn small ghost" data-act="confirm-derived" data-arg="' +
        U.esc(t.id) + '" data-val="' + U.esc(d.id) + '" title="确认这条来源，确认后转成实线">确认来源</button></span></div>';
    }).join("") : "";
    var inferredBlock = inferredRows
      ? '<div class="sb-quiet" style="margin-top:9px">推断来源（未确认）</div>' + inferredRows
      : "";
    var coverRows = covers.length ? '<ul class="frag-list" style="margin-top:8px">' + covers.map(function (f) {
      return '<li><span class="frag-n">第 ' + (f.index == null ? "?" : f.index) + " 句</span><span>" + U.esc(f.text) + "</span></li>";
    }).join("") + "</ul>" : '<p class="sb-quiet" style="margin-top:8px">没有 covers，这张票没接主句的哪一句。</p>';
    var why = '<p class="sb-p">拆票理由：' + (t.split_reason ? U.esc(t.split_reason) : "未记录") + "</p>" +
      '<div class="sb-quiet" style="margin-top:9px">从哪条决定拆出</div>' + fromRows + inferredBlock +
      '<div class="sb-quiet" style="margin-top:9px">覆盖根决定哪几句</div>' + coverRows;

    var body = t.body ? '<div class="sb-md">' + U.mdLite(t.body) + "</div>" :
      '<div class="sb-empty">这张票没有正文。</div>';

    var producedBody = produced.length ? produced.map(function (d, i) {
      return '<div class="prod-row" data-act="select" data-val="decision:' + U.esc(d.id) + '">' +
        '<span class="pr-id">' + U.esc(d.id) + '</span>' +
        '<span class="pr-role">' + (i === 0 ? '<span class="chip accent" style="margin-right:4px">主决定</span>' : "") +
        U.esc(d.statement) + '</span><span class="pr-state">' + U.stateChip(d.status) + "</span></div>";
    }).join("") : '<div class="sb-empty">这张票还没有产出决定。</div>';

    var commentBody = comments.length ? comments.map(function (c) {
      return '<div class="comment"><div class="comment-top"><span class="id">' + U.esc(c.id) + "</span>" +
        '<span>' + U.esc(c.author) + "</span><span>·</span><span>" + U.esc(U.fmtTs(c.created_at)) + "</span>" +
        (c.edited_at ? '<span>·</span><span>已编辑 ' + U.esc(U.fmtTs(c.edited_at)) + "</span>" : "") +
        '<span style="flex:1"></span><button class="btn small ghost" data-act="modal" data-val="edit-comment" data-arg="' + U.esc(c.id) + '">编辑</button></div>' +
        "<p>" + U.esc(c.body) + "</p></div>";
    }).join("") : '<div class="sb-empty">还没有评论。</div>';

    var blockBody = blocked.length ? blocked.map(function (x) {
      return '<div class="prod-row" data-act="select" data-val="ticket:' + U.esc(x.id) + '">' +
        '<span class="pr-id">#' + U.esc(x.id) + '</span><span class="pr-role">' + U.esc(x.title) +
        '</span><span class="pr-state"><span class="chip ' + (x.state === "closed" ? "green" : "red") + '">' +
        (x.state === "closed" ? "已关闭" : "未关闭") + "</span></span></div>";
    }).join("") : '<div class="sb-empty">没有被挡。</div>';

    var syncLast = t.sync && t.sync.last;
    var syncLine = '<div class="sb-quiet">同步状态：' + U.esc(t.sync ? t.sync.state : "未同步") +
      (t.sync && t.sync.github ? " · GitHub #" + U.esc(t.sync.github) : "") +
      (syncLast ? " · " + U.esc(U.fmtTs(syncLast.ts)) + " " + U.esc(syncLast.detail || "") : "") + "</div>";

    var impactRows = (board.impact_cases || []).filter(function (c) {
      return (c.items || []).some(function (i) { return i.kind === "ticket" && i.ref === t.id; });
    }).map(function (c) {
      var item = c.items.filter(function (i) { return i.kind === "ticket" && i.ref === t.id; })[0];
      return '<div class="impact-line ' + (item.status === "待处理" ? "hot" : "") + '"><span class="il-k">' + U.esc(c.id) + "</span>" +
        '<div class="il-v">' + U.esc(triggerLabel(c.trigger)) + " · " + U.esc(c.status === "open" ? "开着" : "已关闭") +
        " · 这项" + U.esc(item.status) + (item.action ? "：" + U.esc(item.action) : "") + "</div></div>";
    }).join("");

    var close = t.close_record;
    var closeBody = "";
    if (close) {
      var rows = '<dt>记录</dt><dd>' + U.esc(close.id) + "</dd>" +
        '<dt>状态</dt><dd>' + U.esc(close.status) + " · PR #" + U.esc(close.pr) + "</dd>" +
        '<dt>head SHA</dt><dd><code class="mono" style="font-size:11px">' +
        U.esc(String(close.sha || "").slice(0, 7)) + "</code></dd>" +
        '<dt>写入</dt><dd>' + U.esc(close.written_by || "未记录") + " · " + U.esc(U.fmtTs(close.written_at)) + "</dd>";
      if (close.verify) {
        rows += '<dt>核对</dt><dd>' + U.esc(close.verify) + "</dd>";
      }
      if (close.last_check) {
        rows += '<dt>最近核对</dt><dd>' + U.esc(checkLabel(close.last_check.result)) +
          (close.last_check.detail ? " · " + U.esc(close.last_check.detail) : "") + "</dd>";
      }
      if (close.revoke_reason) {
        rows += '<dt>说明</dt><dd>' + U.esc(close.revoke_reason) + "</dd>";
      }
      closeBody = '<dl class="sb-kv">' + rows + "</dl>";
      if ((close.comments || []).length) {
        closeBody += '<div class="sb-quiet" style="margin-top:9px">关票评论草稿（合并后写入）</div>' +
          close.comments.map(function (body, i) {
            return '<details class="p-line"><summary><span class="pl-id">评论 ' + (i + 1) + "</span></summary>" +
              '<div class="pl-body"><div class="sb-md">' + U.mdLite(body) + "</div></div></details>";
          }).join("");
      }
      if ((close.decisions || []).length) {
        closeBody += '<div class="sb-quiet" style="margin-top:9px">决定草稿（合并后写入）</div>' +
          close.decisions.map(function (d) {
            return '<div class="prod-row"><span class="pr-id">' + U.esc(d.id) +
              '</span><span class="pr-role">' + U.esc(d.statement) + "</span></div>";
          }).join("");
      }
    }

    return '<div data-focus="ticket:' + U.esc(t.id) + '"><div class="sb-head">' +
      '<div class="sb-idrow"><span class="id">#' + U.esc(t.id) + "</span>" +
      '<span class="chip">' + U.esc(t.type) + "</span>" +
      '<span class="chip ' + (t.state === "closed" ? "green" : "amber") + '">' + U.esc(t.state === "closed" ? "已关闭" : "开放") + "</span>" +
      '<span class="chip ' + U.workTone(t.work) + '">' + U.esc(t.work) + "</span>" +
      signalBadges(board, "ticket:" + t.id) + "</div>" +
      "<h2>" + U.esc(t.title) + "</h2>" +
      '<div class="sb-meta"><span>地图 #' + U.esc(t.parent) + "</span>" +
      '<span class="sb-dot">·</span><span>' + produced.length + " 条产出决定</span>" +
      (t.work_note ? '<span class="sb-dot">·</span><span>' + U.esc(t.work_note) + "</span>" : "") +
      "</div>" +
      '<div class="sb-actions">' +
      '<button class="btn small" data-act="modal" data-val="edit-ticket" data-arg="' + U.esc(t.id) + '">改票</button>' +
      '<button class="btn small" data-act="modal" data-val="add-comment" data-arg="' + U.esc(t.id) + '">写评论</button>' +
      '<button class="btn small" data-act="modal" data-val="new-ticket" data-arg="' + U.esc(t.id) + '">新建票</button>' +
      '<button class="btn small ' + (t.state === "open" ? "danger" : "") + '" data-act="modal" data-val="state-ticket" data-arg="' + U.esc(t.id) + '">' +
      (t.state === "open" ? "关闭票" : "重开票") + "</button>" +
      "</div></div>" +
      section("01", "这张票怎么拆出来的", why) +
      section("02", "这张票要做什么", body) +
      section("03", "这张票产出了什么", producedBody, produced.length) +
      section("04", "评论", commentBody, comments.length) +
      section("05", "阻塞", blockBody) +
      section("06", "影响历史", impactRows || '<div class="sb-empty">没有影响记录。</div>') +
      section("07", "同步", syncLine) +
      (closeBody ? section("08", "关票", closeBody) : "") +
      "</div>";
  }

  function emptySidebar(board) {
    var root = board.root;
    return '<div class="sb-head"><span class="eyebrow">决策中台</span><h2>点一张票，或一条决定</h2>' +
      '<p class="sb-meta" style="display:block">票讲任务：怎么拆出来、要做什么、产出了什么。决定讲结论：前提、依据、和别的决定怎么连。</p></div>' +
      (root ? '<div class="sb-h"><span class="sb-n">主句</span>这张地图</div><p class="sb-lead">' + U.esc(root.statement) + "</p>" : "") +
      signalPanel(board) +
      '<div class="sb-h"><span class="sb-n">附</span>地图</div><p class="sb-quiet">' + U.esc(board.map.title) +
      " · " + board.counts.tickets + " 张票 · " + board.counts.decisions + " 条决定</p>";
  }

  /* ---------- 覆盖表 ---------- */
  function coveragePanel(board) {
    var rows = board.coverage || [];
    var done = rows.filter(function (r) { return r.status === "已落"; }).length;
    var gap = rows.filter(function (r) { return r.status === "缺口"; }).length;
    var doing = rows.length - done - gap;
    var total = rows.length || 1;
    var bar = '<div class="bar"><i class="done" style="width:' + (done / total * 100) + '%"></i>' +
      '<i class="doing" style="width:' + (doing / total * 100) + '%"></i>' +
      '<i class="gap" style="width:' + (gap / total * 100) + '%"></i></div>';
    if (!rows.length) {
      return '<div class="coverage"><div class="cov-head"><div><span class="eyebrow">Destination 覆盖表</span>' +
        "<h2>这张地图没有现行根决定</h2></div></div>" +
        '<div class="cov-note">根决定是覆盖表的起点。先有根决定，才有拆句和票的 covers。</div></div>';
    }
    var body = rows.map(function (r) {
      var gapRow = r.status === "缺口";
      var tickets = r.tickets.length ? r.tickets.map(function (t) {
        return '<div class="cov-ticket" data-act="select" data-val="ticket:' + U.esc(t.id) + '">' +
          '<div class="cov-ticket-top"><span class="pill" style="margin:0"><span class="work-dot ' + U.workDot(t.work) + '"></span>#' +
          U.esc(t.id) + "</span><span>" + U.esc(t.title) + "</span>" +
          '<span class="chip ' + (t.state === "closed" ? "green" : "amber") + '">' + (t.state === "closed" ? "已关闭" : "开放") + "</span></div>" +
          '<div class="cov-ticket-why">拆票理由：' + U.esc(t.split_reason || "未记录") + "</div></div>";
      }).join("") : '<span class="empty">没有票</span>';
      return '<tr class="cov-row' + (gapRow ? " gap" : "") + '"><td class="cov-num">' + String(r.fragment.index).padStart(2, "0") + "</td>" +
        '<td class="cov-text">' + U.esc(r.fragment.text) + "</td>" +
        '<td><div class="cov-tickets">' + tickets + "</div></td>" +
        '<td class="cov-status ' + (r.status === "已落" ? "done" : r.status === "进行中" ? "doing" : "gap") + '">' + U.esc(r.status) + "</td></tr>";
    }).join("");
    return '<div class="coverage"><div class="cov-head"><div><span class="eyebrow">Destination 覆盖表</span>' +
      "<h2>" + done + " 句已落 · " + doing + " 句进行中 · " + gap + ' 句缺口</h2>' +
      '<p class="sum">覆盖行由根决定的拆句和票上的 covers 联接算出。缺口是没有任何票接的句子。</p></div>' +
      '<div class="cov-bar">' + bar + '<div class="lbl"><span>已落 ' + done + "</span><span>进行中 " + doing + "</span><span>缺口 " + gap + "</span></div></div></div>" +
      '<table class="cov-table"><thead><tr><th style="width:44px">句</th><th>原文</th><th style="width:330px">接的票与拆票理由</th><th style="width:74px">状态</th></tr></thead><tbody>' +
      body + "</tbody></table>" +
      '<div class="cov-note">缺口行标红。点票可以打开票侧边栏。拆票理由为空说明这张票没写为什么从这条决定拆出来。</div></div>';
  }

  /* ---------- 影响清单 ---------- */
  function currentCase(board, caseId) {
    var open = (board.impact_cases || []).filter(function (c) { return c.status === "open"; });
    if (caseId) {
      var hit = (board.impact_cases || []).filter(function (c) { return c.id === caseId; })[0];
      if (hit) return hit;
    }
    return open[0] || null;
  }

  function impactQueue(board, caseId) {
    var open = (board.impact_cases || []).filter(function (c) { return c.status === "open"; });
    var closed = (board.impact_cases || []).filter(function (c) { return c.status !== "open"; });
    var current = currentCase(board, caseId);
    if (!current) {
      return '<div class="queue-head"><div><span class="eyebrow">影响清单 · 逐项处理</span><h2>没有开着的影响清单</h2></div></div>' +
        '<div class="q-empty">前提判破、决定被推翻或作废时，中台会在这里打开清单。现在没有。</div>' +
        (closed.length ? '<div class="sb-h"><span class="sb-n">史</span>已关闭</div>' + closed.map(function (c) {
          return '<div class="impact-line"><span class="il-k">' + U.esc(c.id) + '</span><div class="il-v">' +
            U.esc(triggerLabel(c.trigger)) + " · " + U.esc(U.fmtTs(c.opened_at)) + " 打开 · " +
            c.items.length + " 项 · 已关闭</div></div>";
        }).join("") : "");
    }
    var tabs = open.length > 1 ? '<div class="case-tabs">' + open.map(function (c) {
      return '<button class="btn small ' + (c.id === current.id ? "primary" : "") + '" data-act="impact-case" data-val="' + U.esc(c.id) + '">' +
        U.esc(c.id) + " · " + c.items.filter(function (i) { return i.status === "待处理"; }).length + " 项待处理</button>";
    }).join("") + "</div>" : "";
    var total = current.items.length;
    var done = current.items.filter(function (i) { return i.status !== "待处理"; }).length;
    var pending = total - done;
    var trigger = current.trigger_decision_issue || {};
    var triggerText = trigger.statement || "";
    var items = current.items.map(function (item) {
      var isDecision = item.kind === "decision";
      var obj = item.object || {};
      var label = isDecision ? (obj.statement || obj.id) : (obj.title || obj.id);
      var acts = isDecision ? ["仍成立", "需修改", "作废", "要补问"] : ["保留", "改范围", "关掉", "重开", "新建"];
      var cls = item.status === "待处理" ? "pending" : item.status === "已失效" ? "void" : "done";
      var actions = item.status === "待处理" ? '<div class="q-actions">' + acts.map(function (a) {
        var needsForm = !((isDecision && a === "仍成立") || (!isDecision && a === "保留"));
        if (needsForm) {
          return '<button class="btn small" data-act="modal" data-val="impact-act" data-arg="' + U.esc(current.id + "|" + item.kind + "|" + item.ref + "|" + a) + '">' + a + "</button>";
        }
        return '<button class="btn small" data-act="impact-do" data-arg="' + U.esc(current.id + "|" + item.kind + "|" + item.ref + "|" + a) + '">' + a + "</button>";
      }).join("") + "</div>" : "";
      var doneLine = item.status === "待处理" ? "" :
        '<div class="q-done-line ' + (item.status === "已失效" ? "void" : "") + '">' +
        (item.status === "已失效" ? "已失效（别的清单已把这项变掉）" : "已处理：" + U.esc(item.action || "")) +
        (item.reason ? " · " + U.esc(item.reason) : "") + "</div>";
      return '<div class="q-item ' + cls + '">' +
        '<div class="q-top"><span class="kind">' + (isDecision ? "决定" : "票") + "</span>" +
        '<span class="id">' + U.esc(isDecision ? item.ref : "#" + item.ref) + "</span>" +
        (item.status === "待处理" ? '<span class="chip red">待处理</span>' : '<span class="chip ' + (item.status === "已失效" ? "gray" : "green") + '">' + U.esc(item.status) + "</span>") +
        "</div>" +
        '<div class="q-why">' + U.esc(label) + "</div>" +
        (item.relations && item.relations.length ? '<div class="q-why">关系：' +
          item.relations.map(function (r) { return U.esc(relationLabel(r)); }).join("、") + "</div>" : "") +
        actions + doneLine + "</div>";
    }).join("");

    var closeBtn = pending === 0
      ? '<button class="btn small primary" data-act="modal" data-val="impact-close" data-arg="' + U.esc(current.id) + '">关闭影响清单</button>'
      : '<span class="sb-quiet">全部处理完才能关闭</span>';

    return '<div class="queue-head"><div><span class="eyebrow">影响清单 · 逐项处理</span>' +
      '<h2>' + U.esc(current.id) + '</h2><p style="font-size:11px;color:var(--text-muted);margin-top:2px">决定四档，票五种。系统只列名单，不改决定。</p></div>' +
      '<div class="progress"><b>' + done + "/" + total + "</b>已处理<br>" + (total ? Math.round(done / total * 100) : 0) + "%</div></div>" +
      tabs +
      '<div class="trigger-card"><div class="tc-top"><span class="id">' + U.esc(current.id) + "</span>" +
      '<span class="chip red">' + U.esc(triggerLabel(current.trigger)) + "</span>" +
      '<span class="chip">' + U.esc(U.fmtTs(current.opened_at)) + "</span></div>" +
      "<p><b>" + U.esc(triggerText) + "</b><br>范围在触发事件里快照，只沿声明的因果边算。</p></div>" +
      '<div class="q-list">' + items + "</div>" +
      '<div class="queue-foot">' + closeBtn +
      '<button class="btn small ghost" data-act="mode" data-val="graph">回到决策图</button></div>';
  }

  function relationLabel(r) {
    return { derived_from: "派生", source_ticket: "来源票", covers: "覆盖", premise: "前提" }[r] || r;
  }

  function missingRationale(board) {
    var missing = 0;
    if (!(board.map && board.map.split_rationale)) missing++;
    (board.tickets || []).forEach(function (t) { if (!t.split_reason) missing++; });
    (board.decisions || []).forEach(function (d) {
      if (!d.rationale) missing++;
      (d.premises || []).forEach(function (p) {
        if (p.last_judged_at && !p.last_judged_reason) missing++;
      });
    });
    return missing;
  }

  function rationaleNotice(board) {
    if (!(board.map && board.map.imported)) return "";
    var n = missingRationale(board);
    if (!n) return "";
    return '<div class="old-map-note">旧图导入，理由可能缺失 · ' + n + " 处未记录</div>";
  }

  window.BoardPanels = {
    index: index, groupOf: groupOf,
    decisionPanel: decisionPanel, ticketPanel: ticketPanel, emptySidebar: emptySidebar,
    coveragePanel: coveragePanel, impactQueue: impactQueue, signalPanel: signalPanel,
    signalChips: signalChips, filterBanner: filterBanner, signalBadges: signalBadges,
    currentCase: currentCase, triggerLabel: triggerLabel,
    missingRationale: missingRationale, rationaleNotice: rationaleNotice
  };
})();
