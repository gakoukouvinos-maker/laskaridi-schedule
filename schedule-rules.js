'use strict';
window.ScheduleRules = (() => {
  const presenters = ['Κωνσταντίνος', 'Άννα'];
  const pending = 'Εκκρεμεί ανάθεση';
  const programs = [
    {name: 'ΝΑΥΤΙΛΟΣ 21', names: ['ναυτιλος', 'nautilos', 'naytilos', 'nautilus'], src: 'assets/nautilos.webp?v=foundation1', alt: 'Το ναυάγιο και η πυξίδα του ΝΑΥΤΙΛΟΥ 21', position: 'center 76%'},
    {name: 'ΤΕΛΕΥΤΑΙΟ ΣΤΙΓΜΑ / ΠΡΩΤΕΥΣ', names: ['στιγμα', 'πρωτευ', 'proteus', 'stigma'], src: 'assets/stigma.webp?v=foundation1', alt: 'Ο θαλάσσιος χάρτης της Πελοποννήσου για το ΤΕΛΕΥΤΑΙΟ ΣΤΙΓΜΑ', position: 'center 42%'},
    {name: 'BioDive', names: ['biodive', 'bio dive', 'βιονταιβ'], src: 'assets/biodive.webp?v=foundation1', alt: 'Η θαλάσσια χελώνα και οι μέδουσες του BioDive', position: 'center 52%'}
  ];
  const normalize = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('el-GR');
  const programFor = (name) => programs.find((program) => program.names.some((alias) => normalize(name).includes(alias)));

  function assign(event) {
    const weekday = new Date(`${event.date}T12:00:00Z`).getUTCDay();
    let presenter = pending;
    if (weekday === 1 || weekday === 3) presenter = presenters[0];
    if (weekday === 2 || weekday === 4) presenter = presenters[1];
    // Friday is assigned only from the user's explicit instruction, never from the source email.
    if (weekday === 5 && presenters.includes(event.fridayPresenter)) presenter = event.fridayPresenter;
    return {...event, program: programFor(event.program)?.name || event.program, presenters: [presenter]};
  }

  function isUpcoming(event, today, currentTime) {
    return event.date > today || (event.date === today && event.end > currentTime);
  }

  function statistics(events, today, currentTime) {
    const completed = events.filter((event) => event.status !== 'cancelled' && !isUpcoming(event, today, currentTime));
    const byPresenter = Object.fromEntries(presenters.map((name) => [name, 0]));
    const byProgram = new Map([...new Set([...programs.map((program) => program.name), ...events.map((event) => event.program)])].map((program) => [program, {total: 0, counts: {...byPresenter}}]));
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
  return {presenters, pending, programs, programFor, assign, isUpcoming, statistics};
})();
