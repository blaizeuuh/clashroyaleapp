/**
 * app.js — CRStats : logique principale
 * La clé API est chargée depuis config.js (jamais commité).
 * Copiez config.example.js → config.js et ajoutez votre clé.
 */

// Proxy CORS (transmet les headers Authorization)
const BASE = 'https://api.clashroyale.com/v1';

let currentCards = [];

/* ────────────────────────────────────────────────────────
   INITIALISATION
──────────────────────────────────────────────────────── */
document.getElementById('tag-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') searchPlayer();
});

/* ────────────────────────────────────────────────────────
   NAVIGATION
──────────────────────────────────────────────────────── */
function showSearch() {
  document.getElementById('profile-screen').style.display = 'none';
  document.getElementById('search-screen').style.display  = '';
  document.getElementById('search-error').textContent     = '';
}

function setLoading(v) {
  document.getElementById('loading').className = v ? 'show' : '';
}

/* ────────────────────────────────────────────────────────
   FETCH
──────────────────────────────────────────────────────── */
async function fetchCR(path) {
  const url = BASE + path;
  const r = await fetch(
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    { headers: { 'Authorization': 'Bearer ' + API_KEY } }
  );
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${r.status}`);
  }
  return r.json();
}

/* ────────────────────────────────────────────────────────
   RECHERCHE
──────────────────────────────────────────────────────── */
async function searchPlayer() {
  let raw = document.getElementById('tag-input').value.trim().toUpperCase();
  if (!raw) { showError('Entrez un tag de joueur'); return; }
  if (!raw.startsWith('#')) raw = '#' + raw;
  raw = raw.replace(/O/g, '0');

  setLoading(true);
  clearError();

  try {
    const enc = encodeURIComponent(raw);
    const [player, upcoming] = await Promise.allSettled([
      fetchCR(`/players/${enc}`),
      fetchCR(`/players/${enc}/upcomingchests`)
    ]);

    if (player.status === 'rejected') throw player.reason;

    renderProfile(player.value, upcoming.status === 'fulfilled' ? upcoming.value : null);

    document.getElementById('search-screen').style.display  = 'none';
    document.getElementById('profile-screen').style.display = '';
    document.getElementById('top-tag-label').textContent    = raw;
    window.scrollTo(0, 0);
  } catch (e) {
    showError(
      e.message.includes('404')
        ? 'Joueur introuvable. Vérifiez le tag.'
        : 'Erreur : ' + e.message
    );
  } finally {
    setLoading(false);
  }
}

function showError(msg) { document.getElementById('search-error').textContent = msg; }
function clearError()    { document.getElementById('search-error').textContent = ''; }

/* ────────────────────────────────────────────────────────
   HELPERS RARITÉ
──────────────────────────────────────────────────────── */
function rarityLabel(r) {
  const map = {
    common: 'Commune', rare: 'Rare', epic: 'Épique',
    legendary: 'Légendaire', champion: 'Champion'
  };
  return map[r] || r;
}

function rarityColor(r) {
  const map = {
    common: '#aaa', rare: '#4a90d9', epic: '#9b59b6',
    legendary: '#f4c430', champion: '#e63946'
  };
  return map[r] || '#888';
}

/* ────────────────────────────────────────────────────────
   RENDU DU PROFIL
──────────────────────────────────────────────────────── */
function renderProfile(p, chests) {
  const wins   = p.wins   || 0;
  const losses = p.losses || 0;
  const total  = wins + losses;
  const wr     = total ? Math.round(wins / total * 100) : 0;
  const initials = (p.name || '?').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || '?';

  const cards    = p.cards || [];
  const favCards = cards.slice().sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 4);

  let html = '';

  /* ── HERO ── */
  html += `
  <div class="hero">
    <div class="player-avatar">${initials}</div>
    <div>
      <div class="player-name">${esc(p.name || 'Inconnu')}</div>
      <div class="player-tag">${esc(p.tag || '')}</div>
      <div class="player-clan">
        ${p.clan
          ? `<span>Clan : </span>${esc(p.clan.name)}`
          : '<span style="color:var(--faint)">Sans clan</span>'
        }
        ${p.role ? `<span class="badge">${esc(p.role)}</span>` : ''}
      </div>
    </div>
    <div class="trophies-badge">
      <div class="trophy-num">🏆 ${(p.trophies || 0).toLocaleString()}</div>
      <div class="trophy-label">Trophées</div>
      ${p.bestTrophies ? `<div class="best-trophy">Record : ${p.bestTrophies.toLocaleString()}</div>` : ''}
      ${p.leagueStatistics?.currentSeason?.trophies
        ? `<div class="best-trophy">Saison : ${p.leagueStatistics.currentSeason.trophies}</div>`
        : ''}
    </div>
  </div>`;

  /* ── ARENA ── */
  if (p.arena) {
    html += `<div><span class="arena-chip">
      <span class="arena-dot"></span>
      ${esc(p.arena.name || 'Arena ' + p.arena.id)}
    </span></div>`;
  }

  /* ── STATS GÉNÉRALES ── */
  html += `
  <div class="section">
    <div class="section-title">Statistiques générales</div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-val stat-green">${wins.toLocaleString()}</div><div class="stat-lbl">Victoires</div></div>
      <div class="stat-card"><div class="stat-val stat-red">${losses.toLocaleString()}</div><div class="stat-lbl">Défaites</div></div>
      <div class="stat-card"><div class="stat-val stat-gold">${(p.battleCount || wins + losses).toLocaleString()}</div><div class="stat-lbl">Batailles</div></div>
      <div class="stat-card"><div class="stat-val stat-blue">${(p.threeCrownWins || 0).toLocaleString()}</div><div class="stat-lbl">3 Couronnes</div></div>
      <div class="stat-card"><div class="stat-val">${p.expLevel || '?'}</div><div class="stat-lbl">Niveau XP</div></div>
      <div class="stat-card"><div class="stat-val stat-gold">${(p.starPoints || 0).toLocaleString()}</div><div class="stat-lbl">Points Étoile</div></div>
      ${p.warDayWins         ? `<div class="stat-card"><div class="stat-val stat-green">${p.warDayWins.toLocaleString()}</div><div class="stat-lbl">Victoires Guerre</div></div>` : ''}
      ${p.clanCardsCollected ? `<div class="stat-card"><div class="stat-val stat-blue">${p.clanCardsCollected.toLocaleString()}</div><div class="stat-lbl">Cartes Clan</div></div>` : ''}
    </div>
  </div>`;

  /* ── WIN RATE ── */
  if (total > 0) {
    const wrColor = wr >= 55 ? 'var(--green)' : wr >= 45 ? 'var(--gold)' : 'var(--red)';
    html += `
    <div class="section">
      <div class="section-title">Taux de victoire</div>
      <div class="winrate-wrap">
        <div class="winrate-row">
          <span class="winrate-label">V/D</span>
          <span class="winrate-pct" style="color:${wrColor}">${wr}%</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${wr}%;background:${wrColor}"></div>
        </div>
        <div class="bar-wl">
          <span style="color:var(--green)"><b>${wins.toLocaleString()}</b> V</span>
          <span> / </span>
          <span style="color:var(--red)"><b>${losses.toLocaleString()}</b> D</span>
          <span style="margin-left:auto;color:var(--faint)">sur ${total.toLocaleString()} parties</span>
        </div>
      </div>
    </div>`;
  }

  /* ── DECK ACTUEL ── */
  if (p.currentDeck && p.currentDeck.length > 0) {
    html += `
    <div class="section">
      <div class="section-title">Deck actuel</div>
      <div class="deck-grid">
        <div class="deck-row">
          <div class="deck-header">
            <span class="deck-name">8 cartes sélectionnées</span>
            <span class="deck-level">Avg élixir : ${avgElixir(p.currentDeck)}</span>
          </div>
          <div class="cards-row">${p.currentDeck.map(c => cardMini(c)).join('')}</div>
        </div>
      </div>
    </div>`;
  }

  /* ── CARTES FAVORITES ── */
  if (favCards.length > 0) {
    html += `
    <div class="section">
      <div class="section-title">Cartes favorites <span class="badge">Top ${favCards.length}</span></div>
      <div class="stats-grid">`;

    favCards.forEach(c => {
      const img = cardImg(c);
      html += `
      <div class="stat-card" style="display:flex;gap:.75rem;align-items:center;cursor:pointer"
        onmouseenter="showTT(event,${JSON.stringify(c).replace(/"/g, "'")})"
        onmouseleave="hideTT()"
        onmousemove="moveTT(event)">
        <div style="width:40px;height:60px;flex-shrink:0;border-radius:4px;overflow:hidden;background:var(--bg4);border:1px solid var(--border2)">
          ${img
            ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.2rem">🃏</div>`}
        </div>
        <div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:.85rem;font-weight:600;line-height:1.2">${esc(c.name || '')}</div>
          <div style="font-size:.7rem;color:var(--muted);margin-top:.2rem">Nv. ${c.level || 1}</div>
          <div style="font-size:.7rem;color:${rarityColor(c.rarity)}">${rarityLabel(c.rarity || '')}</div>
        </div>
      </div>`;
    });
    html += `</div></div>`;
  }

  /* ── COLLECTION ── */
  if (cards.length > 0) {
    const rarities = [...new Set(cards.map(c => c.rarity).filter(Boolean))];
    html += `
    <div class="section all-cards-section">
      <div class="section-title">Collection de cartes <span class="badge">${cards.length}</span></div>
      <div class="cards-filter">
        <button class="filter-btn active" onclick="filterCards('all',this)">Toutes</button>
        ${rarities.map(r => `<button class="filter-btn" onclick="filterCards('${r}',this)">${rarityLabel(r)}</button>`).join('')}
      </div>
      <div class="all-cards-grid" id="all-cards-grid">${renderCardGrid(cards)}</div>
    </div>`;
    currentCards = cards;
  }

  /* ── LIGUE ── */
  if (p.leagueStatistics) {
    const ls = p.leagueStatistics;
    html += `
    <div class="section">
      <div class="section-title">Statistiques de ligue</div>
      <div class="stats-grid">
        ${ls.currentSeason  ? `<div class="stat-card"><div class="stat-val stat-gold">${ls.currentSeason.bestTrophies  || ls.currentSeason.trophies  || 0}</div><div class="stat-lbl">Record saison</div></div>` : ''}
        ${ls.previousSeason ? `<div class="stat-card"><div class="stat-val stat-blue">${ls.previousSeason.trophies || 0}</div><div class="stat-lbl">Saison précédente</div></div>` : ''}
        ${ls.bestSeason     ? `<div class="stat-card"><div class="stat-val stat-gold">${ls.bestSeason.trophies     || 0}</div><div class="stat-lbl">Meilleure saison</div></div>` : ''}
      </div>
    </div>`;
  }

  document.getElementById('profile-content').innerHTML = html;
}

/* ────────────────────────────────────────────────────────
   GRILLE DE CARTES
──────────────────────────────────────────────────────── */
function renderCardGrid(cards) {
  return cards.map((c, i) => {
    const img   = cardImg(c);
    const delay = Math.min(i * 0.02, 0.5);
    return `
    <div class="card-item" style="animation-delay:${delay}s"
      onmouseenter="showTT(event,${JSON.stringify(c).replace(/"/g, "'")})"
      onmouseleave="hideTT()"
      onmousemove="moveTT(event)">
      ${img
        ? `<img src="${img}" loading="lazy">`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.5rem">🃏</div>`}
      ${c.level      ? `<div class="ci-lvl">${c.level}</div>`           : ''}
      ${c.elixirCost ? `<div class="ci-elixir">${c.elixirCost}</div>`   : ''}
      <div class="ci-name">${esc(c.name || '')}</div>
    </div>`;
  }).join('');
}

function filterCards(rarity, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = rarity === 'all' ? currentCards : currentCards.filter(c => c.rarity === rarity);
  document.getElementById('all-cards-grid').innerHTML = renderCardGrid(filtered);
}

/* ────────────────────────────────────────────────────────
   CARTE MINI (deck)
──────────────────────────────────────────────────────── */
function cardMini(c) {
  const img = cardImg(c);
  return `
  <div class="card-mini"
    onmouseenter="showTT(event,${JSON.stringify(c).replace(/"/g, "'")})"
    onmouseleave="hideTT()"
    onmousemove="moveTT(event)">
    ${img
      ? `<img src="${img}" loading="lazy">`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1rem">🃏</div>`}
    ${c.elixirCost ? `<div class="card-elixir">${c.elixirCost}</div>` : ''}
    <div class="card-name">${esc(c.name || '')}</div>
  </div>`;
}

/* ────────────────────────────────────────────────────────
   UTILITAIRES
──────────────────────────────────────────────────────── */
function cardImg(c) {
  if (c.iconUrls?.medium) return c.iconUrls.medium;
  if (c.iconUrls?.large)  return c.iconUrls.large;
  return null;
}

function avgElixir(cards) {
  const withElixir = cards.filter(c => c.elixirCost);
  if (!withElixir.length) return '?';
  return (withElixir.reduce((s, c) => s + c.elixirCost, 0) / withElixir.length).toFixed(1);
}

/** Échappement HTML basique — protège contre l'injection XSS */
function esc(s) {
  return (s || '').replace(/[<>&"']/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* ────────────────────────────────────────────────────────
   TOOLTIP
──────────────────────────────────────────────────────── */
function showTT(e, card) {
  document.getElementById('tt-name').textContent   = card.name  || '';
  document.getElementById('tt-lvl').textContent    = card.level || '?';
  document.getElementById('tt-elixir').textContent = card.elixirCost !== undefined ? card.elixirCost : '?';

  const rarityEl = document.getElementById('tt-rarity');
  rarityEl.textContent  = rarityLabel(card.rarity || '');
  rarityEl.style.color  = rarityColor(card.rarity || '');

  const tt = document.getElementById('tooltip');
  tt.style.left = (e.clientX + 14) + 'px';
  tt.style.top  = (e.clientY + 14) + 'px';
  tt.classList.add('show');
}

function hideTT() {
  document.getElementById('tooltip').classList.remove('show');
}

function moveTT(e) {
  const tt = document.getElementById('tooltip');
  tt.style.left = (e.clientX + 14) + 'px';
  tt.style.top  = (e.clientY + 14) + 'px';
}
