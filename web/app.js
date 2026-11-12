/* 决策中台屏幕：取数、交互、事件推送。 */
(function () {
  "use strict";
  var U = window.U;

  var state = {
    mapId: null,
    board: null,
    sel: null,
    mode: "graph",
    drawer: "closed",
    top: false,
    filter: null,
    impactCase: null,
    view: null,
    modal: null,
    busy: false,
    connected: true,
    syncing: false,
    error: null,
    seq: 0,
    sse: null,
    loading: false,
    pendingRender: false,
    lastWork: null,
    lastSync: null,
    toastTimer: null,
    dragging: null
  };

  var ICON = {
    sun: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 11.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Zm0-1.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0-8.5a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 8 1.5Zm0 11a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 8 12.5ZM14.5 8a.75.75 0 0 1-.75.75h-1a.75.75 0 0 1 0-1.5h1A.75.75 0 0 1 14.5 8Zm-11 0a.75.75 0 0 1-.75.75h-1a.75.75 0 0 1 0-1.5h1A.75.75 0 0 1 3.5 8Zm9.1-4.6a.75.75 0 0 1 0 1.06l-.7.7a.75.75 0 1 1-1.06-1.06l.7-.7a.75.75 0 0 1 1.06 0ZM5.16 11.84a.75.75 0 0 1 0 1.06l-.7.7a.75.75 0 1 1-1.06-1.06l.7-.7a.75.75 0 0 1 1.06 0Zm8.44 1.76a.75.75 0 0 1-1.06 0l-.7-.7a.75.75 0 1 1 1.06-1.06l.7.7a.75.75 0 0 1 0 1.06ZM5.16 4.16a.75.75 0 0 1-1.06 0l-.7-.7a.75.75 0 0 1 1.06-1.06l.7.7a.75.75 0 0 1 0 1.06Z"/></svg>',
    moon: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M9.6 1.2a.75.75 0 0 1 .25 1.02 5.5 5.5 0 0 0 4 8.1.75.75 0 0 1 .45 1.2A7 7 0 1 1 8.6.95a.75.75 0 0 1 1 .25ZM7.7 2.6a5.5 5.5 0 1 0 6.3 6.7A7 7 0 0 1 7.7 2.6Z"/></svg>',
    auto: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 1.5v10a5 5 0 0 1 0-10Z"/></svg>',
    panel: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2.75 3h10.5a.75.75 0 0 1 .75.75v8.5a.75.75 0 0 1-.75.75H2.75a.75.75 0 0 1-.75-.75v-8.5A.75.75 0 0 1 2.75 3Zm.75 1.5v7h9v-7h-9Zm1.5 1h3v5h-3v-5Z"/></svg>',
    close: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3.47 3.47a.75.75 0 0 1 1.06 0L8 6.94l3.47-3.47a.75.75 0 1 1 1.06 1.06L9.06 8l3.47 3.47a.75.75 0 1 1-1.06 1.06L8 9.06l-3.47 3.47a.75.75 0 0 1-1.06-1.06L6.94 8 3.47 4.53a.75.75 0 0 1 0-1.06Z"/></svg>'
  };

  function el(id) { return document.getElementById(id); }

  function toast(msg, bad) {
    var t = el("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.toggle("bad", !!bad);
    t.classList.add("on");
    if (state.toastTimer) clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(function () { t.classList.remove("on"); }, 3200);
  }

  function api(path, options) {
    options = options || {};
    options.headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
    return fetch(path, options).then(function (res) {
      return res.json().catch(function () { return { ok: false, error: "服务返回的不是 JSON" }; });
    }).then(function (data) {
      if (!data.ok) {
        var err = new Error(data.error || "请求失败");
        err.code = data.code;
        throw err;
      }
      return data.data;
    });
  }

  function command(op, args, reason) {
    return api("/command", {
      method: "POST",
      body: JSON.stringify({
        op: op,
        args: args,
        reason: reason || null,
        actor: state.board && state.board.actor
      })
    });
  }

  function loadBoard(mapId) {
    var path = mapId ? "/board/" + encodeURIComponent(mapId) : "/board";
    return api(path).then(applyBoard);
  }

  function sameSelStillExists(board, sel) {
    if (!sel) return false;
    var parts = sel.split(":");
    var id = parts.slice(1).join(":");
    if (parts[0] === "decision") return board.decisions.some(function (d) { return d.id === id; });
    if (parts[0] === "ticket") return board.tickets.some(function (t) { return t.id === id; });
    return false;
  }

  function applyBoard(board) {
    var first = !state.board;
    var previousMap = state.mapId;
    var needsConnect = !state.sse || String(previousMap) !== String(board.map.id);
    state.board = board;
    state.mapId = board.map.id;
    state.seq = board.seq || 0;
    state.loading = false;
    state.error = null;
    state.lastWork = workSignature(board.workstate);
    state.lastSync = syncSignature(board.sync);
    if (!state.sel || !sameSelStillExists(board, state.sel)) {
      state.sel = board.root ? "decision:" + board.root.id : null;
    }
    if (state.mode === "impact" && !BoardPanels.currentCase(board, state.impactCase)) {
      state.mode = "graph";
    }
    if (state.impactCase && !board.impact_cases.some(function (c) { return c.id === state.impactCase && c.status === "open"; })) {
      state.impactCase = null;
    }
    if (first || String(previousMap) !== String(state.mapId)) {
      state.view = null;
      BoardGraph.reset();
      if (state.mode === "impact") {
        var firstCase = BoardPanels.currentCase(board, state.impactCase);
        if (firstCase) state.focusTargets = firstCase.items.map(function (i) { return i.kind + ":" + i.ref; });
      }
    }
    if (state.modal) {
      state.pendingRender = true;
    } else {
      render();
    }
    if (needsConnect) connectEvents();
  }

  var pendingBoardRefresh = false;

  function refreshBoard(quiet) {
    if (!state.mapId && !state.board) return Promise.resolve();
    if (state.loading) {
      pendingBoardRefresh = true;
      return Promise.resolve();
    }
    state.loading = true;
    function finish() {
      state.loading = false;
      if (pendingBoardRefresh) {
        pendingBoardRefresh = false;
        refreshBoard(true).catch(function () {});
      }
    }
    return loadBoard(state.mapId).then(function (data) {
      finish();
      return data;
    }, function (err) {
      finish();
      if (!quiet) {
        state.connected = false;
        render();
      }
      throw err;
    });
  }

  /* ---------- 事件与轮询 ---------- */

  var scheduleRefresh = U.debounce(function () {
    refreshBoard(true).catch(function () {});
  }, 120);

  function connectEvents() {
    if (state.sse) state.sse.close();
    var source = new EventSource("/events?since=" + encodeURIComponent(state.seq || 0));
    state.sse = source;
    source.onopen = function () {
      if (!state.connected) {
        state.connected = true;
        render();
      }
      scheduleRefresh();
    };
    source.onerror = function () {
      if (state.connected) {
        state.connected = false;
        render();
      }
    };
    source.onmessage = function () { scheduleRefresh(); };
  }

  function workSignature(ws) {
    if (!ws) return "";
    var tickets = ws.tickets || {};
    return JSON.stringify({
      offline: !!ws.offline,
      rules: Object.keys(tickets).sort().map(function (id) {
        return [id, tickets[id].state, tickets[id].note || ""];
      })
    });
  }

  function syncSignature(sync) {
    if (!sync) return "";
    var last = (sync.history || [])[sync.history.length - 1] || {};
    return JSON.stringify({
      mirror: sync.mirror, position: sync.position,
      action: last.action, status: last.status, ts: last.ts
    });
  }

  function pollWorkstate() {
    if (!state.board) return;
    api("/workstate").then(function (ws) {
      var sig = workSignature(ws);
      if (sig !== state.lastWork) {
        state.lastWork = sig;
        refreshBoard(true).catch(function () {});
      }
    }).catch(function () {});
  }

  function pollSync() {
    if (!state.board) return;
    api("/sync/" + encodeURIComponent(state.mapId)).then(function (sync) {
      var sig = syncSignature(sync);
      if (sig !== state.lastSync) {
        state.lastSync = sig;
        refreshBoard(true).catch(function () {});
      }
    }).catch(function () {});
  }

  /* ---------- 渲染 ---------- */

  function themePref() {
    var v = document.documentElement.getAttribute("data-theme-pref");
    return v === "light" || v === "dark" ? v : "auto";
  }

  function setThemePref(v) {
    try { localStorage.setItem("dt-theme", v); } catch (e) {}
    document.documentElement.setAttribute("data-theme-pref", v);
    var dark = v === "dark" || (v === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    render();
  }

  function themeSeg() {
    var cur = themePref();
    function b(v, icon, label) {
      return '<button class="' + (cur === v ? "active" : "") + '" data-act="theme" data-val="' + v +
        '" title="' + label + '" aria-label="' + label + '" aria-pressed="' + (cur === v) + '">' + icon + "</button>";
    }
    return '<div class="theme-seg" role="group" aria-label="主题">' +
      b("light", ICON.sun, "浅色") + b("dark", ICON.moon, "深色") + b("auto", ICON.auto, "跟随系统") + "</div>";
  }

  function mapSwitch() {
    var maps = state.board.maps || [];
    if (maps.length < 2) return "";
    return '<div class="map-seg" role="group" aria-label="切换地图">' + maps.map(function (m) {
      return '<button class="' + (String(m.id) === String(state.mapId) ? "active" : "") + '" data-act="map" data-val="' + U.esc(m.id) + '" title="' + U.esc(m.title) + '">#' + U.esc(m.id) + "</button>";
    }).join("") + "</div>";
  }

  function syncChip() {
    var sync = state.board.sync || {};
    var busy = state.syncing;
    var cls = busy ? "doing" : sync.state === "已同步" ? "ok" : sync.state === "失败" ? "bad" : sync.state === "同步中" ? "doing" : "";
    var label = busy ? "同步中" : sync.state === "未开启" ? "镜像关" : sync.state === "失败" ? "失败 · 重试" : sync.state;
    return '<button class="tb-btn sync-chip ' + cls + '" data-act="modal" data-val="sync" title="同步到 GitHub 镜像">' +
      '<span class="dot"></span>' + U.esc(label) + "</button>";
  }

  function topbar() {
    var b = state.board, c = b.counts;
    var ws = b.workstate || {};
    var live = state.connected;
    return '<header class="topbar">' +
      '<div class="brand"><span class="logo">中</span><b>中台</b></div>' +
      '<span class="tb-sep"></span>' +
      '<div class="map-title"><b>#' + U.esc(b.map.id) + " " + U.esc(b.map.title) + "</b><span>决定是节点，票是边</span></div>" +
      mapSwitch() +
      '<div class="top-counts"><span><b>' + c.groups + "</b> 组决定</span><span><b>" + c.tickets + "</b> 张票</span>" +
      '<span><b>' + c.open + "</b> 开放</span><span><b>" + c.impact_open + "</b> 影响清单</span></div>" +
      '<div class="seg"><button class="' + (state.mode === "graph" ? "active" : "") + '" data-act="mode" data-val="graph">决策图</button>' +
      '<button class="' + (state.mode === "impact" ? "active" : "") + '" data-act="mode" data-val="impact">影响清单</button>' +
      '<button class="' + (state.mode === "coverage" ? "active" : "") + '" data-act="mode" data-val="coverage">覆盖表</button></div>' +
      syncChip() +
      '<span class="sync-chip ' + (ws.offline ? "bad" : "ok") + '" title="工作状态来自 orca"><span class="dot"></span>orca ' + (ws.offline ? "离线" : "在线") + "</span>" +
      '<button class="tb-btn" data-act="modal" data-val="new-ticket" title="新建票">新建票</button>' +
      '<button class="tb-btn" data-act="top" data-val="toggle" aria-expanded="' + (state.top ? "true" : "false") + '" title="信号与快照">' +
      ICON.panel + '<span class="tb-signal"><span class="live-dot ' + (live ? "" : "off") + '"></span><b>' +
      (b.signals || []).filter(function (s) { return s.count > 0; }).length + "</b></span></button>" +
      themeSeg() +
      "</header>";
  }

  function topbarPanel() {
    var b = state.board;
    return '<div class="topbar-panel' + (state.top ? " open" : "") + '"><div><div class="topbar-panel-inner">' +
      '<div class="tbp-block"><span class="tbp-label">信号</span>' + BoardPanels.signalChips(b) + "</div>" +
      '<div class="tbp-block"><span class="tbp-label">主句</span><span class="sb-quiet" style="max-width:52ch">' +
      U.esc(b.root ? b.root.id : "没有根决定") + " · " + b.fragments.length + " 句拆句，覆盖表由拆句、票和拆票理由联接算出。</span></div>" +
      '<div class="tbp-block" style="margin-left:auto"><span class="tbp-label">数据</span><span class="sb-quiet">事件 seq ' + b.seq +
      " · 状态哈希 " + U.esc((b.hash || "").slice(0, 8)) + '</span><button class="tb-btn" data-act="top" data-val="close" title="收起" aria-label="收起顶部栏">' + ICON.close + "</button></div>" +
      "</div></div></div>";
  }

  function banners() {
    var b = state.board;
    var out = "";
    if (!state.connected) {
      out += '<div class="offline-banner"><b>连接断开，正在重连…</b><span>动作暂时禁用。服务恢复后自动继续。</span><span class="spacer"></span></div>';
    }
    var cases = (b.impact_cases || []).filter(function (c) { return c.status === "open"; });
    if (cases.length && state.mode !== "impact") {
      var current = BoardPanels.currentCase(b, state.impactCase) || cases[0];
      var pending = current.items.filter(function (i) { return i.status === "待处理"; }).length;
      var done = current.items.length - pending;
      var trigger = (current.trigger_decision_issue || {}).statement || "";
      out += '<div class="impact-banner show"><span class="pulse"></span><b>' + U.esc(current.id) + " " +
        U.esc(BoardPanels.triggerLabel(current.trigger)) + "</b><span>" + U.esc(U.trunc(trigger, 46)) +
        "</span><span>·</span><span>已处理 " + done + "/" + current.items.length + '</span><span class="spacer"></span>' +
        '<button class="btn small" data-act="mode" data-val="impact">开始处理</button></div>';
    }
    out += BoardPanels.rationaleNotice(b);
    return out;
  }

  function scopeSets(caseObj) {
    if (!caseObj) return null;
    var scope = { decisions: {}, tickets: {}, pendingDecisions: {}, pendingTickets: {} };
    (caseObj.items || []).forEach(function (item) {
      if (item.kind === "decision") scope.decisions[item.ref] = true;
      else scope.tickets[item.ref] = true;
      if (item.status === "待处理") {
        if (item.kind === "decision") scope.pendingDecisions[item.ref] = true;
        else scope.pendingTickets[item.ref] = true;
      }
    });
    return {
      decisions: new Set(Object.keys(scope.decisions)),
      tickets: new Set(Object.keys(scope.tickets)),
      pendingDecisions: new Set(Object.keys(scope.pendingDecisions)),
      pendingTickets: new Set(Object.keys(scope.pendingTickets))
    };
  }

  function filterTargets() {
    if (!state.filter) return null;
    var s = (state.board.signals || []).filter(function (x) { return x.key === state.filter; })[0];
    if (!s) return null;
    var keys = (s.targets || []).filter(function (k) {
      return k.indexOf("decision:") === 0 || k.indexOf("ticket:") === 0;
    });
    return keys.length ? new Set(keys) : null;
  }

  function graphHtml() {
    var caseObj = state.mode === "impact" ? BoardPanels.currentCase(state.board, state.impactCase) : null;
    var result = BoardGraph.render(state.board, {
      view: state.view,
      sel: state.sel,
      scope: scopeSets(caseObj),
      filterTargets: filterTargets()
    });
    if (!result.ok) {
      return '<div class="sb-empty" style="margin:18px">这张地图还没有现行根决定，画不出决策图。</div>';
    }
    return result.html;
  }

  function legend() {
    return '<div class="graph-legend"><span><i class="legend-dot accent"></i>根决定</span>' +
      '<span><i class="legend-dot green"></i>前提全成立</span>' +
      '<span><i class="legend-dot amber"></i>有前提未验 / 未知</span>' +
      '<span><i class="legend-dot red"></i>至少一条前提已破</span>' +
      '<span><i class="legend-dot gray"></i>没有记录前提</span>' +
      '<span><i class="legend-dot void"></i>已被取代 / 作废</span>' +
      '<span><i class="legend-line primary"></i>主来源</span>' +
      '<span><i class="legend-line secondary"></i>同层次要来源</span>' +
      '<span><i class="legend-line inferred"></i>推断来源（未确认）</span>' +
      '<span style="margin-left:auto">跨层来源写在票卡上；琥珀虚线 = 取代；右侧抽屉看前提、评论和影响史</span></div>';
  }

  function drawerTitle() {
    if (!state.sel) return "";
    var parts = state.sel.split(":");
    var kind = parts[0], id = parts.slice(1).join(":");
    if (kind === "decision") {
      var d = (state.board.decisions || []).filter(function (x) { return x.id === id; })[0];
      return d ? id + " " + U.trunc(d.statement, 20) : id;
    }
    if (kind === "ticket") {
      var t = (state.board.tickets || []).filter(function (x) { return x.id === id; })[0];
      return t ? "#" + id + " " + U.trunc(t.title, 22) : "#" + id;
    }
    return "";
  }

  function detailHtml() {
    if (!state.sel) return BoardPanels.emptySidebar(state.board);
    var parts = state.sel.split(":");
    var kind = parts[0], id = parts.slice(1).join(":");
    if (kind === "decision") return BoardPanels.decisionPanel(state.board, id, state.sel);
    if (kind === "ticket") return BoardPanels.ticketPanel(state.board, id);
    return BoardPanels.emptySidebar(state.board);
  }

  function drawerHtml() {
    var ds = state.drawer;
    var open = ds !== "closed", pinned = ds === "pinned";
    var kindLabel = state.sel && state.sel.indexOf("ticket:") === 0 ? "票侧边栏" : "决定侧边栏";
    return '<button class="a-drawer-handle" data-act="drawer" data-val="open" aria-label="打开详情">详情</button>' +
      '<aside class="drawer a-drawer ' + ds + '" aria-label="' + kindLabel + '">' +
      '<div class="drawer-bar"><span class="db-kind">' + kindLabel + '</span><span class="db-title">' + U.esc(drawerTitle()) + "</span>" +
      '<button class="tb-btn" data-act="drawer" data-val="pin" title="' + (pinned ? "取消固定" : "固定到右侧") + '">' + (pinned ? "取消固定" : "固定") + "</button>" +
      '<button class="tb-btn" data-act="drawer" data-val="close" title="收起" aria-label="收起侧边栏">' + ICON.close + "</button></div>" +
      '<div class="sb">' + detailHtml() + "</div></aside>";
  }

  function mainHtml() {
    if (state.mode === "coverage") {
      return '<div class="a-body' + (state.drawer !== "closed" ? " drawer-open" : "") + (state.drawer === "pinned" ? " drawer-pinned" : "") + '">' +
        '<main class="a-main coverage-mode">' + BoardPanels.filterBanner(state.board, state.filter) + BoardPanels.coveragePanel(state.board) + "</main>" +
        drawerHtml() + "</div>";
    }
    if (state.mode === "impact") {
      return '<div class="impact-layout"><main class="impact-main"><div class="a-main graph-mode" style="padding:0">' +
        BoardPanels.filterBanner(state.board, state.filter) + graphHtml() + "</div>" + legend() + "</main>" +
        '<aside class="impact-side">' + BoardPanels.impactQueue(state.board, state.impactCase) + "</aside></div>";
    }
    var bodyCls = "a-body" + (state.drawer !== "closed" ? " drawer-open" : "") + (state.drawer === "pinned" ? " drawer-pinned" : "");
    return '<div class="' + bodyCls + '"><main class="a-main graph-mode">' +
      BoardPanels.filterBanner(state.board, state.filter) + graphHtml() + "</main>" + drawerHtml() + "</div>";
  }

  function viewHtml() {
    if (state.error) {
      return '<div class="boot-error"><h1>中台没连上</h1><p>' + U.esc(state.error) +
        "</p><button class=\"btn primary\" data-act=\"reload\">重试</button></div>";
    }
    if (!state.board) {
      return '<div class="boot-error"><h1>正在读取中台</h1><p>等本机服务返回第一张地图。</p></div>';
    }
    return '<div class="a-root">' + topbar() + topbarPanel() + banners() +
      '<div class="a-shell">' + mainHtml() + "</div></div>" +
      (state.modal ? modalView() : "");
  }

  function render() {
    var app = el("app");
    if (!app) return;
    app.innerHTML = viewHtml();
    if (state.board && state.mode !== "coverage" && (state.mode !== "impact" || BoardPanels.currentCase(state.board, state.impactCase))) {
      BoardGraph.mount();
    }
    if (state.focusTargets) {
      BoardGraph.focusTargets(state.focusTargets);
      state.focusTargets = null;
    }
    var drawer = document.querySelector(".a-drawer.open");
    if (drawer && state.pendingRender === false) {
      /* 新内容默认从顶部看 */
    }
    state.pendingRender = false;
    try {
      var u = new URL(location.href);
      if (state.mapId) u.searchParams.set("map", state.mapId);
      if (state.sel) u.searchParams.set("sel", state.sel);
      if (state.mode !== "graph") u.searchParams.set("mode", state.mode); else u.searchParams.delete("mode");
      if (state.drawer !== "closed") u.searchParams.set("drawer", state.drawer); else u.searchParams.delete("drawer");
      if (state.filter) u.searchParams.set("filter", state.filter); else u.searchParams.delete("filter");
      history.replaceState(null, "", u.toString());
    } catch (e) {}
  }

  /* ---------- 弹窗 ---------- */

  function findDecision(id) {
    return (state.board.decisions || []).filter(function (d) { return d.id === id; })[0] || null;
  }
  function findTicket(id) {
    return (state.board.tickets || []).filter(function (t) { return t.id === id; })[0] || null;
  }
  function findPremise(id) {
    for (var i = 0; i < state.board.decisions.length; i++) {
      var ps = state.board.decisions[i].premises || [];
      for (var j = 0; j < ps.length; j++) if (ps[j].id === id) return ps[j];
    }
    return null;
  }

  function splitList(text) {
    return String(text || "").split(/[,，、\s]+/).map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function coversToIds(text) {
    return splitList(text).map(Number).filter(function (n) { return !isNaN(n); })
      .map(function (n) { return (state.board.fragments[n - 1] || {}).id; })
      .filter(Boolean);
  }
  function idsToCovers(ids) {
    return (ids || []).map(U.fragNum).filter(function (n) { return n != null; }).join("、");
  }
  function splitSentences(text) {
    var out = [];
    String(text || "").split(/\n+/).forEach(function (line) {
      line = line.trim();
      if (!line) return;
      var start = 0;
      for (var i = 0; i < line.length; i++) {
        if ("。！？".indexOf(line[i]) >= 0) {
          var piece = line.slice(start, i + 1).trim();
          if (piece) out.push(piece);
          start = i + 1;
        }
      }
      var rest = line.slice(start).trim();
      if (rest) out.push(rest);
    });
    return out;
  }

  function modalTitle(kind) {
    return {
      "add-premise": "加前提", "judge-premise": "判前提", "overturn": "推翻决定",
      "edit-ticket": "改票", "add-comment": "写评论", "edit-comment": "改评论",
      "new-ticket": "新建票", "state-ticket": "关闭 / 重开票",
      "edit-map-rationale": "编辑地图拆票理由", "annotate-decision": "编辑决定依据",
      "annotate-premise": "改判定理由",
      "impact-act": "处理受影响项", "impact-close": "关闭影响清单", "sync": "同步到 GitHub 镜像"
    }[kind] || "操作";
  }

  function modalSub(m) {
    if (!m) return "";
    if (m.kind.indexOf("impact") === 0 && m.arg) {
      var parts = m.arg.split("|");
      return U.esc(parts[0] || "") + (parts[1] ? " · " + U.esc(parts[1] === "decision" ? "决定" : "票") + " " + U.esc(parts[2] || "") : "");
    }
    var d = m.target ? findDecision(m.target) : null;
    var t = m.target ? findTicket(m.target) : null;
    if (d) return U.esc(d.id + " · " + U.trunc(d.statement, 36));
    if (t) return U.esc("#" + t.id + " · " + U.trunc(t.title, 36));
    var p = m.target ? findPremise(m.target) : null;
    if (p) return U.esc(p.id + " · " + U.trunc(p.statement, 36));
    if (m.kind === "new-ticket") return "挂在地图 #" + U.esc(state.mapId) + " 下";
    if (m.kind === "edit-map-rationale") return U.esc("地图 #" + state.mapId + " · " + state.board.map.title);
    return "";
  }

  function modalFields(m) {
    var kind = m.kind, target = m.target || "";
    if (kind === "add-premise") {
      return '<label>陈述</label><textarea name="statement" required placeholder="一句可被证伪的话"></textarea>' +
        '<label>证据（逗号隔开，写票号、相对路径或链接）</label><input name="evidence" placeholder="#142、中台/设计.md">' +
        '<p class="note">写一条 premise.add 事件。状态从「未验」开始。</p>';
    }
    if (kind === "judge-premise") {
      var p = findPremise(target);
      return '<label>判定</label><div class="radio-row">' +
        '<label><input type="radio" name="verdict" value="成立" required' + (p && p.state === "成立" ? " checked" : "") + ">成立</label>" +
        '<label><input type="radio" name="verdict" value="已破"' + (p && p.state === "已破" ? " checked" : "") + ">已破</label>" +
        '<label><input type="radio" name="verdict" value="未知"' + (p && p.state === "未知" ? " checked" : "") + ">未知</label></div>" +
        '<label>新增证据（逗号隔开，会追加到旧证据后面）</label><input name="evidence" placeholder="#142、中台/设计.md">' +
        '<label>理由</label><textarea name="reason" required placeholder="三个月后能看懂当时为什么这样判"></textarea>' +
        '<p class="note">写一条 premise.judge 事件。判「已破」会打开影响清单，但系统不会自动改决定。</p>';
    }
    if (kind === "overturn") {
      var d = findDecision(target);
      var root = d && d.root_of;
      return '<label>新决定的一句话</label><textarea name="statement" required placeholder="写定了什么，不写「见正文」"></textarea>' +
        '<label>来源票</label><input name="source_ticket" value="' + U.esc(d && d.source_ticket ? "#" + d.source_ticket : "") + '" placeholder="#142">' +
        (root ? '<label>新根决定的拆句（一行一句；留空按句号切）</label><textarea name="fragments" placeholder="一行一句"></textarea>' : "") +
        '<label>理由</label><input name="reason" placeholder="为什么推翻">' +
        '<p class="note">旧决定标「已被取代」，新决定取代它。旧决定不重开。</p>';
    }
    if (kind === "annotate-decision") {
      var ad = findDecision(target);
      return '<label>决定依据</label><textarea name="rationale" required placeholder="写一句为什么这么定，带来源">' + U.esc(ad ? ad.rationale : "") + "</textarea>" +
        '<label>来源（可空）</label><input name="source" value="' + U.esc(ad ? ad.rationale_source : "") + '" placeholder="C-0018、中台/docs/adr/0001-*.md">' +
        '<p class="note">写一条 decision.annotate 事件，只改依据和来源，不改陈述和状态。</p>';
    }
    if (kind === "annotate-premise") {
      var ap = findPremise(target);
      return '<label>判定理由</label><textarea name="reason" required>' + U.esc(ap ? ap.last_judged_reason : "") + "</textarea>" +
        '<p class="note">写一条 premise.annotate 事件，只改上次判定理由，不动状态、证据和影响清单。</p>';
    }
    if (kind === "edit-map-rationale") {
      return '<label>拆票理由</label><textarea name="split_rationale">' + U.esc(state.board.map.split_rationale || "") + "</textarea>" +
        '<p class="note">写一条 issue.edit 事件，只改这张地图的拆票理由。留空显示「未记录」。</p>';
    }
    if (kind === "edit-ticket") {
      var t = findTicket(target);
      return '<label>标题</label><input name="title" value="' + U.esc(t ? t.title : "") + '" required>' +
        '<label>票型</label><select name="type">' + ["grilling", "research", "prototype", "task"].map(function (x) {
          return '<option value="' + x + '"' + (t && t.type === x ? " selected" : "") + ">" + x + "</option>";
        }).join("") + "</select>" +
        '<label>拆票理由</label><textarea name="split_reason">' + U.esc(t ? t.split_reason : "") + "</textarea>" +
        '<label>derived_from（逗号隔开，写决定编号）</label><input name="derived_from" value="' + U.esc(t ? (t.derived_from || []).join("、") : "") + '">' +
        '<label>covers（逗号隔开，写第几句）</label><input name="covers" value="' + U.esc(t ? idsToCovers(t.covers) : "") + '">' +
        '<label>正文</label><textarea name="body" style="min-height:110px">' + U.esc(t ? t.body : "") + "</textarea>";
    }
    if (kind === "add-comment") {
      return '<label>评论正文</label><textarea name="body" required placeholder="写给人看的评论"></textarea>';
    }
    if (kind === "edit-comment") {
      var c = findComment(target);
      return '<label>评论正文</label><textarea name="body" required>' + U.esc(c ? c.body : "") + "</textarea>";
    }
    if (kind === "new-ticket") {
      var ctx = target ? findTicket(target) : null;
      var derived = ctx ? (ctx.derived_from || []).join("、") : (state.board.root ? state.board.root.id : "");
      return '<label>标题</label><input name="title" required>' +
        '<label>票型</label><select name="type"><option value="grilling">grilling</option><option value="research">research</option><option value="prototype">prototype</option><option value="task" selected>task</option></select>' +
        '<label>拆票理由</label><textarea name="split_reason" required placeholder="为什么从这条决定拆出来"></textarea>' +
        '<label>derived_from（逗号隔开，写决定编号）</label><input name="derived_from" value="' + U.esc(derived) + '" required>' +
        '<label>covers（逗号隔开，写第几句；可空）</label><input name="covers">' +
        '<label>正文</label><textarea name="body"></textarea>';
    }
    if (kind === "state-ticket") {
      var st = findTicket(target);
      var closing = st && st.state === "open";
      return '<p class="sb-quiet" style="margin-bottom:8px">' + (closing
        ? "关闭后票不再出现在 open 列表，工作状态停止更新。关票前确认已经留下决定或「无结论」理由。"
        : "重开后票回到工作状态同步。") + "</p>" +
        '<label>理由</label><input name="reason" placeholder="' + (closing ? "写一句为什么关" : "写一句为什么重开") + '">' +
        '<p class="note">写一条 issue.state 事件。</p>';
    }
    if (kind === "impact-act") {
      var parts = m.arg.split("|"), action = parts[3] || "";
      if (action === "需修改") {
        var targetDecision = findDecision(parts[2]);
        return '<label>新决定的一句话</label><textarea name="statement" required></textarea>' +
          '<label>来源票</label><input name="source_ticket" value="' +
          U.esc(targetDecision && targetDecision.source_ticket ? "#" + targetDecision.source_ticket : "") +
          '" placeholder="留空就沿用旧决定的来源票">' +
          '<label>理由</label><input name="reason">';
      }
      if (action === "作废") {
        return '<label>作废原因</label><textarea name="void_reason" required></textarea>';
      }
      if (action === "要补问") {
        return '<label>跟进票标题</label><input name="title" required>' +
          '<label>票型</label><select name="type"><option value="grilling">grilling</option><option value="research">research</option></select>' +
          '<label>拆票理由</label><input name="split_reason" placeholder="留空用标题">' +
          '<label>正文</label><textarea name="body"></textarea>';
      }
      if (action === "改范围" || action === "新建") {
        var ticket = action === "改范围" ? findTicket(parts[2]) : null;
        return (action === "新建" ? '<label>新票标题</label><input name="title" required>' : "") +
          '<label>票型</label><select name="type"><option value="task">task</option><option value="grilling">grilling</option><option value="research">research</option><option value="prototype">prototype</option></select>' +
          (action === "新建" ? '<label>拆票理由</label><input name="split_reason">' : "") +
          '<label>derived_from（逗号隔开）</label><input name="derived_from" value="' + U.esc(ticket ? (ticket.derived_from || []).join("、") : "") + '">' +
          (action === "改范围" ? '<label>正文</label><textarea name="body">' + U.esc(ticket ? ticket.body : "") + "</textarea>" : '<label>正文</label><textarea name="body"></textarea>') +
          (action === "改范围" ? '<label>covers（逗号隔开，写第几句）</label><input name="covers" value="' + U.esc(ticket ? idsToCovers(ticket.covers) : "") + '">' : "");
      }
      if (action === "关掉") {
        return '<label>并入哪张票（可空，合并时填）</label><input name="into" placeholder="#147">' +
          '<label>理由</label><input name="reason">';
      }
      if (action === "重开") {
        return '<label>理由</label><input name="reason">';
      }
      return "";
    }
    if (kind === "impact-close") {
      return '<p class="sb-quiet" style="margin-bottom:8px">所有项都处理完了。关闭后这条影响清单不能再处理；后续变化会开新的清单。</p>' +
        '<label>关闭理由</label><input name="reason" placeholder="写一句">';
    }
    if (kind === "sync") {
      return syncModalBody(m);
    }
    return "";
  }

  function syncModalBody(m) {
    if (!state.board.sync || !state.board.sync.mirror) {
      return '<p class="sb-quiet">这张地图的镜像开关是关的。同步只对导入的地图开放；先在命令行打开镜像开关再回来。</p>';
    }
    if (m.planError) {
      return '<p class="modal-error">' + U.esc(m.planError) + "</p>";
    }
    if (!m.plan) {
      return '<p class="sb-quiet">正在比对中台和 GitHub…</p>';
    }
    var actions = m.plan.actions || [];
    var counts = m.plan.counts || {};
    var list = actions.length ? actions.slice(0, 16).map(function (a) {
      return '<div class="impact-line"><span class="il-k">' + U.esc(a.kind) + '</span><div class="il-v">' + U.esc(a.detail) + "</div></div>";
    }).join("") + (actions.length > 16 ? '<p class="sb-quiet">还有 ' + (actions.length - 16) + " 项</p>" : "")
      : '<p class="sb-quiet">没有要改的，两边已经一致。</p>';
    var warn = (m.plan.warnings || []).length
      ? '<div class="note">' + m.plan.warnings.map(U.esc).join("<br>") + "</div>" : "";
    return '<p class="sb-quiet" style="margin-bottom:8px">先出计划，再执行。中台为准，GitHub 上的直接修改会被覆盖。</p>' +
      '<div class="sb-quiet">合计：' + (Object.keys(counts).length ? Object.keys(counts).map(function (k) { return k + " " + counts[k]; }).join(" · ") : "没有动作") + "</div>" +
      list + warn;
  }

  function findComment(cid) {
    for (var i = 0; i < state.board.tickets.length; i++) {
      var cs = state.board.tickets[i].comments || [];
      for (var j = 0; j < cs.length; j++) if (cs[j].id === cid) return cs[j];
    }
    return null;
  }

  function modalView() {
    var m = state.modal;
    if (!m) return "";
    var canSubmit = !state.syncing && !(m.kind === "sync" && (!m.plan || (m.plan.actions || []).length === 0));
    if (m.kind === "sync" && !state.board.sync.mirror) canSubmit = false;
    return '<div class="modal-wrap"><div class="modal-backdrop" data-act="close-modal"></div><div class="modal">' +
      '<div class="modal-head"><div><h3>' + U.esc(modalTitle(m.kind)) + '</h3><p class="sub">' + modalSub(m) + "</p></div>" +
      '<button class="modal-close" data-act="close-modal" aria-label="关闭">×</button></div>' +
      '<form data-form="' + U.esc(m.kind) + '" data-target="' + U.esc(m.target || "") + '" data-arg="' + U.esc(m.arg || "") + '">' +
      modalFields(m) +
      '<div class="modal-error">' + U.esc(m.error || "") + "</div>" +
      '<div class="modal-actions"><button type="button" class="btn" data-act="close-modal">取消</button>' +
      (m.kind === "sync" ? '<button type="button" class="btn" data-act="sync-check">重新检查</button>' : "") +
      '<button type="submit" class="btn primary"' + (canSubmit ? "" : " disabled") + '>' + (m.kind === "sync" ? "执行同步" : "写入事件") + "</button></div>" +
      "</form></div></div>";
  }

  function openModal(kind, target, arg) {
    if ((kind === "impact-act" || kind === "impact-close") && target) {
      arg = target;
      target = "";
    }
    state.modal = { kind: kind, target: target || "", arg: arg || "", error: "" };
    render();
    if (kind === "sync") loadSyncPlan();
  }

  function closeModal() {
    state.modal = null;
    if (state.pendingRender) {
      state.pendingRender = false;
      render();
    } else {
      render();
    }
  }

  function loadSyncPlan() {
    if (!state.modal || state.modal.kind !== "sync") return;
    api("/sync/check", {
      method: "POST",
      body: JSON.stringify({ map: state.mapId })
    }).then(function (plan) {
      if (state.modal && state.modal.kind === "sync") {
        state.modal.plan = plan;
        state.modal.planError = null;
        render();
      }
    }).catch(function (err) {
      if (state.modal && state.modal.kind === "sync") {
        state.modal.planError = err.message;
        render();
      }
    });
  }

  /* ---------- 表单 ---------- */

  function formError(form, message) {
    var node = form.querySelector(".modal-error");
    if (node) node.textContent = message || "";
  }

  function formValue(fd, name) {
    var v = fd.get(name);
    return v == null ? "" : String(v);
  }

  function submitForm(form) {
    var kind = form.getAttribute("data-form");
    var target = form.getAttribute("data-target");
    var arg = form.getAttribute("data-arg");
    var fd = new FormData(form);
    var button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    formError(form, "");

    var work;
    if (kind === "add-premise") {
      work = command("premise.add", {
        decision: target,
        statement: formValue(fd, "statement"),
        evidence: splitList(formValue(fd, "evidence"))
      });
    } else if (kind === "judge-premise") {
      var verdict = formValue(fd, "verdict");
      if (!verdict) {
        if (button) button.disabled = false;
        formError(form, "先选一个判定");
        return;
      }
      work = command("premise.judge", {
        id: target,
        verdict: verdict,
        evidence: splitList(formValue(fd, "evidence"))
      }, formValue(fd, "reason"));
    } else if (kind === "overturn") {
      var statement = formValue(fd, "statement");
      var fragments = splitSentences(formValue(fd, "fragments") || statement);
      var d = findDecision(target);
      var args = {
        id: target,
        statement: statement,
        source_ticket: (formValue(fd, "source_ticket") || "").replace(/^#/, "") || null
      };
      if (d && d.root_of) args.fragments = fragments;
      work = command("decision.overturn", args, formValue(fd, "reason"));
    } else if (kind === "annotate-decision") {
      work = command("decision.annotate", {
        id: target,
        rationale: formValue(fd, "rationale"),
        source: formValue(fd, "source") || null
      });
    } else if (kind === "annotate-premise") {
      work = command("premise.annotate", {
        id: target
      }, formValue(fd, "reason"));
    } else if (kind === "edit-map-rationale") {
      work = command("issue.edit", {
        id: target,
        split_rationale: formValue(fd, "split_rationale")
      });
    } else if (kind === "edit-ticket") {
      work = command("issue.edit", {
        id: target,
        title: formValue(fd, "title") || null,
        type: formValue(fd, "type") || null,
        split_reason: formValue(fd, "split_reason"),
        derived_from: splitList(formValue(fd, "derived_from")),
        covers: coversToIds(formValue(fd, "covers")),
        body: formValue(fd, "body")
      });
    } else if (kind === "add-comment") {
      work = command("comment.add", { issue: target, body: formValue(fd, "body") });
    } else if (kind === "edit-comment") {
      work = command("comment.edit", { id: target, body: formValue(fd, "body") });
    } else if (kind === "new-ticket") {
      var parent = state.mapId;
      var derived = splitList(formValue(fd, "derived_from"));
      if (!derived.length && state.board.root) derived = [state.board.root.id];
      work = command("issue.create", {
        kind: "ticket",
        title: formValue(fd, "title"),
        body: formValue(fd, "body"),
        parent: parent,
        type: formValue(fd, "type") || "task",
        split_reason: formValue(fd, "split_reason"),
        derived_from: derived,
        covers: coversToIds(formValue(fd, "covers"))
      });
    } else if (kind === "state-ticket") {
      var ticket = findTicket(target);
      var nextState = ticket && ticket.state === "open" ? "closed" : "open";
      work = command("issue.state", { id: target, state: nextState }, formValue(fd, "reason"));
    } else if (kind === "impact-act") {
      var parts = arg.split("|");
      var caseId = parts[0], itemKind = parts[1], ref = parts[2], action = parts[3];
      var impactArgs = { case: caseId, kind: itemKind, ref: ref, action: action };
      var reason = formValue(fd, "reason");
      if (action === "需修改") {
        impactArgs.statement = formValue(fd, "statement");
        impactArgs.source_ticket = (formValue(fd, "source_ticket") || "").replace(/^#/, "") || null;
      } else if (action === "作废") {
        impactArgs.void_reason = formValue(fd, "void_reason");
      } else if (action === "要补问") {
        impactArgs.title = formValue(fd, "title");
        impactArgs.type = formValue(fd, "type") || "grilling";
        impactArgs.split_reason = formValue(fd, "split_reason") || formValue(fd, "title");
        impactArgs.body = formValue(fd, "body");
        impactArgs.derived_from = [ref];
      } else if (action === "改范围") {
        impactArgs.body = formValue(fd, "body");
        impactArgs.derived_from = splitList(formValue(fd, "derived_from"));
        impactArgs.covers = coversToIds(formValue(fd, "covers"));
      } else if (action === "关掉") {
        impactArgs.into = formValue(fd, "into") || null;
        impactArgs.merged_into = formValue(fd, "into") || null;
      } else if (action === "新建") {
        impactArgs.title = formValue(fd, "title");
        impactArgs.type = formValue(fd, "type") || "task";
        impactArgs.split_reason = formValue(fd, "split_reason") || formValue(fd, "title");
        impactArgs.derived_from = splitList(formValue(fd, "derived_from"));
        impactArgs.body = formValue(fd, "body");
      }
      work = command("impact.act", impactArgs, reason);
    } else if (kind === "impact-close") {
      work = command("impact.close", { case: arg }, formValue(fd, "reason"));
    } else if (kind === "sync") {
      state.syncing = true;
      render();
      work = api("/sync/run", {
        method: "POST",
        body: JSON.stringify({ map: state.mapId })
      });
    } else {
      if (button) button.disabled = false;
      return;
    }

    work.then(function (data) {
      state.syncing = false;
      var message = "已写入事件";
      var nextSel = null;
      if (kind === "new-ticket" && data && data.id) {
        nextSel = "ticket:" + data.id;
        message = "新建票 " + data.id;
      } else if (kind === "overturn" && data && data.event && data.event.payload && data.event.payload.new_decision) {
        nextSel = "decision:" + data.event.payload.new_decision.id;
        message = "新决定 " + data.event.payload.new_decision.id;
      } else if (kind === "judge-premise" && formValue(fd, "verdict") === "已破") {
        message = "已判「已破」，影响清单已打开";
      } else if (kind === "sync") {
        message = "同步完成" + (data && data.ok === false ? "，有失败项，看同步异常信号" : "");
      } else if (kind === "impact-close") {
        message = "影响清单已关闭";
      }
      state.modal = null;
      if (nextSel) state.sel = nextSel;
      if (nextSel) state.drawer = state.drawer === "closed" ? "open" : state.drawer;
      toast(message, kind === "sync" && data && data.ok === false);
      return refreshBoard().catch(function () {});
    }).catch(function (err) {
      state.syncing = false;
      if (kind === "sync") {
        if (state.modal) state.modal.error = err.message || "同步失败";
        render();
        return;
      }
      if (button) button.disabled = false;
      formError(form, err.message || "写入失败");
      if (err.code === 3 || err.code === 4) {
        state.connected = false;
        render();
      }
    });
  }

  /* ---------- 影响清单快捷动作 ---------- */

  function parseImpactArg(arg) {
    var parts = String(arg || "").split("|");
    return { case: parts[0], kind: parts[1], ref: parts[2], action: parts[3] };
  }

  function impactDo(arg) {
    var p = parseImpactArg(arg);
    command("impact.act", { case: p.case, kind: p.kind, ref: p.ref, action: p.action })
      .then(function () {
        toast("已处理：" + p.ref + " → " + p.action);
        return refreshBoard();
      }).catch(function (err) { toast(err.message, true); });
  }

  function switchMap(id) {
    if (String(id) === String(state.mapId)) return;
    state.mapId = id;
    state.sel = null;
    state.mode = "graph";
    state.filter = null;
    state.impactCase = null;
    state.drawer = "closed";
    state.view = null;
    BoardGraph.reset();
    loadBoard(id).catch(function (err) { state.error = err.message; render(); });
    if (state.sse) { state.sse.close(); state.sse = null; }
  }

  function toggleSignal(key) {
    var s = (state.board.signals || []).filter(function (x) { return x.key === key; })[0];
    if (!s) return;
    if (state.filter === key) { state.filter = null; render(); return; }
    state.filter = key;
    if (key === "coverage-gap") state.mode = "coverage";
    else if (key === "impact-open") state.mode = "impact";
    else state.mode = "graph";
    if (s.targets && s.targets.length && key !== "coverage-gap") {
      var nodeKeys = s.targets.filter(function (k) {
        return k.indexOf("decision:") === 0 || k.indexOf("ticket:") === 0;
      });
      if (nodeKeys.length) state.focusTargets = nodeKeys;
    }
    if (key === "sync-error" && s.count) {
      toast("同步失败项不在图上，点顶栏的同步状态看明细");
    }
    if (s.count === 0) toast("「" + s.label + "」当前没有命中项");
    render();
  }

  /* ---------- 事件 ---------- */

  document.addEventListener("click", function (e) {
    var node = e.target.closest && e.target.closest("[data-act]");
    if (!node) return;
    var act = node.getAttribute("data-act");
    var val = node.getAttribute("data-val") || "";
    var arg = node.getAttribute("data-arg") || "";
    if (act === "select") {
      state.sel = val;
      state.drawer = state.drawer === "pinned" ? "pinned" : "open";
      render();
      var drawer = document.querySelector(".a-drawer");
      if (drawer) drawer.scrollTop = 0;
      return;
    }
    if (act === "drawer") {
      if (val === "open") state.drawer = "open";
      else if (val === "close") state.drawer = "closed";
      else if (val === "pin") state.drawer = state.drawer === "pinned" ? "open" : "pinned";
      render();
      return;
    }
    if (act === "top") {
      state.top = val === "toggle" ? !state.top : false;
      render();
      return;
    }
    if (act === "theme") { setThemePref(val); return; }
    if (act === "mode") {
      state.mode = val;
      if (val === "impact") {
        var open = (state.board.impact_cases || []).filter(function (c) { return c.status === "open"; });
        if (open.length && !state.impactCase) state.impactCase = open[0].id;
        if (!open.length) toast("现在没有开着的影响清单");
        var caseNow = BoardPanels.currentCase(state.board, state.impactCase);
        if (caseNow) state.focusTargets = caseNow.items.map(function (i) { return i.kind + ":" + i.ref; });
      }
      render();
      return;
    }
    if (act === "impact-case") {
      state.impactCase = val;
      var casePick = BoardPanels.currentCase(state.board, val);
      if (casePick) state.focusTargets = casePick.items.map(function (i) { return i.kind + ":" + i.ref; });
      render();
      return;
    }
    if (act === "map") { switchMap(val); return; }
    if (act === "signal") { toggleSignal(val); return; }
    if (act === "clear-filter") { state.filter = null; render(); return; }
    if (act === "zoom") {
      if (val === "fit") BoardGraph.fit();
      else BoardGraph.zoomAt(val === "in" ? 1.25 : 1 / 1.25);
      return;
    }
    if (act === "impact-do") { impactDo(arg); return; }
    if (act === "confirm-derived") {
      node.disabled = true;
      command("issue.confirm_derived", { id: arg, decisions: val ? [val] : [] })
        .then(function () {
          toast("来源已确认");
          return refreshBoard();
        })
        .catch(function (err) {
          node.disabled = false;
          toast(err.message || "确认失败", true);
        });
      return;
    }
    if (act === "modal") { openModal(val, arg, node.getAttribute("data-extra") || ""); return; }
    if (act === "close-modal") { closeModal(); return; }
    if (act === "sync-check") { loadSyncPlan(); return; }
    if (act === "reload") { state.error = null; render(); loadBoard(state.mapId).catch(function (err) { state.error = err.message; render(); }); return; }
  });

  document.addEventListener("submit", function (e) {
    var form = e.target.closest && e.target.closest("form[data-form]");
    if (!form) return;
    e.preventDefault();
    submitForm(form);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (state.modal) { closeModal(); return; }
      if (state.top) { state.top = false; render(); return; }
      if (state.drawer !== "closed" && state.drawer !== "pinned") { state.drawer = "closed"; render(); return; }
    }
    var tag = document.activeElement && document.activeElement.tagName;
    if (["INPUT", "TEXTAREA", "SELECT"].indexOf(tag) >= 0) return;
    if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && state.board && (state.board.maps || []).length > 1) {
      var ids = state.board.maps.map(function (m) { return m.id; });
      var i = ids.indexOf(String(state.mapId));
      var next = ids[(i + (e.key === "ArrowRight" ? 1 : -1) + ids.length) % ids.length];
      switchMap(next);
      e.preventDefault();
    }
  });

  /* 图：拖动平移、滚轮缩放、双击适应 */
  document.addEventListener("pointerdown", function (e) {
    var wrap = e.target.closest && e.target.closest(".graph-a");
    if (!wrap) return;
    if (e.target.closest(".graph-a-tools") || e.target.closest("[data-act]")) return;
    state.dragging = { x: e.clientX, y: e.clientY, moved: false };
    document.body.classList.add("dragging-a");
    e.preventDefault();
  });
  document.addEventListener("pointermove", function (e) {
    if (!state.dragging) return;
    var dx = e.clientX - state.dragging.x, dy = e.clientY - state.dragging.y;
    if (!state.dragging.moved && Math.abs(dx) + Math.abs(dy) > 4) state.dragging.moved = true;
    state.dragging.x = e.clientX;
    state.dragging.y = e.clientY;
    BoardGraph.panBy(dx, dy);
  });
  document.addEventListener("pointerup", function () {
    if (!state.dragging) return;
    state.dragging = null;
    document.body.classList.remove("dragging-a");
  });
  document.addEventListener("pointercancel", function () {
    state.dragging = null;
    document.body.classList.remove("dragging-a");
  });
  document.addEventListener("wheel", function (e) {
    var wrap = e.target.closest && e.target.closest(".graph-a");
    if (!wrap) return;
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      var rect = wrap.getBoundingClientRect();
      var factor = Math.exp(-Math.max(-40, Math.min(40, e.deltaY)) * 0.01);
      BoardGraph.zoomAt(factor, e.clientX - rect.left, e.clientY - rect.top);
    } else {
      BoardGraph.panBy(-e.deltaX, -e.deltaY);
    }
  }, { passive: false });
  document.addEventListener("dblclick", function (e) {
    var wrap = e.target.closest && e.target.closest(".graph-a");
    if (wrap && !e.target.closest("[data-act]")) BoardGraph.fit();
  });

  /* ---------- 启动 ---------- */

  function boot() {
    var params = new URLSearchParams(location.search);
    var map = params.get("map") || null;
    var sel = params.get("sel") || null;
    var mode = params.get("mode");
    var drawer = params.get("drawer");
    var filter = params.get("filter");
    state.sel = sel;
    state.mode = mode === "impact" || mode === "coverage" ? mode : "graph";
    state.drawer = drawer === "open" || drawer === "pinned" ? drawer : "closed";
    state.filter = filter || null;
    state.loading = true;
    render();
    loadBoard(map).then(function () {
      setInterval(pollWorkstate, 2000);
      setInterval(pollSync, 5000);
    }).catch(function (err) {
      state.loading = false;
      state.error = err.message || "请求失败";
      render();
    });
    if (window.matchMedia) {
      var mq = matchMedia("(prefers-color-scheme: dark)");
      var onScheme = function () {
        if (themePref() !== "auto") return;
        document.documentElement.setAttribute("data-theme", mq.matches ? "dark" : "light");
      };
      if (mq.addEventListener) mq.addEventListener("change", onScheme);
      else if (mq.addListener) mq.addListener(onScheme);
    }
  }

  boot();
})();
