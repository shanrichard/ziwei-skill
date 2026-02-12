/**
 * 八字排盘命令处理
 */

import { generateBazi, getCalendar } from '../engine/bazi.js';

/**
 * 执行八字排盘
 */
export async function executeBazi(options) {
  try {
    const result = generateBazi({
      date: options.date,
      time: options.time,
      gender: options.gender,
      lunar: options.lunar || false,
      sect: options.sect ? parseInt(options.sect) : 2,
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 执行黄历查询
 */
export async function executeCalendar(options) {
  try {
    const result = getCalendar(options.date);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
