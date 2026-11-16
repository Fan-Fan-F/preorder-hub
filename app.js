// 预售中心逻辑：定金期 → 尾款期 → 发货
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const fmt = (n) => "¥" + n.toLocaleString();

  // 全局阶段：统一从加载时刻开始（演示）
  const startAt = Date.now();
  const depositEnd = startAt + 8 * 60000;   // 定金期 8 分钟
  const finalEnd = depositEnd + 6 * 60000;  // 尾款期 6 分钟

  let orders = load("preorder-orders", []); // { id, productId, depositAt, finalAt|null, status }
  function load(k, fb) { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } }
  function save() { localStorage.setItem("preorder-orders", JSON.stringify(orders)); }

  function globalPhase() {
    const now = Date.now();
    if (now < depositEnd) return "deposit";
    if (now < finalEnd) return "final";
    return "ship";
  }

  /* ---------- 倒计时 ---------- */
  function fmtLeft(target) {
    const ms = Math.max(0, target - Date.now());
    const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  setInterval(render, 1000);

  /* ---------- 动作 ---------- */
  function payDeposit(productId) {
    if (globalPhase() !== "deposit") { toast("定金期已过，无法下定"); return; }
    if (orders.some(o => o.productId === productId)) { toast("你已预定过该商品"); return; }
    const p = PRESALE_PRODUCTS.find(x => x.id === productId);
    p.presaled++;
    orders.unshift({
      id: "PO" + Date.now().toString().slice(-8),
      productId, depositAt: Date.now(), finalAt: null,
      status: "deposit-paid",   // deposit-paid → final-paid → shipped
    });
    save();
    toast(`✅ 定金 ${fmt(p.deposit)} 已支付，尾款期付 ${fmt(p.fullPrice - p.depositExpand)} 即可`);
    render();
  }

  function payFinal(orderId) {
    const o = orders.find(x => x.id === orderId);
    if (!o || o.status !== "deposit-paid") return;
    if (globalPhase() !== "final") {
      toast(globalPhase() === "deposit" ? "尾款支付通道尚未开启" : "尾款期已过，定金已原路退回");
      return;
    }
    o.finalAt = Date.now();
    o.status = "final-paid";
    save();
    toast("🎉 尾款支付成功，静候发货！");
    render();
  }

  /* ---------- 渲染 ---------- */
  function render() {
    const phase = globalPhase();

    // 阶段条
    document.querySelectorAll(".phase-item").forEach(el => {
      el.classList.toggle("on", el.dataset.phase === phase);
    });
    $("#phaseNote").textContent =
      phase === "deposit" ? `定金期剩余 ${fmtLeft(depositEnd)}（结束后不可再下定）` :
      phase === "final"   ? `尾款期剩余 ${fmtLeft(finalEnd)}（未付尾款定金原路退回）` :
      "发货阶段：按尾款支付顺序陆续发出";

    // 商品
    $("#productList").innerHTML = PRESALE_PRODUCTS.map(p => {
      const finalPay = p.fullPrice - p.depositExpand;
      const total = p.deposit + finalPay;
      const pct = Math.round(p.presaled / p.stock * 100);
      const mine = orders.find(o => o.productId === p.id);
      return `
      <div class="pre-card">
        <div class="pre-emoji" style="background:hsl(${p.hue},70%,93%)">${p.emoji}</div>
        <div class="pre-main">
          <p class="pre-name">${p.name}</p>
          <p class="pre-desc">${p.desc}</p>
          <div class="pre-pricing">
            <span class="full">${fmt(total)}</span>
            <span class="expand">定金 ${fmt(p.deposit)} 抵 ${fmt(p.depositExpand)}</span>
            <span class="final">尾款 ${fmt(finalPay)}</span>
          </div>
          <div class="pre-progress"><i style="width:${pct}%"></i></div>
          <div class="pre-meta"><span>已预定 ${p.presaled}/${p.stock}</span><span>${pct}%</span></div>
          <div class="pre-actions">
            ${mine
              ? `<span class="badge ${mine.status === "final-paid" ? "done" : "wait"}">
                   ${mine.status === "final-paid" ? "已付全款" : "已下定，待付尾款"}</span>`
              : phase === "deposit"
                ? `<button class="btn-dep" data-dep="${p.id}">付定金 ${fmt(p.deposit)}</button>`
                : `<span class="phase-tag">${phase === "final" ? "定金期已结束" : "预售已结束"}</span>`}
          </div>
        </div>
      </div>`;
    }).join("");

    // 我的订单
    $("#myOrders").innerHTML = orders.length ? orders.map(o => {
      const p = PRESALE_PRODUCTS.find(x => x.id === o.productId);
      const steps = [
        { key: "deposit", label: `定金 ${fmt(p.deposit)}` },
        { key: "final", label: `尾款 ${fmt(p.fullPrice - p.depositExpand)}` },
        { key: "ship", label: "发货" },
      ];
      const stepState = o.status === "final-paid" ? ["done", "done", "now"] : ["done", "now", ""];
      return `
      <div class="order-card">
        <div class="order-top">
          <b>${p.emoji} ${p.name}</b>
          <span class="badge ${o.status === "final-paid" ? "done" : "wait"}">
            ${o.status === "final-paid" ? "待发货" : "待付尾款"}</span>
        </div>
        <div class="order-steps">
          ${steps.map((s, i) => `<div class="ostep ${stepState[i]}">${s.label}</div>`).join("")}
        </div>
        <div class="order-money">
          <span>定金已付 <b>${fmt(p.deposit)}</b>（膨胀为 ${fmt(p.depositExpand)}）</span>
          <span>实付合计 <b>${fmt(p.deposit + (o.status === "final-paid" ? p.fullPrice - p.depositExpand : 0))}</b> / 总价 ${fmt(p.deposit + p.fullPrice - p.depositExpand)}</span>
        </div>
        ${o.status === "deposit-paid" ? `
          <div class="order-act">
            <button class="btn-final" data-final="${o.id}" ${phase !== "final" ? "disabled style='opacity:.5'" : ""}>
              ${phase === "final" ? `支付尾款 ${fmt(p.fullPrice - p.depositExpand)}` : phase === "deposit" ? "尾款期未开始" : "尾款期已过"}
            </button>
          </div>` : ""}
      </div>`;
    }).join("") : `<p class="empty">还没有预售订单</p>`;
  }

  /* ---------- 事件 ---------- */
  $("#productList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-dep]");
    if (btn) payDeposit(btn.dataset.dep);
  });
  $("#myOrders").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-final]");
    if (btn && !btn.disabled) payFinal(btn.dataset.final);
  });

  function toast(text) {
    const t = $("#toast");
    t.textContent = text;
    t.hidden = false;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => (t.hidden = true), 2600);
  }

  render();
})();
