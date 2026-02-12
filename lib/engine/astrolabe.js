/**
 * 星盘生成模块
 * 封装 iztro 库，提供命盘生成和格式化功能
 */

import { lookupCity } from './geo.js';
import { getSolarTime, getTimeIndex } from './solar.js';
import { starsTypeMapping, scopeMapping, MUTAGENS_MAPPING, PALACE_NAMES } from './config.js';

let astroClient;

/**
 * 获取 iztro 客户端
 */
async function getAstroClient() {
  if (!astroClient) {
    const { astro } = await import('iztro');
    astro.config({ yearDivide: 'normal' });
    astroClient = astro;
  }
  return astroClient;
}

/**
 * 生成星盘
 * @param {Object} params - 参数对象
 * @param {string} params.birth_date - 出生日期 (YYYY-MM-DD)
 * @param {string} params.time - 出生时间 (HH:mm)
 * @param {string} params.gender - 性别 ("男"/"女")
 * @param {string} params.city - 出生城市
 * @param {boolean} params.is_lunar - 是否农历 (默认false)
 * @param {boolean} params.is_leap - 是否闰月 (默认false)
 * @returns {Object} iztro 星盘对象
 */
export async function generateAstrolabe({ birth_date, time, gender, city, is_lunar = false, is_leap = false }) {
  try {
    const astro = await getAstroClient();
    const [hour, minute] = time.split(':').map(Number);

    // 获取城市坐标
    const locationResult = lookupCity(city);
    if (!locationResult.success) {
      throw new Error(`城市查询失败: ${locationResult.error}`);
    }
    const coordinates = {
      lat: locationResult.data.latitude,
      lng: locationResult.data.longitude
    };

    // 解析日期
    let dateParts;
    if (is_lunar) {
      const tempAstrolabe = astro.byLunar(birth_date, 0, gender, is_leap, true, 'zh-CN');
      const [year, month, day] = tempAstrolabe.solarDate.split('-').map(Number);
      dateParts = { year, month, day };
    } else {
      const [year, month, day] = birth_date.split('-').map(Number);
      dateParts = { year, month, day };
    }

    // 计算真太阳时
    const solarTimeResult = getSolarTime({
      dateTime: { ...dateParts, hour, minute, second: 0 },
      longitude: coordinates.lng,
      latitude: coordinates.lat
    });

    let timeIndex;
    if (solarTimeResult.success) {
      const trueSolarTime = solarTimeResult.data.trueSolarTime;
      timeIndex = getTimeIndex(trueSolarTime.hour, trueSolarTime.minute);
    } else {
      timeIndex = getTimeIndex(hour, minute);
    }

    // 生成星盘
    const astrolabe = is_lunar
      ? astro.byLunar(birth_date, timeIndex, gender, is_leap, true, 'zh-CN')
      : astro.bySolar(birth_date, timeIndex, gender, is_leap, 'zh-CN');

    return astrolabe;
  } catch (error) {
    throw new Error(`星盘生成失败: ${error.message}`);
  }
}

/**
 * 格式化宫位信息
 */
export function formatPalace(palace, horoscope = {}, scope = 'origin') {
  const ret = {
    "宫位索引": palace.index,
    "宫位名称": horoscope?.palaceNames?.[palace.index] || palace.name,
    "是否身宫": palace.isBodyPalace,
    "是否本宫": palace.isOriginalPalace,
    "天干": palace.heavenlyStem,
    "地支": palace.earthlyBranch,
    "主星": palace.majorStars?.map(star => ({
      "星曜名称": star.name,
      "星曜类型": starsTypeMapping(star.type),
      "作用范围": scopeMapping(star.scope),
      "亮度": star.brightness || "无",
      "本命盘四化": star.mutagen ? star.name + '化' + star.mutagen : "无"
    })) || [],
    "辅星": palace.minorStars?.map(star => ({
      "星曜名称": star.name,
      "星曜类型": starsTypeMapping(star.type),
      "作用范围": scopeMapping(star.scope),
      "亮度": star.brightness || "无"
    })) || [],
    "杂曜": palace.adjectiveStars?.map(star => ({
      "星曜名称": star.name,
      "星曜类型": starsTypeMapping(star.type),
      "作用范围": scopeMapping(star.scope)
    })) || [],
  };

  if (scope === 'origin') {
    ret["长生十二神"] = palace.changsheng12 || "无";
    ret["博士十二神"] = palace.boshi12 || "无";
  } else {
    ret["将前十二神"] = palace.jiangqian12 || "无";
    ret["岁前十二神"] = palace.suiqian12 || "无";
  }

  if (scope === 'decadal') {
    ret["运耀"] = horoscope.stars?.[palace.index]?.map(star => ({
      "星曜名称": star.name,
      "星曜类型": starsTypeMapping(star.type),
      "作用范围": scopeMapping(star.scope),
      "亮度": star.brightness || "无",
      "运耀四化": star.mutagen ? star.name + '化' + star.mutagen : "无"
    })) || [];

    ret["大限飞星四化"] = horoscope.mutagen?.reduce((acc, mutagen, i) => {
      if (palace.majorStars?.some(star => star.name === mutagen)) {
        acc.push(mutagen + '化' + MUTAGENS_MAPPING[i]);
      }
      return acc;
    }, []) || [];

    if (palace.index === horoscope.index) {
      ret["大限年龄范围"] = palace.decadal?.range || [];
    }
  }

  if (scope === 'yearly') {
    ret["流曜"] = horoscope.stars?.[palace.index]?.map(star => ({
      "星曜名称": star.name,
      "星曜类型": starsTypeMapping(star.type),
      "作用范围": scopeMapping(star.scope),
      "亮度": star.brightness || "无",
      "流曜四化": star.mutagen ? star.name + '化' + star.mutagen : "无"
    })) || [];

    ret["流年飞星四化"] = horoscope.mutagen?.reduce((acc, mutagen, i) => {
      if (palace.majorStars?.some(star => star.name === mutagen)) {
        acc.push(mutagen + '化' + MUTAGENS_MAPPING[i]);
      }
      return acc;
    }, []) || [];
  }

  return ret;
}

/**
 * 获取指定运限范围内的十二宫信息数组
 */
export function getScopePalaces(horoscope, scope) {
  if (!horoscope || typeof horoscope.palace !== 'function') {
    throw new Error('无效的运限对象：缺少宫位查询能力');
  }

  return horoscope[scope].palaceNames.map(name => {
    const palace = horoscope.palace(name, scope);
    if (!palace) {
      throw new Error(`未能获取「${name}」的运限宫位信息`);
    }
    palace.name = horoscope[scope].palaceNames[palace.index];
    return palace;
  });
}

/**
 * 格式化三方四正宫位信息
 */
export function formatSurroundedPalaces(surroundedPalaces, horoscope = {}, scope = 'origin') {
  return {
    "对宫": formatPalace(surroundedPalaces.opposite, horoscope, scope),
    "三方": {
      "三合宫之一": formatPalace(surroundedPalaces.wealth, horoscope, scope),
      "三合宫之二": formatPalace(surroundedPalaces.career, horoscope, scope),
    },
  };
}

/**
 * 获取星盘基本信息
 */
export function getAstrolabeBasicInfo(astrolabe) {
  return {
    "阳历日期": astrolabe.solarDate,
    "农历日期": astrolabe.lunarDate,
    "四柱": astrolabe.chineseDate,
    "时辰": astrolabe.time,
    "时辰对应时间段": astrolabe.timeRange,
    "星座": astrolabe.sign,
    "生肖": astrolabe.zodiac,
    "命宫地支": astrolabe.earthlyBranchOfSoulPalace,
    "身宫地支": astrolabe.earthlyBranchOfBodyPalace,
    "命主": astrolabe.soul,
    "身主": astrolabe.body,
    "五行局": astrolabe.fiveElementsClass
  };
}
