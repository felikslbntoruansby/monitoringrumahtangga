const SUPABASE_URL = 'https://bxthbzzslipaoztvqupw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_y44KWW3Si2wjLlBtXaDP7Q_rnkWZIn0';

const ADMIN_EMAIL = 'admin@rumahtangga.ac.id';
const TEKNISI_EMAIL = 'teknisirt@rumahtangga.ac.id';
const ROLE_CACHE_KEY = 'rt_poltekbang_role_cache';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Halaman yang diblokir dari Viewer (hanya terbuka untuk Admin & Teknisi)
const VIEWER_BLOCKED_PAGES = ['inventaris.html'];

let currentUser = null;
let userRole = 'VIEWER';
window.isAdminUser = false;
window.isTeknisiUser = false;

function resolveRoleByEmail(email) {
  const cleanEmail = (email || '').toLowerCase();
  if (cleanEmail === ADMIN_EMAIL.toLowerCase()) return 'ADMIN';
  if (cleanEmail === TEKNISI_EMAIL.toLowerCase()) return 'TEKNISI';
  return 'VIEWER';
}

function setRoleFlags(role) {
  userRole = role;
  window.isAdminUser = (role === 'ADMIN');
  window.isTeknisiUser = (role === 'TEKNISI' || role === 'ADMIN');
}

function applyRoleUI(role) {
  if (role !== 'ADMIN') {
    document.querySelectorAll('.admin-only').forEach(el => el.remove());
  }
  if (role === 'VIEWER') {
    document.querySelectorAll('.teknisi-only').forEach(el => el.remove());
  }

  const userBadge = document.getElementById('userBadge');
  if (userBadge) {
    let badgeStyle = 'bg-white/15 text-white border border-white/25';
    let icon = 'fa-user';
    if (role === 'ADMIN') {
      badgeStyle = 'bg-amber-500/20 text-amber-300 border border-amber-400/40';
      icon = 'fa-shield-halved';
    } else if (role === 'TEKNISI') {
      badgeStyle = 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40';
      icon = 'fa-screwdriver-wrench';
    }

    userBadge.innerHTML = `
      <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold ${badgeStyle}">
        <i class="fa-solid ${icon} mr-1"></i> ${role}
      </span>
    `;
  }
}

function isPageBlockedForRole(role) {
  const currentPage = window.location.pathname.split('/').pop().toLowerCase();
  return role === 'VIEWER' && VIEWER_BLOCKED_PAGES.some(p => currentPage === p || currentPage === p.replace('.html', ''));
}

// 1. INSTANT RENDER DARI SESSIONSTORAGE (Meningkatkan FCP/LCP Lighthouse & Navigasi Instan)
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

// 2. VALIDASI SESI ASLI DI LATAR BELAKANG (Keamanan tetap terjaga)
(async function verifySession() {
  const { data: { session } } = await sb.auth.getSession();

  if (!session || !session.user) {
    sessionStorage.removeItem(ROLE_CACHE_KEY);
    window.location.replace('login.html');
    return;
  }

  currentUser = session.user;
  const verifiedRole = resolveRoleByEmail(currentUser.email);
  setRoleFlags(verifiedRole);
  sessionStorage.setItem(ROLE_CACHE_KEY, verifiedRole);

  if (isPageBlockedForRole(verifiedRole)) {
    alert('Akses ditolak! Halaman Inventaris hanya dapat diakses oleh Admin dan Teknisi.');
    window.location.replace('index.html');
    return;
  }

  // Jika belum ditampilkan lewat cache (kunjungan pertama setelah login), tampilkan sekarang
  if (!cachedRole) {
    document.documentElement.style.visibility = 'visible';
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => applyRoleUI(verifiedRole));
    } else {
      applyRoleUI(verifiedRole);
    }
  }
})();

async function logoutApp() {
  sessionStorage.removeItem(ROLE_CACHE_KEY);
  await sb.auth.signOut();
  window.location.replace('login.html');
}