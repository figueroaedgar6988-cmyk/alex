// Parlor Soda Co. interactions. Prices and store results are sample data.
(function () {
  const FLAVORS = [
    { id: 'cherry', name: 'Black Cherry Vanilla', short: 'Cherry', notes: 'Dark cherry juice with Madagascar vanilla bean.' },
    { id: 'orange', name: 'Blood Orange Ginger', short: 'Orange', notes: 'Bright blood orange and a warm ginger finish.' },
    { id: 'yuzu', name: 'Yuzu Lime', short: 'Yuzu', notes: 'Tart yuzu and lime, sharp and clean.' },
    { id: 'cola', name: 'Craft Cola', short: 'Cola', notes: 'Kola nut, cinnamon, citrus peel and cane sugar.' },
    { id: 'grapefruit', name: 'Grapefruit Salt', short: 'Grapefruit', notes: 'Pink grapefruit with a pinch of sea salt.' },
    { id: 'rootbeer', name: 'Sarsaparilla Root Beer', short: 'Root beer', notes: 'Sassafras, wintergreen and a creamy head.' },
  ];
  const byId = Object.fromEntries(FLAVORS.map((f) => [f.id, f]));
  const PRICE_CAN = 3.25;
  const PACK_SIZE = 12;
  const PACK_PRICE = 36;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, r = document) => r.querySelector(s);
  const icon = (id, cls = 'i') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;

  // Cans: fill any [data-flavor].can with its rims and label
  function paintCan(el) {
    const f = byId[el.dataset.flavor];
    el.innerHTML = `<span class="rim"></span><span class="band"><b>Parlor</b><em>${f.short}</em></span><span class="rim bottom"></span>`;
  }
  const canHTML = (id, cls = '') => `<div class="can ${cls}" data-flavor="${id}" aria-hidden="true"></div>`;

  // Theme
  const root = document.documentElement;
  const themeBtn = $('#theme');
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let stored = null;
  try { stored = localStorage.getItem('parlor-theme'); } catch (e) {}
  const current = () => root.dataset.theme || (media.matches ? 'dark' : 'light');
  function setTheme(t) {
    root.dataset.theme = t;
    themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  setTheme(stored || current());
  media.addEventListener('change', (e) => {
    let s = null;
    try { s = localStorage.getItem('parlor-theme'); } catch (err) {}
    if (!s) setTheme(e.matches ? 'dark' : 'light');
  });
  themeBtn.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('parlor-theme', next); } catch (e) {}
  });

  // Nav shadow once the hero top leaves the viewport
  const navWrap = $('.nav-wrap');
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px';
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => navWrap.classList.toggle('scrolled', !e.isIntersecting)).observe(sentinel);

  // Marquee: two identical halves so the loop is seamless
  const words = FLAVORS.map((f) => `<span>${f.name}${icon('orange-slice')}</span>`).join('');
  $('#marquee').innerHTML = words + words;

  // Toast
  const toast = $('#toast');
  let toastTimer;
  function showToast(msg) {
    toast.innerHTML = icon('check') + '<span></span>';
    toast.lastChild.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  // Bag
  let bagCount = 0;
  const bagBtn = $('#bag');
  const bagCountEl = $('#bag-count');
  function addToBag(n, label) {
    bagCount += n;
    bagCountEl.textContent = bagCount;
    bagBtn.setAttribute('aria-label', `Bag, ${bagCount} item${bagCount === 1 ? '' : 's'}`);
    bagCountEl.classList.remove('bump');
    void bagCountEl.offsetWidth;
    bagCountEl.classList.add('bump');
    showToast(label);
  }
  bagBtn.addEventListener('click', () => showToast(bagCount ? `${bagCount} item${bagCount === 1 ? '' : 's'} in your bag. Checkout is not part of this demo.` : 'Your bag is empty.'));

  // Flavor shelf
  const shelf = $('#shelf');
  shelf.innerHTML = FLAVORS.map((f) => `
    <li class="card" data-flavor="${f.id}">
      <div class="card-art">${canHTML(f.id)}</div>
      <div class="card-body">
        <h3>${f.name}</h3>
        <p>${f.notes}</p>
        <div class="card-foot">
          <span class="price">$${PRICE_CAN.toFixed(2)} <small>/ can</small></span>
          <button class="btn btn-primary" type="button" data-add="${f.id}" aria-label="Add ${f.name} to bag">Add to bag</button>
        </div>
      </div>
    </li>`).join('');
  shelf.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (b) addToBag(1, `${byId[b.dataset.add].name} added to your bag.`);
  });
  const shelfBtns = document.querySelectorAll('[data-shelf]');
  function updateShelfBtns() {
    const max = shelf.scrollWidth - shelf.clientWidth - 2;
    shelfBtns[0].disabled = shelf.scrollLeft <= 2;
    shelfBtns[1].disabled = shelf.scrollLeft >= max;
  }
  shelfBtns.forEach((b) => b.addEventListener('click', () => {
    const card = shelf.querySelector('.card');
    const step = card.getBoundingClientRect().width + 20;
    shelf.scrollBy({ left: step * Number(b.dataset.shelf), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  }));
  shelf.addEventListener('scroll', () => requestAnimationFrame(updateShelfBtns), { passive: true });
  window.addEventListener('resize', updateShelfBtns);

  // Pack builder
  const counts = Object.fromEntries(FLAVORS.map((f) => [f.id, 0]));
  const picker = $('#picker');
  const slotsEl = $('#slots');
  const status = $('#pack-status');
  const addPack = $('#pack-add');
  picker.innerHTML = FLAVORS.map((f) => `
    <li class="pick" data-flavor="${f.id}">
      <span class="dot-top" aria-hidden="true"></span>
      <span class="pick-name" id="pn-${f.id}">${f.name}</span>
      <div class="stepper" role="group" aria-labelledby="pn-${f.id}">
        <button class="icon-btn" type="button" data-step="-1" data-id="${f.id}" aria-label="Remove one ${f.name}">${icon('minus')}</button>
        <output id="out-${f.id}" aria-live="off">0</output>
        <button class="icon-btn" type="button" data-step="1" data-id="${f.id}" aria-label="Add one ${f.name}">${icon('plus')}</button>
      </div>
    </li>`).join('');
  slotsEl.innerHTML = Array.from({ length: PACK_SIZE }, () => '<span class="slot"></span>').join('');
  const slots = [...slotsEl.children];
  const total = () => Object.values(counts).reduce((a, b) => a + b, 0);

  function renderPack(changedIndex) {
    const order = FLAVORS.flatMap((f) => Array(counts[f.id]).fill(f.id));
    slots.forEach((s, i) => {
      const id = order[i];
      s.classList.toggle('filled', !!id);
      if (id) s.dataset.flavor = id; else delete s.dataset.flavor;
    });
    if (changedIndex != null && slots[changedIndex]) {
      slots[changedIndex].classList.remove('pop'); void slots[changedIndex].offsetWidth; slots[changedIndex].classList.add('pop');
    }
    const n = total();
    FLAVORS.forEach((f) => {
      $('#out-' + f.id).textContent = counts[f.id];
      picker.querySelector(`[data-id="${f.id}"][data-step="-1"]`).disabled = counts[f.id] === 0;
      picker.querySelector(`[data-id="${f.id}"][data-step="1"]`).disabled = n >= PACK_SIZE;
    });
    addPack.disabled = n !== PACK_SIZE;
    status.textContent = n === 0 ? 'Pick 12 cans to fill your pack.'
      : n < PACK_SIZE ? `${n} of 12 picked. ${PACK_SIZE - n} to go.`
      : 'Your pack is full.';
    const names = FLAVORS.filter((f) => counts[f.id]).map((f) => `${counts[f.id]} ${f.name}`);
    slotsEl.setAttribute('aria-label', n ? `12-pack with ${names.join(', ')}` : 'Empty 12-pack');
  }
  picker.addEventListener('click', (e) => {
    const b = e.target.closest('[data-step]');
    if (!b || b.disabled) return;
    const step = Number(b.dataset.step);
    const before = total();
    counts[b.dataset.id] = Math.max(0, counts[b.dataset.id] + step);
    renderPack(step > 0 ? before : null);
  });
  $('#pack-random').addEventListener('click', () => {
    let n = total();
    while (n < PACK_SIZE) { counts[FLAVORS[Math.floor(Math.random() * FLAVORS.length)].id]++; n++; }
    renderPack();
  });
  $('#pack-clear').addEventListener('click', () => { FLAVORS.forEach((f) => { counts[f.id] = 0; }); renderPack(); });
  addPack.addEventListener('click', () => {
    addToBag(PACK_SIZE, `Your 12-pack is in the bag ($${PACK_PRICE.toFixed(2)}).`);
    FLAVORS.forEach((f) => { counts[f.id] = 0; });
    renderPack();
  });
  renderPack();

  // Store finder (sample data)
  const form = $('#zip-form');
  const zip = $('#zip');
  const zipError = $('#zip-error');
  const results = $('#results');
  const STORES = [
    ['Hollow Tree Deli', '1412 Lorain Ave'], ['Greenleaf Market', '88 W 25th St'], ['Corner Cup Café', '3021 Detroit Ave'],
    ['Pine & Main Grocery', '640 Main St'], ['Northside Provisions', '19 Clark Ave'],
  ];
  function setError(msg) {
    zipError.textContent = msg;
    zipError.hidden = !msg;
    if (msg) zip.setAttribute('aria-invalid', 'true'); else zip.removeAttribute('aria-invalid');
  }
  zip.addEventListener('input', () => { zip.value = zip.value.replace(/\D/g, '').slice(0, 5); if (!zipError.hidden && zip.value.length === 5) setError(''); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = zip.value.trim();
    if (!v) { setError('Enter a ZIP code to search.'); zip.focus(); return; }
    if (!/^\d{5}$/.test(v)) { setError('ZIP codes are 5 digits, for example 44113.'); zip.focus(); return; }
    setError('');
    results.setAttribute('aria-busy', 'true');
    results.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
    setTimeout(() => {
      results.removeAttribute('aria-busy');
      const seed = Number(v);
      if (seed % 7 === 0) {
        results.innerHTML = `<div class="results-empty">${icon('map-pin', 'i-lg')}<p>No stores within 25 miles of ${v} yet. Try a nearby ZIP code, or build a pack and we will ship it to you.</p><a class="btn btn-ghost" href="#pack">Build a pack</a></div>`;
        return;
      }
      const count = 3 + (seed % 2);
      results.innerHTML = STORES.slice(0, count).map(([name, addr], i) => {
        const miles = (0.4 + i * 1.3 + (seed % 5) * 0.2).toFixed(1);
        return `<div class="store">${icon('map-pin')}<div><b>${name}</b><span>${addr}</span></div><span class="dist">${miles} mi</span></div>`;
      }).join('');
    }, 700);
  });

  // Paint every can on the page
  document.querySelectorAll('.can[data-flavor]').forEach(paintCan);
  updateShelfBtns();
})();
