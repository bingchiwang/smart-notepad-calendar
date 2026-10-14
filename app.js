/**
 * 智曆記事本 (Smart Calendar & Notepad) 核心應用程式邏輯
 */

(function () {
  'use strict';

  // 儲存金鑰
  const STORAGE_KEY = 'smart_notepad_events_v2';
  const THEME_KEY = 'smart_notepad_theme';
  const SIM_DATE_KEY = 'smart_notepad_sim_date';

  // 預設調色盤
  const PRESET_COLORS = [
    { name: '經典藍', value: '#3b82f6' },
    { name: '薄荷綠', value: '#10b981' },
    { name: '活力橘', value: '#f59e0b' },
    { name: '珊瑚紅', value: '#ef4444' },
    { name: '薰衣草紫', value: '#8b5cf6' },
    { name: '櫻花粉', value: '#ec4899' },
    { name: '蒂芙藍', value: '#06b6d4' },
    { name: '石墨灰', value: '#64748b' }
  ];

  // 全域狀態
  let state = {
    events: [],
    currentYear: 2026,
    currentMonth: 10, // 1 ~ 12
    selectedDate: '2026-10-13',
    referenceDate: '2026-10-13', // 基準日/模擬今日 (用於計算「到期日前一天」警示)
    activeTab: 'todo', // 'todo' | 'reminder' | 'all'
    todoFilter: 'all', // 'all' | 'pending' | 'warning' | 'today' | 'overdue' | 'completed'
    reminderFilter: 'all', // 'all' | 'future' | 'today' | 'past'
    searchQuery: '',
    editingEventId: null,
    selectedColor: '#3b82f6',
    modalType: 'todo' // 'todo' | 'reminder'
  };

  // DOM 元件快取
  const elements = {
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    simDateInput: document.getElementById('simDateInput'),
    resetSimDateBtn: document.getElementById('resetSimDateBtn'),
    todayLunarBadge: document.getElementById('todayLunarBadge'),
    
    // 月曆 DOM
    calMonthSelect: document.getElementById('calMonthSelect'),
    calYearSelect: document.getElementById('calYearSelect'),
    calPrevBtn: document.getElementById('calPrevBtn'),
    calNextBtn: document.getElementById('calNextBtn'),
    calTodayBtn: document.getElementById('calTodayBtn'),
    calMainTitle: document.getElementById('calendarMainTitle'),
    calLunarSummary: document.getElementById('calendarLunarSummary'),
    calendarGrid: document.getElementById('calendarGrid'),
    
    // 記事本 DOM
    tabTodo: document.getElementById('tabTodo'),
    tabReminder: document.getElementById('tabReminder'),
    tabAll: document.getElementById('tabAll'),
    todoBadgeCount: document.getElementById('todoBadgeCount'),
    reminderBadgeCount: document.getElementById('reminderBadgeCount'),
    searchInput: document.getElementById('searchInput'),
    filterChipsContainer: document.getElementById('filterChipsContainer'),
    eventsListContainer: document.getElementById('eventsListContainer'),
    
    // 按鈕
    openAddModalBtn: document.getElementById('openAddModalBtn'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    importDataInput: document.getElementById('importDataInput'),
    resetDemoBtn: document.getElementById('resetDemoBtn'),
    
    // 事項表單 Modal
    eventModal: document.getElementById('eventModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    modalCancelBtn: document.getElementById('modalCancelBtn'),
    eventForm: document.getElementById('eventForm'),
    typeTodoCard: document.getElementById('typeTodoCard'),
    typeReminderCard: document.getElementById('typeReminderCard'),
    formTitle: document.getElementById('formTitle'),
    formDesc: document.getElementById('formDesc'),
    formDate: document.getElementById('formDate'),
    formTime: document.getElementById('formTime'),
    dateLabelText: document.getElementById('dateLabelText'),
    colorPalette: document.getElementById('colorPalette'),
    customColorInput: document.getElementById('customColorInput'),
    deleteEventBtn: document.getElementById('deleteEventBtn'),
    submitEventBtn: document.getElementById('submitEventBtn'),
    
    // 單日檢視 Modal
    dayViewModal: document.getElementById('dayViewModal'),
    dayViewTitle: document.getElementById('dayViewTitle'),
    dayViewLunar: document.getElementById('dayViewLunar'),
    dayViewEventsList: document.getElementById('dayViewEventsList'),
    dayViewCloseBtn: document.getElementById('dayViewCloseBtn'),
    dayViewAddTodoBtn: document.getElementById('dayViewAddTodoBtn'),
    dayViewAddReminderBtn: document.getElementById('dayViewAddReminderBtn'),
    
    // 跨裝置雲端同步 DOM
    openSyncModalBtn: document.getElementById('openSyncModalBtn'),
    syncStatusDot: document.getElementById('syncStatusDot'),
    syncBtnText: document.getElementById('syncBtnText'),
    syncModal: document.getElementById('syncModal'),
    syncModalCloseBtn: document.getElementById('syncModalCloseBtn'),
    syncModalDoneBtn: document.getElementById('syncModalDoneBtn'),
    modalSyncDot: document.getElementById('modalSyncDot'),
    modalSyncStatusText: document.getElementById('modalSyncStatusText'),
    syncLastTimeText: document.getElementById('syncLastTimeText'),
    syncKeyInput: document.getElementById('syncKeyInput'),
    randomSyncKeyBtn: document.getElementById('randomSyncKeyBtn'),
    connectSyncBtn: document.getElementById('connectSyncBtn'),
    disconnectSyncBtn: document.getElementById('disconnectSyncBtn'),
    autoSyncCheckbox: document.getElementById('autoSyncCheckbox'),
    showQrBtn: document.getElementById('showQrBtn'),
    copySyncLinkBtn: document.getElementById('copySyncLinkBtn'),
    qrCodeContainer: document.getElementById('qrCodeContainer'),
    qrCodeImageWrapper: document.getElementById('qrCodeImageWrapper'),
    manualPushBtn: document.getElementById('manualPushBtn'),
    manualPullBtn: document.getElementById('manualPullBtn'),
    customApiKeyInput: document.getElementById('customApiKeyInput'),
    customProjectIdInput: document.getElementById('customProjectIdInput'),
    customAppIdInput: document.getElementById('customAppIdInput'),
    saveCustomFirebaseBtn: document.getElementById('saveCustomFirebaseBtn'),

    // Toast 提示
    toastContainer: document.getElementById('toastContainer')
  };

  /* ==========================================================================
     初始化與資料持久化
     ========================================================================== */

  function init() {
    initTheme();
    initReferenceDate();
    loadEvents();
    initYearMonthSelectors();
    initColorPalette();
    bindEvents();
    renderAll();
    if (typeof SyncManager !== 'undefined') {
      SyncManager.init();
    }
  }

  // 初始化主題
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function updateThemeIcon(theme) {
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.textContent = theme === 'dark' ? '☀️ 淺色' : '🌙 深色';
    }
  }

  // 初始化基準日期（今天）
  function initReferenceDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const realToday = `${y}-${m}-${d}`;

    const savedSimDate = localStorage.getItem(SIM_DATE_KEY) || realToday;
    state.referenceDate = savedSimDate;
    state.selectedDate = savedSimDate;
    
    const parts = savedSimDate.split('-');
    state.currentYear = parseInt(parts[0], 10);
    state.currentMonth = parseInt(parts[1], 10);

    if (elements.simDateInput) {
      elements.simDateInput.value = savedSimDate;
    }
  }

  // 載入事件資料
  function loadEvents() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        state.events = JSON.parse(saved);
      } else {
        state.events = createDefaultDemoEvents();
        saveEvents();
      }
    } catch (e) {
      console.error('載入資料錯誤:', e);
      state.events = createDefaultDemoEvents();
    }
  }

  function saveEvents(skipSync = false) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.events));
      if (!skipSync && typeof SyncManager !== 'undefined') {
        SyncManager.onLocalChange();
      }
    } catch (e) {
      console.error('儲存資料失敗:', e);
    }
  }

  // 產生示範預設資料（依據基準日，精準展示「到期日前一天特殊邊框警示」）
  function createDefaultDemoEvents() {
    const ref = state.referenceDate;
    const refD = new Date(ref + 'T00:00:00');
    
    function addDays(d, count) {
      const target = new Date(d);
      target.setDate(target.getDate() + count);
      const y = target.getFullYear();
      const m = String(target.getMonth() + 1).padStart(2, '0');
      const day = String(target.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }

    const todayStr = ref;
    const tomorrowStr = addDays(refD, 1); // 剛好是到期日前一天！
    const day3Str = addDays(refD, 3);
    const day6Str = addDays(refD, 6);
    const yesterdayStr = addDays(refD, -1);

    return [
      {
        id: 'demo-1',
        type: 'todo',
        title: '🎯 提交第三季專案成果報告 (明日到期示範)',
        description: '需彙整團隊進度與預算支出分析，明天下午5點前送審。剛好處於【到期日前一天】，觸發特殊動態邊框警示！',
        date: tomorrowStr,
        time: '17:00',
        color: '#f59e0b',
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-2',
        type: 'reminder',
        title: '🔔 提醒：每週二跨部門線上研討會',
        description: '會議連結已寄發至信箱，記得準備討論議題與會議簡報。',
        date: todayStr,
        time: '14:30',
        color: '#3b82f6',
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-3',
        type: 'todo',
        title: '📝 檢閱系統自動化排程與伺服器日誌',
        description: '確認備份腳本正常執行並釋放舊磁碟空間。',
        date: todayStr,
        time: '18:00',
        color: '#0284c7',
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-4',
        type: 'reminder',
        title: '🎂 提醒：購買母親生日蛋糕與卡片',
        description: '提前向預約訂購草莓生乳酪蛋糕，確認取件時間。',
        date: day3Str,
        time: '11:00',
        color: '#ec4899',
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-5',
        type: 'todo',
        title: '💻 執行產品功能版本發布與驗證',
        description: '完成上線前迴歸測試，通知相關業務夥伴。',
        date: day6Str,
        time: '16:00',
        color: '#10b981',
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-6',
        type: 'todo',
        title: '📦 整理前週會議紀錄與行動清單',
        description: '已完成並歸檔至共用雲端空間。',
        date: yesterdayStr,
        time: '10:00',
        color: '#64748b',
        completed: true,
        createdAt: new Date().toISOString()
      }
    ];
  }

  // 初始化年月選單
  function initYearMonthSelectors() {
    if (!elements.calYearSelect || !elements.calMonthSelect) return;
    elements.calYearSelect.innerHTML = '';
    for (let y = 1970; y <= 2050; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = `${y} 年`;
      elements.calYearSelect.appendChild(opt);
    }
    elements.calMonthSelect.innerHTML = '';
    for (let m = 1; m <= 12; m++) {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = `${m} 月`;
      elements.calMonthSelect.appendChild(opt);
    }
  }

  // 初始化調色盤
  function initColorPalette() {
    if (!elements.colorPalette) return;
    elements.colorPalette.innerHTML = '';
    PRESET_COLORS.forEach(c => {
      const swatch = document.createElement('div');
      swatch.className = `color-swatch ${c.value === state.selectedColor ? 'active' : ''}`;
      swatch.style.backgroundColor = c.value;
      swatch.title = c.name;
      swatch.dataset.color = c.value;
      swatch.addEventListener('click', () => {
        selectColor(c.value);
      });
      elements.colorPalette.appendChild(swatch);
    });
  }

  function selectColor(hex) {
    state.selectedColor = hex;
    if (elements.customColorInput) {
      elements.customColorInput.value = hex;
    }
    const swatches = elements.colorPalette.querySelectorAll('.color-swatch');
    swatches.forEach(s => {
      s.classList.toggle('active', s.dataset.color.toLowerCase() === hex.toLowerCase());
    });
  }

  /* ==========================================================================
     核心判斷邏輯：待做事件到期日前一天的特殊邊框警示
     ========================================================================== */

  /**
   * 判定事件是否處於「到期日前一天」：
   * 1. 必須為待做事件 (type === 'todo')
   * 2. 尚未完成 (!completed)
   * 3. 基準日 (今天) 距離 到期日 (event.date) 剛好剩餘 1 天！
   */
  function isDayBeforeDue(event) {
    if (!event || event.type !== 'todo' || event.completed || !event.date) {
      return false;
    }
    const refDate = new Date(state.referenceDate + 'T00:00:00');
    const dueDate = new Date(event.date + 'T00:00:00');
    const diffTime = dueDate.getTime() - refDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  }

  /**
   * 計算距離基準日的狀態 ('overdue' | 'today' | 'warning' | 'future' | 'completed')
   */
  function getEventDueStatus(event) {
    if (event.completed) return 'completed';
    if (!event.date) return 'none';
    const refDate = new Date(state.referenceDate + 'T00:00:00');
    const targetDate = new Date(event.date + 'T00:00:00');
    const diffTime = targetDate.getTime() - refDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'warning'; // 到期日前一天！
    return 'future';
  }

  function offsetDateStr(baseDateStr, offsetDays) {
    const d = new Date(baseDateStr + 'T00:00:00');
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /* ==========================================================================
     畫面渲染核心 (Render)
     ========================================================================== */

  function renderAll() {
    renderHeaderInfo();
    renderCalendar();
    renderFilterChips();
    renderEventsList();
    updateBadgeCounts();
  }

  // 頂部當前日期與農曆資訊
  function renderHeaderInfo() {
    const parts = state.referenceDate.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    
    if (typeof LunarCalendar !== 'undefined') {
      const lunar = LunarCalendar.getLunar(y, m, d);
      const weekNames = ['日', '一', '二', '三', '四', '五', '六'];
      const dateObj = new Date(y, m - 1, d);
      const weekDay = weekNames[dateObj.getDay()];
      
      let badgeHtml = `📅 <strong>${y}年${m}月${d}日 (週${weekDay})</strong> · 農曆 ${lunar.fullLunarStr}`;
      if (lunar.holiday) {
        badgeHtml += ` <span style="background:#dc2626;color:#fff;padding:1px 6px;border-radius:10px;font-size:0.75rem;margin-left:4px;">${lunar.holiday}</span>`;
      }
      if (elements.todayLunarBadge) {
        elements.todayLunarBadge.innerHTML = badgeHtml;
      }
    }
  }

  // 渲染月曆 (包含農曆與事件)
  function renderCalendar() {
    if (!elements.calendarGrid) return;
    
    const year = state.currentYear;
    const month = state.currentMonth;

    if (elements.calYearSelect) elements.calYearSelect.value = year;
    if (elements.calMonthSelect) elements.calMonthSelect.value = month;

    if (elements.calMainTitle) {
      elements.calMainTitle.textContent = `${year} 年 ${month} 月`;
    }

    // 農曆月份概述
    if (elements.calLunarSummary && typeof LunarCalendar !== 'undefined') {
      const midLunar = LunarCalendar.getLunar(year, month, 15);
      elements.calLunarSummary.textContent = `【${midLunar.ganzhiYear} ${midLunar.zodiac}年 · ${midLunar.lunarMonthStr}】`;
    }

    // 計算當月第 1 天的星期 (0=日, 1=一, ...)
    const firstDayObj = new Date(year, month - 1, 1);
    const startingDayOfWeek = firstDayObj.getDay();

    // 當月總天數
    const daysInMonth = new Date(year, month, 0).getDate();

    // 上個月總天數
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

    elements.calendarGrid.innerHTML = '';

    // 1. 填補上個月的尾端格子
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      let prevM = month - 1;
      let prevY = year;
      if (prevM === 0) {
        prevM = 12;
        prevY--;
      }
      const cell = createCalendarDayCell(prevY, prevM, prevDay, true);
      elements.calendarGrid.appendChild(cell);
    }

    // 2. 渲染當月所有天數
    for (let day = 1; day <= daysInMonth; day++) {
      const cell = createCalendarDayCell(year, month, day, false);
      elements.calendarGrid.appendChild(cell);
    }

    // 3. 填補下個月開頭格子，使其湊滿 35 或 42 格 (保證網格完整)
    const totalRendered = startingDayOfWeek + daysInMonth;
    const remainingCells = (totalRendered % 7 === 0) ? 0 : 7 - (totalRendered % 7);
    for (let nextDay = 1; nextDay <= remainingCells; nextDay++) {
      let nextM = month + 1;
      let nextY = year;
      if (nextM === 13) {
        nextM = 1;
        nextY++;
      }
      const cell = createCalendarDayCell(nextY, nextM, nextDay, true);
      elements.calendarGrid.appendChild(cell);
    }
  }

  // 建立單個月曆方格
  function createCalendarDayCell(year, month, day, isOtherMonth) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell';
    if (isOtherMonth) cell.classList.add('other-month');
    
    // 判定是否為基準日（今天）
    if (dateStr === state.referenceDate) {
      cell.classList.add('is-today');
    }
    // 判定是否為目前選取的日期
    if (dateStr === state.selectedDate) {
      cell.classList.add('is-selected');
    }

    // 取得農曆資料
    let lunarInfo = null;
    if (typeof LunarCalendar !== 'undefined') {
      lunarInfo = LunarCalendar.getLunar(year, month, day);
    }

    // 頂部日曆資訊
    const header = document.createElement('div');
    header.className = 'day-header';

    const solarSpan = document.createElement('span');
    solarSpan.className = 'solar-day-number';
    solarSpan.textContent = day;

    const lunarSpan = document.createElement('span');
    lunarSpan.className = 'lunar-day-text';
    if (lunarInfo) {
      lunarSpan.textContent = lunarInfo.displayText;
      if (lunarInfo.isFestivalOrTerm) {
        lunarSpan.classList.add('is-holiday');
        lunarSpan.title = lunarInfo.holiday || lunarInfo.solarTerm;
      }
    }
    header.appendChild(solarSpan);
    header.appendChild(lunarSpan);
    cell.appendChild(header);

    // 事件容器
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events-container';

    // 1. 屬於此日期的排程事件 (到期日或提醒日)
    const dayEvents = state.events.filter(e => e.date === dateStr);

    // 2. 於此日期處於「到期日前一天」的待辦事件 (提前警示)
    const tomorrowStr = offsetDateStr(dateStr, 1);
    const preAlertEvents = state.events.filter(e => e.type === 'todo' && !e.completed && e.date === tomorrowStr);

    // 合併於該格顯示的項目
    const allCellItems = [];

    // 若此日是某待辦到期日前一天，先放特殊警示項目
    preAlertEvents.forEach(evt => {
      allCellItems.push({
        event: evt,
        isPreAlert: true
      });
    });

    // 放入當日本身安排的事件
    dayEvents.forEach(evt => {
      allCellItems.push({
        event: evt,
        isPreAlert: false
      });
    });

    // 最多顯示 3 個，超過顯示 "+X 更多"
    const displayItems = allCellItems.slice(0, 3);
    displayItems.forEach(item => {
      const evt = item.event;
      const pill = document.createElement('div');
      pill.className = 'cal-event-pill';
      if (evt.completed) pill.classList.add('is-completed');

      // 核心需求：待做事件到期日前一天加上「特殊邊框警示」
      const isWarning = item.isPreAlert || isDayBeforeDue(evt);
      if (isWarning) {
        pill.classList.add('special-warning-alert');
        pill.title = item.isPreAlert 
          ? `【到期日前一天警示】明日即將到期：${evt.title}`
          : `【特殊邊框警示】此待做事件明日即將到期！`;
      }

      // 套用使用者自行選擇的顏色
      applyEventColorToPill(pill, evt.color, isWarning);

      // 圖示與標題
      if (item.isPreAlert) {
        pill.innerHTML = `<span>⚠️</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">明日到期: ${escapeHtml(evt.title)}</span>`;
      } else {
        const icon = evt.type === 'todo' ? (evt.completed ? '✅' : '📋') : '🔔';
        pill.innerHTML = `<span>${icon}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(evt.title)}</span>`;
      }

      // 點擊事件膠囊開啟編輯
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(evt);
      });

      eventsContainer.appendChild(pill);
    });

    if (allCellItems.length > 3) {
      const moreIndicator = document.createElement('div');
      moreIndicator.className = 'more-events-indicator';
      moreIndicator.textContent = `+ 還有 ${allCellItems.length - 3} 項...`;
      eventsContainer.appendChild(moreIndicator);
    }

    cell.appendChild(eventsContainer);

    // 點擊日期格子開啟單日檢視
    cell.addEventListener('click', () => {
      state.selectedDate = dateStr;
      renderCalendar();
      openDayViewModal(dateStr, lunarInfo, dayEvents);
    });

    return cell;
  }

  // 套用膠囊色彩與對比度
  function applyEventColorToPill(pill, hexColor, isWarning) {
    const bg = hexColor || '#3b82f6';
    const isDark = isColorDark(bg);
    pill.style.backgroundColor = bg;
    pill.style.color = isDark ? '#ffffff' : '#0f172a';
    
    if (!isWarning) {
      pill.style.borderColor = 'rgba(0,0,0,0.1)';
    }
  }

  // 判斷顏色深淺以決定文字是白是黑
  function isColorDark(hex) {
    if (!hex || hex[0] !== '#') return true;
    let c = hex.substring(1);
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq < 145;
  }

  // 渲染過濾晶片標籤 (Chips)
  function renderFilterChips() {
    if (!elements.filterChipsContainer) return;
    elements.filterChipsContainer.innerHTML = '';

    if (state.activeTab === 'todo') {
      const chips = [
        { id: 'all', label: '全部待辦' },
        { id: 'pending', label: '⏳ 進行中' },
        { id: 'warning', label: '⚠️ 明日到期警示', isWarning: true },
        { id: 'today', label: '📅 今日到期' },
        { id: 'overdue', label: '🚨 已逾期' },
        { id: 'completed', label: '✅ 已完成' }
      ];

      chips.forEach(c => {
        const btn = document.createElement('button');
        btn.className = `filter-chip ${c.isWarning ? 'chip-warning' : ''} ${state.todoFilter === c.id ? 'active' : ''}`;
        btn.textContent = c.label;
        btn.addEventListener('click', () => {
          state.todoFilter = c.id;
          renderAll();
        });
        elements.filterChipsContainer.appendChild(btn);
      });
    } else if (state.activeTab === 'reminder') {
      const chips = [
        { id: 'all', label: '全部提醒' },
        { id: 'today', label: '🔔 今日提醒' },
        { id: 'future', label: '📅 即將到來' },
        { id: 'past', label: '📁 過去提醒' }
      ];

      chips.forEach(c => {
        const btn = document.createElement('button');
        btn.className = `filter-chip ${state.reminderFilter === c.id ? 'active' : ''}`;
        btn.textContent = c.label;
        btn.addEventListener('click', () => {
          state.reminderFilter = c.id;
          renderAll();
        });
        elements.filterChipsContainer.appendChild(btn);
      });
    } else {
      // 全部事項
      const chips = [
        { id: 'all', label: '全部事項' },
        { id: 'warning', label: '⚠️ 明日到期警示', isWarning: true }
      ];
      chips.forEach(c => {
        const btn = document.createElement('button');
        btn.className = `filter-chip ${c.isWarning ? 'chip-warning' : ''} ${state.todoFilter === c.id ? 'active' : ''}`;
        btn.textContent = c.label;
        btn.addEventListener('click', () => {
          state.todoFilter = c.id;
          renderAll();
        });
        elements.filterChipsContainer.appendChild(btn);
      });
    }
  }

  // 渲染記事本卡片清單
  function renderEventsList() {
    if (!elements.eventsListContainer) return;
    elements.eventsListContainer.innerHTML = '';

    // 依 Tab 篩選
    let filtered = state.events.filter(e => {
      if (state.activeTab === 'todo') return e.type === 'todo';
      if (state.activeTab === 'reminder') return e.type === 'reminder';
      return true;
    });

    // 依關鍵字搜尋
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        (e.title && e.title.toLowerCase().includes(q)) || 
        (e.description && e.description.toLowerCase().includes(q))
      );
    }

    // 依標籤篩選器
    if (state.activeTab === 'todo' || state.activeTab === 'all') {
      if (state.todoFilter === 'pending') {
        filtered = filtered.filter(e => !e.completed);
      } else if (state.todoFilter === 'warning') {
        filtered = filtered.filter(e => isDayBeforeDue(e));
      } else if (state.todoFilter === 'today') {
        filtered = filtered.filter(e => e.date === state.referenceDate && !e.completed);
      } else if (state.todoFilter === 'overdue') {
        filtered = filtered.filter(e => getEventDueStatus(e) === 'overdue');
      } else if (state.todoFilter === 'completed') {
        filtered = filtered.filter(e => e.completed);
      }
    } else if (state.activeTab === 'reminder') {
      if (state.reminderFilter === 'today') {
        filtered = filtered.filter(e => e.date === state.referenceDate);
      } else if (state.reminderFilter === 'future') {
        filtered = filtered.filter(e => e.date > state.referenceDate);
      } else if (state.reminderFilter === 'past') {
        filtered = filtered.filter(e => e.date < state.referenceDate);
      }
    }

    // 排序：到期日由近到遠，警告優先排前
    filtered.sort((a, b) => {
      const aWarn = isDayBeforeDue(a);
      const bWarn = isDayBeforeDue(b);
      if (aWarn && !bWarn) return -1;
      if (!aWarn && bWarn) return 1;
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (a.date || '').localeCompare(b.date || '');
    });

    if (filtered.length === 0) {
      elements.eventsListContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">目前沒有符合條件的事項</div>
          <p>點擊上方「+ 新增事項」開始規劃您的行程與待辦任務吧！</p>
        </div>
      `;
      return;
    }

    filtered.forEach(evt => {
      const card = createEventCard(evt);
      elements.eventsListContainer.appendChild(card);
    });
  }

  // 建立事項卡片元件
  function createEventCard(evt) {
    const card = document.createElement('div');
    card.className = 'event-card';
    if (evt.completed) card.classList.add('is-completed');

    // 核心要求：待做事件到期日前一天的事件加上「特殊邊框警示」
    const isWarning = isDayBeforeDue(evt);
    if (isWarning) {
      card.classList.add('special-warning-alert');
    }

    // 彩色側邊識別條 (使用者自行選顏色)
    const colorBar = document.createElement('div');
    colorBar.className = 'event-color-bar';
    colorBar.style.backgroundColor = evt.color || '#3b82f6';
    card.appendChild(colorBar);

    // 左側圖示/核取方塊
    if (evt.type === 'todo') {
      const chkWrap = document.createElement('div');
      chkWrap.className = 'event-checkbox-wrap';
      const chk = document.createElement('div');
      chk.className = `custom-checkbox ${evt.completed ? 'checked' : ''}`;
      chk.innerHTML = evt.completed ? '✓' : '';
      chk.title = evt.completed ? '標記為未完成' : '標記為已完成';
      chk.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleEventCompleted(evt.id);
      });
      chkWrap.appendChild(chk);
      card.appendChild(chkWrap);
    } else {
      const remIcon = document.createElement('div');
      remIcon.className = 'event-reminder-icon';
      remIcon.style.color = evt.color || '#8b5cf6';
      remIcon.textContent = '🔔';
      card.appendChild(remIcon);
    }

    // 內文主體
    const body = document.createElement('div');
    body.className = 'event-body';

    // 標題與徽章列
    const titleRow = document.createElement('div');
    titleRow.className = 'event-title-row';

    const titleEl = document.createElement('div');
    titleEl.className = 'event-title';
    titleEl.textContent = evt.title;
    titleRow.appendChild(titleEl);

    // 狀態徽章
    const badgeGroup = document.createElement('div');
    badgeGroup.className = 'event-badge-group';

    // 到期日前一天特殊警示徽章
    if (isWarning) {
      const warnBadge = document.createElement('span');
      warnBadge.className = 'alert-warning-badge';
      warnBadge.innerHTML = '⚠️ 明日到期！(特殊警示)';
      badgeGroup.appendChild(warnBadge);
    } else if (evt.type === 'todo') {
      const dueStatus = getEventDueStatus(evt);
      if (dueStatus === 'today') {
        const todayBadge = document.createElement('span');
        todayBadge.className = 'badge-today';
        todayBadge.textContent = '📅 今日到期';
        badgeGroup.appendChild(todayBadge);
      } else if (dueStatus === 'overdue') {
        const overdueBadge = document.createElement('span');
        overdueBadge.className = 'badge-overdue';
        overdueBadge.textContent = '🚨 已逾期';
        badgeGroup.appendChild(overdueBadge);
      }
    }

    titleRow.appendChild(badgeGroup);
    body.appendChild(titleRow);

    // 備註內容
    if (evt.description) {
      const descEl = document.createElement('div');
      descEl.className = 'event-description';
      descEl.textContent = evt.description;
      body.appendChild(descEl);
    }

    // 底部資訊與按鈕
    const footer = document.createElement('div');
    footer.className = 'event-footer-info';

    // 日期標示
    const dateInd = document.createElement('div');
    dateInd.className = 'event-date-indicator';
    const dateLabel = evt.type === 'todo' ? '到期日' : '提醒日';
    const timeText = evt.time ? ` ${evt.time}` : '';
    dateInd.innerHTML = `<span>📅</span><span>${dateLabel}：<strong>${evt.date}${timeText}</strong></span>`;
    footer.appendChild(dateInd);

    // 操作按鈕
    const actions = document.createElement('div');
    actions.className = 'event-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-outline btn-sm';
    editBtn.innerHTML = '✏️ 編輯';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(evt);
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-outline btn-sm';
    delBtn.innerHTML = '🗑️ 刪除';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteEvent(evt.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    footer.appendChild(actions);

    body.appendChild(footer);
    card.appendChild(body);

    return card;
  }

  // 更新標籤計數
  function updateBadgeCounts() {
    const todoCount = state.events.filter(e => e.type === 'todo' && !e.completed).length;
    const reminderCount = state.events.filter(e => e.type === 'reminder').length;
    if (elements.todoBadgeCount) elements.todoBadgeCount.textContent = todoCount;
    if (elements.reminderBadgeCount) elements.reminderBadgeCount.textContent = reminderCount;
  }

  /* ==========================================================================
     互動彈出視窗 (Modal) 管理
     ========================================================================== */

  // 開啟新增視窗
  function openAddModal(type = 'todo', prefillDate = null) {
    state.editingEventId = null;
    state.modalType = type;
    
    if (elements.modalTitle) {
      elements.modalTitle.innerHTML = type === 'todo' ? '➕ 新增待做事件' : '➕ 新增提醒事項';
    }
    if (elements.deleteEventBtn) {
      elements.deleteEventBtn.style.display = 'none';
    }
    if (elements.submitEventBtn) {
      elements.submitEventBtn.textContent = '確定建立';
    }

    setTypeSelector(type);
    
    elements.formTitle.value = '';
    elements.formDesc.value = '';
    elements.formDate.value = prefillDate || state.selectedDate || state.referenceDate;
    elements.formTime.value = '';

    // 預設顏色
    selectColor(type === 'todo' ? '#3b82f6' : '#8b5cf6');

    updateDateLabel(type);
    elements.eventModal.classList.add('active');
    elements.formTitle.focus();
  }

  // 開啟編輯視窗
  function openEditModal(evt) {
    closeDayViewModal();
    state.editingEventId = evt.id;
    state.modalType = evt.type;

    if (elements.modalTitle) {
      elements.modalTitle.innerHTML = evt.type === 'todo' ? '✏️ 編輯待做事件' : '✏️ 編輯提醒事項';
    }
    if (elements.deleteEventBtn) {
      elements.deleteEventBtn.style.display = 'inline-flex';
    }
    if (elements.submitEventBtn) {
      elements.submitEventBtn.textContent = '儲存修改';
    }

    setTypeSelector(evt.type);
    elements.formTitle.value = evt.title;
    elements.formDesc.value = evt.description || '';
    elements.formDate.value = evt.date;
    elements.formTime.value = evt.time || '';

    selectColor(evt.color || '#3b82f6');
    updateDateLabel(evt.type);

    elements.eventModal.classList.add('active');
  }

  function closeEventModal() {
    elements.eventModal.classList.remove('active');
  }

  function setTypeSelector(type) {
    state.modalType = type;
    if (elements.typeTodoCard && elements.typeReminderCard) {
      elements.typeTodoCard.classList.toggle('selected', type === 'todo');
      elements.typeReminderCard.classList.toggle('selected', type === 'reminder');
    }
    updateDateLabel(type);
  }

  function updateDateLabel(type) {
    if (elements.dateLabelText) {
      elements.dateLabelText.textContent = type === 'todo' ? '到期日' : '提醒日期';
    }
  }

  // 開啟單日詳細檢視視窗
  function openDayViewModal(dateStr, lunarInfo, dayEvents) {
    const parts = dateStr.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);

    if (elements.dayViewTitle) {
      elements.dayViewTitle.textContent = `📅 ${y} 年 ${m} 月 ${d} 日 事項一覽`;
    }

    if (elements.dayViewLunar && lunarInfo) {
      elements.dayViewLunar.innerHTML = `農曆：<strong>${lunarInfo.fullLunarStr}</strong> ${lunarInfo.holiday ? `<span style="color:#ef4444;font-weight:bold;">[${lunarInfo.holiday}]</span>` : ''}`;
    }

    if (elements.dayViewEventsList) {
      elements.dayViewEventsList.innerHTML = '';
      
      const tomorrowStr = offsetDateStr(dateStr, 1);
      const preAlerts = state.events.filter(e => e.type === 'todo' && !e.completed && e.date === tomorrowStr);
      const scheduled = state.events.filter(e => e.date === dateStr);

      if (preAlerts.length === 0 && scheduled.length === 0) {
        elements.dayViewEventsList.innerHTML = `
          <div class="empty-state" style="padding: 1.5rem 0;">
            <p style="color:var(--text-muted);">此日尚無任何待做事件、提醒或到期警示</p>
          </div>
        `;
      } else {
        // 若有明日到期之待辦，顯示專屬警示區塊
        if (preAlerts.length > 0) {
          const alertSectionTitle = document.createElement('div');
          alertSectionTitle.style.cssText = 'font-size:0.85rem;font-weight:700;color:#d97706;display:flex;align-items:center;gap:4px;margin-top:4px;';
          alertSectionTitle.innerHTML = '⚠️ 到期日前一天警示（以下事項明日即將到期）：';
          elements.dayViewEventsList.appendChild(alertSectionTitle);

          preAlerts.forEach(evt => {
            const card = createEventCard(evt);
            elements.dayViewEventsList.appendChild(card);
          });
        }

        // 當日排程事件
        if (scheduled.length > 0) {
          if (preAlerts.length > 0) {
            const schedTitle = document.createElement('div');
            schedTitle.style.cssText = 'font-size:0.85rem;font-weight:700;color:var(--text-muted);display:flex;align-items:center;gap:4px;margin-top:10px;';
            schedTitle.innerHTML = '📌 此日安排之事項：';
            elements.dayViewEventsList.appendChild(schedTitle);
          }

          scheduled.forEach(evt => {
            const card = createEventCard(evt);
            elements.dayViewEventsList.appendChild(card);
          });
        }
      }
    }

    elements.dayViewModal.classList.add('active');
  }

  function closeDayViewModal() {
    elements.dayViewModal.classList.remove('active');
  }

  /* ==========================================================================
     資料異動處理 (CRUD)
     ========================================================================== */

  // 儲存或更新事件
  function handleFormSubmit(e) {
    e.preventDefault();
    const title = elements.formTitle.value.trim();
    const desc = elements.formDesc.value.trim();
    const date = elements.formDate.value;
    const time = elements.formTime.value;
    const color = state.selectedColor;
    const type = state.modalType;

    if (!title) {
      showToast('請輸入事項標題！', 'warning');
      elements.formTitle.focus();
      return;
    }
    if (!date) {
      showToast(type === 'todo' ? '請設定到期日！' : '請選擇提醒日期！', 'warning');
      elements.formDate.focus();
      return;
    }

    if (state.editingEventId) {
      // 更新
      const index = state.events.findIndex(x => x.id === state.editingEventId);
      if (index !== -1) {
        state.events[index] = {
          ...state.events[index],
          type,
          title,
          description: desc,
          date,
          time,
          color
        };
        showToast('事項修改成功！', 'success');
      }
    } else {
      // 新增
      const newEvent = {
        id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        type,
        title,
        description: desc,
        date,
        time,
        color,
        completed: false,
        createdAt: new Date().toISOString()
      };
      state.events.push(newEvent);
      showToast(type === 'todo' ? '已成功新增待做事件！' : '已成功新增提醒事項！', 'success');
    }

    saveEvents();
    closeEventModal();
    closeDayViewModal();
    renderAll();
  }

  // 切換待辦完成狀態
  function toggleEventCompleted(id) {
    const evt = state.events.find(x => x.id === id);
    if (evt) {
      evt.completed = !evt.completed;
      saveEvents();
      renderAll();
      showToast(evt.completed ? '已標記為完成！🎉' : '已恢復為進行中', 'success');
    }
  }

  // 刪除事件
  function deleteEvent(id) {
    if (confirm('確定要刪除這筆事項嗎？')) {
      state.events = state.events.filter(x => x.id !== id);
      saveEvents();
      closeEventModal();
      closeDayViewModal();
      renderAll();
      showToast('事項已刪除', 'danger');
    }
  }

  /* ==========================================================================
     事件監聽綁定
     ========================================================================== */

  function bindEvents() {
    // 主題切換
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem(THEME_KEY, nextTheme);
        updateThemeIcon(nextTheme);
      });
    }

    // 模擬基準日期切換 (隨時驗證「到期日前一天」警示邊框)
    if (elements.simDateInput) {
      elements.simDateInput.addEventListener('change', (e) => {
        state.referenceDate = e.target.value;
        localStorage.setItem(SIM_DATE_KEY, e.target.value);
        showToast(`已將基準日更新為 ${e.target.value}`, 'warning');
        renderAll();
      });
    }

    if (elements.resetSimDateBtn) {
      elements.resetSimDateBtn.addEventListener('click', () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const realToday = `${y}-${m}-${d}`;
        state.referenceDate = realToday;
        localStorage.setItem(SIM_DATE_KEY, realToday);
        if (elements.simDateInput) elements.simDateInput.value = realToday;
        showToast('已重設為今日日期', 'success');
        renderAll();
      });
    }

    // 月曆導覽
    if (elements.calPrevBtn) {
      elements.calPrevBtn.addEventListener('click', () => {
        state.currentMonth--;
        if (state.currentMonth < 1) {
          state.currentMonth = 12;
          state.currentYear--;
        }
        renderCalendar();
      });
    }

    if (elements.calNextBtn) {
      elements.calNextBtn.addEventListener('click', () => {
        state.currentMonth++;
        if (state.currentMonth > 12) {
          state.currentMonth = 1;
          state.currentYear++;
        }
        renderCalendar();
      });
    }

    if (elements.calTodayBtn) {
      elements.calTodayBtn.addEventListener('click', () => {
        const parts = state.referenceDate.split('-');
        state.currentYear = parseInt(parts[0], 10);
        state.currentMonth = parseInt(parts[1], 10);
        state.selectedDate = state.referenceDate;
        renderCalendar();
      });
    }

    if (elements.calYearSelect) {
      elements.calYearSelect.addEventListener('change', (e) => {
        state.currentYear = parseInt(e.target.value, 10);
        renderCalendar();
      });
    }

    if (elements.calMonthSelect) {
      elements.calMonthSelect.addEventListener('change', (e) => {
        state.currentMonth = parseInt(e.target.value, 10);
        renderCalendar();
      });
    }

    // 分頁切換 (待辦 vs 提醒 vs 全部)
    if (elements.tabTodo) {
      elements.tabTodo.addEventListener('click', () => {
        state.activeTab = 'todo';
        updateTabActiveUI();
        renderFilterChips();
        renderEventsList();
      });
    }

    if (elements.tabReminder) {
      elements.tabReminder.addEventListener('click', () => {
        state.activeTab = 'reminder';
        updateTabActiveUI();
        renderFilterChips();
        renderEventsList();
      });
    }

    if (elements.tabAll) {
      elements.tabAll.addEventListener('click', () => {
        state.activeTab = 'all';
        updateTabActiveUI();
        renderFilterChips();
        renderEventsList();
      });
    }

    // 關鍵字搜尋
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderEventsList();
      });
    }

    // 新增事項按鈕
    if (elements.openAddModalBtn) {
      elements.openAddModalBtn.addEventListener('click', () => {
        openAddModal(state.activeTab === 'reminder' ? 'reminder' : 'todo');
      });
    }

    // 表單類型切換
    if (elements.typeTodoCard) {
      elements.typeTodoCard.addEventListener('click', () => setTypeSelector('todo'));
    }
    if (elements.typeReminderCard) {
      elements.typeReminderCard.addEventListener('click', () => setTypeSelector('reminder'));
    }

    // 自訂顏色輸入
    if (elements.customColorInput) {
      elements.customColorInput.addEventListener('input', (e) => {
        selectColor(e.target.value);
      });
    }

    // 表單送出
    if (elements.eventForm) {
      elements.eventForm.addEventListener('submit', handleFormSubmit);
    }

    if (elements.deleteEventBtn) {
      elements.deleteEventBtn.addEventListener('click', () => {
        if (state.editingEventId) {
          deleteEvent(state.editingEventId);
        }
      });
    }

    // 關閉 Modal
    if (elements.modalCloseBtn) elements.modalCloseBtn.addEventListener('click', closeEventModal);
    if (elements.modalCancelBtn) elements.modalCancelBtn.addEventListener('click', closeEventModal);
    if (elements.eventModal) {
      elements.eventModal.addEventListener('click', (e) => {
        if (e.target === elements.eventModal) closeEventModal();
      });
    }

    // 單日檢視 Modal 關閉
    if (elements.dayViewCloseBtn) elements.dayViewCloseBtn.addEventListener('click', closeDayViewModal);
    if (elements.dayViewModal) {
      elements.dayViewModal.addEventListener('click', (e) => {
        if (e.target === elements.dayViewModal) closeDayViewModal();
      });
    }

    // 單日檢視快捷新增
    if (elements.dayViewAddTodoBtn) {
      elements.dayViewAddTodoBtn.addEventListener('click', () => {
        closeDayViewModal();
        openAddModal('todo', state.selectedDate);
      });
    }
    if (elements.dayViewAddReminderBtn) {
      elements.dayViewAddReminderBtn.addEventListener('click', () => {
        closeDayViewModal();
        openAddModal('reminder', state.selectedDate);
      });
    }

    // 資料備份匯出 JSON
    if (elements.exportDataBtn) {
      elements.exportDataBtn.addEventListener('click', exportData);
    }

    // 資料還原匯入 JSON
    if (elements.importDataInput) {
      elements.importDataInput.addEventListener('change', importData);
    }

    // 重設示範資料
    if (elements.resetDemoBtn) {
      elements.resetDemoBtn.addEventListener('click', () => {
        if (confirm('確定要恢復預設示範事項嗎？這將覆蓋現有內容。')) {
          state.events = createDefaultDemoEvents();
          saveEvents();
          renderAll();
          showToast('已重設為預設示範資料', 'success');
        }
      });
    }
  }

  function updateTabActiveUI() {
    elements.tabTodo.classList.toggle('active', state.activeTab === 'todo');
    elements.tabReminder.classList.toggle('active', state.activeTab === 'reminder');
    elements.tabAll.classList.toggle('active', state.activeTab === 'all');
  }

  // 匯出 JSON
  function exportData() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.events, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `smart_notepad_backup_${state.referenceDate}.json`);
    dlAnchor.click();
    showToast('備份檔案匯出完成！', 'success');
  }

  // 匯入 JSON
  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          state.events = imported;
          saveEvents();
          renderAll();
          showToast('成功匯入備份資料！', 'success');
        } else {
          showToast('檔案格式不符，請上傳正確的 JSON 檔案', 'danger');
        }
      } catch (err) {
        showToast('檔案解析失敗！', 'danger');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // 重設 input
  }

  // 輔助函式：HTML 轉義
  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&#039;');
  }

  // 輔助函式：Toast 彈出訊息
  function showToast(message, type = 'success') {
    if (!elements.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌';
    toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 350);
    }, 2800);
  }

  /* ==========================================================================
     跨裝置即時雲端同步模組 (SyncManager)
     ========================================================================== */
  const SyncManager = (function () {
    const SYNC_CONFIG_KEY = 'smart_notepad_sync_v2';
    const DEVICE_ID_KEY = 'smart_notepad_device_id';

    let config = {
      syncKey: '',
      autoSync: true,
      lastSyncTime: '',
      customFirebase: null // { apiKey, projectId, appId }
    };

    let isConnected = false;
    let sseSource = null;
    let firestoreUnsubscribe = null;
    let isRemoteUpdating = false;
    let debounceTimer = null;

    // 取得或產生此裝置的唯一識別碼 (避免自我廣播回圈)
    function getDeviceId() {
      let devId = sessionStorage.getItem(DEVICE_ID_KEY);
      if (!devId) {
        devId = 'dev-' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem(DEVICE_ID_KEY, devId);
      }
      return devId;
    }

    function init() {
      loadConfig();
      checkUrlParams();
      bindSyncEvents();
      renderSyncUI();

      if (config.syncKey) {
        connect(config.syncKey, true);
      }
    }

    function loadConfig() {
      try {
        const saved = localStorage.getItem(SYNC_CONFIG_KEY);
        if (saved) {
          config = { ...config, ...JSON.parse(saved) };
        }
      } catch (e) {
        console.error('載入同步設定失敗:', e);
      }
    }

    function saveConfig() {
      try {
        localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
      } catch (e) {
        console.error('儲存同步設定失敗:', e);
      }
    }

    // 檢查網址列是否有 ?sync=xxxx 自動配對代碼
    function checkUrlParams() {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlSyncKey = params.get('sync');
        if (urlSyncKey && urlSyncKey.trim()) {
          const cleanKey = urlSyncKey.trim();
          config.syncKey = cleanKey;
          saveConfig();
          setTimeout(() => {
            showToast(`已透過網址連結自動載入同步代碼：${cleanKey}`, 'success');
          }, 600);
        }
      } catch (e) {}
    }

    // 渲染同步設定介面狀態
    function renderSyncUI() {
      if (elements.syncKeyInput) elements.syncKeyInput.value = config.syncKey || '';
      if (elements.autoSyncCheckbox) elements.autoSyncCheckbox.checked = config.autoSync !== false;
      if (elements.syncLastTimeText) {
        elements.syncLastTimeText.textContent = config.lastSyncTime ? `最後同步：${config.lastSyncTime}` : '尚未同步';
      }

      if (config.customFirebase && elements.customApiKeyInput) {
        elements.customApiKeyInput.value = config.customFirebase.apiKey || '';
        elements.customProjectIdInput.value = config.customFirebase.projectId || '';
        elements.customAppIdInput.value = config.customFirebase.appId || '';
      }

      updateStatusUI(isConnected, isConnected ? `🟢 雲端已即時同步中 (${config.syncKey})` : '⚪ 本地離線模式 (尚未連線)');
    }

    // 更新狀態指示燈與文字
    function updateStatusUI(connected, text, stateType = '') {
      isConnected = connected;

      const dotClass = stateType === 'syncing' ? 'sync-status-dot syncing' : (connected ? 'sync-status-dot connected' : 'sync-status-dot');
      
      if (elements.syncStatusDot) elements.syncStatusDot.className = dotClass;
      if (elements.modalSyncDot) elements.modalSyncDot.className = dotClass;

      if (elements.syncBtnText) {
        elements.syncBtnText.textContent = stateType === 'syncing' ? '☁️ 同步中' : (connected ? '☁️ 已同步' : '☁️ 雲端同步');
      }

      if (elements.modalSyncStatusText) {
        elements.modalSyncStatusText.textContent = text;
      }
    }

    // 綁定同步面板互動事件
    function bindSyncEvents() {
      if (elements.openSyncModalBtn) {
        elements.openSyncModalBtn.addEventListener('click', () => {
          renderSyncUI();
          elements.syncModal.classList.add('active');
        });
      }

      if (elements.syncModalCloseBtn) {
        elements.syncModalCloseBtn.addEventListener('click', () => {
          elements.syncModal.classList.remove('active');
        });
      }

      if (elements.syncModalDoneBtn) {
        elements.syncModalDoneBtn.addEventListener('click', () => {
          elements.syncModal.classList.remove('active');
        });
      }

      if (elements.syncModal) {
        elements.syncModal.addEventListener('click', (e) => {
          if (e.target === elements.syncModal) {
            elements.syncModal.classList.remove('active');
          }
        });
      }

      // 隨機產生同步代碼
      if (elements.randomSyncKeyBtn) {
        elements.randomSyncKeyBtn.addEventListener('click', () => {
          const randKey = 'note-' + Math.random().toString(36).substr(2, 6);
          elements.syncKeyInput.value = randKey;
          showToast(`已隨機產生代碼：${randKey}`, 'success');
        });
      }

      // 連線同步按鈕
      if (elements.connectSyncBtn) {
        elements.connectSyncBtn.addEventListener('click', () => {
          const key = elements.syncKeyInput.value.trim();
          if (!key) {
            showToast('請輸入同步帳號 / 密鑰代碼！', 'warning');
            elements.syncKeyInput.focus();
            return;
          }
          config.syncKey = key;
          saveConfig();
          connect(key, false);
        });
      }

      // 斷開連線按鈕
      if (elements.disconnectSyncBtn) {
        elements.disconnectSyncBtn.addEventListener('click', disconnect);
      }

      // 自動同步開關
      if (elements.autoSyncCheckbox) {
        elements.autoSyncCheckbox.addEventListener('change', (e) => {
          config.autoSync = e.target.checked;
          saveConfig();
          showToast(config.autoSync ? '已開啟自動即時同步' : '已關閉自動同步，改為手動同步', 'success');
        });
      }

      // 顯示手機 QR Code 按鈕
      if (elements.showQrBtn) {
        elements.showQrBtn.addEventListener('click', toggleQrCode);
      }

      // 複製同步連結按鈕
      if (elements.copySyncLinkBtn) {
        elements.copySyncLinkBtn.addEventListener('click', copySyncLink);
      }

      // 手動立即上傳
      if (elements.manualPushBtn) {
        elements.manualPushBtn.addEventListener('click', () => {
          if (!config.syncKey) {
            showToast('請先連線同步代碼！', 'warning');
            return;
          }
          pushToCloud(true);
        });
      }

      // 手動立即下載
      if (elements.manualPullBtn) {
        elements.manualPullBtn.addEventListener('click', () => {
          if (!config.syncKey) {
            showToast('請先連線同步代碼！', 'warning');
            return;
          }
          pullFromCloud(true);
        });
      }

      // 儲存個人 Firebase 設定
      if (elements.saveCustomFirebaseBtn) {
        elements.saveCustomFirebaseBtn.addEventListener('click', () => {
          const apiKey = elements.customApiKeyInput ? elements.customApiKeyInput.value.trim() : '';
          const projectId = elements.customProjectIdInput ? elements.customProjectIdInput.value.trim() : '';
          const appId = elements.customAppIdInput ? elements.customAppIdInput.value.trim() : '';

          if (apiKey && projectId) {
            config.customFirebase = { apiKey, projectId, appId };
            saveConfig();
            showToast('已儲存個人 Firebase 專案設定！正在重新連線...', 'success');
            if (config.syncKey) connect(config.syncKey, false);
          } else {
            config.customFirebase = null;
            saveConfig();
            showToast('已清除個人 Firebase 設定，切換回開箱即用即時同步通道', 'success');
            if (config.syncKey) connect(config.syncKey, false);
          }
        });
      }
    }

    // 建立連線 (Firebase Firestore 或 即時 PubSub 雙向通道)
    function connect(key, isSilent = false) {
      if (!key) return;
      cleanUpListeners();

      const safeKey = encodeURIComponent(key.toLowerCase());
      updateStatusUI(true, '🟡 正在連線同步雲端...', 'syncing');

      // 1. 若設定了個人 Firebase 專案，使用 Firebase Firestore 即時監聽
      if (config.customFirebase && config.customFirebase.apiKey && config.customFirebase.projectId && typeof firebase !== 'undefined') {
        try {
          let app = firebase.apps.length ? firebase.apps[0] : firebase.initializeApp(config.customFirebase);
          const db = firebase.firestore(app);

          firestoreUnsubscribe = db.collection('smart_notepads').doc(safeKey).onSnapshot((doc) => {
            if (doc.exists) {
              const data = doc.data();
              if (data && Array.isArray(data.events)) {
                if (data.senderId === getDeviceId()) return;
                isRemoteUpdating = true;
                state.events = data.events;
                saveEvents(true);
                renderAll();
                const nowTime = new Date().toLocaleTimeString('zh-TW', { hour12: false });
                config.lastSyncTime = nowTime;
                saveConfig();
                if (elements.syncLastTimeText) elements.syncLastTimeText.textContent = `最後同步：${nowTime}`;
                updateStatusUI(true, `🟢 雲端已即時同步 (Firebase: ${key})`);
                showToast('已自 Firebase 同步最新事項！', 'success');
                setTimeout(() => { isRemoteUpdating = false; }, 800);
              }
            } else {
              // 遠端尚無文件，推送本地現有資料至 Firebase
              pushToCloud(false);
            }
          }, (err) => {
            console.warn('Firebase 監聽錯誤:', err);
            setupRealtimeChannel(safeKey, key, isSilent);
          });

          updateStatusUI(true, `🟢 雲端已即時同步 (Firebase: ${key})`);
          if (!isSilent) showToast(`已成功連線至 Firebase 雲端：${key}`, 'success');
          return;
        } catch (e) {
          console.warn('Firebase 初始化失敗，自動切換至即時雲端通道:', e);
        }
      }

      // 2. 開箱即用即時雙向通道 (毫秒級 SSE 監聽 + 雲端同步)
      setupRealtimeChannel(safeKey, key, isSilent);
    }

    // 設置即時雙向通道
    function setupRealtimeChannel(safeKey, key, isSilent) {
      try {
        const topic = `smart_np_sync_${safeKey}`;
        const sseUrl = `https://ntfy.sh/${topic}/sse`;

        sseSource = new EventSource(sseUrl);

        sseSource.onopen = function () {
          updateStatusUI(true, `🟢 雲端已即時同步 (${key})`);
          if (!isSilent) showToast(`已成功連線至雲端同步：${key}`, 'success');
          // 連線成功時，先主動拉取一次雲端快照
          pullFromCloud(false);
        };

        sseSource.onmessage = function (e) {
          try {
            const data = JSON.parse(e.data);
            if (data.event === 'message' && data.message) {
              const payload = JSON.parse(data.message);
              if (payload && Array.isArray(payload.events)) {
                if (payload.senderId === getDeviceId()) return; // 略過本裝置自身發出的廣播
                isRemoteUpdating = true;
                state.events = payload.events;
                saveEvents(true);
                renderAll();
                const nowTime = new Date().toLocaleTimeString('zh-TW', { hour12: false });
                config.lastSyncTime = nowTime;
                saveConfig();
                if (elements.syncLastTimeText) elements.syncLastTimeText.textContent = `最後同步：${nowTime}`;
                updateStatusUI(true, `🟢 雲端已即時同步 (${key})`);
                showToast('已自其他裝置即時同步最新事項！', 'success');
                setTimeout(() => { isRemoteUpdating = false; }, 800);
              }
            }
          } catch (err) {}
        };

        sseSource.onerror = function () {
          // 網路暫時波動，自動由瀏覽器重試重連
        };

      } catch (err) {
        console.error('即時通道啟動錯誤:', err);
        updateStatusUI(false, '連線發生錯誤');
      }
    }

    function cleanUpListeners() {
      if (sseSource) {
        sseSource.close();
        sseSource = null;
      }
      if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
        firestoreUnsubscribe = null;
      }
    }

    // 本地資料產生異動時 (新增、修改、刪除、勾選完成)
    function onLocalChange() {
      if (isRemoteUpdating || !config.syncKey || config.autoSync === false) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        pushToCloud(false);
      }, 400);
    }

    // 推送本地資料至雲端
    function pushToCloud(isManual = false) {
      if (!config.syncKey) return;
      const safeKey = encodeURIComponent(config.syncKey.toLowerCase());
      updateStatusUI(true, '🟡 正在上傳至雲端...', 'syncing');

      const payload = {
        senderId: getDeviceId(),
        timestamp: Date.now(),
        events: state.events
      };

      const jsonStr = JSON.stringify(payload);

      // 1. 若啟用 Firebase，寫入 Firestore
      if (config.customFirebase && typeof firebase !== 'undefined' && firebase.apps.length) {
        try {
          const db = firebase.firestore();
          db.collection('smart_notepads').doc(safeKey).set({
            senderId: getDeviceId(),
            updatedAt: Date.now(),
            events: state.events
          });
        } catch (e) {}
      }

      // 2. 廣播至即時雙向通道
      const topic = `smart_np_sync_${safeKey}`;
      fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        body: jsonStr,
        headers: { 'Title': 'Notepad-Sync' }
      }).then(() => {
        const nowTime = new Date().toLocaleTimeString('zh-TW', { hour12: false });
        config.lastSyncTime = nowTime;
        saveConfig();
        if (elements.syncLastTimeText) elements.syncLastTimeText.textContent = `最後同步：${nowTime}`;
        updateStatusUI(true, `🟢 雲端已即時同步 (${config.syncKey})`);
        if (isManual) showToast('已成功上傳最新事項覆蓋雲端！', 'success');
      }).catch(err => {
        console.warn('同步上傳暫時異常:', err);
        updateStatusUI(true, `🟢 雲端已就緒 (${config.syncKey})`);
      });
    }

    // 從雲端下載最新資料
    function pullFromCloud(isManual = false) {
      if (!config.syncKey) return;
      const safeKey = encodeURIComponent(config.syncKey.toLowerCase());
      updateStatusUI(true, '🟡 正在從雲端抓取...', 'syncing');

      // 1. 若有 Firebase 則從 Firestore 抓取
      if (config.customFirebase && typeof firebase !== 'undefined' && firebase.apps.length) {
        try {
          const db = firebase.firestore();
          db.collection('smart_notepads').doc(safeKey).get().then(doc => {
            if (doc.exists) {
              const data = doc.data();
              if (data && Array.isArray(data.events)) {
                state.events = data.events;
                saveEvents(true);
                renderAll();
                const nowTime = new Date().toLocaleTimeString('zh-TW', { hour12: false });
                config.lastSyncTime = nowTime;
                saveConfig();
                if (elements.syncLastTimeText) elements.syncLastTimeText.textContent = `最後同步：${nowTime}`;
                updateStatusUI(true, `🟢 雲端已即時同步 (Firebase: ${config.syncKey})`);
                if (isManual) showToast('成功從 Firebase 下載最新事項！', 'success');
                return;
              }
            }
          });
        } catch (e) {}
      }

      // 2. 從即時通道最近一筆快照中讀取
      const topic = `smart_np_sync_${safeKey}`;
      fetch(`https://ntfy.sh/${topic}/json?poll=1`)
        .then(res => res.text())
        .then(text => {
          if (!text) return;
          const lines = text.trim().split('\n');
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const msg = JSON.parse(lines[i]);
              if (msg.event === 'message' && msg.message) {
                const payload = JSON.parse(msg.message);
                if (payload && Array.isArray(payload.events)) {
                  state.events = payload.events;
                  saveEvents(true);
                  renderAll();
                  const nowTime = new Date().toLocaleTimeString('zh-TW', { hour12: false });
                  config.lastSyncTime = nowTime;
                  saveConfig();
                  if (elements.syncLastTimeText) elements.syncLastTimeText.textContent = `最後同步：${nowTime}`;
                  updateStatusUI(true, `🟢 雲端已即時同步 (${config.syncKey})`);
                  if (isManual) showToast('已成功從雲端下載最新事項！', 'success');
                  return;
                }
              }
            } catch (e) {}
          }
          updateStatusUI(true, `🟢 雲端已即時同步 (${config.syncKey})`);
        })
        .catch(() => {
          updateStatusUI(true, `🟢 雲端已就緒 (${config.syncKey})`);
        });
    }

    // 斷開雲端連線
    function disconnect() {
      cleanUpListeners();
      config.syncKey = '';
      saveConfig();
      if (elements.syncKeyInput) elements.syncKeyInput.value = '';
      updateStatusUI(false, '⚪ 本地離線模式 (已斷開連線)');
      showToast('已斷開雲端同步，目前為本地單機模式', 'warning');
    }

    // 取得手機配對完整連結
    function getSyncUrl() {
      const key = config.syncKey || (elements.syncKeyInput ? elements.syncKeyInput.value.trim() : '');
      if (!key) return '';

      let base = window.location.href.split('?')[0];
      // 若為 file:// 協定本機開啟，提示使用區域網路 IP
      if (window.location.protocol === 'file:') {
        base = 'http://172.16.194.210:8080/';
      }
      return `${base}?sync=${encodeURIComponent(key)}`;
    }

    // 切換顯示手機配對 QR Code
    function toggleQrCode() {
      if (!elements.qrCodeContainer) return;
      const key = config.syncKey || (elements.syncKeyInput ? elements.syncKeyInput.value.trim() : '');
      if (!key) {
        showToast('請先輸入或設定同步代碼！', 'warning');
        return;
      }

      const isHidden = elements.qrCodeContainer.style.display === 'none';
      if (isHidden) {
        const syncUrl = getSyncUrl();
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(syncUrl)}`;
        
        elements.qrCodeImageWrapper.innerHTML = `
          <div style="text-align:center;">
            <img src="${qrApiUrl}" alt="手機同步 QR Code" style="box-shadow:var(--shadow-sm); margin-bottom:8px;">
            <div style="font-size:0.75rem; color:var(--text-muted); word-break:break-all;">
              同步連結：<span class="code-badge">${escapeHtml(syncUrl)}</span>
            </div>
          </div>
        `;
        elements.qrCodeContainer.style.display = 'flex';
        showToast('已產生配對 QR Code，請用手機相機掃描', 'success');
      } else {
        elements.qrCodeContainer.style.display = 'none';
      }
    }

    // 複製同步連結到剪貼簿
    function copySyncLink() {
      const syncUrl = getSyncUrl();
      if (!syncUrl) {
        showToast('請先輸入或設定同步代碼！', 'warning');
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(syncUrl).then(() => {
          showToast('已成功複製手機同步連結至剪貼簿！', 'success');
        }).catch(() => {
          prompt('請複製以下同步連結：', syncUrl);
        });
      } else {
        prompt('請複製以下同步連結：', syncUrl);
      }
    }

    return {
      init,
      onLocalChange,
      connect,
      pushToCloud,
      pullFromCloud,
      disconnect
    };
  })();

  // 當 DOM 載入完成即執行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
