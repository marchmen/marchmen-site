/* ==========================================================
 * main.js — 官网交互（导航、付款登记表单提交）
 * ========================================================== */
(function () {
  'use strict';

  /* API 地址：同域部署时直接用相对路径 */
  const API_URL = 'api/api.php';

  /* ---------- 导航：顶部透明悬浮，滚动后变白色玻璃（页面最顶端无白边） ---------- */
  const nav = document.querySelector('.nav');
  const syncNav = () => {
    if (!nav) return;
    nav.classList.toggle('solid', window.scrollY > 30 || (links && links.classList.contains('open')));
  };
  window.addEventListener('scroll', syncNav, { passive: true });

  /* ---------- 移动端导航 ---------- */
  const burger = document.getElementById('navBurger');
  const links = document.getElementById('navLinks');
  if (burger && links) {
    burger.addEventListener('click', () => {
      links.classList.toggle('open');
      syncNav(); // 展开菜单时强制导航变白底，保证链接可读
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open');
      syncNav();
    }));
  }
  syncNav();

  /* ---------- 页脚「在线智能客服」唤起机器人 ---------- */
  const footBot = document.getElementById('footBot');
  if (footBot) {
    footBot.addEventListener('click', () => {
      const fab = document.querySelector('.cb-fab');
      if (fab) fab.click();
    });
  }

  /* ---------- 付款登记表单 ---------- */
  const form = document.getElementById('payForm');
  const msg = document.getElementById('payMsg');
  if (!form) return;

  /* ---------- 费用标准：永久购买 ￥888 / 逐年购买 ￥188 ---------- */
  const PLAN_PRICE = { '永久购买': '888', '逐年购买': '188' };
  const planSel = document.getElementById('payPlan');
  const syncAmount = () => { if (planSel && form.amount) form.amount.value = PLAN_PRICE[planSel.value] || ''; };
  if (planSel) {
    planSel.addEventListener('change', syncAmount);
    syncAmount();
  }
  /* 价格卡片按钮：选定购买方式并滚动到登记表单 */
  document.querySelectorAll('.price-pick').forEach(btn => {
    btn.addEventListener('click', () => {
      if (planSel) {
        planSel.value = btn.dataset.plan === 'yearly' ? '逐年购买' : '永久购买';
        syncAmount();
      }
      document.getElementById('payForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'form-msg';
    msg.textContent = '';

    const data = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      plan: form.plan.value,
      channel: form.channel.value,
      amount: parseFloat(form.amount.value),
      txn: form.txn.value.trim(),
      note: form.note.value.trim(),
      submittedAt: Date.now()
    };

    if (!data.name || !/^1\d{10}$/.test(data.phone)) {
      msg.className = 'form-msg err';
      msg.textContent = '请填写姓名和正确的 11 位手机号';
      return;
    }
    if (!data.amount || data.amount <= 0) {
      msg.className = 'form-msg err';
      msg.textContent = '请填写正确的付款金额';
      return;
    }

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = '提交中…';

    try {
      // 主通道：PHP 官网后台；站点改用 Netlify 部署时回退到 Functions（避免 PHP 404）
      let json = null;
      try {
        const res = await fetch(API_URL + '?action=order/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        json = await res.json();
      } catch (e) {
        const res2 = await fetch('/.netlify/functions/order-submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res2.ok) throw new Error('HTTP ' + res2.status);
        json = await res2.json();
      }
      if (json && json.ok) {
        msg.className = 'form-msg ok';
        msg.textContent = '提交成功！客服确认到账后将通过短信发送授权码至 ' + data.phone + '，请留意查收。';
        form.reset();
      } else {
        throw new Error(json && json.error ? json.error : '提交失败');
      }
    } catch (err) {
      // 服务器暂不可用时降级：提示用户保存凭证，并给出人工联系方式
      msg.className = 'form-msg err';
      msg.innerHTML = '提交未成功（' + (err.message || '网络异常') + '）。<br>请截图保存本页与付款凭证，直接联系人工客服完成登记。';
    } finally {
      btn.disabled = false;
      btn.textContent = '提交付款登记';
    }
  });
})();
