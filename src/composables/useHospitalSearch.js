import { ref, computed } from "vue";

/**
 * 体检点查询:懒加载 public/vision_data 下的两份数据(模块级单例)
 * - hospitals.json 各地提供色觉检查的体检机构列表
 * - regions.json  省市区三级树(级联选择用)
 * 场景筛选按 scene 原始值归类,custom/military_exam 等长尾并入"其他"
 */

const SCENES = [
  { key: "driver_exam", name: "驾照体检" },
  { key: "hospital_exam", name: "医院检查" },
  { key: "job_exam", name: "入职体检" },
  { key: "other", name: "其他" },
];

// 模块级单例:数据与筛选状态跨页面保留,二次进入不重新请求
const loading = ref(false);
const loadError = ref("");
const entries = ref([]);
const regionTree = ref([]);

const province = ref("");
const city = ref("");
const district = ref("");
const scene = ref("all");
const keyword = ref("");

let loadPromise = null;

function normalizeScene(raw) {
  return SCENES.some((s) => s.key === raw) ? raw : "other";
}

function fetchData(url) {
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${url} HTTP ${r.status}`);
    return r.json();
  });
}

// 首次进入体检点页时才拉取数据;失败后允许重试
function ensureLoaded() {
  if (loadPromise) return loadPromise;
  loading.value = true;
  loadError.value = "";
  loadPromise = Promise.all([
    fetchData(`${import.meta.env.BASE_URL}vision_data/hospitals.json`),
    fetchData(`${import.meta.env.BASE_URL}vision_data/regions.json`),
  ])
    .then(([hospitals, regions]) => {
      entries.value = hospitals?.data?.entries ?? [];
      regionTree.value = Array.isArray(regions) ? regions : [];
    })
    .catch((err) => {
      loadPromise = null; // 清掉失败的 promise,允许下次重试
      loadError.value = err?.message || "数据加载失败";
    })
    .finally(() => {
      loading.value = false;
    });
  return loadPromise;
}

function retry() {
  loadPromise = null;
  ensureLoaded();
}

// ---------- 级联选项 ----------

const provinceOptions = computed(() => regionTree.value.map((p) => p.name));

const cityOptions = computed(() => {
  if (!province.value) return [];
  const node = regionTree.value.find((p) => p.name === province.value);
  return node?.children?.map((c) => c.name) ?? [];
});

// 区县下拉 = 树上的区县 ∪ 数据里实际出现的区县(东莞/中山等直筒子市按镇街记录)
const districtOptions = computed(() => {
  if (!province.value || !city.value) return [];
  const set = new Set();
  const pNode = regionTree.value.find((p) => p.name === province.value);
  const cNode = pNode?.children?.find((c) => c.name === city.value);
  (cNode?.children ?? []).forEach((d) => d.name && set.add(d.name));
  entries.value.forEach((e) => {
    if (e.province === province.value && e.city === city.value && e.district)
      set.add(e.district);
  });
  return [...set].sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
});

// ---------- 筛选 ----------

function setProvince(name) {
  province.value = name;
  city.value = "";
  district.value = "";
}

function setCity(name) {
  city.value = name;
  district.value = "";
}

function setScene(key) {
  scene.value = key;
}

// 场景计数:只按地域筛选统计,供 chips 显示角标
const sceneCounts = computed(() => {
  const counts = { all: 0 };
  SCENES.forEach((s) => (counts[s.key] = 0));
  entries.value.forEach((e) => {
    if (province.value && e.province !== province.value) return;
    if (city.value && e.city !== city.value) return;
    if (district.value && e.district !== district.value) return;
    counts.all += 1;
    counts[normalizeScene(e.scene)] += 1;
  });
  return counts;
});

const filtered = computed(() => {
  const kw = keyword.value.trim();
  const list = entries.value.filter((e) => {
    if (province.value && e.province !== province.value) return false;
    if (city.value && e.city !== city.value) return false;
    if (district.value && e.district !== district.value) return false;
    if (scene.value !== "all" && normalizeScene(e.scene) !== scene.value)
      return false;
    if (kw && !(e.hospital_name + (e.location_detail || "")).includes(kw))
      return false;
    return true;
  });
  // 同省同市内按区县聚拢展示,观感更整齐
  return list.sort(
    (a, b) =>
      (a.district || "").localeCompare(b.district || "", "zh-Hans-CN") ||
      a.hospital_name.localeCompare(b.hospital_name, "zh-Hans-CN")
  );
});

function resetFilters() {
  province.value = "";
  city.value = "";
  district.value = "";
  scene.value = "all";
  keyword.value = "";
}

export function useHospitalSearch() {
  return {
    SCENES,
    // 数据状态
    loading,
    loadError,
    entries,
    ensureLoaded,
    retry,
    // 筛选状态
    province,
    city,
    district,
    scene,
    keyword,
    // 级联选项与结果
    provinceOptions,
    cityOptions,
    districtOptions,
    sceneCounts,
    filtered,
    setProvince,
    setCity,
    setScene,
    resetFilters,
  };
}
