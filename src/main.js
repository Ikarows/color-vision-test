import { createApp } from 'vue'
// 全局共享样式必须先于 App 导入:组件样式后注入才能按预期覆盖共享类
import './styles/base.css'
import App from './App.vue'

// 安卓 App 内（Capacitor 原生桥注入 window.Capacitor）给根元素打类，供 CSS 区分平台样式
if (window.Capacitor?.isNativePlatform?.()) {
  document.documentElement.classList.add('android-app')
  // 页面就绪后向原生请求注入状态栏高度(--sbh)；页面重载/热更新后需重新注入
  window.CvNativeInsets?.ready?.()
}

createApp(App).mount('#app')
