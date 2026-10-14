import { computed, ref } from "vue";
import { EDITIONS, getEdition, DEFAULT_EDITION_ID } from "../data/editions/index.js";

// 版本上下文(全局单例):当前使用的《色盲检查图》版本数据包
// 所有业务域(出题/学习/记录/放大层)都从 edition.value 取数据,切换版本即整体切换
const savedId = (() => {
  try {
    return localStorage.getItem("cv_edition");
  } catch {
    return null;
  }
})();
const edition = ref(getEdition(savedId) ?? getEdition(DEFAULT_EDITION_ID));

function setEdition(id) {
  const ed = getEdition(id);
  if (!ed) return;
  edition.value = ed;
  try {
    localStorage.setItem("cv_edition", id);
  } catch {
    // 存储不可用时静默忽略
  }
}

export function useEdition() {
  const totalCount = computed(() => edition.value.questions.length);
  const editionLabel = computed(
    () => `${edition.value.source}${edition.value.edition}`,
  );

  return { editions: EDITIONS, edition, setEdition, totalCount, editionLabel };
}
