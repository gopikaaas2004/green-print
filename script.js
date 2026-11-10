// ===== Simplified emission factors (kg CO2 per unit) =====
const FACTORS = {
  car: 0.17 * 52,      // per km/week -> per year
  bus: 0.04 * 52,
  short: 250,          // per short flight
  long: 1500,          // per long-haul flight
  elec: 0.7 * 12,      // per kWh/month -> per year (coal-heavy grid)
  lpg: 42,             // per 14.2 kg cylinder
};

const sliders = ['car', 'bus', 'short', 'long', 'elec', 'lpg'];
const choice = { diet: 1.4, shop: 0.7 }; // tonnes per year

// Option button groups
document.querySelectorAll('.option-group').forEach(group => {
  group.addEventListener('click', e => {
    const btn = e.target.closest('.opt');
    if (!btn) return;
    group.querySelectorAll('.opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    choice[group.dataset.name] = +btn.dataset.val;
    update();
  });
});

sliders.forEach(id => document.getElementById(id).addEventListener('input', update));

const ring = document.getElementById('ringFg');
const CIRC = 2 * Math.PI * 85;
ring.style.strokeDasharray = CIRC;

const tips = {
  Travel: 'Travel is your biggest source. Try carpooling, the metro, or cycling short trips — and consider a train instead of a short flight.',
  Home: 'Home energy leads your footprint. Switch to LED bulbs, set the AC to 24–26°C, and look into rooftop solar.',
  Food: 'Food is your biggest slice. Swapping a few meat meals a week for dal, beans or paneer makes a real difference.',
  Shopping: 'Shopping tops your list. Buy fewer, better things — repair, rent or thrift before buying new.',
};

function update() {
  const v = {};
  sliders.forEach(id => {
    v[id] = +document.getElementById(id).value;
    document.getElementById(id + 'Out').textContent = v[id];
  });

  const parts = {
    Travel: (v.car * FACTORS.car + v.bus * FACTORS.bus + v.short * FACTORS.short + v.long * FACTORS.long) / 1000,
    Home: (v.elec * FACTORS.elec + v.lpg * FACTORS.lpg) / 1000,
    Food: choice.diet,
    Shopping: choice.shop,
  };
  const total = Object.values(parts).reduce((a, b) => a + b, 0);

  // Ring: full circle = 12 tonnes
  const pct = Math.min(total / 12, 1);
  ring.style.strokeDashoffset = CIRC * (1 - pct);
  ring.style.stroke = total < 2.5 ? '#4f8a5b' : total < 5 ? '#d9a54f' : '#d9534f';
  document.getElementById('total').textContent = total.toFixed(1);

  const verdict = document.getElementById('verdict');
  if (total < 2.5) verdict.textContent = '🌿 Excellent — you\'re close to a sustainable level!';
  else if (total < 5) verdict.textContent = '🌤️ Not bad — a few changes will go a long way.';
  else verdict.textContent = '🔥 High footprint — lots of room to improve.';

  const colors = { Travel: '#4f8a5b', Home: '#d9a54f', Food: '#d97b4f', Shopping: '#7a8fd9' };
  document.getElementById('breakdown').innerHTML = Object.entries(parts).map(([k, val]) => `
    <div class="bar-row">
      <div class="label"><span>${k}</span><span>${val.toFixed(2)} t</span></div>
      <div class="bar"><div style="width:${total ? (val / total) * 100 : 0}%;background:${colors[k]}"></div></div>
    </div>`).join('');

  const biggest = Object.entries(parts).sort((a, b) => b[1] - a[1])[0][0];
  document.getElementById('tip').innerHTML = `<strong>💡 Tip:</strong> ${tips[biggest]}`;
}
update();

// ===== Pledges =====
const pledges = [
  { icon: '🚲', text: 'Cycle or walk trips under 3 km', kg: 300 },
  { icon: '🥗', text: 'Go meat-free 3 days a week', kg: 350 },
  { icon: '💡', text: 'Switch every bulb to LED', kg: 120 },
  { icon: '❄️', text: 'Set AC to 25°C instead of 20°C', kg: 250 },
  { icon: '🛍️', text: 'Carry a reusable bag & bottle', kg: 40 },
  { icon: '🚆', text: 'Take a train instead of one flight', kg: 200 },
];
const maxPledge = pledges.reduce((a, p) => a + p.kg, 0);
const list = document.getElementById('pledgeList');

list.innerHTML = pledges.map((p, i) => `
  <div class="col-sm-6">
    <div class="pledge" data-i="${i}">
      <span class="check"><i class="bi bi-check-lg"></i></span>
      <div>${p.icon} ${p.text}<small>saves ~${p.kg} kg/yr</small></div>
    </div>
  </div>`).join('');

list.addEventListener('click', e => {
  const card = e.target.closest('.pledge');
  if (!card) return;
  card.classList.toggle('done');
  const sum = [...list.querySelectorAll('.pledge.done')].reduce((a, el) => a + pledges[+el.dataset.i].kg, 0);
  document.getElementById('pledgeTotal').textContent = sum.toLocaleString() + ' kg';
  document.getElementById('pledgeBar').style.width = (sum / maxPledge) * 100 + '%';
});