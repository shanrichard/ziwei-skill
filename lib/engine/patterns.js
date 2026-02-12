/**
 * 紫微斗数格局检测模块
 * 检测命盘中的各种格局
 */

import { PALACE_NAMES, MAJOR_14 } from './config.js';

const SHA_SET = new Set(["擎羊", "陀罗", "火星", "铃星", "地空", "地劫"]);

// 格局定义
const PATTERN_COPY = {
  junchen_qinghui_A: { group: "富贵格", title: "君臣庆会A", blurb: "紫破同宫，左右辅弼分拱，主位与辅佐齐备，利权位与统筹。" },
  junchen_qinghui_B: { group: "富贵格", title: "君臣庆会B", blurb: "紫微天相坐命，命迁分见昌曲，科名与口碑相应，利名望与制度。" },
  junchen_qinghui_C: { group: "富贵格", title: "君臣庆会C", blurb: "天府坐命，左右会机梁与同阴，主从分明，资源稳健。" },
  zifu_tonggong: { group: "富贵格", title: "紫府同宫", blurb: "紫微天府同宫，统筹与守成并见，利大平台与稳态经营。" },
  jinyu_fujia: { group: "富贵格", title: "金舆扶驾", blurb: "天府守命，左右会日月，内外辅佐兼备，名器加身。" },
  zifu_jiaming: { group: "富贵格", title: "紫府夹命", blurb: "命坐机月，左右夹紫府，谋定而后动，得贵佐助。" },
  jixiang_liming: { group: "富贵格", title: "极向离明", blurb: "紫微在午会清局，权名昭著，忌三方煞忌冲破。" },

  big5_shapolang: { group: "五大格局", title: "杀破狼格", blurb: "动中求变、攻坚突破，宜开拓与竞技，忌情绪化对撞。" },
  big5_fuxiang: { group: "五大格局", title: "府相格", blurb: "稳重守成、执行见长，宜大组织内管控配合，稳中求进。" },
  big5_jiyue_tongliang: { group: "五大格局", title: "机月同梁格", blurb: "温和细致、专业匠心，按部就班，宜稳定岗位或自由才艺线。" },
  big5_ziwulian_fuxiang: { group: "五大格局", title: "紫武廉府相", blurb: "统筹驾驭与稳重并存，能主导亦能配合，宜高阶管理/政务统筹。" },
  big5_ziwulian_shapolang: { group: "五大格局", title: "紫武廉杀破狼", blurb: "能文能武、敢战能守，宜阶段化目标与护城河建设稳态推进。" },

  huotan: { group: "爆发格", title: "火贪", blurb: "贪狼会火，果敢激进，宜冲锋开拓，忌躁进损耗。" },
  lingtan: { group: "爆发格", title: "铃贪", blurb: "贪狼会铃，灵敏多变，宜创意试错，注意节奏与稳定。" },
  huo_or_ling_tan_weak: { group: "爆发格", title: "火/铃贪（弱）", blurb: "贪狼与火/铃三方会，动能较弱，适合阶段性试点。" },

  shapolang: { group: "事业格", title: "杀破狼", blurb: "变动开拓加速，适合攻坚重构，需制度化控险。" },
  yangliang_changlu: { group: "事业格", title: "阳梁昌禄", blurb: "名位俱隆，有制度与文书背书，利晋升与公开场域。" },
  qisha_chaodou: { group: "事业格", title: "七杀朝斗", blurb: "七杀坐命（子午寅申），锋锐果断，宜攻坚突破与执法军警线。" },
  yingxing_rumiao: { group: "事业格", title: "英星入庙", blurb: "破军坐命（子/午），变革重来，宜重构升级，忌反复与冲毁。" },

  sanqi_jiahui: { group: "财禄格", title: "三奇加会", blurb: "禄权科齐聚，资源/权责/名望共振，利关键节点。" },
  luma_jiaochi: { group: "财禄格", title: "禄马交驰", blurb: "俸禄与机动并举，利财务流转与外勤奔走。" },
  luhe_yuanyang: { group: "财禄格", title: "禄合鸳鸯", blurb: "禄存同宫化禄，财源并合，利俸禄加成与回报兑现。" },
  shuanglu_chaoyuan: { group: "四化格局", title: "双禄朝垣", blurb: "三方四正会照禄存与化禄，财运亨通，尤利财官两宫。" },

  zuoyou_jiaming: { group: "辅助格", title: "左右夹命", blurb: "左右夹命，内外助力相随，宜发挥主位统筹。" },
  kuiyue_jiaming: { group: "辅助格", title: "魁钺夹命", blurb: "魁钺夹命，贵气与解题并见，利关键节点获提携。" },

  liangma_piaodang: { group: "负面格", title: "梁马飘荡", blurb: "奔波不定、聚少散多，适合短期流动项目，避免长期绑定。" },
  lu_feng_chongpo: { group: "四化格局", title: "禄逢冲破", blurb: "化禄遭空劫夹破或对宫化忌冲照，先得后失，虚发易破。" },

  ziwei_duzuo: { group: "基本盘", title: "紫微独坐", blurb: "帝星独座（子/午），自尊独立，午位更显庙势与统筹感。" },
  baiguan_chaogong: { group: "基本盘", title: "百官朝拱", blurb: "紫微坐命，三方成对吉星齐集（≥3对），贵气与援助俱足。" },
  zaiye_goujun: { group: "基本盘", title: "在野孤君", blurb: "紫微坐命，三方少吉亦无煞，清高独行，需自建体系。" },
  wudao_zhijun: { group: "基本盘", title: "无道之君", blurb: "紫微坐命，三方见煞/忌冲破，易骄矜误判，宜制衡控险。" },
  zipo_tonggong: { group: "基本盘", title: "紫破组合", blurb: "紫微+破军同宫（丑/未），先破后成，大器晚成，变革强。" },
  zitan_tonggong: { group: "基本盘", title: "紫贪组合", blurb: "紫微+贪狼同宫（卯/酉），欲望与权柄并行，需驾欲定边界。" },
};

// 工具函数
function _left(i) { return (i - 1 + 12) % 12; }
function _right(i) { return (i + 1) % 12; }
function _opp(i) { return (i + 6) % 12; }

function buildMaps(chart, scope) {
  const palStars = {};
  const palMutagen = {};
  const nameToIdx = {};
  const idxToName = {};
  const idxToBranch = {};

  if (!scope) {
    for (let i = 0; i < 12; i++) {
      const palaceName = PALACE_NAMES[i];
      const palace = chart.palace(palaceName);

      nameToIdx[palace.name] = palace.index;
      idxToName[palace.index] = palace.name;
      idxToBranch[palace.index] = palace.earthlyBranch;

      const stars = new Set();
      const muts = new Set();

      for (const s of palace.majorStars || []) {
        stars.add(s.name);
        if (s.mutagen) muts.add(s.mutagen);
      }
      for (const s of palace.minorStars || []) {
        stars.add(s.name);
        if (s.mutagen) muts.add(s.mutagen);
      }
      for (const s of palace.adjectiveStars || []) {
        stars.add(s.name);
        if (s.mutagen) muts.add(s.mutagen);
      }

      palStars[palace.index] = stars;
      palMutagen[palace.index] = muts;
    }
  } else {
    for (let i = 0; i < 12; i++) {
      const palaceName = PALACE_NAMES[i];
      const palace = chart.palace(palaceName, scope);

      nameToIdx[palaceName] = palace.index;
      idxToName[palace.index] = palaceName;
      idxToBranch[palace.index] = palace.earthlyBranch;

      const stars = new Set();
      const muts = new Set();

      for (const s of palace.majorStars || []) {
        stars.add(s.name);
        if (s.mutagen) muts.add(s.mutagen);
      }
      for (const s of palace.minorStars || []) {
        stars.add(s.name);
        if (s.mutagen) muts.add(s.mutagen);
      }
      for (const s of palace.adjectiveStars || []) {
        stars.add(s.name);
        if (s.mutagen) muts.add(s.mutagen);
      }

      palStars[palace.index] = stars;
      palMutagen[palace.index] = muts;
    }
  }

  return { palStars, palMutagen, nameToIdx, idxToName, idxToBranch };
}

function starsIn(palStars, idx, stars) {
  const palaceStars = palStars[idx] || new Set();
  for (const star of stars) {
    if (!palaceStars.has(star)) return false;
  }
  return true;
}

function anyStarIn(palStars, idx, stars) {
  const palaceStars = palStars[idx] || new Set();
  for (const star of stars) {
    if (palaceStars.has(star)) return true;
  }
  return false;
}

function noShaJi(palStars, palMutagen, idxs) {
  for (const i of idxs) {
    const stars = palStars[i] || new Set();
    const muts = palMutagen[i] || new Set();
    for (const sha of SHA_SET) {
      if (stars.has(sha)) return false;
    }
    if (muts.has("忌")) return false;
  }
  return true;
}

function hit(pid, reason) {
  const copy = PATTERN_COPY[pid];
  return {
    id: pid,
    reason: reason,
    title: copy?.title || pid,
    blurb: copy?.blurb || ""
  };
}

/**
 * 检测命盘格局
 * @param {Object} chart - iztro 星盘对象
 * @param {string} scope - 运限范围（可选）
 * @returns {Array} 检测到的格局列表
 */
export function detectPatterns(chart, scope = null) {
  const { palStars, palMutagen, nameToIdx, idxToName, idxToBranch } = buildMaps(chart, scope);

  const ret = [];

  const iMing = nameToIdx["命宫"];
  const iCai = nameToIdx["财帛"];
  const iGuan = nameToIdx["官禄"];
  const iQian = nameToIdx["迁移"];
  const iLeft = _left(iMing);
  const iRight = _right(iMing);
  const tri = [iMing, iCai, iGuan, iQian];
  const tri3 = [iMing, iCai, iGuan];

  // 紫微独坐
  const mingMajor = new Set([...(palStars[iMing] || new Set())].filter(s => MAJOR_14.has(s)));
  if (mingMajor.size === 1 && mingMajor.has("紫微") && ["子", "午"].includes(idxToBranch[iMing])) {
    ret.push(hit("ziwei_duzuo", `紫微独坐于${idxToBranch[iMing]}支`));
  }

  // 百官朝拱
  if ((palStars[iMing] || new Set()).has("紫微")) {
    const triUnion = new Set();
    for (const j of tri) for (const s of (palStars[j] || new Set())) triUnion.add(s);
    const pairSets = [
      new Set(["天魁", "天钺"]), new Set(["文昌", "文曲"]), new Set(["左辅", "右弼"]),
      new Set(["三台", "八座"]), new Set(["恩光", "天贵"]), new Set(["台辅", "封诰"]), new Set(["天官", "天福"])
    ];
    let pairCount = 0;
    for (const ps of pairSets) {
      let ok = true;
      for (const st of ps) if (!triUnion.has(st)) { ok = false; break; }
      if (ok) pairCount += 1;
    }
    if (pairCount >= 3) {
      ret.push(hit("baiguan_chaogong", `紫微坐命，三方四正成对吉星≥3对（实际${pairCount}对）`));
    }

    const goodSet = new Set(["天魁", "天钺", "文昌", "文曲", "左辅", "右弼", "三台", "八座", "恩光", "天贵", "台辅", "封诰", "天官", "天福"]);
    let hasGood = false;
    for (const j of tri) if ([...(palStars[j] || new Set())].some(s => goodSet.has(s))) { hasGood = true; break; }
    const hasShaOrJi = !noShaJi(palStars, palMutagen, tri);

    if (!hasGood && !hasShaOrJi) {
      ret.push(hit("zaiye_goujun", "紫微坐命，三方四正少吉亦无煞忌"));
    }
    if (hasShaOrJi) {
      ret.push(hit("wudao_zhijun", "紫微坐命，三方四正见煞/忌冲破"));
    }
  }

  // 紫破组合
  for (let i = 0; i < 12; i++) {
    if (starsIn(palStars, i, new Set(["紫微", "破军"])) && ["丑", "未"].includes(idxToBranch[i])) {
      ret.push(hit("zipo_tonggong", `${idxToName[i]}同宫紫微+破军`));
      break;
    }
  }

  // 紫贪组合
  for (let i = 0; i < 12; i++) {
    if (starsIn(palStars, i, new Set(["紫微", "贪狼"])) && ["卯", "酉"].includes(idxToBranch[i])) {
      ret.push(hit("zitan_tonggong", `${idxToName[i]}同宫紫微+贪狼`));
      break;
    }
  }

  // 紫府同宫
  for (let i = 0; i < 12; i++) {
    if (starsIn(palStars, i, new Set(["紫微", "天府"]))) {
      ret.push(hit("zifu_tonggong", `${idxToName[i]}同宫见紫微+天府`));
      break;
    }
  }

  // 极向离明
  if ((palStars[iMing] || new Set()).has("紫微") && idxToBranch[iMing] === "午") {
    if (noShaJi(palStars, palMutagen, tri)) {
      ret.push(hit("jixiang_liming", "命宫紫微在午，三方无煞忌"));
    }
  }

  // 火贪/铃贪
  if ((palStars[iMing] || new Set()).has("贪狼")) {
    if ((palStars[iMing] || new Set()).has("火星")) {
      ret.push(hit("huotan", "命宫同宫：贪狼+火星"));
    } else if ((palStars[iMing] || new Set()).has("铃星")) {
      ret.push(hit("lingtan", "命宫同宫：贪狼+铃星"));
    }
  }

  const triUnion = new Set();
  for (const j of tri) {
    for (const star of palStars[j] || []) {
      triUnion.add(star);
    }
  }

  if (triUnion.has("贪狼") && (triUnion.has("火星") || triUnion.has("铃星"))) {
    ret.push(hit("huo_or_ling_tan_weak", "命三方四正会照：贪+火/铃"));
  }

  // 杀破狼
  if (triUnion.has("七杀") && triUnion.has("破军") && triUnion.has("贪狼")) {
    ret.push(hit("shapolang", "命三方四正集齐：七杀/破军/贪狼"));
  }

  // 五大格局
  const tri3Union = new Set();
  for (const j of tri3) for (const s of (palStars[j] || new Set())) tri3Union.add(s);
  const tri3Major = new Set([...tri3Union].filter(s => MAJOR_14.has(s)));

  if (["七杀", "破军", "贪狼"].every(s => tri3Major.has(s))) {
    ret.push(hit("big5_shapolang", "命/财/官三宫主星包含：七杀、破军、贪狼"));
  }

  const fuxiangSet = new Set(["天府", "天相"]);
  if (tri3Major.size > 0 && [...tri3Major].every(s => fuxiangSet.has(s))) {
    ret.push(hit("big5_fuxiang", "命/财/官三宫主星仅由天府/天相构成"));
  }

  const jiyueSet = new Set(["天机", "太阴", "天同", "天梁"]);
  if (tri3Major.size >= 3 && [...tri3Major].every(s => jiyueSet.has(s))) {
    ret.push(hit("big5_jiyue_tongliang", "命/财/官三宫主星由天机/太阴/天同/天梁构成"));
  }

  // 阳梁昌禄
  const need = new Set(["太阳", "天梁", "文昌", "禄存"]);
  let hasAll = true;
  for (const star of need) {
    if (!triUnion.has(star)) { hasAll = false; break; }
  }
  if (hasAll) {
    ret.push(hit("yangliang_changlu", "命三方四正集齐：日/梁/昌/禄"));
  }

  // 七杀朝斗
  if ((palStars[iMing] || new Set()).has("七杀") && ["子", "午", "寅", "申"].includes(idxToBranch[iMing])) {
    ret.push(hit("qisha_chaodou", `七杀坐命，命支=${idxToBranch[iMing]}`));
  }

  // 英星入庙
  if ((palStars[iMing] || new Set()).has("破军") && ["子", "午"].includes(idxToBranch[iMing])) {
    ret.push(hit("yingxing_rumiao", `破军坐命，命支=${idxToBranch[iMing]}`));
  }

  // 三奇加会
  const hasLu = tri.some(j => palMutagen[j] && palMutagen[j].has("禄"));
  const hasQuan = tri.some(j => palMutagen[j] && palMutagen[j].has("权"));
  const hasKe = tri.some(j => palMutagen[j] && palMutagen[j].has("科"));
  if (hasLu && hasQuan && hasKe) {
    ret.push(hit("sanqi_jiahui", "命三方四正见化禄/化权/化科"));
  }

  // 禄马交驰
  for (let i = 0; i < 12; i++) {
    if (starsIn(palStars, i, new Set(["禄存", "天马"]))) {
      ret.push(hit("luma_jiaochi", `${idxToName[i]}同宫禄存+天马`));
      break;
    }
  }

  // 禄合鸳鸯
  for (let i = 0; i < 12; i++) {
    if ((palStars[i] || new Set()).has("禄存") && (palMutagen[i] || new Set()).has("禄")) {
      ret.push(hit("luhe_yuanyang", `${idxToName[i]}同宫禄存+化禄`));
      break;
    }
  }

  // 双禄朝垣
  const triHasLucun = tri.some(j => (palStars[j] || new Set()).has("禄存"));
  const triHasHualu = tri.some(j => (palMutagen[j] || new Set()).has("禄"));
  if (triHasLucun && triHasHualu) {
    if (noShaJi(palStars, palMutagen, tri)) {
      ret.push(hit("shuanglu_chaoyuan", "命三方四正会照：禄存与化禄，三方无煞忌"));
    }
  }

  // 左右夹命
  if (((palStars[iLeft] || new Set()).has("左辅") && (palStars[iRight] || new Set()).has("右弼")) ||
      ((palStars[iRight] || new Set()).has("左辅") && (palStars[iLeft] || new Set()).has("右弼"))) {
    ret.push(hit("zuoyou_jiaming", "左右邻宫分见左辅与右弼"));
  }

  // 魁钺夹命
  if (((palStars[iLeft] || new Set()).has("天魁") && (palStars[iRight] || new Set()).has("天钺")) ||
      ((palStars[iRight] || new Set()).has("天魁") && (palStars[iLeft] || new Set()).has("天钺"))) {
    ret.push(hit("kuiyue_jiaming", "左右邻宫分见天魁与天钺"));
  }

  // 梁马飘荡
  for (let i = 0; i < 12; i++) {
    if (starsIn(palStars, i, new Set(["天梁", "天马"]))) {
      ret.push(hit("liangma_piaodang", `${idxToName[i]}同宫天梁+天马`));
      break;
    }
  }

  return ret;
}
