/**
 * 真太阳时计算器
 * 基于天文算法实现高精度真太阳时计算
 */

const J2000 = 2451545.0;
const DEGREES_TO_RADIANS = Math.PI / 180.0;
const RADIANS_TO_DEGREES = 180.0 / Math.PI;

/**
 * 计算儒略日 (Julian Day)
 */
function calculateJulianDay(year, month, day, hour = 0, minute = 0, second = 0) {
  const fractionalDay = (hour + minute / 60.0 + second / 3600.0) / 24.0;

  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const a = Math.floor(year / 100);
  const b = Math.floor(a / 4);
  const c = 2 - a + b;
  const e = Math.floor(365.25 * (year + 4716));
  const f = Math.floor(30.6001 * (month + 1));

  return c + day + e + f - 1524.5 + fractionalDay;
}

/**
 * 角度归一化到0-360度
 */
function normalizeAngle(angle) {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * 计算太阳平黄经
 */
function calculateMeanLongitude(T) {
  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  return normalizeAngle(L0);
}

/**
 * 计算太阳平近点角
 */
function calculateMeanAnomaly(T) {
  let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  return normalizeAngle(M);
}

/**
 * 计算太阳中心方程
 */
function calculateEquationOfCenter(M, T) {
  const Mr = M * DEGREES_TO_RADIANS;

  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr) +
            (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) +
            0.000289 * Math.sin(3 * Mr);

  return C;
}

/**
 * 计算太阳真黄经
 */
function calculateTrueLongitude(L0, C) {
  return normalizeAngle(L0 + C);
}

/**
 * 计算黄赤交角
 */
function calculateObliquity(T) {
  const eps0 = 23.0 + 26.0/60.0 + 21.448/3600.0 -
               46.8150/3600.0 * T -
               0.00059/3600.0 * T * T +
               0.001813/3600.0 * T * T * T;
  return eps0;
}

/**
 * 计算太阳赤经
 */
function calculateRightAscension(lambda, eps) {
  const lambdaRad = lambda * DEGREES_TO_RADIANS;
  const epsRad = eps * DEGREES_TO_RADIANS;

  const alpha = Math.atan2(
    Math.cos(epsRad) * Math.sin(lambdaRad),
    Math.cos(lambdaRad)
  );

  return normalizeAngle(alpha * RADIANS_TO_DEGREES);
}

/**
 * 计算时间方程
 */
function calculateEquationOfTime(L0, alpha) {
  let E = L0 - 0.0057183 - alpha;

  if (E > 180) E -= 360;
  if (E < -180) E += 360;

  return E * 4.0;
}

/**
 * 分钟转换为时分秒格式
 */
function minutesToHourMinute(totalMinutes) {
  let minutes = totalMinutes;
  while (minutes < 0) minutes += 24 * 60;
  while (minutes >= 24 * 60) minutes -= 24 * 60;

  const hour = Math.floor(minutes / 60);
  const minute = Math.floor(minutes % 60);
  const second = (minutes % 1) * 60;

  return { hour, minute, second };
}

/**
 * 计算真太阳时
 * @param {Object} params - 参数对象
 * @param {Object} params.dateTime - 日期时间 {year, month, day, hour, minute, second}
 * @param {number} params.longitude - 经度 (东经为正)
 * @param {number} params.latitude - 纬度 (北纬为正)
 * @returns {Object} 计算结果
 */
export function getSolarTime({ dateTime, longitude, latitude }) {
  try {
    const { year, month, day, hour, minute, second = 0 } = dateTime;

    // 计算儒略日
    const JD = calculateJulianDay(year, month, day, hour, minute, second);

    // 计算儒略世纪数
    const T = (JD - J2000) / 36525.0;

    // 计算各天文要素
    const L0 = calculateMeanLongitude(T);
    const M = calculateMeanAnomaly(T);
    const C = calculateEquationOfCenter(M, T);
    const lambda = calculateTrueLongitude(L0, C);
    const eps = calculateObliquity(T);
    const alpha = calculateRightAscension(lambda, eps);
    const E = calculateEquationOfTime(L0, alpha);

    // 计算地方时修正 (相对于标准时区的经度修正)
    const standardLongitude = 120.0; // 中国标准时间基准经度
    const longitudeCorrection = (longitude - standardLongitude) * 4.0;

    // 计算真太阳时
    const totalCorrection = E + longitudeCorrection;
    const meanSolarMinutes = hour * 60 + minute + second / 60.0;
    const trueSolarMinutes = meanSolarMinutes + totalCorrection;

    const trueSolarTime = minutesToHourMinute(trueSolarMinutes);

    return {
      success: true,
      data: {
        trueSolarTime: {
          hour: trueSolarTime.hour,
          minute: trueSolarTime.minute,
          second: Math.round(trueSolarTime.second)
        },
        corrections: {
          equationOfTime: E,
          longitudeCorrection,
          totalCorrection
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * 计算时辰索引
 * @param {number} hour - 小时
 * @param {number} minute - 分钟
 * @returns {number} 时辰索引 (0-11对应子-亥时)
 */
export function getTimeIndex(hour, minute) {
  const totalMinutes = hour * 60 + minute;

  if (totalMinutes >= 23 * 60 || totalMinutes < 1 * 60) return 0;  // 子时
  else if (totalMinutes >= 1 * 60 && totalMinutes < 3 * 60) return 1;   // 丑时
  else if (totalMinutes >= 3 * 60 && totalMinutes < 5 * 60) return 2;   // 寅时
  else if (totalMinutes >= 5 * 60 && totalMinutes < 7 * 60) return 3;   // 卯时
  else if (totalMinutes >= 7 * 60 && totalMinutes < 9 * 60) return 4;   // 辰时
  else if (totalMinutes >= 9 * 60 && totalMinutes < 11 * 60) return 5;  // 巳时
  else if (totalMinutes >= 11 * 60 && totalMinutes < 13 * 60) return 6; // 午时
  else if (totalMinutes >= 13 * 60 && totalMinutes < 15 * 60) return 7; // 未时
  else if (totalMinutes >= 15 * 60 && totalMinutes < 17 * 60) return 8; // 申时
  else if (totalMinutes >= 17 * 60 && totalMinutes < 19 * 60) return 9; // 酉时
  else if (totalMinutes >= 19 * 60 && totalMinutes < 21 * 60) return 10; // 戌时
  else return 11; // 亥时
}
