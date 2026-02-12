#!/usr/bin/env node

/**
 * 紫微斗数 CLI 入口
 */

import { Command } from 'commander';
import { executePalace } from '../lib/commands/palace.js';
import { executeSynastry, executeSynastryYearly } from '../lib/commands/synastry.js';

const program = new Command();

program
  .name('ziwei')
  .description('紫微斗数命理分析工具')
  .version('1.0.0');

// 宫位查询命令
program
  .command('palace')
  .description('查询指定宫位的三方四正（支持本命/大限/流年/流月/流日）')
  .requiredOption('--date <date>', '出生日期 (YYYY-MM-DD)')
  .requiredOption('--time <time>', '出生时间 (HH:MM)')
  .requiredOption('--gender <gender>', '性别 (男/女)')
  .requiredOption('--city <city>', '出生城市')
  .requiredOption('--palace <palace>', '宫位名称')
  .option('--scope <scope>', '查询层级 (origin/decadal/yearly/monthly/daily)', 'origin')
  .option('--year <year>', '查询年份（运限层级必需）')
  .option('--month <month>', '查询月份（流月/流日必需）')
  .option('--day <day>', '查询日期（流日必需）')
  .option('--lunar', '农历日期', false)
  .option('--leap', '闰月', false)
  .action(async (options) => {
    const result = await executePalace({
      ...options,
      year: options.year ? parseInt(options.year) : undefined,
      month: options.month ? parseInt(options.month) : undefined,
      day: options.day ? parseInt(options.day) : undefined
    });
    console.log(JSON.stringify(result, null, 2));
  });

// 合盘分析命令
const synastry = program
  .command('synastry')
  .description('合盘分析');

// 本命合盘
synastry
  .command('origin')
  .description('本命合盘分析')
  .requiredOption('--a-date <date>', 'A方出生日期 (YYYY-MM-DD)')
  .requiredOption('--a-time <time>', 'A方出生时间 (HH:MM)')
  .requiredOption('--a-gender <gender>', 'A方性别 (男/女)')
  .requiredOption('--a-city <city>', 'A方出生城市')
  .option('--a-name <name>', 'A方姓名', 'A')
  .option('--a-lunar', 'A方农历日期', false)
  .option('--a-leap', 'A方闰月', false)
  .requiredOption('--b-date <date>', 'B方出生日期 (YYYY-MM-DD)')
  .requiredOption('--b-time <time>', 'B方出生时间 (HH:MM)')
  .requiredOption('--b-gender <gender>', 'B方性别 (男/女)')
  .requiredOption('--b-city <city>', 'B方出生城市')
  .option('--b-name <name>', 'B方姓名', 'B')
  .option('--b-lunar', 'B方农历日期', false)
  .option('--b-leap', 'B方闰月', false)
  .action(async (options) => {
    const result = await executeSynastry({
      aDate: options.aDate,
      aTime: options.aTime,
      aGender: options.aGender,
      aCity: options.aCity,
      aName: options.aName,
      aLunar: options.aLunar,
      aLeap: options.aLeap,
      bDate: options.bDate,
      bTime: options.bTime,
      bGender: options.bGender,
      bCity: options.bCity,
      bName: options.bName,
      bLunar: options.bLunar,
      bLeap: options.bLeap
    });
    console.log(JSON.stringify(result, null, 2));
  });

// 流年合盘
synastry
  .command('yearly')
  .description('流年合盘分析')
  .requiredOption('--a-date <date>', 'A方出生日期 (YYYY-MM-DD)')
  .requiredOption('--a-time <time>', 'A方出生时间 (HH:MM)')
  .requiredOption('--a-gender <gender>', 'A方性别 (男/女)')
  .requiredOption('--a-city <city>', 'A方出生城市')
  .option('--a-name <name>', 'A方姓名', 'A')
  .option('--a-lunar', 'A方农历日期', false)
  .option('--a-leap', 'A方闰月', false)
  .requiredOption('--b-date <date>', 'B方出生日期 (YYYY-MM-DD)')
  .requiredOption('--b-time <time>', 'B方出生时间 (HH:MM)')
  .requiredOption('--b-gender <gender>', 'B方性别 (男/女)')
  .requiredOption('--b-city <city>', 'B方出生城市')
  .option('--b-name <name>', 'B方姓名', 'B')
  .option('--b-lunar', 'B方农历日期', false)
  .option('--b-leap', 'B方闰月', false)
  .requiredOption('--year <year>', '查询年份')
  .action(async (options) => {
    const result = await executeSynastryYearly({
      aDate: options.aDate,
      aTime: options.aTime,
      aGender: options.aGender,
      aCity: options.aCity,
      aName: options.aName,
      aLunar: options.aLunar,
      aLeap: options.aLeap,
      bDate: options.bDate,
      bTime: options.bTime,
      bGender: options.bGender,
      bCity: options.bCity,
      bName: options.bName,
      bLunar: options.bLunar,
      bLeap: options.bLeap,
      year: parseInt(options.year)
    });
    console.log(JSON.stringify(result, null, 2));
  });

program.parse();
