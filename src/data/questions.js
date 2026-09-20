// 色盲检查图第6版 - 48 道测试题
// 答案已按文档逐题核对（图 → 答案映射经图片内容抽查验证）
// 2026-09-20 全量更换高清图版后逐张复核：图1 新图方向读 606，与旧图（旋转 180° 呈 909）方向相反，答案仍沿用 909

export const QUESTIONS = [
  { image: 'image1.jpeg',  answer: '909',  type: 'number' },
  { image: 'image2.jpeg',  answer: '29',   type: 'number' },
  { image: 'image3.jpeg',  answer: '69',   type: 'number' },
  { image: 'image4.jpeg',  answer: '88',   type: 'number' },
  { image: 'image5.jpeg',  answer: '60',   type: 'number' },
  { image: 'image6.jpeg',  answer: '162',  type: 'number' },
  { image: 'image7.jpeg',  answer: '916',  type: 'number' },
  { image: 'image8.jpeg',  answer: '56',   type: 'number' },
  { image: 'image9.jpeg',  answer: '628',  type: 'number' },
  { image: 'image10.jpeg', answer: '602',  type: 'number' },
  { image: 'image11.jpeg', answer: '268',  type: 'number' },
  { image: 'image12.jpeg', answer: '985',  type: 'number' },
  { image: 'image13.jpeg', answer: '6289', type: 'number' },
  { image: 'image14.jpeg', answer: '6098', type: 'number' },
  { image: 'image15.jpeg', answer: '2901', type: 'number' },
  { image: 'image16.jpeg', answer: '8609', type: 'number' },
  { image: 'image17.jpeg', answer: '熊猫', type: 'animal' },
  { image: 'image18.jpeg', answer: '三角形、圆形', type: 'shape' },
  { image: 'image19.jpeg', answer: '大圆', type: 'shape' },
  { image: 'image20.jpeg', answer: '牛',   type: 'animal' },
  { image: 'image21.jpeg', answer: '蜻蜓', type: 'animal' },
  { image: 'image22.jpeg', answer: '鹅',   type: 'animal' },
  { image: 'image23.jpeg', answer: '金鱼', type: 'animal' },
  { image: 'image24.jpeg', answer: '燕子', type: 'animal' },
  { image: 'image25.jpeg', answer: '羊',   type: 'animal' },
  { image: 'image26.jpeg', answer: '兔子', type: 'animal' },
  { image: 'image27.jpeg', answer: '蝴蝶', type: 'animal' },
  { image: 'image28.jpeg', answer: '圆形、剪刀', type: 'shape' },
  { image: 'image29.jpeg', answer: '上排 899，下排 022', type: 'rows' },
  { image: 'image30.jpeg', answer: '上排 621，下排 989', type: 'rows' },
  { image: 'image31.jpeg', answer: '红色', type: 'color' },
  { image: 'image32.jpeg', answer: '黄色', type: 'color' },
  { image: 'image33.jpeg', answer: '蓝色', type: 'color' },
  { image: 'image34.jpeg', answer: '绿色', type: 'color' },
  { image: 'image35.jpeg', answer: '紫色', type: 'color' },
  { image: 'image36.jpeg', answer: '2个五角星', type: 'shape' },
  { image: 'image37.jpeg', answer: '522',  type: 'number' },
  { image: 'image38.jpeg', answer: '825',  type: 'number' },
  { image: 'image39.jpeg', answer: '5 和 8', type: 'number' },
  { image: 'image40.jpeg', answer: '0 和 9', type: 'number' },
  { image: 'image41.jpeg', answer: '三角形、正方形', type: 'shape' },
  { image: 'image42.jpeg', answer: '86',   type: 'number' },
  { image: 'image43.jpeg', answer: '茶壶', type: 'object' },
  { image: 'image44.jpeg', answer: '21',   type: 'number' },
  { image: 'image45.jpeg', answer: '52',   type: 'number' },
  { image: 'image46.jpeg', answer: '69',   type: 'number' },
  { image: 'image47.jpeg', answer: '2个圆', type: 'shape' },
  { image: 'image48.jpeg', answer: '正方形、三角形', type: 'shape' },
]

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
    '上排 899，下排 022', '上排 621，下排 989', '上排 699，下排 028',
    '上排 826，下排 988', '上排 689，下排 022', '上排 621，下排 968',
    '上排 896，下排 020', '上排 627，下排 986',
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
