import { createApp } from 'vue'
// 全局共享样式必须先于 App 导入:组件样式后注入才能按预期覆盖共享类
import './styles/base.css'
import App from './App.vue'

// 内容保护:禁用右键菜单与复制/剪切(输入框等可编辑元素除外,保证搜索框可正常编辑)
const isEditable = (el) =>
  el instanceof HTMLElement &&
  (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)

document.addEventListener('contextmenu', (e) => {
  if (!isEditable(e.target)) e.preventDefault()
})
document.addEventListener('copy', (e) => {
  if (!isEditable(e.target)) e.preventDefault()
})
document.addEventListener('cut', (e) => {
  if (!isEditable(e.target)) e.preventDefault()
})

// 安卓 App 内（Capacitor 原生桥注入 window.Capacitor）给根元素打类，供 CSS 区分平台样式
if (window.Capacitor?.isNativePlatform?.()) {
  document.documentElement.classList.add('android-app')
  // 页面就绪后向原生请求注入状态栏高度(--sbh)；页面重载/热更新后需重新注入
  window.CvNativeInsets?.ready?.()
}

createApp(App).mount('#app')
