!macro customInit
  ; 覆盖安装前强制结束正在运行的应用进程（含旧版可能的进程名），
  ; 避免自动卸载旧版本时因文件被占用而失败（"卸载旧应用失败"）。
  nsExec::Exec 'taskkill /F /T /IM "ColorVisionHelper.exe"'
  nsExec::Exec 'taskkill /F /T /IM "色盲色弱助手.exe"'
  Sleep 1000
!macroend
