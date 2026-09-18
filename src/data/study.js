// 学习模式数据 —— 技巧内容整理自《第六版背图技巧(全新)》PDF
// 题目图(q_*.png)与解析图(*_d*.png)均从 PDF 对应页面逐张提取,经感知哈希(pHash)匹配确认
// category: easy = 简单一眼出(不用背) / feature = 特征对应 / number = 数字对应

export const STUDY_CATEGORIES = [
  { key: 'easy',    name: '简单易看', desc: '无需背诵,看不出来的说明色觉异常' },
  { key: 'feature', name: '特征对应',   desc: '记图中的特征形状,对号入座' },
  { key: 'number',  name: '数字对应',   desc: '把看到的数字对应成正确答案' },
  { key: 'review',  name: '总结复习',   desc: 'PDF《三、总结复习》:速查图与备考建议' },
]

export const STUDY_ITEMS = [
  // ---------- 简单一眼出(13 张) ----------
  { image: 'q_image1.png',  answer: '909',   category: 'easy', tip: '' },
  { image: 'q_image17.png', answer: '熊猫',  category: 'easy', tip: '' },
  { image: 'q_image36.png', answer: '2个五角星', category: 'easy', tip: '' },
  { image: 'q_image44.png', answer: '21',    category: 'easy', tip: '' },
  { image: 'q_image45.png', answer: '52',    category: 'easy', tip: '' },
  { image: 'q_image46.png', answer: '69',    category: 'easy', tip: '' },
  { image: 'q_image47.png', answer: '2个圆', category: 'easy', tip: '' },
  { image: 'q_image48.png', answer: '正方形、三角形', category: 'easy', tip: '' },
  { image: 'q_image31.png', answer: '红色',  category: 'easy', tip: '' },
  { image: 'q_image32.png', answer: '黄色',  category: 'easy', tip: '' },
  { image: 'q_image33.png', answer: '蓝色',  category: 'easy', tip: '' },
  { image: 'q_image34.png', answer: '绿色',  category: 'easy', tip: '' },
  { image: 'q_image35.png', answer: '紫色',  category: 'easy', tip: '' },

  // ---------- 特征对应(26 张;sub: num=数字 / animal=动物 / other=形状及其他) ----------
  { image: 'q_image2.png',  answer: '29',   category: 'feature', sub: 'num', tip: '记左上角:两对称三角形', details: ['image2_d1.png'] },
  { image: 'q_image3.png',  answer: '69',   category: 'feature', sub: 'num', tip: '记左上角:两相互扣的三角形(69 嘛,懂得都懂)', details: ['image3_d1.png'] },
  { image: 'q_image5.png',  answer: '60',   category: 'feature', sub: 'num', tip: '记左上角:平行四边形', details: ['image5_d1.png'] },
  { image: 'q_image7.png',  answer: '916',  category: 'feature', sub: 'num', tip: '中间一大竖,或中间/边上一个大三角形', details: ['image7_d1.png'] },
  { image: 'q_image13.png', answer: '6289', category: 'feature', sub: 'num', tip: '左边 123 弧线,右边 12 弧线(弧线实际是 6 和 9 的边线);或记它在 985 的下一页', details: ['image13_d1.png', 'image13_d2.png'] },
  { image: 'q_image14.png', answer: '6098', category: 'feature', sub: 'num', tip: '左边有贯穿两边的弧线', details: ['image14_d1.png'] },
  { image: 'q_image15.png', answer: '2901', category: 'feature', sub: 'num', tip: '蓝色底图,右下角连续图形差不多成圈', details: ['image15_d1.png'] },
  { image: 'q_image16.png', answer: '8609', category: 'feature', sub: 'num', tip: '中间一大坨三角形四边形,或右边一条贯穿长线;与 6098 数字互为颠倒,结合记忆', details: ['image16_d1.png'] },
  { image: 'q_image18.png', answer: '三角形、圆形', category: 'feature', sub: 'other', tip: '记中间黑大四边形', details: ['image18_d1.png'] },
  { image: 'q_image19.png', answer: '大圆', category: 'feature', sub: 'other', tip: '左上角大三角形 + 四边形', details: ['image19_d1.png'] },
  { image: 'q_image20.png', answer: '牛',   category: 'feature', sub: 'animal', tip: '色弱看到的是鸡:鸡冠离得远是牛(双脚站立的是牛)', details: ['image20_d1.png'] },
  { image: 'q_image25.png', answer: '羊',   category: 'feature', sub: 'animal', tip: '鸡冠离得近是羊(单脚站立的是羊)', details: ['image25_d1.png'] },
  { image: 'q_image21.png', answer: '蜻蜓', category: 'feature', sub: 'animal', tip: '看右上角:对称绿色三角形——深绿是蜻蜓', details: ['image21_d1.png'] },
  { image: 'q_image23.png', answer: '金鱼', category: 'feature', sub: 'animal', tip: '看右上角:对称绿色三角形——浅绿是金鱼', details: ['image23_d1.png'] },
  { image: 'q_image43.png', answer: '茶壶', category: 'feature', sub: 'other', tip: '看右上角:对称绿色三角形——淡绿是茶壶', details: ['image43_d1.png'] },
  { image: 'q_image22.png', answer: '鹅',   category: 'feature', sub: 'animal', tip: '浅蓝、浅绿色面,中间有个小人脸', details: ['image22_d1.png'] },
  { image: 'q_image24.png', answer: '燕子', category: 'feature', sub: 'animal', tip: '尖尖嘴巴是燕子', details: ['image24_d1.png'] },
  { image: 'q_image26.png', answer: '兔子', category: 'feature', sub: 'animal', tip: '像个问号的是兔子', details: ['image26_d1.png'] },
  { image: 'q_image27.png', answer: '蝴蝶', category: 'feature', sub: 'animal', tip: '记中间五边形', details: ['image27_d1.png'] },
  { image: 'q_image29.png', answer: '上排 899,下排 022', category: 'feature', sub: 'num', tip: '先看出图分六个区域,看左上角:三个三角形 = 899、022', details: ['image29_d1.png'] },
  { image: 'q_image30.png', answer: '上排 621,下排 989', category: 'feature', sub: 'num', tip: '同样分六个区域,左上角多个(四个)三角形或四边形 = 621、989', details: ['image30_d1.png'] },
  { image: 'q_image37.png', answer: '522',  category: 'feature', sub: 'num', tip: '左上角只有一个单个梯形', details: ['image37_d1.png'] },
  { image: 'q_image39.png', answer: '5 和 8', category: 'feature', sub: 'num', tip: '左上角单个梯形 + 大 S 弯', details: ['image39_d1.png'] },
  { image: 'q_image41.png', answer: '三角形、正方形', category: 'feature', sub: 'other', tip: '左上角单个梯形 + 大 S 弯 + 右边梯形', details: ['image41_d1.png'] },
  { image: 'q_image38.png', answer: '825',  category: 'feature', sub: 'num', tip: '左上等边三角形,中间像笔尖尖;双手捧玉珠——掌上明珠 825', details: ['image38_d1.png'] },
  { image: 'q_image40.png', answer: '0 和 9', category: 'feature', sub: 'num', tip: '一个大斜线', details: ['image40_d1.png'] },

  // ---------- 数字对应(9 张) ----------
  { image: 'q_image4.png',  answer: '88',   category: 'number', tip: '色弱看到 66,直接记 88——万事顺 6 才能发发', details: ['image4_d1.png'] },
  { image: 'q_image6.png',  answer: '162',  category: 'number', tip: '色弱只看到 6,看底下:三角形少的记 162', details: ['image6_d1.png'] },
  { image: 'q_image11.png', answer: '268',  category: 'number', tip: '色弱只看到 6,看底下:三角形四边形都有的记 268', details: ['image11_d1.png'] },
  { image: 'q_image8.png',  answer: '56',   category: 'number', tip: '色弱看到 2,直接记 56——马兰开花二十一,二七、二八、二 56', details: ['image8_d1.png'] },
  { image: 'q_image9.png',  answer: '628',  category: 'number', tip: '硬背:记右上像毛毛虫的长条图形(618 的哥哥 628);或记它在 56 的下一页', details: ['image9_d1.png', 'image9_d2.png'] },
  { image: 'q_image10.png', answer: '602',  category: 'number', tip: '色弱看到 98,直接记 602——98 的酒贵,600 块得 2 支', details: ['image10_d1.png'] },
  { image: 'q_image12.png', answer: '985',  category: 'number', tip: '色弱看到 8,直接记 985——梦寐以求的高校', details: ['image12_d1.png'] },
  { image: 'q_image28.png', answer: '圆形、剪刀', category: 'number', tip: '色弱只看到圆圈,别忘了还有剪刀', details: ['image28_d1.png'] },
  { image: 'q_image42.png', answer: '86',   category: 'number', tip: '色弱看到 9,直接记 86——酗酒不可取,迟早要 86(拜了)', details: ['image42_d1.png'] },

  // ---------- 总结复习(3 张,来自 PDF《三、总结复习》三页) ----------
  { image: 'review_p50.png', answer: '熟悉各图特性', category: 'review', tip: '熟悉各图特性,结合图册自己熟悉,简单的自己熟悉正常看就可以。毛毛虫=628。' },
  { image: 'review_p51.png', answer: '特征速查图', category: 'review', tip: '全书特征速查:连续大圆=8609、单梯形=522、梯形+大S弯=5 和 8 及三角形正方形、右上红三角=蜻蜓/金鱼/茶壶、中间五边形=蝴蝶、小人脸=鹅。' },
  { image: 'review_p52.png', answer: '备考建议', category: 'review', tip: '左下小尖嘴=燕子、连续像问号=兔子、中间像笔尖=825、一分为 6 的数字看左上角:三个三角形=899 022、三角形和四边形=621 989。建议用笔自己写写画画帮助记忆,可以购买一本图回来,模拟自测,锻炼自己找特征,效果更好。记好了,利用电子版自测,学会自己找特征,对号入座,祝逢检必过。' },
]
