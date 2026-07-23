// FriendlyTeaching.cl — IELTS Academic Task 1 visual helpers
// Small hand-rolled chart generators — no chart library dependency.
// Each returns raw <svg>…</svg> string, embedded in the prompt data.

const AXIS = '#1B2C3F';
const GRID = '#E5E7EB';
const COLORS = ['#5A3D7A', '#E8B547', '#0284C7', '#059669', '#DB2777', '#B45309'];

function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function barChart(opts: {
  title:     string;
  yLabel:    string;
  xLabels:   string[];
  series:    { name: string; values: number[] }[];  // grouped bars
  yMax?:     number;
}): string {
  const W = 640, H = 360, PAD_L = 60, PAD_R = 20, PAD_T = 20, PAD_B = 70;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const yMax = opts.yMax ?? Math.ceil(Math.max(...opts.series.flatMap(s => s.values)) * 1.1);
  const ticks = 5;

  const groupW = chartW / opts.xLabels.length;
  const barW = (groupW * 0.7) / opts.series.length;

  const grid = Array.from({ length: ticks + 1 }, (_, i) => {
    const y = PAD_T + chartH - (i / ticks) * chartH;
    const val = (yMax * i) / ticks;
    return `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="${GRID}" stroke-width="1"/>
<text x="${PAD_L - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="${AXIS}">${fmtNum(val)}</text>`;
  }).join('');

  const bars = opts.xLabels.map((label, gi) => {
    const gx = PAD_L + gi * groupW + (groupW * 0.15);
    const bars = opts.series.map((s, si) => {
      const v = s.values[gi];
      const bh = (v / yMax) * chartH;
      const x = gx + si * barW;
      const y = PAD_T + chartH - bh;
      return `<rect x="${x}" y="${y}" width="${barW - 2}" height="${bh}" fill="${COLORS[si % COLORS.length]}"/>
<text x="${x + (barW - 2) / 2}" y="${y - 4}" text-anchor="middle" font-size="10" fill="${AXIS}">${fmtNum(v)}</text>`;
    }).join('');
    const lx = PAD_L + gi * groupW + groupW / 2;
    return bars + `<text x="${lx}" y="${H - PAD_B + 18}" text-anchor="middle" font-size="11" fill="${AXIS}">${label}</text>`;
  }).join('');

  const legend = opts.series.map((s, i) => {
    const x = PAD_L + i * 130;
    const y = H - 18;
    return `<rect x="${x}" y="${y - 10}" width="14" height="10" fill="${COLORS[i % COLORS.length]}"/>
<text x="${x + 20}" y="${y - 1}" font-size="11" fill="${AXIS}">${s.name}</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${opts.title}" style="max-width:100%;height:auto;font-family:Inter,system-ui,sans-serif;background:#fff">
<text x="${W / 2}" y="14" text-anchor="middle" font-size="13" font-weight="700" fill="${AXIS}">${opts.title}</text>
<text x="${PAD_L}" y="${PAD_T - 6}" font-size="10" fill="${AXIS}">${opts.yLabel}</text>
${grid}
${bars}
<line x1="${PAD_L}" y1="${H - PAD_B}" x2="${W - PAD_R}" y2="${H - PAD_B}" stroke="${AXIS}" stroke-width="1.5"/>
<line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${H - PAD_B}" stroke="${AXIS}" stroke-width="1.5"/>
${legend}
</svg>`;
}

export function lineChart(opts: {
  title:   string;
  yLabel:  string;
  xLabels: string[];
  series:  { name: string; values: number[] }[];
  yMax?:   number;
}): string {
  const W = 640, H = 360, PAD_L = 60, PAD_R = 20, PAD_T = 20, PAD_B = 70;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const yMax = opts.yMax ?? Math.ceil(Math.max(...opts.series.flatMap(s => s.values)) * 1.1);
  const ticks = 5;
  const stepX = chartW / (opts.xLabels.length - 1);

  const grid = Array.from({ length: ticks + 1 }, (_, i) => {
    const y = PAD_T + chartH - (i / ticks) * chartH;
    const val = (yMax * i) / ticks;
    return `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="${GRID}" stroke-width="1"/>
<text x="${PAD_L - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="${AXIS}">${fmtNum(val)}</text>`;
  }).join('');

  const xlabels = opts.xLabels.map((label, i) => {
    const x = PAD_L + i * stepX;
    return `<text x="${x}" y="${H - PAD_B + 18}" text-anchor="middle" font-size="11" fill="${AXIS}">${label}</text>`;
  }).join('');

  const lines = opts.series.map((s, si) => {
    const color = COLORS[si % COLORS.length];
    const points = s.values.map((v, i) => {
      const x = PAD_L + i * stepX;
      const y = PAD_T + chartH - (v / yMax) * chartH;
      return `${x},${y}`;
    }).join(' ');
    const dots = s.values.map((v, i) => {
      const x = PAD_L + i * stepX;
      const y = PAD_T + chartH - (v / yMax) * chartH;
      return `<circle cx="${x}" cy="${y}" r="3.5" fill="${color}"/><text x="${x}" y="${y - 8}" text-anchor="middle" font-size="10" fill="${AXIS}">${fmtNum(v)}</text>`;
    }).join('');
    return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5"/>${dots}`;
  }).join('');

  const legend = opts.series.map((s, i) => {
    const x = PAD_L + i * 130;
    const y = H - 18;
    return `<line x1="${x}" y1="${y - 5}" x2="${x + 18}" y2="${y - 5}" stroke="${COLORS[i % COLORS.length]}" stroke-width="3"/>
<text x="${x + 24}" y="${y - 1}" font-size="11" fill="${AXIS}">${s.name}</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${opts.title}" style="max-width:100%;height:auto;font-family:Inter,system-ui,sans-serif;background:#fff">
<text x="${W / 2}" y="14" text-anchor="middle" font-size="13" font-weight="700" fill="${AXIS}">${opts.title}</text>
<text x="${PAD_L}" y="${PAD_T - 6}" font-size="10" fill="${AXIS}">${opts.yLabel}</text>
${grid}
<line x1="${PAD_L}" y1="${H - PAD_B}" x2="${W - PAD_R}" y2="${H - PAD_B}" stroke="${AXIS}" stroke-width="1.5"/>
<line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${H - PAD_B}" stroke="${AXIS}" stroke-width="1.5"/>
${lines}
${xlabels}
${legend}
</svg>`;
}

export function pieChart(opts: {
  title:  string;
  slices: { label: string; value: number }[];
}): string {
  const W = 480, H = 360, CX = 180, CY = 180, R = 130;
  const total = opts.slices.reduce((a, b) => a + b.value, 0);

  let angle = -Math.PI / 2;
  const paths = opts.slices.map((s, i) => {
    const frac = s.value / total;
    const a2 = angle + frac * Math.PI * 2;
    const x1 = CX + R * Math.cos(angle);
    const y1 = CY + R * Math.sin(angle);
    const x2 = CX + R * Math.cos(a2);
    const y2 = CY + R * Math.sin(a2);
    const large = frac > 0.5 ? 1 : 0;
    const d = `M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} Z`;
    const midA = (angle + a2) / 2;
    const lx = CX + (R * 0.65) * Math.cos(midA);
    const ly = CY + (R * 0.65) * Math.sin(midA);
    angle = a2;
    return `<path d="${d}" fill="${COLORS[i % COLORS.length]}" stroke="#fff" stroke-width="2"/>
<text x="${lx}" y="${ly}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${((s.value / total) * 100).toFixed(0)}%</text>`;
  }).join('');

  const legend = opts.slices.map((s, i) => {
    const y = 40 + i * 26;
    return `<rect x="330" y="${y - 12}" width="14" height="14" fill="${COLORS[i % COLORS.length]}"/>
<text x="352" y="${y}" font-size="12" fill="${AXIS}">${s.label} — ${s.value}</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${opts.title}" style="max-width:100%;height:auto;font-family:Inter,system-ui,sans-serif;background:#fff">
<text x="${W / 2}" y="18" text-anchor="middle" font-size="13" font-weight="700" fill="${AXIS}">${opts.title}</text>
${paths}
${legend}
</svg>`;
}

export function tableChart(opts: {
  title:   string;
  headers: string[];
  rows:    (string | number)[][];
}): string {
  const colW = 110;
  const rowH = 32;
  const W = 60 + colW * opts.headers.length;
  const H = 40 + rowH * (opts.rows.length + 1) + 10;

  const headers = opts.headers.map((h, i) => {
    const x = 30 + i * colW;
    return `<rect x="${x}" y="30" width="${colW}" height="${rowH}" fill="#5A3D7A"/>
<text x="${x + colW / 2}" y="50" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${h}</text>`;
  }).join('');

  const rows = opts.rows.map((r, ri) => {
    const y = 30 + rowH * (ri + 1);
    const bg = ri % 2 === 0 ? '#FDFAFF' : '#F0E5FF';
    return r.map((cell, ci) => {
      const x = 30 + ci * colW;
      const bold = ci === 0 ? 'font-weight="700"' : '';
      return `<rect x="${x}" y="${y}" width="${colW}" height="${rowH}" fill="${bg}" stroke="#E8D5F0"/>
<text x="${x + colW / 2}" y="${y + 20}" text-anchor="middle" font-size="12" ${bold} fill="${AXIS}">${cell}</text>`;
    }).join('');
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${opts.title}" style="max-width:100%;height:auto;font-family:Inter,system-ui,sans-serif;background:#fff">
<text x="${W / 2}" y="18" text-anchor="middle" font-size="13" font-weight="700" fill="${AXIS}">${opts.title}</text>
${headers}
${rows}
</svg>`;
}

/** Hand-drawn map of a park before/after redevelopment (two-panel SVG). */
export function beforeAfterMap(opts: {
  title:  string;
  before: { label: string; svg: string };
  after:  { label: string; svg: string };
}): string {
  const W = 720, H = 340;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${opts.title}" style="max-width:100%;height:auto;font-family:Inter,system-ui,sans-serif;background:#fff">
<text x="${W / 2}" y="18" text-anchor="middle" font-size="13" font-weight="700" fill="${AXIS}">${opts.title}</text>
<text x="170" y="42" text-anchor="middle" font-size="12" font-weight="700" fill="${AXIS}">${opts.before.label}</text>
<g transform="translate(20,50)">${opts.before.svg}</g>
<text x="540" y="42" text-anchor="middle" font-size="12" font-weight="700" fill="${AXIS}">${opts.after.label}</text>
<g transform="translate(380,50)">${opts.after.svg}</g>
</svg>`;
}
