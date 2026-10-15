// 出题引擎(版本无关):干扰项派生 + 选项生成 + 洗牌
// 干扰项不再手工维护固定池,按版本从题库答案自动派生:
// 各版本干扰词严格封闭在本版本题库内,不借用其它版本任何数据

import { getEdition, DEFAULT_EDITION_ID } from "./editions/index.js"

// 随机打乱数组（返回新数组）
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 按版本派生干扰项池:类型 → 去重答案数组(版本数据为静态模块,按 id 缓存)
const poolCache = new Map()
function poolsOf(editionId) {
  const id = editionId || DEFAULT_EDITION_ID
  if (!poolCache.has(id)) {
    const sets = {}
    for (const q of getEdition(id)?.questions ?? []) {
      ;(sets[q.type] ??= new Set()).add(q.answer)
    }
    const pools = {}
    for (const t of Object.keys(sets)) pools[t] = [...sets[t]]
    poolCache.set(id, pools)
  }
  return poolCache.get(id)
}

// 为每道题生成 6 个选项(1 个正确答案 + 5 个干扰,顺序随机):
// 同类干扰最多 2 个,其余从本版本跨类型答案池补足;
// 数字类选项自然混入上下排/并列双图等题型的选项中
export function buildOptions(question) {
  const own = poolsOf(question.editionId)
  const same = shuffle(
    (own[question.type] ?? []).filter((a) => a !== question.answer),
  ).slice(0, 2)
  const crossPool = Object.keys(own)
    .filter((t) => t !== question.type)
    .flatMap((t) => own[t] ?? [])
  const cross = shuffle(
    [...new Set(crossPool)].filter(
      (a) => a !== question.answer && !same.includes(a),
    ),
  ).slice(0, 5 - same.length)
  return shuffle([question.answer, ...same, ...cross])
}
