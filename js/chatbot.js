/* ==========================================================
 * chatbot.js — 智能客服机器人（本地规则库，无需联网 API）
 * 依赖：knowledge.js（KB / KB_MENU）
 * ========================================================== */
(function () {
  'use strict';

  /* ---------- 匹配引擎 ---------- */
  function norm(s) { return String(s || '').toLowerCase().replace(/\s+/g, ''); }

  function match(input) {
    const q = norm(input);
    if (!q) return null;
    let best = null, bestScore = 0;
    for (const item of KB) {
      let score = 0;
      for (const k of item.keys) {
        const nk = norm(k);
        if (!nk) continue;
        if (q.includes(nk)) score += nk.length * 2;      // 用户输入包含关键词
        else if (nk.includes(q) && q.length >= 2) score += q.length; // 关键词包含输入
      }
      if (norm(item.q).includes(q) && q.length >= 2) score += q.length * 2;
      if (score > bestScore) { bestScore = score; best = item; }
    }
    return bestScore >= 2 ? best : null;
  }

  function suggest(input) {
    const q = norm(input);
    return KB.filter(it => it.keys.some(k => norm(k).includes(q) || q.includes(norm(k))) && q.length >= 1)
      .slice(0, 3);
  }

  /* ---------- UI ---------- */
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function init() {
    // 悬浮按钮
    const fab = el('button', 'cb-fab', '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>');
    fab.title = '智能客服';
    document.body.appendChild(fab);

    // 聊天窗
    const win = el('div', 'cb-win');
    win.innerHTML =
      '<div class="cb-head">' +
      '  <div class="cb-head-info"><div class="cb-avatar">木</div>' +
      '  <div><div class="cb-title">智能客服</div><div class="cb-sub">木地板门店智能管理系统</div></div></div>' +
      '  <button class="cb-close" aria-label="关闭">×</button>' +
      '</div>' +
      '<div class="cb-body" id="cb-body"></div>' +
      '<div class="cb-quick" id="cb-quick"></div>' +
      '<div class="cb-input"><input id="cb-text" type="text" placeholder="请输入您的问题…" autocomplete="off"><button id="cb-send">发送</button></div>';
    document.body.appendChild(win);

    const body = win.querySelector('#cb-body');
    const quick = win.querySelector('#cb-quick');
    const input = win.querySelector('#cb-text');
    const sendBtn = win.querySelector('#cb-send');

    function scrollBottom() { body.scrollTop = body.scrollHeight; }

    function botSay(html, withMenu) {
      const m = el('div', 'cb-msg cb-bot', '<div class="cb-bubble">' + html + '</div>');
      body.appendChild(m);
      scrollBottom();
      if (withMenu) renderQuick();
    }
    function userSay(text) {
      const m = el('div', 'cb-msg cb-user', '<div class="cb-bubble"></div>');
      m.querySelector('.cb-bubble').textContent = text;
      body.appendChild(m);
      scrollBottom();
    }
    function typing(cb) {
      const t = el('div', 'cb-msg cb-bot', '<div class="cb-bubble cb-typing"><span></span><span></span><span></span></div>');
      body.appendChild(t); scrollBottom();
      setTimeout(() => { t.remove(); cb(); }, 450 + Math.random() * 350);
    }

    function renderQuick() {
      quick.innerHTML = '';
      KB_MENU.forEach(it => {
        const b = el('button', 'cb-chip', it.label);
        b.addEventListener('click', () => { ask(it.q); });
        quick.appendChild(b);
      });
    }

    function ask(text) {
      userSay(text);
      typing(() => {
        const hit = match(text);
        if (hit) {
          botSay(hit.a, true);
        } else {
          const sug = suggest(text);
          let html = '抱歉，这个问题我暂时答不上来。';
          if (sug.length) {
            html += '您可能想问：<br>' + sug.map(s => '· <a href="javascript:void(0)" class="cb-link" data-q="' + s.q.replace(/"/g, '&quot;') + '">' + s.q + '</a>').join('<br>');
          } else {
            html += '<br>您可以换个说法，或点击下方快捷菜单；也可以联系人工客服获取帮助。';
          }
          botSay(html, true);
        }
      });
    }

    // 事件
    fab.addEventListener('click', () => {
      win.classList.toggle('open');
      if (win.classList.contains('open') && !body.dataset.greeted) {
        body.dataset.greeted = '1';
        typing(() => botSay(match('你好').a, true));
      }
      if (win.classList.contains('open')) input.focus();
    });
    win.querySelector('.cb-close').addEventListener('click', () => win.classList.remove('open'));
    sendBtn.addEventListener('click', () => { const v = input.value.trim(); if (v) { input.value = ''; ask(v); } });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') sendBtn.click(); });
    body.addEventListener('click', e => {
      const a = e.target.closest('.cb-link');
      if (a) ask(a.dataset.q);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
