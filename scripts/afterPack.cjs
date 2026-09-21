// afterPack 钩子：替代 electron-builder 内置的 rcedit 步骤（配合 win.signAndEditExecutable: false）。
// 杀毒软件会实时扫描新写入/刚修改的 exe 并短暂锁定，导致内置 rcedit 报
// "Fatal error: Unable to commit changes" 且重试间隔太短。这里在写入图标/版本信息
// 前后都轮询等待文件可写，并对 rcedit 做带间隔的重试，保证打包稳定。
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitWritable(exePath, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  let lastErr = ''
  while (Date.now() < deadline) {
    try {
      const fd = fs.openSync(exePath, 'r+')
      fs.closeSync(fd)
      return
    } catch (e) {
      lastErr = e.code || e.message
    }
    await sleep(2000)
  }
  throw new Error(`等待 ${exePath} 可写超时（最后一次错误: ${lastErr}）`)
}

function findRcedit() {
  const cacheRoot = path.join(os.homedir(), 'AppData', 'Local', 'electron-builder', 'Cache', 'winCodeSign')
  const preferred = path.join(cacheRoot, 'winCodeSign-2.6.0', 'rcedit-x64.exe')
  if (fs.existsSync(preferred)) return preferred
  if (fs.existsSync(cacheRoot)) {
    for (const dir of fs.readdirSync(cacheRoot)) {
      const p = path.join(cacheRoot, dir, 'rcedit-x64.exe')
      if (fs.existsSync(p)) return p
    }
  }
  return null
}

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return
  // 内置编辑流程仍启用时不做处理（避免与内置 rcedit 重复修改触发锁定）
  if (context.packager.platformSpecificBuildOptions.signAndEditExecutable !== false) return

  const appOutDir = context.appOutDir
  const exeName = fs.readdirSync(appOutDir).find((f) => f.toLowerCase().endsWith('.exe'))
  if (!exeName) return
  const exePath = path.join(appOutDir, exeName)

  const appInfo = context.packager.appInfo
  const iconPath = path.join(context.packager.projectDir, 'build', 'icon.ico')
  const rcedit = findRcedit()
  if (!rcedit) throw new Error('未找到 rcedit-x64.exe，无法写入图标/版本信息')

  const args = [
    exePath,
    '--set-version-string', 'FileDescription', appInfo.productName,
    '--set-version-string', 'ProductName', appInfo.productName,
    '--set-version-string', 'LegalCopyright', appInfo.copyright,
    '--set-file-version', appInfo.version,
    '--set-product-version', `${appInfo.version}.0`,
    '--set-version-string', 'InternalName', path.basename(exeName, '.exe'),
  ]
  if (fs.existsSync(iconPath)) args.push('--set-icon', iconPath)

  await waitWritable(exePath, 120000)

  const maxAttempts = 10
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = spawnSync(rcedit, args, { encoding: 'utf8' })
    if (res.status === 0) {
      console.log(`[afterPack] 图标/版本信息写入成功: ${exePath}`)
      // 修改后再等文件稳定，保证后续 NSIS 打包读取正常
      await waitWritable(exePath, 120000)
      return
    }
    console.log(`[afterPack] rcedit 第 ${attempt}/${maxAttempts} 次失败（文件可能被安全软件锁定），3 秒后重试...`)
    await sleep(3000)
  }
  throw new Error(`rcedit 写入 ${exePath} 失败（已重试 ${maxAttempts} 次）`)
}
