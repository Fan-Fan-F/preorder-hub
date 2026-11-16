// 预售商品（原创虚构）——阶段时间以分钟计便于演示
const PRESALE_PRODUCTS = [
  {
    id: "pre1", name: "全画幅微单相机（新品首发）", emoji: "📸", hue: 220,
    fullPrice: 12999, deposit: 500, depositExpand: 1000,   // 定金 500 抵 1000
    stock: 300, presaled: 187,
    phases: { depositMin: 8, finalMin: 5 },                // 定金期 8 分钟 → 尾款期 5 分钟
    desc: "新一代 6100 万像素传感器，8K 视频，首发赠电池手柄。",
  },
  {
    id: "pre2", name: "设计师联名机械键盘", emoji: "⌨️", hue: 260,
    fullPrice: 899, deposit: 50, depositExpand: 150,
    stock: 500, presaled: 322,
    phases: { depositMin: 10, finalMin: 6 },
    desc: "联名限定配色，PBT 五面热升华键帽，编号铭牌。",
  },
  {
    id: "pre3", name: "智能扫拖机器人 X2", emoji: "🤖", hue: 190,
    fullPrice: 2499, deposit: 100, depositExpand: 300,
    stock: 200, presaled: 96,
    phases: { depositMin: 6, finalMin: 4 },
    desc: "全能基站版，自动集尘+洗拖布+烘干。",
  },
];
