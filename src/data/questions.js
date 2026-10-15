// 出题引擎(版本无关):干扰项派生 + 选项生成 + 洗牌
// 干扰项不再手工维护固定池,按版本从题库答案自动派生:
// 同类干扰优先取当前版本的同类答案,不足时并入其它注册版本的同类答案
// (如 v6 仅一道茶壶题,茶壶的同类干扰自动取自 v5 的水杯/雨伞)

import { getEdition, EDITIONS, DEFAULT_EDITION_ID } from "./editions/index.js"

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

// 全部注册版本的合并池(当前版本同类答案不足时的补充来源)
let unionPools = null
function poolsOfAll() {
  if (!unionPools) {
    const sets = {}
    for (const e of EDITIONS) {
      for (const q of e.questions ?? []) {
        ;(sets[q.type] ??= new Set()).add(q.answer)
      }
    }
    unionPools = {}
    for (const t of Object.keys(sets)) unionPools[t] = [...sets[t]]
  }
  return unionPools
}

// 为每道题生成 6 个选项(1 个正确答案 + 5 个干扰,顺序随机):
// 同类干扰最多 2 个(当前版本同类答案优先,不足由其它版本同类答案补),
// 其余从跨类型答案池补足;数字类选项自然混入上下排/并列双图等题型的选项中
export function buildOptions(question) {
  const own = poolsOf(question.editionId)
  const all = poolsOfAll()
  let same = shuffle(
    (own[question.type] ?? []).filter((a) => a !== question.answer),
  ).slice(0, 2)
  if (same.length < 2) {
    same = same.concat(
      shuffle(
        [...new Set(all[question.type] ?? [])].filter(
          (a) => a !== question.answer && !same.includes(a),
        ),
      ).slice(0, 2 - same.length),
    )
  }
  const crossPool = Object.keys(all)
    .filter((t) => t !== question.type)
    .flatMap((t) => all[t] ?? [])
  const cross = shuffle(
    [...new Set(crossPool)].filter(
      (a) => a !== question.answer && !same.includes(a),
    ),
  ).slice(0, 5 - same.length)
  return shuffle([question.answer, ...same, ...cross])
}
