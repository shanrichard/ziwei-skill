/**
 * 合盘分析命令
 */

import { analyzeSynastryByUserInfo } from '../engine/synastry.js';

/**
 * 执行本命合盘分析
 */
export async function executeSynastry(options) {
  const {
    aDate, aTime, aGender, aCity, aName,
    bDate, bTime, bGender, bCity, bName,
    aLunar, aLeap, bLunar, bLeap
  } = options;

  try {
    // 验证必需参数
    if (!aDate || !aTime || !aGender || !aCity) {
      return {
        success: false,
        error: '缺少A方必需参数: a-date, a-time, a-gender, a-city'
      };
    }
    if (!bDate || !bTime || !bGender || !bCity) {
      return {
        success: false,
        error: '缺少B方必需参数: b-date, b-time, b-gender, b-city'
      };
    }

    const result = await analyzeSynastryByUserInfo({
      birth_date_a: aDate,
      birth_time_a: aTime,
      gender_a: aGender,
      city_a: aCity,
      name_a: aName || 'A',
      birth_date_b: bDate,
      birth_time_b: bTime,
      gender_b: bGender,
      city_b: bCity,
      name_b: bName || 'B',
      is_lunar_a: aLunar || false,
      is_leap_a: aLeap || false,
      is_lunar_b: bLunar || false,
      is_leap_b: bLeap || false,
      scope: 'origin'
    });

    return result;

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 执行流年合盘分析
 */
export async function executeSynastryYearly(options) {
  const {
    aDate, aTime, aGender, aCity, aName,
    bDate, bTime, bGender, bCity, bName,
    aLunar, aLeap, bLunar, bLeap,
    year
  } = options;

  try {
    if (!aDate || !aTime || !aGender || !aCity) {
      return {
        success: false,
        error: '缺少A方必需参数: a-date, a-time, a-gender, a-city'
      };
    }
    if (!bDate || !bTime || !bGender || !bCity) {
      return {
        success: false,
        error: '缺少B方必需参数: b-date, b-time, b-gender, b-city'
      };
    }
    if (!year) {
      return {
        success: false,
        error: '缺少年份参数: year'
      };
    }

    const queryDate = `${year}-01-01`;

    const result = await analyzeSynastryByUserInfo({
      birth_date_a: aDate,
      birth_time_a: aTime,
      gender_a: aGender,
      city_a: aCity,
      name_a: aName || 'A',
      birth_date_b: bDate,
      birth_time_b: bTime,
      gender_b: bGender,
      city_b: bCity,
      name_b: bName || 'B',
      is_lunar_a: aLunar || false,
      is_leap_a: aLeap || false,
      is_lunar_b: bLunar || false,
      is_leap_b: bLeap || false,
      scope: 'yearly',
      query_date: queryDate
    });

    if (result.success) {
      result.data.query_year = year;
    }

    return result;

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
