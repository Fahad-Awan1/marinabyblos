// Availability search → RevChill booking engine.

const ENGINE = 'https://marinabyblos.revchillbook.com/en/bookcore/availability/tomorrow/marinabyblos';
const LIMITS = { adults: [1, 8], children: [0, 6], rooms: [1, 5] };

const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const addDays = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };

// TODO: confirm deep-link parameter names with RevChill. The base URL is the one
// the current site uses; the extra query params are ignored if unsupported.
function bookingUrl({ checkin, checkout, adults, children, rooms }) {
  const q = new URLSearchParams({ checkin, checkout, adults, children, rooms });
  return `${ENGINE}?${q}`;
}

function setup(form) {
  const state = { adults: 2, children: 0, rooms: 1 };
  const checkin = form.querySelector('[name=checkin]');
  const checkout = form.querySelector('[name=checkout]');
  const toggle = form.querySelector('.field__toggle');
  const pop = form.querySelector('.pop');
  const out = form.querySelector('[data-guests-out]');
  const showRooms = !form.querySelector('.field--rooms');

  const today = new Date();
  checkin.min = iso(today);
  checkin.value = iso(addDays(today, 1));
  checkout.min = iso(addDays(today, 2));
  checkout.value = iso(addDays(today, 3));

  checkin.addEventListener('change', () => {
    if (!checkin.value) return;
    const next = iso(addDays(new Date(checkin.value), 1));
    checkout.min = next;
    if (!checkout.value || checkout.value <= checkin.value) checkout.value = next;
  });

  const render = () => {
    form.querySelectorAll('[data-val]').forEach((o) => { o.textContent = state[o.dataset.val]; });
    const s = (n, w) => `${n} ${w}${n === 1 ? '' : w === 'Child' ? 'ren' : 's'}`;
    out.textContent = [s(state.adults, 'Adult'), s(state.children, 'Child'), showRooms && s(state.rooms, 'Room')]
      .filter(Boolean).join(' · ');
    form.querySelectorAll('[data-step]').forEach((b) => {
      const [key, dir] = b.dataset.step.split(':');
      const [min, max] = LIMITS[key];
      b.disabled = Number(dir) < 0 ? state[key] <= min : state[key] >= max;
    });
  };

  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-step]');
    if (!b) return;
    const [key, dir] = b.dataset.step.split(':');
    const [min, max] = LIMITS[key];
    state[key] = Math.min(max, Math.max(min, state[key] + Number(dir)));
    render();
  });

  const setOpen = (open) => {
    pop.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(pop.hidden));
  document.addEventListener('click', (e) => { if (!pop.hidden && !e.target.closest('.field--guests')?.contains(toggle)) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    window.location.href = bookingUrl({ checkin: checkin.value, checkout: checkout.value, ...state });
  });

  render();
}

export function initBooking() {
  document.querySelectorAll('[data-booking]').forEach(setup);
}
