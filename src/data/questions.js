// 出题引擎(版本无关):干扰项池 + 选项生成 + 洗牌
// 各版本题库在 data/editions/ 下作为数据包挂载,本文件只保留共用逻辑

// 各类型干扰项池
const POOLS = {
  number: [
    '26', '28', '66', '68', '98', '89', '59', '50', '90', '80',
    '126', '152', '169', '196', '816', '918', '926', '956', '58', '65',
    '288', '683', '829', '689', '682', '609', '905', '960', '662', '928',
    '265', '286', '869', '958', '995', '986', '6859', '6239', '6989', '6089',
    '2610', '8608', '8509', '8606', '523', '525', '855', '823', '865', '87',
    '85', '25', '55', '22', '11', '12', '24', '27', '51', '57',
    '2 和 8', '5 和 9', '6 和 8', '0 和 6', '8 和 9', '3 和 8',
  ],
  animal: ['熊猫', '牛', '蜻蜓', '鹅', '金鱼', '燕子', '羊', '兔子', '蝴蝶', '狗', '猫', '马', '鸟', '鱼', '猴子'],
  shape: [
    '三角形、圆形', '大圆', '圆形、剪刀', '2个五角星', '三角形、正方形',
    '2个圆', '正方形、三角形', '五角星', '圆形', '正方形', '三角形',
    '2个三角形', '圆、正方形', '菱形、圆形', '1个五角星',
  ],
  color: ['红色', '黄色', '蓝色', '绿色', '紫色', '橙色', '粉色', '黑色', '棕色', '灰色'],
  rows: [
    '899、022', '621、989', '699、028',
    '826、988', '689、022', '621、968',
    '896、020', '627、986',
  ],
  object: ['茶壶', '水杯', '花瓶', '闹钟', '剪刀', '眼镜', '雨伞'],
}

// 随机打乱数组（返回新数组）
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 为每道题生成 6 个选项（1 个正确答案 + 2 个同类干扰 + 3 个跨类型干扰），顺序随机
export function buildOptions(question) {
  // 同类型干扰 2 个 + 跨类型干扰 3 个,避免 6 个选项全是同一类型
  const samePool = POOLS[question.type].filter((item) => item !== question.answer)
  const distractors = shuffle(samePool).slice(0, 2)
  let crossPool = Object.keys(POOLS)
    .filter((t) => t !== question.type)
    .flatMap((t) => POOLS[t])
  if (question.type === 'rows') crossPool = [...POOLS.number, ...crossPool] // 上下排题优先混入纯数字干扰
  const cross = shuffle(crossPool).slice(0, 3)
  return shuffle([question.answer, ...distractors, ...cross])
}
