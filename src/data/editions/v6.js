// 《色盲检查图》第 6 版数据包:题目 + 学习内容
// 答案已按文档逐题核对（图 → 答案映射经图片内容抽查验证）
// 2026-09-20 全量更换高清图版后逐张复核：图1 新图方向读 606，与旧图（旋转 180° 呈 909）方向相反，答案仍沿用 909
// 图片素材:检查图在 public/plates/v6/、学习图在 public/study/v6/(各版本图片放带版本号的子目录)
// crop 特写图(q_imageN_c1.jpg):技巧图特征区域的红框特写放大图,学习卡特写视图与总结复习画廊共用

// ---------- 测试题(48 道;按题型分组:数字 / 动物 / 形状 / 整行数字 / 颜色 / 物品) ----------
const QUESTIONS = [
  // ---------- 数字(24) ----------
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
  { image: 'image37.jpeg', answer: '522',  type: 'number' },
  { image: 'image38.jpeg', answer: '825',  type: 'number' },
  { image: 'image39.jpeg', answer: '5/8',  type: 'number' },
  { image: 'image40.jpeg', answer: '0/9',  type: 'number' },
  { image: 'image42.jpeg', answer: '86',   type: 'number' },
  { image: 'image44.jpeg', answer: '21',   type: 'number' },
  { image: 'image45.jpeg', answer: '52',   type: 'number' },
  { image: 'image46.jpeg', answer: '69',   type: 'number' },

  // ---------- 动物(9) ----------
  { image: 'image17.jpeg', answer: '熊猫', type: 'animal' },
  { image: 'image20.jpeg', answer: '牛',   type: 'animal' },
  { image: 'image21.jpeg', answer: '蜻蜓', type: 'animal' },
  { image: 'image22.jpeg', answer: '鹅',   type: 'animal' },
  { image: 'image23.jpeg', answer: '金鱼', type: 'animal' },
  { image: 'image24.jpeg', answer: '燕子', type: 'animal' },
  { image: 'image25.jpeg', answer: '羊',   type: 'animal' },
  { image: 'image26.jpeg', answer: '兔子', type: 'animal' },
  { image: 'image27.jpeg', answer: '蝴蝶', type: 'animal' },

  // ---------- 形状(7) ----------
  { image: 'image18.jpeg', answer: '△/○', type: 'shape' },
  { image: 'image19.jpeg', answer: '○',    type: 'shape' },
  { image: 'image28.jpeg', answer: '○/✂',  type: 'shape' },
  { image: 'image36.jpeg', answer: '☆☆',   type: 'shape' },
  { image: 'image41.jpeg', answer: '△/□',  type: 'shape' },
  { image: 'image47.jpeg', answer: '○○',   type: 'shape' },
  { image: 'image48.jpeg', answer: '□/△',  type: 'shape' },

  // ---------- 整行数字(2) ----------
  { image: 'image29.jpeg', answer: '899/022', type: 'rows' },
  { image: 'image30.jpeg', answer: '621/989', type: 'rows' },

  // ---------- 颜色(5) ----------
  { image: 'image31.jpeg', answer: '红色', type: 'color' },
  { image: 'image32.jpeg', answer: '黄色', type: 'color' },
  { image: 'image33.jpeg', answer: '蓝色', type: 'color' },
  { image: 'image34.jpeg', answer: '绿色', type: 'color' },
  { image: 'image35.jpeg', answer: '紫色', type: 'color' },

  // ---------- 物品(1) ----------
  { image: 'image43.jpeg', answer: '茶壶', type: 'object' },
]

// ---------- 学习内容 ----------
// 题目图(q_*.png)与解析图(*_d*.png)均从 PDF 对应页面逐张提取,经感知哈希(pHash)匹配确认
// category: easy = 简单一眼出(不用背) / feature = 特征认图 / number = 数字口诀
// crop = 特写图文件名;挂了 crop 的条目同时进「总结复习」画廊(按 feature.sub / category 分组)
// 没有技巧图的条目加 noTipImg: true(如 easy 类,q_*.png 只是原图复制品),
// 学习页/放大层会隐藏技巧图栏并默认展示原图;image 字段仍需保留用于推导原图路径与 zoom 匹配
// noTipImg: true 没有技巧图隐藏技巧图栏
const STUDY_ITEMS = [
  // ---------- 简单一眼出(13 张) ----------
  { image: 'q_image1.png',  answer: '909',   category: 'easy', tip: '', noTipImg: true },
  { image: 'q_image44.png', answer: '21',    category: 'easy', tip: '', noTipImg: true },
  { image: 'q_image45.png', answer: '52',    category: 'easy', tip: '', noTipImg: true },
  { image: 'q_image46.png', answer: '69',    category: 'easy', tip: '', noTipImg: true },
  { image: 'q_image17.png', answer: '熊猫',  category: 'easy', tip: '', noTipImg: true },
  { image: 'q_image47.png', answer: '○○', category: 'easy', tip: '', noTipImg: true },
  { image: 'q_image48.png', answer: '□/△', category: 'easy', tip: '', noTipImg: true },
  { image: 'q_image36.png', answer: '☆☆', category: 'easy', tip: '', noTipImg: true },
  { image: 'q_image31.png', answer: '红色',  category: 'easy', tip: '', noTipImg: true },
  { image: 'q_image32.png', answer: '黄色',  category: 'easy', tip: '', noTipImg: true },
  { image: 'q_image33.png', answer: '蓝色',  category: 'easy', tip: '', noTipImg: true },
  { image: 'q_image34.png', answer: '绿色',  category: 'easy', tip: '', noTipImg: true },
  { image: 'q_image35.png', answer: '紫色',  category: 'easy', tip: '', noTipImg: true },

  // ---------- 特征认图(28 张;sub: num=数字 / animal=动物 / other=形状及其他) ----------
  { image: 'q_image2.png',  answer: '29',   category: 'feature', sub: 'num', tip: '记左上角：两对称三角形', details: ['image2_d1.png'], crop: 'q_image2_c1.jpg', tipAudio: 'tip_audios/q_image2_tip.mp3' },
  { image: 'q_image3.png',  answer: '69',   category: 'feature', sub: 'num', tip: '记左上角：两相互扣的三角形(6 9 嘛,懂得都懂)', details: ['image3_d1.png'], crop: 'q_image3_c1.jpg', tipAudio: 'tip_audios/q_image3_tip.mp3' },
  { image: 'q_image5.png',  answer: '60',   category: 'feature', sub: 'num', tip: '记左上角：平行四边形', details: ['image5_d1.png'], crop: 'q_image5_c1.jpg', tipAudio: 'tip_audios/q_image5_tip.mp3' },
  { image: 'q_image7.png',  answer: '916',  category: 'feature', sub: 'num', tip: '中间一大竖,或右上角深绿色四边形和三角形往内叩', details: ['image7_d1.png'], crop: 'q_image7_c1.jpg', tipAudio: 'tip_audios/q_image7_tip.mp3' },
  { image: 'q_image13.png', answer: '6289', category: 'feature', sub: 'num', tip: '顶部连续三个酒红色三角形', details: ['image13_d1.png', 'image13_d2.png'], crop: 'q_image13_c1.jpg', tipAudio: 'tip_audios/q_image13_tip.mp3' },
  { image: 'q_image15.png', answer: '2901', category: 'feature', sub: 'num', tip: '蓝色底图,右下角一个圈', details: ['image15_d1.png'], crop: 'q_image15_c1.jpg', tipAudio: 'tip_audios/q_image15_tip.mp3' },
  { image: 'q_image14.png', answer: '6098', category: 'feature', sub: 'num', tip: '右下角有一把向右弯刀', details: ['image14_d1.png'], crop: 'q_image14_c1.jpg', tipAudio: 'tip_audios/q_image14_tip.mp3' },
  { image: 'q_image16.png', answer: '8609', category: 'feature', sub: 'num', tip: '右下角有一把向左弯刀', details: ['image16_d1.png'], crop: 'q_image16_c1.jpg', tipAudio: 'tip_audios/q_image16_tip.mp3' },
  { image: 'q_image9.png',  answer: '628',  category: 'feature', sub: 'num', tip: '记右上像毛毛虫的长条图形是6 2 8', details: ['image9_d1.png', 'image9_d2.png'], crop: 'q_image9_c1.jpg', tipAudio: 'tip_audios/q_image9_tip.mp3' },
  { image: 'q_image29.png', answer: '899/022', category: 'feature', sub: 'num', tip: '先看出图分六个区域,看左上角:三个三角形就8 9 9、0 2 2', details: ['image29_d1.png'], crop: 'q_image29_c1.jpg', tipAudio: 'tip_audios/q_image29_tip.mp3' },
  { image: 'q_image30.png', answer: '621/989', category: 'feature', sub: 'num', tip: '同样分六个区域,左上角多个(四个)三角形或四边形就6 2 1、9 8 9', details: ['image30_d1.png'], crop: 'q_image30_c1.jpg', tipAudio: 'tip_audios/q_image30_tip.mp3' },
  { image: 'q_image37.png', answer: '522',  category: 'feature', sub: 'num', tip: '左上角：单个梯形', details: ['image37_d1.png'], crop: 'q_image37_c1.jpg', tipAudio: 'tip_audios/q_image37_tip.mp3' },
  { image: 'q_image39.png', answer: '5/8', category: 'feature', sub: 'num', tip: '左上角：单个梯形 + 大 S 弯', details: ['image39_d1.png'], crop: 'q_image39_c1.jpg', tipAudio: 'tip_audios/q_image39_tip.mp3' },
  { image: 'q_image40.png', answer: '0/9', category: 'feature', sub: 'num', tip: '一个大斜线', details: ['image40_d1.png'], crop: 'q_image40_c1.jpg', tipAudio: 'tip_audios/q_image40_tip.mp3' },
  { image: 'q_image38.png', answer: '825',  category: 'feature', sub: 'num', tip: '中间一只黑色眼睛就是8 2 5', details: ['image38_d1.png'], crop: 'q_image38_c1.jpg', tipAudio: 'tip_audios/q_image38_tip.mp3' },
  { image: 'q_image20.png', answer: '牛',   category: 'feature', sub: 'animal', tip: '色弱看到的是鸡:鸡冠离得远是牛(双脚站立的是牛)', details: ['image20_d1.png'], crop: 'q_image20_c1.jpg', tipAudio: 'tip_audios/q_image20_tip.mp3' },
  { image: 'q_image25.png', answer: '羊',   category: 'feature', sub: 'animal', tip: '鸡冠离得近是羊(单脚站立的是羊)', details: ['image25_d1.png'], crop: 'q_image25_c1.jpg', tipAudio: 'tip_audios/q_image25_tip.mp3' },
  { image: 'q_image21.png', answer: '蜻蜓', category: 'feature', sub: 'animal', tip: '看右上角:对称绿色三角形——深绿是蜻蜓', details: ['image21_d1.png'], crop: 'q_image21_c1.jpg', tipAudio: 'tip_audios/q_image21_tip.mp3' },
  { image: 'q_image23.png', answer: '金鱼', category: 'feature', sub: 'animal', tip: '看右上角:对称绿色三角形——浅绿是金鱼', details: ['image23_d1.png'], crop: 'q_image23_c1.jpg', tipAudio: 'tip_audios/q_image23_tip.mp3' },
  { image: 'q_image43.png', answer: '茶壶', category: 'feature', sub: 'other', tip: '看右上角:对称粉色三角形——粉色是茶壶', details: ['image43_d1.png'], crop: 'q_image43_c1.jpg', tipAudio: 'tip_audios/q_image43_tip.mp3' },
  { image: 'q_image22.png', answer: '鹅',   category: 'feature', sub: 'animal', tip: '中间有个小人脸，其实看到一片的粉色线条基本就是了', details: ['image22_d1.png'], crop: 'q_image22_c1.jpg', tipAudio: 'tip_audios/q_image22_tip.mp3' },
  { image: 'q_image24.png', answer: '燕子', category: 'feature', sub: 'animal', tip: '尖尖嘴巴是燕子', details: ['image24_d1.png'], crop: 'q_image24_c1.jpg', tipAudio: 'tip_audios/q_image24_tip.mp3' },
  { image: 'q_image26.png', answer: '兔子', category: 'feature', sub: 'animal', tip: '深蓝色方块多，像个问号的是兔子', details: ['image26_d1.png'], crop: 'q_image26_c1.jpg', tipAudio: 'tip_audios/q_image26_tip.mp3' },
  { image: 'q_image27.png', answer: '蝴蝶', category: 'feature', sub: 'animal', tip: '记两点眼睛加中间五边形', details: ['image27_d1.png'], crop: 'q_image27_c1.jpg', tipAudio: 'tip_audios/q_image27_tip.mp3' },
  { image: 'q_image18.png', answer: '△/○', category: 'feature', sub: 'other', tip: '记中间黑色大四边形', details: ['image18_d1.png'], crop: 'q_image18_c1.jpg', tipAudio: 'tip_audios/q_image18_tip.mp3' },
  { image: 'q_image19.png', answer: '○', category: 'feature', sub: 'other', tip: '左上角大三角形 + 四边形', details: ['image19_d1.png'], crop: 'q_image19_c1.jpg', tipAudio: 'tip_audios/q_image19_tip.mp3' },
  { image: 'q_image28.png', answer: '○/✂', category: 'feature', sub: 'other', tip: '色弱只看到圆圈,别忘了还有剪刀', details: ['image28_d1.png'], noTipImg: true, tipAudio: 'tip_audios/q_image28_tip.mp3' },
  { image: 'q_image41.png', answer: '△/□', category: 'feature', sub: 'other', tip: '左上角单个梯形 + 大 S 弯 + 右边梯形', details: ['image41_d1.png'], crop: 'q_image41_c1.jpg', tipAudio: 'tip_audios/q_image41_tip.mp3' },

  // ---------- 数字口诀(7 张) ----------
  { image: 'q_image4.png',  answer: '88',   category: 'number', tip: '色弱看到 6 6,直接记 8 8,万事顺 6 才能发发', details: ['image4_d1.png'], noTipImg: true, tipAudio: 'tip_audios/q_image4_tip.mp3' },
  { image: 'q_image6.png',  answer: '162',  category: 'number', tip: '色弱只看到 6,看底下:三角形少的记 1 6 2', details: ['image6_d1.png'], crop: 'q_image6_c1.jpg', tipAudio: 'tip_audios/q_image6_tip.mp3' },
  { image: 'q_image11.png', answer: '268',  category: 'number', tip: '色弱只看到 6,看底下:三角形四边形都有的记 2 6 8', details: ['image11_d1.png'], crop: 'q_image11_c1.jpg', tipAudio: 'tip_audios/q_image11_tip.mp3' },
  { image: 'q_image8.png',  answer: '56',   category: 'number', tip: '色弱看到 2,直接记 5 6,马兰开花二十一,二七、二八、二 5 6', details: ['image8_d1.png'], noTipImg: true, tipAudio: 'tip_audios/q_image8_tip.mp3' },
  { image: 'q_image10.png', answer: '602',  category: 'number', tip: '色弱看到 9 8,直接记 6 0 2, 9 8 的酒贵,600 块得 2 支', details: ['image10_d1.png'], noTipImg: true, tipAudio: 'tip_audios/q_image10_tip.mp3' },
  { image: 'q_image12.png', answer: '985',  category: 'number', tip: '色弱看到 8,直接记 9 8 5,梦寐以求的高校', details: ['image12_d1.png'], noTipImg: true, tipAudio: 'tip_audios/q_image12_tip.mp3' },
  { image: 'q_image42.png', answer: '86',   category: 'number', tip: '色弱看到 9,直接记 8 6,酗酒不可取,迟早要 8 6(拜拜了)', details: ['image42_d1.png'], noTipImg: true, tipAudio: 'tip_audios/q_image42_tip.mp3' }
]

// 版本数据包:图片在 plates/v6/、study/v6/,新版本同样放带版本号的子目录
export const v6 = {
  id: 'v6',
  source: '《色盲检查图》',
  name: '俞自萍',
  edition: '第 6 版',
  dirs: { plates: 'plates/v6', study: 'study/v6' },
  questions: QUESTIONS,
  studyItems: STUDY_ITEMS,
}
