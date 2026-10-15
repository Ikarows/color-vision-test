// 测试统计 —— 数据持久化在浏览器 localStorage
import { DEFAULT_EDITION_ID } from "./editions/index.js";

const KEY = 'cvt_stats_v1'
const MAX_RECORDS = 100

export function loadStats() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data && Array.isArray(data.records)) {
        // 多版本兼容:无 editionId 的旧记录默认视为第六版
        data.records.forEach((r) => {
          if (!r.editionId) r.editionId = DEFAULT_EDITION_ID
        })
        return data
      }
    }
  } catch (e) {
    // 数据损坏时重新开始
  }
  return { records: [] }
}

function saveStats(stats) {
  try {
    localStorage.setItem(KEY, JSON.stringify(stats))
  } catch (e) {
    // 存储不可用时静默忽略
  }
}

// 记录一次完成的测试(含 0-100 评分、错图明细与答对图明细)
// editionId: 本次测试的版本;错图/答对图明细逐条也带各自 editionId(drill 可能混合版本)
export function addRecord(mode, total, correct, score, wrong = [], correctPlates = [], editionId = DEFAULT_EDITION_ID) {
  const stats = loadStats()
  const rec = { ts: Date.now(), mode, total, correct, score, wrong, correctPlates, editionId }
  // 自助机模拟记录:直接存通过判定,历史/详情展示"通过/未通过"而非评分
  if (mode === 'driving') rec.verdict = wrong.length > 2 ? 'fail' : 'pass'
  stats.records.push(rec)
  if (stats.records.length > MAX_RECORDS) {
    stats.records = stats.records.slice(-MAX_RECORDS)
  }
  saveStats(stats)
  return stats
}

// 清空统计数据:传版本 id 只删该版本的记录,不传则清空全部
export function resetStats(editionId) {
  try {
    if (!editionId) {
      localStorage.removeItem(KEY)
      return
    }
    const stats = loadStats()
    stats.records = stats.records.filter(
      (r) => (r.editionId || DEFAULT_EDITION_ID) !== editionId
    )
    saveStats(stats)
  } catch (e) {
    // 忽略
  }
}
