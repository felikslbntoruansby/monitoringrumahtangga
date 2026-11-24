const SUPABASE_URL = 'https://bxthbzzslipaoztvqupw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_y44KWW3Si2wjLlBtXaDP7Q_rnkWZIn0';
const ROLE_CACHE_KEY = 'rt_poltekbang_role_cache';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const VIEWER_BLOCKED_PAGES = ['inventaris.html'];
const ADMIN_ONLY_PAGES = ['utilitas-kendaraan.html'];

let currentUser = null;
let userRole = 'VIEWER';
window.isAdminUser = false;
window.isTeknisiUser = false;

// Cek halaman yang diblokir sebelum path diubah ke '/'
const _rawPath = window.location.pathname.split('/').pop().toLowerCase();
const _isBlockedPageForViewer = VIEWER_BLOCKED_PAGES.some(
  p => _rawPath === p || _rawPath === p.replace('.html', '')
);
const _isAdminOnlyPage = ADMIN_ONLY_PAGES.some(
  p => _rawPath === p || _rawPath === p.replace('.html', '')
);

// Sembunyikan nama file (.html / path menu) sambil tetap mempertahankan parameter (?no= / ?kode=) & #hash
if (window.location.pathname !== '/' && !window.location.search.includes('kode=') && !window.location.search.includes('no=')) {
  window.history.replaceState(null, '', '/' + window.location.search + window.location.hash);
}

window.escapeHtml = function(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

function resolveRoleFromUser(user) {
  const role = (user?.app_metadata?.role || 'VIEWER').toUpperCase();
  if (role === 'ADMIN' || role === 'TEKNISI') return role;
  return 'VIEWER';
}

function setRoleFlags(role) {
  userRole = role;
  window.isAdminUser = (role === 'ADMIN');
  window.isTeknisiUser = (role === 'TEKNISI' || role === 'ADMIN');
}

function applyRoleUI(role) {
  const upperRole = (role || 'VIEWER').toUpperCase();
  setRoleFlags(upperRole);

  if (upperRole !== 'ADMIN') {
    document.querySelectorAll('.admin-only').forEach(el => el.remove());
  }
  if (upperRole === 'VIEWER') {
    document.querySelectorAll('.teknisi-only').forEach(el => el.remove());
  }

  const userBadge = document.getElementById('userBadge');
  if (userBadge) {
    let badgeStyle = 'bg-white/15 text-white border border-white/25';
    let icon = 'fa-user';
    if (upperRole === 'ADMIN') {
      badgeStyle = 'bg-amber-500/20 text-amber-300 border border-amber-400/40';
      icon = 'fa-shield-halved';
    } else if (upperRole === 'TEKNISI') {
      badgeStyle = 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40';
      icon = 'fa-screwdriver-wrench';
    }

    userBadge.innerHTML = `
      <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold ${badgeStyle}">
        <i class="fa-solid ${icon} mr-1"></i> ${escapeHtml(upperRole)}
      </span>
    `;
  }
}

function isPageBlockedForRole(role) {
  const shellPage = (document.getElementById('appShell')?.dataset?.page || '').toLowerCase();
  const isViewerBlocked = _isBlockedPageForViewer || VIEWER_BLOCKED_PAGES.includes(shellPage);
  const isAdminBlocked = _isAdminOnlyPage || ADMIN_ONLY_PAGES.includes(shellPage);

  if (isAdminBlocked && role !== 'ADMIN') return true;
  if (isViewerBlocked && role === 'VIEWER') return true;
  return false;
}

const cachedRole = sessionStorage.getItem(ROLE_CACHE_KEY);
if (cachedRole) {
  setRoleFlags(cachedRole);
  if (isPageBlockedForRole(cachedRole)) {
    window.location.replace('index.html');
  } else {
    document.documentElement.style.visibility = 'visible';
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => applyRoleUI(cachedRole));
    } else {
      applyRoleUI(cachedRole);
    }
  }
}

(async function verifySession() {
  const { data: { session } } = await sb.auth.getSession();

  if (!session || !session.user) {
    sessionStorage.removeItem(ROLE_CACHE_KEY);
    window.location.replace('login.html');
    return;
  }

  currentUser = session.user;
  const verifiedRole = resolveRoleFromUser(currentUser);
  setRoleFlags(verifiedRole);
  sessionStorage.setItem(ROLE_CACHE_KEY, verifiedRole);

  if (isPageBlockedForRole(verifiedRole)) {
    window.location.replace('index.html');
    return;
  }

  document.documentElement.style.visibility = 'visible';
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyRoleUI(verifiedRole));
  } else {
    applyRoleUI(verifiedRole);
  }
})();

async function logoutApp() {
  sessionStorage.removeItem(ROLE_CACHE_KEY);
  await sb.auth.signOut();
  window.location.replace('login.html');
}