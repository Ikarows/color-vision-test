// 行尾归一化:把 git 跟踪的文本文件统一为 LF,消除 git 的
// 「CRLF will be replaced by LF the next time Git touches it」警告。
// 配合 .gitattributes(eol=lf) 与 .vscode/settings.json(files.eol) 使用:
// 提交前跑一次 npm run norm,保证任何电脑上工作区与仓库行尾策略一致。
import { execSync } from "node:child_process";
import fs from "node:fs";

// 只处理文本类扩展名;bat/cmd 必须保持 CRLF(.gitattributes 已单独声明),排除
const TEXT =
  /\.(md|js|mjs|cjs|json|vue|html|css|scss|gradle|xml|properties|txt|svg|nsi|nsh|ps1)$/i;

let files = [];
try {
  files = execSync("git ls-files", { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
} catch {
  // 非 git 环境(如直接下载的源码包)无法列出跟踪文件,跳过归一化且不阻断构建
  console.log("norm: 未检测到 git 仓库,跳过行尾归一化");
  process.exit(0);
}
files = files.filter((f) => {
  try {
    return fs.statSync(f).isFile();
  } catch {
    return false; // 已删除但未提交的路径跳过
  }
});

let changed = 0;
for (const f of files) {
  if (!TEXT.test(f)) continue;
  const s = fs.readFileSync(f, "utf8");
  const t = s.replace(/\r\n/g, "\n");
  if (t !== s) {
    fs.writeFileSync(f, t);
    changed++;
    console.log("LF:", f);
  }
}
console.log(
  changed ? `${changed} 个文件已归一化为 LF` : "全部已是 LF,无需处理",
);
