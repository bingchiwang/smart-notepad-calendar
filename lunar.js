/**
 * 完整萬年曆與農曆轉換核心 (1900-2100)
 * 包含：陽曆轉農曆、農曆閏月判定、二十四節氣、傳統農曆節日、國定民俗節日
 */

const LunarCalendar = (function () {
  // 1900年至2100年農曆數據編碼
  // 16進位制，共5位。第1-4位為12個月的大(30天)小(29天)月，第5位為閏月月份
  const lunarInfo = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
    0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06aa0, 0x1a6c4, 0x0aae0,
    0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
    0x0d520
  ];

  // 24節氣編碼
  const solarTermInfo = [
    0, 21208, 42467, 63836, 85337, 107014, 128867, 150921, 173149, 195551, 218072, 240693,
    263386, 286090, 308773, 331410, 353969, 376429, 398767, 420977, 443038, 464933, 486641, 508142
  ];

  const solarTermNames = [
    '小寒', '大寒', '立春', '雨水', '驚蟄', '春分',
    '清明', '穀雨', '立夏', '小滿', '芒種', '夏至',
    '小暑', '大暑', '立秋', '處暑', '白露', '秋分',
    '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
  ];

  const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const zodiacAnimals = ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬'];

  const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '臘月'];
  const lunarDays = [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
  ];

  // 農曆傳統節日
  const lunarHolidays = {
    '1-1': '春節',
    '1-15': '元宵節',
    '2-2': '龍抬頭',
    '3-3': '上巳節',
    '5-5': '端午節',
    '7-7': '七夕節',
    '7-15': '中元節',
    '8-15': '中秋節',
    '9-9': '重陽節',
    '10-15': '下元節',
    '12-8': '臘八節',
    '12-23': '小年'
  };

  // 陽曆公曆常見節日
  const solarHolidays = {
    '1-1': '元旦',
    '2-14': '情人節',
    '2-28': '和平紀念日',
    '3-8': '婦女節',
    '3-12': '植樹節',
    '4-4': '兒童節',
    '5-1': '勞動節',
    '8-8': '父親節',
    '9-3': '軍人節',
    '9-28': '教師節',
    '10-10': '國慶日',
    '10-31': '萬聖夜',
    '11-1': '萬聖節',
    '12-24': '平安夜',
    '12-25': '聖誕節',
    '12-31': '跨年夜'
  };

  // 輔助函式：計算某農曆年的總天數
  function getLunarYearDays(y) {
    let sum = 348;
    for (let i = 0x8000; i > 0x8; i >>= 1) {
      sum += (lunarInfo[y - 1900] & i) ? 1 : 0;
    }
    return sum + getLeapDays(y);
  }

  // 輔助函式：取得某農曆年的閏月月份（0表示無閏月）
  function getLeapMonth(y) {
    return lunarInfo[y - 1900] & 0xf;
  }

  // 輔助函式：取得某農曆年閏月的天數
  function getLeapDays(y) {
    if (getLeapMonth(y)) {
      return (lunarInfo[y - 1900] & 0x10000) ? 30 : 29;
    }
    return 0;
  }

  // 輔助函式：取得某農曆年某月份的天數
  function getLunarMonthDays(y, m) {
    return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
  }

  // 輔助函式：計算節氣
  function getSolarTerm(y, n) {
    const offDate = new Date((31556925974.7 * (y - 1900) + solarTermInfo[n] * 60000) + Date.UTC(1900, 0, 6, 2, 5));
    return {
      month: offDate.getUTCMonth() + 1,
      day: offDate.getUTCDate(),
      name: solarTermNames[n]
    };
  }

  // 主要核心：陽曆轉農曆
  function getLunar(year, month, day) {
    if (year < 1900 || year > 2100) {
      return {
        year, month, day,
        lunarYear: year, lunarMonth: month, lunarDay: day,
        lunarDayStr: '---', lunarMonthStr: '',
        text: '---', holiday: ''
      };
    }

    const baseDate = new Date(1900, 0, 31);
    const objDate = new Date(year, month - 1, day);
    let offset = Math.round((objDate - baseDate) / 86400000);

    let iYear, daysOfYear = 0;
    for (iYear = 1900; iYear < 2101 && offset > 0; iYear++) {
      daysOfYear = getLunarYearDays(iYear);
      offset -= daysOfYear;
    }
    if (offset < 0) {
      offset += daysOfYear;
      iYear--;
    }

    const lYear = iYear;
    const leap = getLeapMonth(iYear);
    let isLeap = false;
    let lMonth = 1;
    let daysOfMonth = 0;

    for (let i = 1; i < 13 && offset > 0; i++) {
      if (leap > 0 && i === (leap + 1) && !isLeap) {
        --i;
        isLeap = true;
        daysOfMonth = getLeapDays(lYear);
      } else {
        daysOfMonth = getLunarMonthDays(lYear, i);
      }

      if (isLeap && i === (leap + 1)) isLeap = false;
      offset -= daysOfMonth;
      if (!isLeap) lMonth++;
    }

    if (offset === 0 && leap > 0 && lMonth === leap + 1) {
      if (isLeap) {
        isLeap = false;
      } else {
        isLeap = true;
        --lMonth;
      }
    }

    if (offset < 0) {
      offset += daysOfMonth;
      --lMonth;
    }

    const lDay = offset + 1;

    // 天干地支與生肖
    const ganIndex = (lYear - 4) % 10;
    const zhiIndex = (lYear - 4) % 12;
    const ganzhi = heavenlyStems[ganIndex] + earthlyBranches[zhiIndex];
    const zodiac = zodiacAnimals[zhiIndex];

    const monthStr = (isLeap ? '閏' : '') + lunarMonths[lMonth - 1];
    const dayStr = lunarDays[lDay - 1];

    // 判斷節氣
    let solarTerm = '';
    const st1 = getSolarTerm(year, (month - 1) * 2);
    const st2 = getSolarTerm(year, (month - 1) * 2 + 1);
    if (st1.day === day) solarTerm = st1.name;
    if (st2.day === day) solarTerm = st2.name;

    // 判斷除夕：臘月最後一天
    let isChuXi = false;
    if (lMonth === 12) {
      const monthTotal = getLunarMonthDays(lYear, 12);
      if (lDay === monthTotal) {
        isChuXi = true;
      }
    }

    // 判斷節日優先級：除夕 > 傳統節日 > 節氣 > 公曆節日 > 初一/普通日
    let holiday = '';
    const lunarKey = `${lMonth}-${lDay}`;
    const solarKey = `${month}-${day}`;

    if (isChuXi) {
      holiday = '除夕';
    } else if (!isLeap && lunarHolidays[lunarKey]) {
      holiday = lunarHolidays[lunarKey];
    } else if (solarTerm) {
      holiday = solarTerm;
    } else if (solarHolidays[solarKey]) {
      holiday = solarHolidays[solarKey];
    }

    // 在月曆方格內顯示的精簡文字：
    // 若有節日/節氣，顯示節日；若為初一，顯示月份名稱（例如「九月」或「閏九月」）；其餘顯示農曆日（例如「初四」）
    let displayText = '';
    if (holiday) {
      displayText = holiday;
    } else if (lDay === 1) {
      displayText = monthStr;
    } else {
      displayText = dayStr;
    }

    return {
      year,
      month,
      day,
      lunarYear: lYear,
      lunarMonth: lMonth,
      lunarDay: lDay,
      isLeap,
      ganzhiYear: ganzhi,
      zodiac,
      lunarMonthStr: monthStr,
      lunarDayStr: dayStr,
      fullLunarStr: `${ganzhi}年 ${monthStr}${dayStr}`,
      solarTerm,
      holiday,
      displayText,
      isFestivalOrTerm: Boolean(holiday)
    };
  }

  return {
    getLunar,
    solarTermNames,
    lunarHolidays,
    solarHolidays
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LunarCalendar;
}
