'use strict';
window.ScheduleRules = (() => {
  const presenters = ['Κωσταντίνος', 'Άννα'];
  const pending = 'Εκκρεμεί ανάθεση';

  function assign(event) {
    const weekday = new Date(`${event.date}T12:00:00Z`).getUTCDay();
    let presenter = pending;
    if (weekday === 1 || weekday === 2) presenter = presenters[0];
    if (weekday === 3 || weekday === 4) presenter = presenters[1];
    // Friday is assigned only from the user's explicit instruction, never from the source email.
    if (weekday === 5 && presenters.includes(event.fridayPresenter)) presenter = event.fridayPresenter;
    return {...event, presenters: [presenter]};
  }

  function isUpcoming(event, today, currentTime) {
    return event.date > today || (event.date === today && event.end > currentTime);
  }

  function statistics(events, today, currentTime) {
    const completed = events.filter((event) => event.status !== 'cancelled' && !isUpcoming(event, today, currentTime));
    const byPresenter = Object.fromEntries(presenters.map((name) => [name, 0]));
    const byProgram = new Map([...new Set(events.map((event) => event.program))].sort((a, b) => a.localeCompare(b, 'el')).map((program) => [program, {total: 0, counts: {...byPresenter}}]));
    let unassigned = 0;
    for (const event of completed) {
      const row = byProgram.get(event.program);
      row.total++;
      const presenter = event.presenters[0];
      if (presenters.includes(presenter)) {
        byPresenter[presenter]++;
        row.counts[presenter]++;
      } else {
        unassigned++;
        row.counts[pending] = (row.counts[pending] || 0) + 1;
      }
    }
    return {total: completed.length, byPresenter, byProgram, unassigned};
  }
  return {presenters, pending, assign, isUpcoming, statistics};
})();
