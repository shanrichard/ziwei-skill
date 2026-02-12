/**
 * 八字计算引擎
 * 基于 tyme4ts 和 cantian-tymext 库
 */

import { calculateRelation, getShen } from 'cantian-tymext';
import {
  ChildLimit,
  DefaultEightCharProvider,
  LunarHour,
  LunarSect2EightCharProvider,
  SolarTime,
} from 'tyme4ts';

const eightCharProvider1 = new DefaultEightCharProvider();
const eightCharProvider2 = new LunarSect2EightCharProvider();

/**
 * 构建藏干对象
 */
function buildHideHeavenObject(heavenStem, me) {
  if (!heavenStem) return undefined;
  return {
    天干: heavenStem.toString(),
    十神: me.getTenStar(heavenStem).toString(),
  };
}

/**
 * 构建六十甲子柱对象（年柱/月柱/日柱/时柱）
 */
function buildSixtyCycleObject(sixtyCycle, me) {
  const heavenStem = sixtyCycle.getHeavenStem();
  const earthBranch = sixtyCycle.getEarthBranch();
  if (!me) me = heavenStem;

  return {
    天干: {
      天干: heavenStem.toString(),
      五行: heavenStem.getElement().toString(),
      阴阳: heavenStem.getYinYang() === 1 ? '阳' : '阴',
      十神: me === heavenStem ? undefined : me.getTenStar(heavenStem).toString(),
    },
    地支: {
      地支: earthBranch.toString(),
      五行: earthBranch.getElement().toString(),
      阴阳: earthBranch.getYinYang() === 1 ? '阳' : '阴',
      藏干: {
        主气: buildHideHeavenObject(earthBranch.getHideHeavenStemMain(), me),
        中气: buildHideHeavenObject(earthBranch.getHideHeavenStemMiddle(), me),
        余气: buildHideHeavenObject(earthBranch.getHideHeavenStemResidual(), me),
      },
    },
    纳音: sixtyCycle.getSound().toString(),
    旬: sixtyCycle.getTen().toString(),
    空亡: sixtyCycle.getExtraEarthBranches().join(''),
    星运: me.getTerrain(earthBranch).toString(),
    自坐: heavenStem.getTerrain(earthBranch).toString(),
  };
}

/**
 * 构建神煞对象
 */
function buildGodsObject(eightChar, gender) {
  const gods = getShen(eightChar.toString(), gender);
  return {
    年柱: gods[0],
    月柱: gods[1],
    日柱: gods[2],
    时柱: gods[3],
  };
}

/**
 * 构建大运排盘
 */
function buildDecadeFortuneObject(solarTime, gender, me) {
  const childLimit = ChildLimit.fromSolarTime(solarTime, gender);
  let decadeFortune = childLimit.getStartDecadeFortune();
  const firstStartAge = decadeFortune.getStartAge();
  const startDate = childLimit.getEndTime();
  const decadeFortuneObjects = [];

  for (let i = 0; i < 10; i++) {
    const sixtyCycle = decadeFortune.getSixtyCycle();
    const heavenStem = sixtyCycle.getHeavenStem();
    const earthBranch = sixtyCycle.getEarthBranch();
    decadeFortuneObjects.push({
      干支: sixtyCycle.toString(),
      开始年份: decadeFortune.getStartSixtyCycleYear().getYear(),
      结束年份: decadeFortune.getEndSixtyCycleYear().getYear(),
      天干十神: me.getTenStar(heavenStem).getName(),
      地支十神: earthBranch.getHideHeavenStems().map((hs) => me.getTenStar(hs.getHeavenStem()).getName()),
      地支藏干: earthBranch.getHideHeavenStems().map((hs) => hs.toString()),
      开始年龄: decadeFortune.getStartAge(),
      结束年龄: decadeFortune.getEndAge(),
    });
    decadeFortune = decadeFortune.next(1);
  }

  return {
    起运日期: `${startDate.getYear()}-${startDate.getMonth()}-${startDate.getDay()}`,
    起运年龄: firstStartAge,
    大运: decadeFortuneObjects,
  };
}

/**
 * 生成完整八字排盘
 * @param {Object} options
 * @param {string} options.date - 出生日期 YYYY-MM-DD
 * @param {string} options.time - 出生时间 HH:MM
 * @param {string} options.gender - 性别 "男"/"女"
 * @param {boolean} [options.lunar] - 是否农历
 * @param {number} [options.sect] - 早晚子时配置 1或2，默认2
 */
export function generateBazi({ date, time, gender, lunar = false, sect = 2 }) {
  const [hour, minute] = time.split(':').map(Number);
  const genderNum = gender === '男' ? 1 : 0;

  let lunarHour;

  if (lunar) {
    // 农历输入
    const [year, month, day] = date.split('-').map(Number);
    lunarHour = LunarHour.fromYmdHms(year, month, day, hour, minute, 0);
  } else {
    // 阳历输入
    const [year, month, day] = date.split('-').map(Number);
    const solarTime = SolarTime.fromYmdHms(year, month, day, hour, minute, 0);
    lunarHour = solarTime.getLunarHour();
  }

  // 设置子时配置
  if (sect === 2) {
    LunarHour.provider = eightCharProvider2;
  } else {
    LunarHour.provider = eightCharProvider1;
  }

  const eightChar = lunarHour.getEightChar();
  const me = eightChar.getDay().getHeavenStem();
  const solarTime = lunarHour.getSolarTime();

  return {
    性别: gender,
    阳历: solarTime.toString(),
    农历: lunarHour.toString(),
    八字: eightChar.toString(),
    生肖: eightChar.getYear().getEarthBranch().getZodiac().toString(),
    日主: me.toString(),
    年柱: buildSixtyCycleObject(eightChar.getYear(), me),
    月柱: buildSixtyCycleObject(eightChar.getMonth(), me),
    日柱: buildSixtyCycleObject(eightChar.getDay()),
    时柱: buildSixtyCycleObject(eightChar.getHour(), me),
    胎元: eightChar.getFetalOrigin().toString(),
    胎息: eightChar.getFetalBreath().toString(),
    命宫: eightChar.getOwnSign().toString(),
    身宫: eightChar.getBodySign().toString(),
    神煞: buildGodsObject(eightChar, genderNum),
    大运: buildDecadeFortuneObject(solarTime, genderNum, me),
    刑冲合会: calculateRelation({
      年: { 天干: eightChar.getYear().getHeavenStem().toString(), 地支: eightChar.getYear().getEarthBranch().toString() },
      月: { 天干: eightChar.getMonth().getHeavenStem().toString(), 地支: eightChar.getMonth().getEarthBranch().toString() },
      日: { 天干: eightChar.getDay().getHeavenStem().toString(), 地支: eightChar.getDay().getEarthBranch().toString() },
      时: { 天干: eightChar.getHour().getHeavenStem().toString(), 地支: eightChar.getHour().getEarthBranch().toString() },
    }),
  };
}

/**
 * 获取黄历信息
 * @param {string} [date] - 阳历日期 YYYY-MM-DD，不传则为当天
 */
export function getCalendar(date) {
  let solarTime;
  if (date) {
    const [year, month, day] = date.split('-').map(Number);
    solarTime = SolarTime.fromYmdHms(year, month, day, 12, 0, 0);
  } else {
    const now = new Date();
    solarTime = SolarTime.fromYmdHms(
      now.getFullYear(), now.getMonth() + 1, now.getDate(),
      now.getHours(), now.getMinutes(), now.getSeconds()
    );
  }

  const lunarHour = solarTime.getLunarHour();
  const lunarDay = lunarHour.getLunarDay();
  const eightChar = lunarHour.getEightChar();
  const solarDay = solarTime.getSolarDay();

  return {
    公历: solarTime.toString().split(' ')[0],
    农历: lunarDay.toString(),
    干支: eightChar.toString().split(' ').slice(0, 3).join(' '),
    年干支: eightChar.getYear().toString(),
    月干支: eightChar.getMonth().toString(),
    日干支: eightChar.getDay().toString(),
    生肖: eightChar.getYear().getEarthBranch().getZodiac().toString(),
    纳音: eightChar.getDay().getSound().toString(),
    节气: solarDay.getTerm()?.toString() || '无节气',
    农历节日: lunarDay.getFestival()?.toString() || undefined,
    公历节日: solarDay.getFestival()?.toString() || undefined,
  };
}
