/**
 * 紫微斗数合盘分析模块
 * 评估两人命盘的匹配度
 */

import {
  PALACE_NAMES, MAJOR_14, SOFT, TOUGH, FLOWER, HELPER, POS_ADJ, NEG_ADJ,
  BASE_WEIGHTS, MUTAGEN_WEIGHTS, FLOWER_WEIGHT, HELPER_WEIGHT,
  POS_ADJ_WEIGHT, NEG_ADJ_WEIGHT, TRI_WEIGHTS, NORM_PARAMS,
  BRIGHTNESS_ALIASES, BRIGHTNESS_POS_MULT, BRIGHTNESS_NEG_MULT,
  SYNASTRY_BINS, BUCKET_TONE, PALACE_ADVICE, STAR_BRIEF
} from './config.js';
import { generateAstrolabe, getScopePalaces } from './astrolabe.js';

// 宫位导航函数
function opp(i) { return (i + 6) % 12; }
function triIndices(i) { return [i, opp(i), (i + 4) % 12, (i + 8) % 12]; }

// 构建星盘映射表
function buildMaps(chart) {
  const palStars = {};
  const palMutagen = {};
  const nameToIdx = {};
  const idxToBranch = {};

  for (let i = 0; i < 12; i++) {
    const palace = chart[i];
    nameToIdx[palace.name] = palace.index;
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

  return { palStars, palMutagen, nameToIdx, idxToBranch };
}

// 构建亮度映射表
function buildBrightnessMap(chart) {
  const palBright = {};
  for (let i = 0; i < 12; i++) {
    const palace = chart[i];
    const mp = {};
    const allStars = [...(palace.majorStars || []), ...(palace.minorStars || []), ...(palace.adjectiveStars || [])];
    for (const s of allStars) {
      if (s.name && s.brightness) {
        mp[s.name] = s.brightness;
      }
    }
    palBright[palace.index] = mp;
  }
  return palBright;
}

// 构建权重字典
function buildWeightMap() {
  const weights = { ...BASE_WEIGHTS };
  for (const s of FLOWER) weights[s] = FLOWER_WEIGHT;
  for (const s of HELPER) weights[s] = HELPER_WEIGHT;
  for (const s of POS_ADJ) weights[s] = POS_ADJ_WEIGHT;
  for (const s of NEG_ADJ) weights[s] = NEG_ADJ_WEIGHT;
  return weights;
}

// 按地支叠加B的星曜到A的宫位
function overlaySameBranch(AIdxToBranch, BIdxToBranch, BPalStars, BPalMut) {
  const overlayStars = {};
  const overlayMut = {};
  const bMap = {};

  for (const [i, br] of Object.entries(BIdxToBranch)) {
    bMap[br] = parseInt(i);
  }

  for (const [ai, abr] of Object.entries(AIdxToBranch)) {
    const bi = bMap[abr];
    const aiNum = parseInt(ai);

    if (bi === undefined) {
      overlayStars[aiNum] = new Set();
      overlayMut[aiNum] = new Set();
    } else {
      overlayStars[aiNum] = new Set(BPalStars[bi] || []);
      overlayMut[aiNum] = new Set(BPalMut[bi] || []);
    }
  }

  return { overlayStars, overlayMut };
}

// 归一化亮度标签
function normalizeBrightnessLabel(br) {
  if (!br) return null;
  return BRIGHTNESS_ALIASES[br] || br;
}

// 应用亮度调整
function applyBrightnessAdjust(w, br) {
  if (br === null || br === undefined) return w;
  const normalizedBr = normalizeBrightnessLabel(br);
  if (!normalizedBr) return w;

  if (w >= 0) {
    return w * (BRIGHTNESS_POS_MULT[normalizedBr] || 1.0);
  } else {
    return w * (BRIGHTNESS_NEG_MULT[normalizedBr] || 1.0);
  }
}

// 将B盘的亮度映射到与A盘同地支的宫位上
function mapBrightnessByBranch(AIdxToBranch, BIdxToBranch, BBright) {
  const branchToBIdx = {};
  for (const [i, br] of Object.entries(BIdxToBranch)) {
    branchToBIdx[br] = parseInt(i);
  }
  const ABright = {};
  for (const [ai, abr] of Object.entries(AIdxToBranch)) {
    const bi = branchToBIdx[abr];
    const aiNum = parseInt(ai);
    ABright[aiNum] = (bi !== undefined && BBright[bi]) ? BBright[bi] : {};
  }
  return ABright;
}

// 计算单个宫位得分
function scorePalace(i, BOnAStars, BOnAMut, weight = 1.0, nameByIdx = null, brightMap = null) {
  const tri = triIndices(i);
  const wMap = {
    [i]: TRI_WEIGHTS.self,
    [opp(i)]: TRI_WEIGHTS.opp,
    [(i + 4) % 12]: TRI_WEIGHTS.tri1,
    [(i + 8) % 12]: TRI_WEIGHTS.tri2
  };

  let pts = 0.0;
  const reasons = [];
  const baseW = buildWeightMap();

  for (const j of tri) {
    const jw = wMap[j] || 0.0;

    for (const s of BOnAStars[j] || []) {
      let br = null;
      if (brightMap && brightMap[j]) {
        br = brightMap[j][s];
      }

      const base = baseW[s] || 0.0;
      const adj = applyBrightnessAdjust(base, br);
      const inc = adj * jw * weight;

      if (Math.abs(inc) > 1e-9) {
        pts += inc;
        const ti = nameByIdx ? nameByIdx[i] : PALACE_NAMES[i];
        const tj = nameByIdx ? nameByIdx[j] : PALACE_NAMES[j];
        const brn = normalizeBrightnessLabel(br);

        if (br) {
          reasons.push(`${ti}←${tj}: B星[${s}|${brn}] *${jw.toFixed(1)} => ${inc.toFixed(2)}`);
        } else {
          reasons.push(`${ti}←${tj}: B星[${s}] *${jw.toFixed(1)} => ${inc.toFixed(2)}`);
        }
      }
    }

    for (const m of BOnAMut[j] || []) {
      const inc = (MUTAGEN_WEIGHTS[m] || 0.0) * jw * weight;
      if (Math.abs(inc) > 1e-9) {
        pts += inc;
        const ti = nameByIdx ? nameByIdx[i] : PALACE_NAMES[i];
        const tj = nameByIdx ? nameByIdx[j] : PALACE_NAMES[j];
        reasons.push(`${ti}←${tj}: B化[${m}] *${jw.toFixed(1)} => ${inc.toFixed(2)}`);
      }
    }
  }

  return { pts, reasons };
}

// 归一化分数到0-100
function normScore(x, center = null, spread = null) {
  if (center === null) center = NORM_PARAMS.center;
  if (spread === null) spread = NORM_PARAMS.spread;
  const z = (x - center) / (spread > 0 ? spread : 1.0);
  const sig = 1.0 / (1.0 + Math.exp(-z));
  return sig * 100.0;
}

// 根据分数判断档位
function getBucket(x) {
  for (const [name, lo, hi] of SYNASTRY_BINS) {
    if (lo <= x && x < hi) return name;
  }
  return "中性";
}

/**
 * 紫微斗数合盘评分
 */
export function synastryScore(chartA, chartB) {
  const { palStars: AStars, palMutagen: AMut, nameToIdx: AN2I, idxToBranch: AI2B } = buildMaps(chartA);
  const { palStars: BStars, palMutagen: BMut, idxToBranch: BI2B } = buildMaps(chartB);

  const { overlayStars: BOnAStars, overlayMut: BOnAMut } = overlaySameBranch(AI2B, BI2B, BStars, BMut);

  const AI2N = Object.fromEntries(Object.entries(AN2I).map(([k, v]) => [v, k]));
  const ABright = mapBrightnessByBranch(AI2B, BI2B, buildBrightnessMap(chartB));

  const palaceScores = {};
  const palaceReasons = {};
  for (const [pName, idx] of Object.entries(AN2I)) {
    const { pts, reasons } = scorePalace(idx, BOnAStars, BOnAMut, 1.0, AI2N, ABright);
    palaceScores[pName] = pts;
    palaceReasons[pName] = reasons;
  }

  return {
    palaces: palaceScores,
    explanations: { palaces: palaceReasons }
  };
}

/**
 * 基于宫位的合盘解释
 */
export function interpretSynastryByPalace(result, minAbsEffect = 0.3, maxItemsPerPolarity = null) {
  const palRaw = result.palaces || {};
  const palExps = result.explanations?.palaces || {};

  const out = { palaces: {} };

  function parseInc(line) {
    if (!line.includes('=>')) return null;
    try {
      const incTxt = line.split('=>').pop().trim();
      return parseFloat(incTxt);
    } catch (e) {
      return null;
    }
  }

  function adviceFor(pal, bucket) {
    const posKeys = new Set(["相合", "强合", "共振"]);
    const negKeys = new Set(["相克", "相冲"]);

    let key = 'neu';
    if (posKeys.has(bucket)) key = 'pos';
    else if (negKeys.has(bucket)) key = 'neg';

    return PALACE_ADVICE[pal]?.[key] || [];
  }

  for (const [pal, raw] of Object.entries(palRaw)) {
    const lines = palExps[pal] || [];
    const posLinesWithV = [];
    const negLinesWithV = [];

    for (const ln of lines) {
      const v = parseInc(ln);
      if (v === null) continue;
      if (Math.abs(v) < minAbsEffect) continue;

      if (v > 0) posLinesWithV.push([Math.abs(v), ln]);
      else if (v < 0) negLinesWithV.push([Math.abs(v), ln]);
    }

    posLinesWithV.sort((a, b) => b[0] - a[0]);
    negLinesWithV.sort((a, b) => b[0] - a[0]);

    let posLines = posLinesWithV.map(x => x[1]);
    let negLines = negLinesWithV.map(x => x[1]);

    if (maxItemsPerPolarity !== null) {
      posLines = posLines.slice(0, maxItemsPerPolarity);
      negLines = negLines.slice(0, maxItemsPerPolarity);
    }

    const score = normScore(raw);
    const bucket = getBucket(score);

    out.palaces[pal] = {
      raw: raw,
      score: score,
      bucket: bucket,
      highlights: posLines,
      risks: negLines,
      advice: adviceFor(pal, bucket)
    };
  }

  return out;
}

/**
 * 生成自然语言合盘分析
 */
export function renderSynastryText(aName, bName, synResult, interpResult) {
  const palOut = [];
  const pals = interpResult.palaces || {};

  for (const [pal, info] of Object.entries(pals)) {
    const bucket = info.bucket || '中性';
    const tone = BUCKET_TONE[bucket] || '';
    const oneLiner = tone.endsWith('。') ? tone : `${tone}。`;

    palOut.push({
      palace: pal,
      bucket: bucket,
      score: Math.round(info.score),
      one_liner: oneLiner,
      advice: info.advice || []
    });
  }

  return { headline: `${aName} × ${bName}`, palaces: palOut };
}

/**
 * 完整的合盘分析接口
 */
export function analyzeSynastry(chartA, chartB, nameA = "A", nameB = "B", options = {}) {
  const { minAbsEffect = 0.3, maxItemsPerPolarity = null, includeRawData = false } = options;

  try {
    const synResult = synastryScore(chartA, chartB);
    const interpResult = interpretSynastryByPalace(synResult, minAbsEffect, maxItemsPerPolarity);
    const textResult = renderSynastryText(nameA, nameB, synResult, interpResult);

    const result = {
      summary: {
        headline: textResult.headline,
        total_palaces: Object.keys(interpResult.palaces).length
      },
      palaces: textResult.palaces,
      metadata: {
        analysis_time: new Date().toISOString(),
        min_effect_threshold: minAbsEffect
      }
    };

    if (includeRawData) {
      result.raw_data = {
        synastry_scores: synResult,
        interpretation: interpResult
      };
    }

    return { success: true, data: result };

  } catch (error) {
    return { success: false, error: `合盘分析失败: ${error.message}` };
  }
}

/**
 * 通过用户信息进行合盘分析
 */
export async function analyzeSynastryByUserInfo({
  birth_date_a, birth_time_a, gender_a, city_a, name_a = "A",
  birth_date_b, birth_time_b, gender_b, city_b, name_b = "B",
  is_lunar_a = false, is_leap_a = false,
  is_lunar_b = false, is_leap_b = false,
  scope = 'origin',
  query_date = null,
  min_abs_effect = 0.3,
  max_items_per_polarity = null,
  include_raw_data = false
}) {
  try {
    const astroA = await generateAstrolabe({
      birth_date: birth_date_a,
      time: birth_time_a,
      gender: gender_a,
      city: city_a,
      is_lunar: is_lunar_a,
      is_leap: is_leap_a
    });

    const astroB = await generateAstrolabe({
      birth_date: birth_date_b,
      time: birth_time_b,
      gender: gender_b,
      city: city_b,
      is_lunar: is_lunar_b,
      is_leap: is_leap_b
    });

    let chartA, chartB;

    if (scope === 'origin') {
      chartA = astroA.palaces;
      chartB = astroB.palaces;
    } else {
      const horoscopeA = astroA.horoscope(query_date);
      const horoscopeB = astroB.horoscope(query_date);
      chartA = getScopePalaces(horoscopeA, scope);
      chartB = getScopePalaces(horoscopeB, scope);
    }

    const result = analyzeSynastry(chartA, chartB, name_a, name_b, {
      minAbsEffect: min_abs_effect,
      maxItemsPerPolarity: max_items_per_polarity,
      includeRawData: include_raw_data
    });

    return {
      success: true,
      data: result.data,
      message: `${name_a}与${name_b}的合盘分析完成`,
      time: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '合盘分析失败',
      time: new Date().toISOString()
    };
  }
}
