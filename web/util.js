/* 共用小工具。 */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function inline(x) {
    return esc(x)
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
        '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  }

  function mdLite(text) {
    var lines = String(text || "").split("\n");
    var out = [], inList = false;
    function closeList() { if (inList) { out.push("</ul>"); inList = false; } }
    lines.forEach(function (raw) {
      var line = raw.replace(/\s+$/, "");
      if (!line.trim()) { closeList(); return; }
      if (/^\s*```/.test(line)) { closeList(); return; }
      if (/^#{1,6}\s+/.test(line)) {
        closeList();
        out.push('<p class="md-h">' + inline(line.replace(/^#{1,6}\s+/, "")) + "</p>");
        return;
      }
      if (/^\s*[-*+]\s+/.test(line)) {
        if (!inList) { out.push('<ul class="md-list">'); inList = true; }
        out.push("<li>" + inline(line.replace(/^\s*[-*+]\s+/, "")) + "</li>");
        return;
      }
      closeList();
      out.push("<p>" + inline(line) + "</p>");
    });
    closeList();
    return out.join("");
  }

  function trunc(s, n) {
    s = String(s || "");
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }

  function wrap(s, n) {
    s = String(s || "");
    var out = [], line = "";
    for (var i = 0; i < s.length; i++) {
      line += s[i];
      if (line.length >= n) {
        var cut = -1, j;
        for (j = line.length - 1; j >= Math.max(1, line.length - 7); j--) {
          if ("，；、。！？".indexOf(line[j]) >= 0) { cut = j + 1; break; }
        }
        if (cut < 0) {
          for (j = line.length - 1; j >= 1; j--) {
            if (line[j] === " ") { cut = j + 1; break; }
          }
        }
        if (cut < 0) cut = line.length;
        out.push(line.slice(0, cut));
        line = line.slice(cut);
      }
    }
    if (line) out.push(line);
    return out;
  }

  function wrapLines(s, n) {
    var out = [];
    String(s || "").split("\n").forEach(function (part) {
      if (!part) return;
      wrap(part, n).forEach(function (line) { out.push(line); });
    });
    return out;
  }

  function fmtTs(value) {
    if (!value) return "—";
    var d = new Date(value);
    if (isNaN(d.getTime())) return String(value).replace("T", " ").replace("Z", "");
    function pad(n) { return String(n).padStart(2, "0"); }
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function fragNum(fragmentId) {
    var m = String(fragmentId || "").match(/#(\d+)$/);
    return m ? Number(m[1]) : null;
  }

  function natural(a, b) {
    return String(a).localeCompare(String(b), "zh-CN", { numeric: true, sensitivity: "base" });
  }

  var STATUS_LABEL = {
    active: "生效中", superseded: "已被取代", void: "已作废",
    未验: "未验", 成立: "成立", 已破: "已破", 未知: "未知"
  };
  function statusLabel(s) { return STATUS_LABEL[s] || s || ""; }

  function stateChip(s) {
    var cls = s === "成立" ? "green" : s === "已破" ? "red" : s === "未知" ? "violet" : s === "未验" ? "gray"
      : s === "active" ? "accent" : (s === "superseded" || s === "void") ? "gray" : "gray";
    return '<span class="chip ' + cls + '">' + esc(statusLabel(s)) + "</span>";
  }

  function premiseTone(p) {
    return p.state === "已破" ? "red" : p.state === "成立" ? "green" : p.state === "未知" ? "amber" : "gray";
  }

  function decisionTone(d) {
    if (d.status !== "active") return "void";
    if (d.root_of) return "root";
    var ps = d.premises || [];
    if (!ps.length) return "bare";
    if (ps.some(function (p) { return p.state === "已破"; })) return "red";
    if (ps.some(function (p) { return p.state === "未知" || p.state === "未验"; })) return "amber";
    if (ps.every(function (p) { return p.state === "成立"; })) return "green";
    return "amber";
  }

  function toneClass(tone) {
    return { root: "accent", green: "green", amber: "amber", red: "red", bare: "gray", void: "void", oldroot: "gray" }[tone] || "gray";
  }

  function workTone(work) {
    if (work === "已完成") return "green";
    if (work === "进行中") return "accent";
    if (work === "等待人" || work === "等合并") return "amber";
    if (work === "被挡") return "red";
    return "gray";
  }

  function workDot(work) {
    if (work === "已完成") return "done";
    if (work === "进行中") return "now";
    if (work === "等待人" || work === "等合并" || work === "被挡") return "stuck";
    return "";
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments, self = this;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { timer = null; fn.apply(self, args); }, wait);
    };
  }

  function lineChars(w, size, pad) {
    return Math.max(8, Math.floor((w - (pad || 24)) / size));
  }

  window.U = {
    esc: esc, mdLite: mdLite, trunc: trunc, wrap: wrap, wrapLines: wrapLines,
    fmtTs: fmtTs, fragNum: fragNum, natural: natural, statusLabel: statusLabel,
    stateChip: stateChip, premiseTone: premiseTone, decisionTone: decisionTone,
    toneClass: toneClass, workTone: workTone, workDot: workDot,
    debounce: debounce, lineChars: lineChars
  };
})();
