// 测试统计 —— 数据持久化在浏览器 localStorage
const KEY = 'cvt_stats_v1'
const MAX_RECORDS = 100

export function loadStats() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data && Array.isArray(data.records)) return data
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

// 记录一次完成的测试(含 0-100 评分与错图明细)
export function addRecord(mode, total, correct, score, wrong = []) {
  const stats = loadStats()
  stats.records.push({ ts: Date.now(), mode, total, correct, score, wrong })
  if (stats.records.length > MAX_RECORDS) {
    stats.records = stats.records.slice(-MAX_RECORDS)
  }
  saveStats(stats)
  return stats
}

// 清空全部统计数据
export function resetStats() {
  try {
    localStorage.removeItem(KEY)
  } catch (e) {
    // 忽略
  }
}
