/**
 * 宫位查询命令
 * 支持本命/大限/流年/流月/流日各层级的三方四正查询
 */

import { generateAstrolabe, formatPalace, formatSurroundedPalaces, getAstrolabeBasicInfo, getScopePalaces } from '../engine/astrolabe.js';
import { detectPatterns } from '../engine/patterns.js';

/**
 * 构建查询日期字符串
 */
function buildQueryDate(year, month = 1, day = 1) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * 获取指定层级的宫位及三方四正
 */
function getScopedPalaceAndSurrounded(astrolabe, palaceName, scope, queryDate) {
  if (scope === 'origin') {
    // 本命层直接从 astrolabe 获取
    const targetPalace = astrolabe.palace(palaceName);
    const surroundedPalaces = astrolabe.surroundedPalaces(palaceName);
    return { targetPalace, surroundedPalaces, scopeData: {} };
  } else {
    // 运限层从 horoscope 获取
    const horoscope = astrolabe.horoscope(queryDate);
    const scopeData = horoscope[scope];

    if (!scopeData) {
      throw new Error(`无效的运限范围: ${scope}`);
    }

    const targetPalace = horoscope.palace(palaceName, scope);
    const surroundedPalaces = horoscope.surroundPalaces(palaceName, scope);

    return { targetPalace, surroundedPalaces, scopeData };
  }
}

/**
 * 执行宫位查询
 * @param {Object} options - 命令选项
 * @returns {Object} 查询结果 (JSON)
 */
export async function executePalace(options) {
  const { date, time, gender, city, palace, lunar, leap, scope = 'origin', year, month, day } = options;

  try {
    // 验证必需参数
    if (!date || !time || !gender || !city || !palace) {
      return {
        success: false,
        error: '缺少必需参数: date, time, gender, city, palace'
      };
    }

    // 验证运限层级所需的额外参数
    if (scope !== 'origin' && !year) {
      return {
        success: false,
        error: `${scope} 层级需要指定 year 参数`
      };
    }
    if ((scope === 'monthly' || scope === 'daily') && !month) {
      return {
        success: false,
        error: `${scope} 层级需要指定 month 参数`
      };
    }
    if (scope === 'daily' && !day) {
      return {
        success: false,
        error: 'daily 层级需要指定 day 参数'
      };
    }

    // 生成星盘
    const astrolabe = await generateAstrolabe({
      birth_date: date,
      time: time,
      gender: gender,
      city: city,
      is_lunar: lunar || false,
      is_leap: leap || false
    });

    // 获取目标宫位名称
    // origin 模式需要带"宫"字，horoscope 模式不需要
    const palaceNameWithSuffix = palace.replace(/宫$/, '') + '宫';
    const palaceNameWithoutSuffix = palace.replace(/宫$/, '');
    const targetPalaceName = scope === 'origin' ? palaceNameWithSuffix : palaceNameWithoutSuffix;

    // 构建查询日期
    const queryDate = scope !== 'origin' ? buildQueryDate(year, month || 1, day || 1) : null;

    // 获取目标宫位和三方四正
    const { targetPalace, surroundedPalaces, scopeData } = getScopedPalaceAndSurrounded(
      astrolabe, targetPalaceName, scope, queryDate
    );

    if (!targetPalace) {
      return {
        success: false,
        error: `未找到宫位: ${palace}`
      };
    }

    // 检测格局
    let patterns;
    if (scope === 'origin') {
      patterns = detectPatterns(astrolabe);
    } else {
      const horoscope = astrolabe.horoscope(queryDate);
      patterns = detectPatterns(horoscope, scope);
    }

    // 构建结果
    const result = {
      success: true,
      data: {
        basic_info: getAstrolabeBasicInfo(astrolabe),
        scope: scope,
        target_palace: formatPalace(targetPalace, scopeData, scope),
        surrounded_palaces: formatSurroundedPalaces(surroundedPalaces, scopeData, scope),
        patterns: patterns.map(p => ({
          title: p.title,
          blurb: p.blurb,
          reason: p.reason
        }))
      }
    };

    // 添加查询时间信息
    if (scope !== 'origin') {
      result.data.query_year = year;
      if (month) result.data.query_month = month;
      if (day) result.data.query_day = day;

      // 添加该层级的四化信息
      if (scopeData.mutagen) {
        result.data.mutagen = scopeData.mutagen;
      }
    }

    return result;

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
