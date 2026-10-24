'use strict';
(() => {
  const data = window.SCHEDULE;
  const $ = (selector) => document.querySelector(selector);
  const tz = 'Europe/Athens';
  const dateParts = (date) => new Intl.DateTimeFormat('en-CA', {timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).formatToParts(date).reduce((result, part) => ({...result, [part.type]: part.value}), {});
  const now = dateParts(new Date());
  const today = `${now.year}-${now.month}-${now.day}`;
  const currentTime = `${now.hour}:${now.minute}`;
  const isUpcoming = (event) => event.date > today || (event.date === today && event.end > currentTime);
  const parseDate = (date) => new Date(`${date}T12:00:00Z`);
  const formatDate = (date, options) => new Intl.DateTimeFormat('el-GR', {timeZone: tz, ...options}).format(parseDate(date));
  const upperFirst = (text) => text.charAt(0).toLocaleUpperCase('el-GR') + text.slice(1);
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
  const normalize = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('el-GR');
  const programArtworks = [
    {names: ['ναυτιλος', 'nautilos', 'naytilos', 'nautilus'], src: 'assets/nautilos.webp', alt: 'Το ναυάγιο και η πυξίδα του ΝΑΥΤΙΛΟΥ 21', position: 'center 76%'},
    {names: ['στιγμα', 'πρωτευ', 'proteus', 'stigma'], src: 'assets/stigma.webp', alt: 'Ο θαλάσσιος χάρτης της Πελοποννήσου για το ΤΕΛΕΥΤΑΙΟ ΣΤΙΓΜΑ', position: 'center 42%'},
    {names: ['biodive', 'bio dive', 'βιονταιβ'], src: 'assets/biodive.webp', alt: 'Η θαλάσσια χελώνα και οι μέδουσες του BioDive', position: 'center 52%'}
  ];
  const artworkFor = (event) => programArtworks.find((artwork) => artwork.names.some((name) => normalize(event.program).includes(name)));
  const statusLabels = {scheduled: 'Στο πρόγραμμα', changed: 'Τροποποιήθηκε', cancelled: 'Ακυρώθηκε'};
  const events = [...data.events].sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  let view = 'list';
  let selectedId = null;
  const next = events.find((event) => isUpcoming(event) && event.status !== 'cancelled');
  const anchor = next ? next.date : today;
  let calendarYear = Number(anchor.slice(0, 4));
  let calendarMonth = Number(anchor.slice(5, 7)) - 1;

  function populateFilter(selector, values) {
    const target = $(selector);
    for (const value of [...new Set(values)].sort((a, b) => a.localeCompare(b, 'el'))) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      target.append(option);
    }
  }
  populateFilter('#presenter', events.flatMap((event) => event.presenters));
  populateFilter('#program', events.map((event) => event.program));
  $('#updated').textContent = `Ενημέρωση προγράμματος: ${formatDate(data.updatedAt, {day: 'numeric', month: 'long', year: 'numeric'})}`;

  if (next) {
    const artwork = artworkFor(next);
    $('#next-event').classList.toggle('has-artwork', Boolean(artwork));
    $('#next-event').innerHTML = `${artwork ? `<img class="next-artwork" src="${artwork.src}" alt="" style="object-position:${artwork.position}" fetchpriority="high">` : ''}<div class="next-content"><p class="next-label"><span>ΕΠΟΜΕΝΗ ΔΡΑΣΗ</span><span aria-hidden="true">↗</span></p><div class="next-date"><span class="next-number">${next.date.slice(8)}</span><span class="next-date-text">${escape(upperFirst(formatDate(next.date, {weekday: 'long'})))}<br>${escape(formatDate(next.date, {month: 'long', year: 'numeric'}))}</span></div><h2>${escape(next.program)}</h2><p class="next-subtitle">${escape(next.subtitle)}</p><div class="next-meta"><span>◷ &nbsp;${escape(next.start)} – ${escape(next.end)}</span><span>⌖ &nbsp;${escape(next.building)}</span></div></div>`;
  } else {
    $('#next-event').innerHTML = '<p class="next-label">ΕΠΟΜΕΝΗ ΔΡΑΣΗ</p><h2>Αναμένουμε το επόμενο πρόγραμμα.</h2><p class="next-subtitle">Οι προηγούμενες δράσεις παραμένουν διαθέσιμες στην επιλογή «Όλες οι δράσεις».</p>';
  }

  function filteredEvents() {
    const query = normalize($('#search').value.trim());
    const presenter = $('#presenter').value;
    const program = $('#program').value;
    const period = $('#period').value;
    return events.filter((event) => (!query || normalize([event.school, event.program, event.subtitle, event.building, ...event.presenters, event.date, event.note].join(' ')).includes(query)) && (!presenter || event.presenters.includes(presenter)) && (!program || event.program === program) && (period === 'all' || (period === 'upcoming' ? isUpcoming(event) : !isUpcoming(event))));
  }

  function eventCard(event) {
    const artwork = artworkFor(event);
    return `<article class="event-card${artwork ? ' has-artwork' : ''}" aria-label="${escape(event.program)} · ${escape(formatDate(event.date, {day: 'numeric', month: 'long', year: 'numeric'}))}">
      <div class="event-date"><span class="event-weekday">${escape(upperFirst(formatDate(event.date, {weekday: 'long'})))}</span><span class="event-number">${event.date.slice(8)}</span><span class="event-month">${escape(formatDate(event.date, {month: 'short'}))} ${event.date.slice(0, 4)}</span></div>
      ${artwork ? `<div class="event-artwork"><img src="${artwork.src}" alt="${escape(artwork.alt)}" style="object-position:${artwork.position}" loading="lazy" decoding="async"></div>` : ''}
      <div class="event-main"><div class="event-title-row"><div><h3>${escape(event.program)}</h3><p class="event-subtitle">${escape(event.subtitle)}</p></div><span class="status ${escape(event.status)}">${escape(statusLabels[event.status])}</span></div>
      <div class="event-meta"><span><span class="meta-symbol" aria-hidden="true">◷</span>${escape(event.start)} – ${escape(event.end)}</span><span><span class="meta-symbol" aria-hidden="true">⌖</span>Κτήριο ${escape(event.building)}</span></div>
      <dl class="event-details"><div><dt>ΕΙΣΗΓΗΤΕΣ</dt><dd>${event.presenters.map((presenter) => `<span>${escape(presenter)}</span>`).join('')}</dd></div><div><dt>ΣΧΟΛΕΙΟ</dt><dd>${escape(event.school)}</dd></div><div><dt>ΤΑΞΗ / ΜΑΘΗΤΕΣ</dt><dd>${escape(event.className)} · ${escape(event.students)} μαθητές</dd></div></dl>
      ${event.note ? `<p class="event-note">${escape(event.note)}</p>` : ''}
      ${event.status !== 'cancelled' ? `<div class="event-footer"><button type="button" class="add-calendar" data-export="${escape(event.id)}" aria-label="Προσθήκη ${escape(event.program)} στις ${escape(event.date)} στο ημερολόγιό μου">＋ Στο ημερολόγιό μου</button></div>` : ''}</div></article>`;
  }
  const emptyMessage = '<div class="empty"><h3>Δεν βρέθηκαν δράσεις.</h3><p>Δοκίμασε άλλη αναζήτηση ή επίλεξε «Όλες οι δράσεις».</p></div>';
  function renderList(filtered) {
    if (!filtered.length) { $('#list-view').innerHTML = emptyMessage; return; }
    let previousMonth = '';
    $('#list-view').innerHTML = filtered.map((event) => {
      const month = event.date.slice(0, 7);
      const heading = month !== previousMonth ? `<h3 class="month-heading">${escape(upperFirst(formatDate(event.date, {month: 'long', year: 'numeric'})))}</h3>` : '';
      previousMonth = month;
      return heading + eventCard(event);
    }).join('');
  }
  function monthEvents(filtered) {
    const prefix = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`;
    return filtered.filter((event) => event.date.startsWith(prefix));
  }
  function renderCalendar(filtered) {
    const labelDate = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-01`;
    $('#month-label').textContent = upperFirst(formatDate(labelDate, {month: 'long', year: 'numeric'}));
    const firstDay = (new Date(Date.UTC(calendarYear, calendarMonth, 1)).getUTCDay() + 6) % 7;
    const daysInMonth = new Date(Date.UTC(calendarYear, calendarMonth + 1, 0)).getUTCDate();
    const monthList = monthEvents(filtered);
    let html = ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'].map((day) => `<div class="week-label">${day}</div>`).join('');
    for (let dayIndex = 0; dayIndex < Math.ceil((firstDay + daysInMonth) / 7) * 7; dayIndex++) {
      const day = dayIndex - firstDay + 1;
      if (day < 1 || day > daysInMonth) { html += '<div class="day blank" aria-hidden="true"></div>'; continue; }
      const date = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      html += `<div class="day${date === today ? ' today' : ''}"><span class="day-number">${day}</span>${monthList.filter((event) => event.date === date).map((event) => `<button type="button" class="calendar-event ${escape(event.status)}" data-detail="${escape(event.id)}" aria-label="${escape(event.program)}, ${escape(formatDate(date, {day: 'numeric', month: 'long'}))}, ${escape(event.start)}, ${escape(statusLabels[event.status])}"><strong>${escape(event.start)}</strong><span class="calendar-program">${escape(event.program)}</span></button>`).join('')}</div>`;
    }
    $('#calendar').innerHTML = html;
    const selected = monthList.find((event) => event.id === selectedId);
    $('#day-details').innerHTML = selected ? eventCard(selected) : monthList.length ? '' : '<div class="empty"><h3>Δεν υπάρχουν δράσεις σε αυτόν τον μήνα.</h3><p>Άλλαξε μήνα ή φίλτρα για να δεις το υπόλοιπο πρόγραμμα.</p></div>';
  }
  function render() {
    const filtered = filteredEvents();
    renderList(filtered);
    renderCalendar(filtered);
    $('#list-view').hidden = view !== 'list';
    $('#calendar-view').hidden = view !== 'calendar';
    const count = view === 'calendar' ? monthEvents(filtered).length : filtered.length;
    $('#result-count').textContent = `${count} ${count === 1 ? 'δράση' : 'δράσεις'}${view === 'calendar' ? ' στον μήνα προβολής' : ''}`;
  }

  // Convert the wall-clock time in Athens to a UTC instant, including daylight saving time.
  function utcDate(date, time) {
    const wallTime = new Date(`${date}T${time}:00Z`);
    let guess = wallTime.getTime();
    for (let attempt = 0; attempt < 3; attempt++) {
      const parts = dateParts(new Date(guess));
      const representedTime = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
      guess += wallTime.getTime() - representedTime;
    }
    return new Date(guess).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }
  const icsEscape = (text) => String(text).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
  function foldLine(line) {
    const encoder = new TextEncoder();
    let result = '', current = '';
    for (const character of line) {
      if (encoder.encode(current + character).length > 75) { result += current + '\r\n'; current = ' '; }
      current += character;
    }
    return result + current;
  }
  function exportEvent(event) {
    const description = `Εισηγητές: ${event.presenters.join(' & ')}\nΣχολείο: ${event.school}\nΤάξη: ${event.className} · Μαθητές: ${event.students}${event.note ? `\n${event.note}` : ''}`;
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Programma Omadas//Educational Schedule//EL', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${event.id}@programma-omadas.local`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`, `DTSTART:${utcDate(event.date, event.start)}`, `DTEND:${utcDate(event.date, event.end)}`, `SUMMARY:${icsEscape(`${event.program} – ${event.subtitle}`)}`, `LOCATION:${icsEscape(`Κτήριο ${event.building}`)}`, `DESCRIPTION:${icsEscape(description)}`, 'END:VEVENT', 'END:VCALENDAR'];
    const url = URL.createObjectURL(new Blob([lines.map(foldLine).join('\r\n') + '\r\n'], {type: 'text/calendar;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url; link.download = `${event.id}.ics`; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  for (const selector of ['#search', '#presenter', '#program', '#period']) {
    $(selector).addEventListener(selector === '#search' ? 'input' : 'change', () => {selectedId = null; render();});
  }
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => {
    view = button.dataset.view;
    document.querySelectorAll('[data-view]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    render();
  }));
  $('#clear').addEventListener('click', () => {
    $('#search').value = ''; $('#presenter').value = ''; $('#program').value = ''; $('#period').value = 'upcoming'; selectedId = null; render();
  });
  for (const [id, offset] of [['#prev-month', -1], ['#next-month', 1]]) {
    $(id).addEventListener('click', () => {
      const date = new Date(Date.UTC(calendarYear, calendarMonth + offset, 1));
      calendarYear = date.getUTCFullYear(); calendarMonth = date.getUTCMonth(); selectedId = null; render();
    });
  }
  $('#current-month').addEventListener('click', () => {calendarYear = Number(now.year); calendarMonth = Number(now.month) - 1; selectedId = null; render();});
  $('#refresh').addEventListener('click', () => window.location.reload());
  $('#print').addEventListener('click', () => window.print());
  document.addEventListener('click', (event) => {
    const detailButton = event.target.closest('[data-detail]');
    if (detailButton) {
      selectedId = detailButton.dataset.detail; render();
      $('#day-details').scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest'});
    }
    const exportButton = event.target.closest('[data-export]');
    if (exportButton) { const selected = events.find((item) => item.id === exportButton.dataset.export); if (selected) exportEvent(selected); }
  });
  render();
})();
