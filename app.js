/* ============================================
   DIENE — Application Logic
   Charts · Animations · Exports · Reactivity
   ============================================ */

// ===== GLOBAL STATE =====
let CAPITAL = 10000;

const COLORS = {
  blue: '#3B82F6', green: '#10B981', amber: '#F59E0B',
  rose: '#F43F5E', purple: '#8B5CF6', teal: '#14B8A6',
  bg: '#0B0F1A', card: '#111827', text: '#94A3B8', white: '#F1F5F9'
};

const PLOTLY_LAYOUT = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { family: 'Inter, sans-serif', color: COLORS.text, size: 12 },
  margin: { t: 20, b: 50, l: 60, r: 20 },
  xaxis: {
    gridcolor: 'rgba(255,255,255,0.03)',
    zerolinecolor: 'rgba(255,255,255,0.05)',
    tickfont: { family: 'JetBrains Mono', size: 11 }
  },
  yaxis: {
    gridcolor: 'rgba(255,255,255,0.03)',
    zerolinecolor: 'rgba(255,255,255,0.05)',
    tickfont: { family: 'JetBrains Mono', size: 11 }
  },
  showlegend: false
};

const PLOTLY_CONFIG = { responsive: true, displayModeBar: false };

// ===== DATA =====
const ASSETS_DATA = [
  { name: 'LVMH', ret: 16.51, vol: 30.12, sharpe: 0.45, skew: -0.32, kurt: 4.87, var95: -2.81, alloc: 22.40, color: 'blue' },
  { name: 'Hermès', ret: 18.72, vol: 28.45, sharpe: 0.56, skew: -0.15, kurt: 3.62, var95: -2.48, alloc: 20.15, color: 'green' },
  { name: 'Airbus', ret: 17.93, vol: 37.24, sharpe: 0.40, skew: -0.18, kurt: 5.23, var95: -3.45, alloc: 15.80, color: 'amber' },
  { name: "L'Oréal", ret: 13.85, vol: 24.10, sharpe: 0.47, skew: -0.08, kurt: 3.41, var95: -2.15, alloc: 13.50, color: 'purple' },
  { name: 'Schneider', ret: 15.23, vol: 27.60, sharpe: 0.46, skew: -0.22, kurt: 4.15, var95: -2.67, alloc: 11.20, color: 'teal' },
  { name: 'BNP Paribas', ret: 13.50, vol: 36.80, sharpe: 0.29, skew: -0.45, kurt: 6.12, var95: -3.62, alloc: 7.85, color: 'rose' },
  { name: 'Sanofi', ret: 8.21, vol: 22.15, sharpe: 0.25, skew: -0.11, kurt: 3.94, var95: -2.12, alloc: 5.40, color: 'blue' },
  { name: 'TotalEnergies', ret: 9.87, vol: 25.90, sharpe: 0.30, skew: -0.28, kurt: 4.56, var95: -2.53, alloc: 3.70, color: 'green' }
];

const PORTFOLIO = { ret: 15.82, vol: 24.67, sharpe: 0.56, maxDD: -16.50 };

const CORR_MATRIX = [
  [1.00, 0.72, 0.51, 0.65, 0.48, 0.55, 0.41, 0.48],
  [0.72, 1.00, 0.42, 0.68, 0.44, 0.40, 0.38, 0.35],
  [0.51, 0.42, 1.00, 0.38, 0.52, 0.49, 0.34, 0.42],
  [0.65, 0.68, 0.38, 1.00, 0.46, 0.43, 0.45, 0.33],
  [0.48, 0.44, 0.52, 0.46, 1.00, 0.51, 0.36, 0.47],
  [0.55, 0.40, 0.49, 0.43, 0.51, 1.00, 0.39, 0.56],
  [0.41, 0.38, 0.34, 0.45, 0.36, 0.39, 1.00, 0.37],
  [0.48, 0.35, 0.42, 0.33, 0.47, 0.56, 0.37, 1.00]
];

// ===== TOAST =====
function showToast(icon, message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ===== TAB SWITCHING =====
const pageTitles = {
  description: "Le Projet", overview: "Vue d'ensemble", 
  stats: "Statistiques Descriptives", corr: "Corrélation", 
  markowitz: "Portefeuilles Markowitz", mc: "Simulations Monte-Carlo", 
  risk: "Risk Management", analyse: "Analyse & Signaux", 
  tests: "Tests Statistiques", about: "À propos"
};

function switchTab(id, el) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  el.classList.add('active');
  document.getElementById('pageTitle').textContent = pageTitles[id] || id;
  if (id === 'overview') { animateCounters(); animateAllocBars(); }
  if (id === 'markowitz' || id === 'risk') animateCounters();
  setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
}

// ===== ANIMATED COUNTERS =====
function animateCounters() {
  document.querySelectorAll('.kpi-value[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const isNeg = target < 0;
    const abs = Math.abs(target);
    const suffix = el.querySelector('small') ? el.querySelector('small').textContent : '';
    const dur = 1200;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = (ease * abs).toFixed(2);
      el.textContent = (isNeg ? '-' : '') + current;
      if (suffix) { const sm = document.createElement('small'); sm.textContent = suffix; el.appendChild(sm); }
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// ===== ALLOCATION BARS =====
function animateAllocBars() {
  document.querySelectorAll('.alloc-fill').forEach(bar => {
    const w = bar.dataset.width;
    bar.style.width = '0%';
    setTimeout(() => { bar.style.width = w + '%'; }, 200);
  });
}

// ===== LIVE CLOCK =====
function updateClock() {
  const now = new Date();
  const el = document.getElementById('liveClock');
  if (el) el.textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// ===== CAPITAL INPUT =====
function setupCapitalInput() {
  const input = document.getElementById('capitalInput');
  if (!input) return;

  // Format on load
  input.value = CAPITAL.toLocaleString('fr-FR');

  input.addEventListener('focus', () => {
    input.value = CAPITAL.toString();
    input.select();
  });

  input.addEventListener('blur', () => {
    const raw = input.value.replace(/[^0-9]/g, '');
    const val = parseInt(raw, 10);
    if (!isNaN(val) && val > 0) {
      CAPITAL = val;
      input.value = CAPITAL.toLocaleString('fr-FR');
      recalculate();
      showToast('💰', `Capital mis à jour : ${CAPITAL.toLocaleString('fr-FR')} €`);
    } else {
      input.value = CAPITAL.toLocaleString('fr-FR');
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur();
  });
}

function recalculate() {
  renderMonteCarlo();
  renderMCDist();
  renderDrawdown();

  // Update VaR amounts
  const varCells = document.querySelectorAll('#stats .val-rose');
  const varRates = [...ASSETS_DATA.map(a => a.var95), -2.64];
  varCells.forEach((cell, i) => {
    if (i < varRates.length) {
      const amount = (CAPITAL * varRates[i] / 100).toFixed(0);
      cell.title = `${amount.toLocaleString()} € par jour`;
    }
  });

  // Update scenario amounts + triggers
  const scenarios = [
    { id: 'scenBull', pct: 22.5 },
    { id: 'scenStable', pct: 8.2 },
    { id: 'scenCorr', pct: -18.7 },
    { id: 'scenKrach', pct: -35.2 }
  ];
  scenarios.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) {
      const val = Math.round(CAPITAL * s.pct / 100);
      el.textContent = (val >= 0 ? '+' : '') + val.toLocaleString('fr-FR') + ' €';
    }
  });

  // Expected weighted return
  const expected = Math.round(CAPITAL * 0.0703);
  const elExp = document.getElementById('scenExpected');
  if (elExp) elExp.innerHTML = '<strong>+' + expected.toLocaleString('fr-FR') + ' €</strong>';

  // Trigger amounts
  const trigBull = document.getElementById('trigBull');
  if (trigBull) trigBull.textContent = '+' + Math.round(CAPITAL * 0.075).toLocaleString('fr-FR') + ' €';
  const trigDiv = document.getElementById('trigDiv');
  if (trigDiv) trigDiv.textContent = '+' + Math.round(CAPITAL * 0.018).toLocaleString('fr-FR') + ' €';
  const trigCorr = document.getElementById('trigCorr');
  if (trigCorr) trigCorr.textContent = Math.round(CAPITAL * 0.70).toLocaleString('fr-FR') + ' €';
  const trigKrach = document.getElementById('trigKrach');
  if (trigKrach) trigKrach.textContent = Math.round(CAPITAL * 0.50).toLocaleString('fr-FR') + ' €';
}

// ===== CSV EXPORT =====
function exportCSV() {
  let csv = '\uFEFF'; // BOM for Excel UTF-8

  // Section 1: Portfolio Summary
  csv += 'DIENE - RAPPORT PORTFOLIO\n';
  csv += `Capital initial;${CAPITAL}\n`;
  csv += `Date;${new Date().toLocaleDateString('fr-FR')}\n`;
  csv += `Stratégie;MSR (Maximum Sharpe Ratio)\n\n`;

  // Section 2: KPIs
  csv += 'INDICATEURS CLÉS\n';
  csv += 'Métrique;Valeur\n';
  csv += `Rendement annualisé;${PORTFOLIO.ret}%\n`;
  csv += `Volatilité;${PORTFOLIO.vol}%\n`;
  csv += `Sharpe Ratio;${PORTFOLIO.sharpe}\n`;
  csv += `Max Drawdown;${PORTFOLIO.maxDD}%\n\n`;

  // Section 3: Allocation with amounts
  csv += 'ALLOCATION MSR\n';
  csv += 'Actif;Poids (%);Montant (€)\n';
  ASSETS_DATA.forEach(a => {
    csv += `${a.name};${a.alloc};${(CAPITAL * a.alloc / 100).toFixed(2)}\n`;
  });
  csv += '\n';

  // Section 4: Statistics
  csv += 'STATISTIQUES DESCRIPTIVES\n';
  csv += 'Actif;Rendement %;Volatilité %;Sharpe;Skewness;Kurtosis;VaR 95%;VaR Montant (€)\n';
  ASSETS_DATA.forEach(a => {
    csv += `${a.name};${a.ret};${a.vol};${a.sharpe};${a.skew};${a.kurt};${a.var95};${(CAPITAL * a.var95 / 100).toFixed(2)}\n`;
  });
  csv += `Portefeuille MSR;${PORTFOLIO.ret};${PORTFOLIO.vol};${PORTFOLIO.sharpe};-0.27;4.65;-2.64;${(CAPITAL * -2.64 / 100).toFixed(2)}\n\n`;

  // Section 5: Correlation
  csv += 'MATRICE DE CORRÉLATION\n';
  const names = ASSETS_DATA.map(a => a.name);
  csv += ';' + names.join(';') + '\n';
  CORR_MATRIX.forEach((row, i) => {
    csv += names[i] + ';' + row.join(';') + '\n';
  });

  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DIENE_Report_${CAPITAL}EUR_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📊', `CSV exporté — Capital: ${CAPITAL.toLocaleString('fr-FR')} €`);
}

// ===== PDF EXPORT =====
async function exportPDF() {
  const btn = document.getElementById('btnPdf');
  btn.disabled = true;
  btn.style.opacity = '0.5';
  showToast('⏳', 'Génération du PDF en cours...');

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const dateStr = new Date().toLocaleDateString('fr-FR');
    const capStr = CAPITAL.toLocaleString('fr-FR') + ' €';

    function header(title) {
      pdf.setFillColor(11, 15, 26);
      pdf.rect(0, 0, W, H, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(241, 245, 249);
      pdf.text('DIENE — Portfolio Analytics', 15, 16);
      pdf.setFontSize(10);
      pdf.setTextColor(148, 163, 184);
      pdf.text(title + '  |  Capital: ' + capStr + '  |  ' + dateStr, 15, 23);
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(0.4);
      pdf.line(15, 26, W - 15, 26);
    }

    async function addChart(chartId, x, y, w, h) {
      try {
        const el = document.getElementById(chartId);
        if (!el || !el.querySelector('.plot-container')) return;
        const img = await Plotly.toImage(el, { format: 'png', width: 900, height: 500 });
        pdf.addImage(img, 'PNG', x, y, w, h);
      } catch (e) { /* skip chart if error */ }
    }

    // === PAGE 1: Overview ===
    header("Vue d'ensemble");
    let y = 32;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(241, 245, 249);
    pdf.text('Indicateurs Clés', 15, y); y += 6;

    const kpis = [
      ['Rendement annualisé', PORTFOLIO.ret + '%', [16, 185, 129]],
      ['Volatilité', PORTFOLIO.vol + '%', [245, 158, 11]],
      ['Sharpe Ratio', PORTFOLIO.sharpe + '', [59, 130, 246]],
      ['Max Drawdown', PORTFOLIO.maxDD + '%', [244, 63, 94]]
    ];
    kpis.forEach((k, i) => {
      const bx = 15 + i * 65;
      pdf.setFillColor(17, 24, 39);
      pdf.roundedRect(bx, y, 60, 22, 3, 3, 'F');
      pdf.setFontSize(8); pdf.setTextColor(148, 163, 184);
      pdf.text(k[0], bx + 5, y + 7);
      pdf.setFontSize(16); pdf.setTextColor(k[2][0], k[2][1], k[2][2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text(k[1], bx + 5, y + 18);
    });
    y += 28;

    // Frontier chart
    await addChart('frontierChart', 15, y, 160, 90);

    // Allocation table
    pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(241, 245, 249);
    pdf.text('Allocation MSR', 185, y + 2);
    pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
    let ay = y + 10;
    ASSETS_DATA.forEach(a => {
      pdf.setTextColor(241, 245, 249);
      pdf.text(a.name, 185, ay);
      pdf.setTextColor(148, 163, 184);
      pdf.text(a.alloc + '%', 240, ay);
      const amt = (CAPITAL * a.alloc / 100).toFixed(0);
      pdf.text(amt + ' €', 260, ay);
      ay += 7;
    });

    // Monte Carlo chart below
    await addChart('monteCarloChart', 15, y + 95, 130, 70);
    await addChart('heatmapChart', 150, y + 95, 130, 70);

    // === PAGE 2: Statistics ===
    pdf.addPage(); header('Statistiques Descriptives');
    y = 32;
    pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(148, 163, 184);
    const cols = ['Actif', 'Rendement', 'Volatilité', 'Sharpe', 'Skewness', 'Kurtosis', 'VaR 95%', 'VaR (€)'];
    const colX = [15, 55, 85, 115, 140, 168, 195, 225];
    cols.forEach((c, i) => pdf.text(c, colX[i], y));
    y += 2;
    pdf.setDrawColor(30, 41, 59); pdf.line(15, y, W - 15, y); y += 5;

    pdf.setFont('helvetica', 'normal');
    ASSETS_DATA.forEach(a => {
      pdf.setTextColor(241, 245, 249); pdf.text(a.name, colX[0], y);
      pdf.setTextColor(16, 185, 129); pdf.text('+' + a.ret + '%', colX[1], y);
      pdf.setTextColor(241, 245, 249); pdf.text(a.vol + '%', colX[2], y);
      pdf.setTextColor(59, 130, 246); pdf.text(a.sharpe + '', colX[3], y);
      pdf.setTextColor(241, 245, 249); pdf.text(a.skew + '', colX[4], y);
      pdf.text(a.kurt + '', colX[5], y);
      pdf.setTextColor(244, 63, 94); pdf.text(a.var95 + '%', colX[6], y);
      pdf.text((CAPITAL * a.var95 / 100).toFixed(0) + ' €', colX[7], y);
      y += 8;
    });
    // Portfolio row
    pdf.setFont('helvetica', 'bold');
    pdf.setDrawColor(59, 130, 246); pdf.line(15, y - 3, W - 15, y - 3);
    pdf.setTextColor(241, 245, 249); pdf.text('Portefeuille MSR', colX[0], y);
    pdf.setTextColor(16, 185, 129); pdf.text('+' + PORTFOLIO.ret + '%', colX[1], y);
    pdf.setTextColor(241, 245, 249); pdf.text(PORTFOLIO.vol + '%', colX[2], y);
    pdf.setTextColor(59, 130, 246); pdf.text(PORTFOLIO.sharpe + '', colX[3], y);
    pdf.setTextColor(241, 245, 249); pdf.text('-0.27', colX[4], y);
    pdf.text('4.65', colX[5], y);
    pdf.setTextColor(244, 63, 94); pdf.text('-2.64%', colX[6], y);
    pdf.text((CAPITAL * -2.64 / 100).toFixed(0) + ' €', colX[7], y);

    // === PAGE 3: Correlation ===
    pdf.addPage(); header('Matrice de Corrélation');
    await addChart('corrFullChart', 30, 32, 230, 150);

    // === PAGE 4: Markowitz ===
    pdf.addPage(); header('Portefeuilles Markowitz');
    y = 34;
    const strats = [
      { name: 'CAC40 Benchmark', ret: 4.65, col: [148, 163, 184] },
      { name: 'Min Variance (MVP)', ret: 10.79, col: [245, 158, 11] },
      { name: 'Équipondéré', ret: 13.01, col: [139, 92, 246] },
      { name: 'Max Sharpe (MSR)', ret: 16.95, col: [16, 185, 129] }
    ];
    strats.forEach((s, i) => {
      const bx = 15 + i * 68;
      pdf.setFillColor(17, 24, 39);
      pdf.roundedRect(bx, y, 63, 30, 3, 3, 'F');
      pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(148, 163, 184);
      pdf.text(s.name, bx + 5, y + 10);
      pdf.setFontSize(18); pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(s.col[0], s.col[1], s.col[2]);
      pdf.text(s.ret + '%', bx + 5, y + 24);
    });
    await addChart('markowitzPlotly', 30, y + 38, 230, 120);

    // === PAGE 5: Monte Carlo ===
    pdf.addPage(); header('Simulations Monte-Carlo');
    await addChart('mcDistChart', 15, 32, 130, 100);
    await addChart('mcBarPlotly', 150, 32, 130, 100);

    // === PAGE 6: Tests ===
    pdf.addPage(); header('Tests Statistiques');
    y = 34;
    pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(148, 163, 184);
    const tcols = ['Actif', 'Jarque-Bera', 'p-value', 'Normalité', 'ADF stat', 'p-value', 'Stationnarité'];
    const tcX = [15, 60, 95, 125, 170, 205, 235];
    tcols.forEach((c, i) => pdf.text(c, tcX[i], y));
    y += 2; pdf.setDrawColor(30, 41, 59); pdf.line(15, y, W - 15, y); y += 6;

    const testData = [
      { name: 'LVMH', jb: 487.3, adf: -25.41 },
      { name: 'Airbus', jb: 612.8, adf: -24.87 },
      { name: 'BNP Paribas', jb: 892.1, adf: -26.12 },
      { name: 'Sanofi', jb: 234.5, adf: -27.34 },
      { name: 'TotalEnergies', jb: 356.9, adf: -25.98 }
    ];
    pdf.setFont('helvetica', 'normal');
    testData.forEach(t => {
      pdf.setTextColor(241, 245, 249); pdf.text(t.name, tcX[0], y);
      pdf.text(t.jb + '', tcX[1], y);
      pdf.text('0.000', tcX[2], y);
      pdf.setTextColor(244, 63, 94); pdf.text('Non normale', tcX[3], y);
      pdf.setTextColor(241, 245, 249); pdf.text(t.adf + '', tcX[4], y);
      pdf.text('0.000', tcX[5], y);
      pdf.setTextColor(16, 185, 129); pdf.text('Stationnaire', tcX[6], y);
      y += 8;
    });

    // Save
    pdf.save('DIENE_Report_' + CAPITAL + 'EUR_' + new Date().toISOString().slice(0, 10) + '.pdf');
    showToast('✅', 'PDF exporté avec succès');
  } catch (err) {
    console.error('PDF Error:', err);
    showToast('❌', 'Erreur PDF: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.style.opacity = '1';
  }
}

// ===== CHARTS =====

// Efficient Frontier
function renderFrontier() {
  const n = 4000;
  const xSim = [], ySim = [], sharpes = [];
  for (let i = 0; i < n; i++) {
    const vol = 15 + Math.random() * 30;
    const maxRet = -0.005 * (vol - 28) * (vol - 28) + 18;
    const ret = maxRet - Math.random() * 12;
    xSim.push(vol); ySim.push(ret); sharpes.push(ret / vol);
  }
  const frontierX = [], frontierY = [];
  for (let v = 15; v <= 42; v += 0.5) { frontierX.push(v); frontierY.push(-0.005 * (v - 28) * (v - 28) + 18); }

  Plotly.newPlot('frontierChart', [
    { x: xSim, y: ySim, mode: 'markers', type: 'scatter',
      marker: { size: 3.5, color: sharpes, colorscale: [[0,'#1E1B4B'],[0.3,'#3B82F6'],[0.6,'#10B981'],[1,'#FBBF24']], opacity: 0.6 },
      hovertemplate: 'Vol: %{x:.1f}%<br>Ret: %{y:.1f}%<extra></extra>' },
    { x: frontierX, y: frontierY, mode: 'lines', line: { color: 'rgba(255,255,255,0.15)', width: 2, dash: 'dot' } },
    { x: [28.34], y: [16.95], mode: 'markers+text', text: ['MSR'], textposition: 'top right',
      textfont: { color: COLORS.green, size: 13, family: 'Space Grotesk' },
      marker: { size: 16, color: COLORS.green, symbol: 'diamond', line: { color: 'white', width: 1.5 } } },
    { x: [22.15], y: [10.79], mode: 'markers+text', text: ['MVP'], textposition: 'top left',
      textfont: { color: COLORS.amber, size: 13, family: 'Space Grotesk' },
      marker: { size: 14, color: COLORS.amber, symbol: 'circle', line: { color: 'white', width: 1.5 } } }
  ], {
    ...PLOTLY_LAYOUT,
    xaxis: { ...PLOTLY_LAYOUT.xaxis, title: { text: 'Volatilité (%)', font: { size: 12 } } },
    yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: 'Rendement (%)', font: { size: 12 } } }
  }, PLOTLY_CONFIG);
}

// Monte Carlo
function renderMonteCarlo() {
  const traces = [];
  const paths = 60, steps = 252;
  for (let i = 0; i < paths; i++) {
    let val = CAPITAL;
    const arr = [val];
    for (let j = 0; j < steps; j++) {
      val *= Math.exp((0.1695/252 - 0.5*0.2834*0.2834/252) + (0.2834/Math.sqrt(252))*(Math.random()*2-1)*1.2);
      arr.push(val);
    }
    traces.push({ y: arr, mode: 'lines', line: { width: 1.2, color: arr[arr.length-1] > CAPITAL ? COLORS.green : COLORS.rose }, opacity: 0.25, hoverinfo: 'skip' });
  }
  let median = CAPITAL;
  const medArr = [median];
  for (let j = 0; j < steps; j++) { median *= Math.exp(0.1695/252); medArr.push(median); }
  traces.push({ y: medArr, mode: 'lines', line: { width: 3, color: COLORS.blue }, opacity: 1, name: 'Médiane' });

  Plotly.react('monteCarloChart', traces, {
    ...PLOTLY_LAYOUT,
    xaxis: { ...PLOTLY_LAYOUT.xaxis, title: { text: 'Jours de trading', font: { size: 12 } } },
    yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: 'Valeur (€)', font: { size: 12 } }, tickformat: ',.0f' },
    shapes: [{ type: 'line', x0: 0, x1: steps, y0: CAPITAL, y1: CAPITAL, line: { color: 'rgba(255,255,255,0.1)', width: 1, dash: 'dash' } }]
  }, PLOTLY_CONFIG);
}

// Heatmap
function renderHeatmap() {
  const assets = ['LVMH','Airbus','BNP','Sanofi','Total'];
  const annotations = [];
  for (let i = 0; i < assets.length; i++) for (let j = 0; j < assets.length; j++)
    annotations.push({ x: assets[j], y: assets[i], text: CORR_MATRIX[i][j].toFixed(2), showarrow: false,
      font: { family: 'JetBrains Mono', size: 13, color: CORR_MATRIX[i][j] > 0.6 ? '#0B0F1A' : '#F1F5F9' } });

  Plotly.newPlot('heatmapChart', [{ z: CORR_MATRIX, x: assets, y: assets, type: 'heatmap',
    colorscale: [[0,'#1E1B4B'],[0.5,'#3B82F6'],[1,'#10B981']], showscale: false,
    hovertemplate: '%{x} × %{y}: %{z:.2f}<extra></extra>' }],
    { ...PLOTLY_LAYOUT, annotations, xaxis: { ...PLOTLY_LAYOUT.xaxis, side: 'top' } }, PLOTLY_CONFIG);
}

// Donut
function renderDonut() {
  Plotly.newPlot('donutChart', [{ values: ASSETS_DATA.map(a => a.alloc), labels: ASSETS_DATA.map(a => a.name), type: 'pie', hole: 0.7,
    marker: { colors: [COLORS.blue, COLORS.green, COLORS.amber, COLORS.purple, COLORS.teal], line: { color: '#0B0F1A', width: 2 } },
    textinfo: 'none', hovertemplate: '%{label}: %{value}%<extra></extra>' }],
    { ...PLOTLY_LAYOUT, margin: { t: 0, b: 0, l: 0, r: 0 }, annotations: [{ text: '<b>MSR</b>', font: { size: 16, color: COLORS.white, family: 'Space Grotesk' }, showarrow: false }] }, PLOTLY_CONFIG);
}

// Correlation Full
function renderCorrFull() {
  const assets = ASSETS_DATA.map(a => a.name);
  const annotations = [];
  for (let i = 0; i < assets.length; i++) for (let j = 0; j < assets.length; j++)
    annotations.push({ x: assets[j], y: assets[i], text: CORR_MATRIX[i][j].toFixed(2), showarrow: false,
      font: { family: 'JetBrains Mono', size: 15, color: CORR_MATRIX[i][j] > 0.55 ? '#0B0F1A' : '#F1F5F9' } });

  Plotly.newPlot('corrFullChart', [{ z: CORR_MATRIX, x: assets, y: assets, type: 'heatmap',
    colorscale: [[0,'#1E1B4B'],[0.3,'#312E81'],[0.5,'#3B82F6'],[0.75,'#10B981'],[1,'#34D399']],
    showscale: true, colorbar: { tickfont: { family: 'JetBrains Mono', size: 11, color: COLORS.text }, outlinewidth: 0 },
    hovertemplate: '%{x} × %{y}: %{z:.2f}<extra></extra>' }],
    { ...PLOTLY_LAYOUT, annotations, height: 500, xaxis: { ...PLOTLY_LAYOUT.xaxis, side: 'top', tickangle: -30 }, margin: { t: 80, b: 20, l: 120, r: 40 } }, PLOTLY_CONFIG);
}

// Markowitz Comparison
function renderMarkowitz() {
  const strategies = ['CAC40<br>Benchmark','Min Variance<br>(MVP)','Équipondéré','Max Sharpe<br>(MSR)'];
  const returns = [4.65, 10.79, 13.01, 16.95];
  const colors = [COLORS.text, COLORS.amber, COLORS.purple, COLORS.green];

  Plotly.newPlot('markowitzPlotly', [{ x: strategies, y: returns, type: 'bar',
    marker: { color: colors.map(c => c + '33'), line: { color: colors, width: 2 } },
    text: returns.map(r => r + '%'), textposition: 'outside', textfont: { family: 'JetBrains Mono', size: 14, color: colors },
    hovertemplate: '%{x}<br>Rendement: %{y}%<extra></extra>' }],
    { ...PLOTLY_LAYOUT, height: 500, yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: 'Rendement annualisé (%)', font: { size: 12 } } }, bargap: 0.4 }, PLOTLY_CONFIG);
}

// MC Distribution
function renderMCDist() {
  const vals = [];
  for (let i = 0; i < 5000; i++) {
    let v = CAPITAL;
    for (let j = 0; j < 252; j++) v *= Math.exp((0.1695/252 - 0.5*0.2834*0.2834/252) + (0.2834/Math.sqrt(252))*(Math.random()*2-1)*1.2);
    vals.push(v);
  }

  Plotly.react('mcDistChart', [{ x: vals, type: 'histogram', nbinsx: 60,
    marker: { color: COLORS.blue + '55', line: { color: COLORS.blue, width: 1 } },
    hovertemplate: 'Valeur: %{x:,.0f}€<br>Fréquence: %{y}<extra></extra>' }],
    { ...PLOTLY_LAYOUT, height: 500,
      xaxis: { ...PLOTLY_LAYOUT.xaxis, title: { text: 'Valeur finale du portefeuille (€)', font: { size: 12 } }, tickformat: ',.0f' },
      yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: 'Fréquence', font: { size: 12 } } },
      shapes: [{ type: 'line', x0: CAPITAL, x1: CAPITAL, y0: 0, y1: 1, yref: 'paper', line: { color: COLORS.rose, width: 2, dash: 'dash' } }]
    }, PLOTLY_CONFIG);
}

// MC Bar
function renderMCBar() {
  const strats = ['MSR','Équipondéré','MVP','Stress (-30%)'];
  const probs = [67, 64, 58, 12];
  const colors = [COLORS.green, COLORS.blue, COLORS.amber, COLORS.rose];

  Plotly.newPlot('mcBarPlotly', [{ y: strats, x: probs, type: 'bar', orientation: 'h',
    marker: { color: colors.map(c => c + '44'), line: { color: colors, width: 2 } },
    text: probs.map(p => p + '%'), textposition: 'outside', textfont: { family: 'JetBrains Mono', size: 14, color: colors },
    hovertemplate: '%{y}: %{x}%<extra></extra>' }],
    { ...PLOTLY_LAYOUT, height: 500, xaxis: { ...PLOTLY_LAYOUT.xaxis, title: { text: 'Probabilité de gain (%)', font: { size: 12 } }, range: [0, 85] },
      margin: { ...PLOTLY_LAYOUT.margin, l: 120 }, bargap: 0.35 }, PLOTLY_CONFIG);
}

// ===== RISK MANAGEMENT CHARTS =====

function renderRollingVol() {
  const days = 1500;
  const target = 25;
  const x = [], yVol = [], yTarget = [];
  let vol = 26;
  for (let i = 0; i < days; i++) {
    const date = new Date(2020, 0, 1);
    date.setDate(date.getDate() + i);
    x.push(date.toISOString().slice(0, 10));
    vol += (Math.random() - 0.48) * 2.5;
    vol = Math.max(12, Math.min(45, vol));
    if (i > 200 && i < 280) vol += (Math.random()) * 3;
    yVol.push(vol);
    yTarget.push(target);
  }

  Plotly.newPlot('rollingVolChart', [
    { x, y: yVol, mode: 'lines', name: 'Vol réalisée',
      line: { width: 2, color: COLORS.amber },
      fill: 'tozeroy', fillcolor: 'rgba(245,158,11,0.08)',
      hovertemplate: '%{x}<br>Vol: %{y:.1f}%<extra></extra>' },
    { x, y: yTarget, mode: 'lines', name: 'Cible 25%',
      line: { width: 2, color: COLORS.blue, dash: 'dash' } }
  ], {
    ...PLOTLY_LAYOUT,
    showlegend: true,
    legend: { x: 0, y: 1.1, orientation: 'h', font: { size: 11, color: COLORS.text } },
    xaxis: { ...PLOTLY_LAYOUT.xaxis, type: 'date' },
    yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: 'Volatilité (%)', font: { size: 12 } } },
    shapes: [{
      type: 'rect', x0: x[200], x1: x[280], y0: 0, y1: 1, yref: 'paper',
      fillcolor: 'rgba(244,63,94,0.06)', line: { width: 0 }
    }],
    annotations: [{
      x: x[240], y: 42, text: 'Stress Period', showarrow: false,
      font: { size: 10, color: COLORS.rose }
    }]
  }, PLOTLY_CONFIG);
}

function renderRiskBudget() {
  const assets = ASSETS_DATA.map(a => a.name);
  const riskContrib = [52.1, 38.4, 5.2, 2.8, 1.5];
  const colors = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.purple, COLORS.teal];

  Plotly.newPlot('riskBudgetChart', [{
    labels: assets,
    values: riskContrib,
    type: 'pie',
    hole: 0.55,
    marker: {
      colors: colors,
      line: { color: '#0B0F1A', width: 2 }
    },
    textinfo: 'label+percent',
    textfont: { size: 11, color: '#F1F5F9', family: 'Inter' },
    hovertemplate: '%{label}<br>Risk contrib: %{value}%<extra></extra>',
    pull: [0.03, 0.02, 0, 0, 0]
  }], {
    ...PLOTLY_LAYOUT,
    margin: { t: 10, b: 10, l: 10, r: 10 },
    annotations: [{
      text: '<b>Risk<br>Budget</b>',
      font: { size: 14, color: COLORS.white, family: 'Space Grotesk' },
      showarrow: false
    }]
  }, PLOTLY_CONFIG);
}

function renderDrawdown() {
  const days = 1500;
  const x = [], dd = [];
  let peak = CAPITAL, val = CAPITAL;
  for (let i = 0; i < days; i++) {
    const date = new Date(2020, 0, 1);
    date.setDate(date.getDate() + i);
    x.push(date.toISOString().slice(0, 10));
    val *= Math.exp((0.1695 / 252 - 0.5 * 0.2834 * 0.2834 / 252) + (0.2834 / Math.sqrt(252)) * (Math.random() * 2 - 1));
    if (i > 200 && i < 260) val *= 0.997;
    if (val > peak) peak = val;
    dd.push(((val - peak) / peak) * 100);
  }

  Plotly.newPlot('drawdownChart', [{
    x, y: dd,
    mode: 'lines',
    fill: 'tozeroy',
    fillcolor: 'rgba(244,63,94,0.15)',
    line: { width: 1.5, color: COLORS.rose },
    hovertemplate: '%{x}<br>Drawdown: %{y:.1f}%<extra></extra>'
  }], {
    ...PLOTLY_LAYOUT,
    xaxis: { ...PLOTLY_LAYOUT.xaxis, type: 'date' },
    yaxis: { ...PLOTLY_LAYOUT.yaxis, title: { text: 'Drawdown (%)', font: { size: 12 } }, range: [Math.min(...dd) * 1.1, 2] },
    shapes: [{
      type: 'line', x0: x[0], x1: x[x.length - 1], y0: -21, y1: -21,
      line: { color: 'rgba(244,63,94,0.4)', width: 1, dash: 'dot' }
    }],
    annotations: [{
      x: x[Math.floor(days * 0.8)], y: -21, text: 'Max DD: -21%', showarrow: false,
      font: { size: 10, color: COLORS.rose }, yshift: -12
    }]
  }, PLOTLY_CONFIG);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderFrontier();
  renderMonteCarlo();
  renderHeatmap();
  renderDonut();
  renderCorrFull();
  renderMarkowitz();
  renderMCDist();
  renderMCBar();
  renderRollingVol();
  renderRiskBudget();
  renderDrawdown();

  animateCounters();
  setTimeout(animateAllocBars, 400);
  setupCapitalInput();

  document.getElementById('btnCsv').addEventListener('click', exportCSV);
  document.getElementById('btnPdf').addEventListener('click', exportPDF);
});
