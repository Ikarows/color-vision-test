// 学习模式引擎层(版本无关):分类定义
// 各版本的学习条目在 data/editions/ 对应版本数据包的 studyItems 中

export const STUDY_CATEGORIES = [
  { key: 'easy',    name: '简单易看', desc: '无需背诵,看不出来的说明色觉异常' },
  { key: 'feature', name: '特征对应',   desc: '记图中的特征形状,对号入座' },
  { key: 'number',  name: '数字对应',   desc: '把看到的数字对应成正确答案' },
  { key: 'review',  name: '总结复习',   desc: 'PDF《三、总结复习》:速查图与备考建议' },
]
