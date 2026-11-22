const SUPABASE_URL = 'https://bxthbzzslipaoztvqupw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_y44KWW3Si2wjLlBtXaDP7Q_rnkWZIn0';

const ADMIN_EMAIL = 'admin@rumahtangga.ac.id';
const TEKNISI_EMAIL = 'teknisirt@rumahtangga.ac.id';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Hanya Viewer biasa yang diblokir masuk ke halaman Inventaris
const VIEWER_BLOCKED_PAGES = ['inventaris.html'];

let currentUser = null;
let userRole = 'VIEWER'; // 'ADMIN' | 'TEKNISI' | 'VIEWER'
window.isAdminUser = false;
window.isTeknisiUser = false;

(async function checkAuth() {
  const { data: { session } } = await sb.auth.getSession();

  if (!session || !session.user) {
    window.location.replace('login.html');
    return;
  }

  currentUser = session.user;
  const email = currentUser.email.toLowerCase();

  if (email === ADMIN_EMAIL.toLowerCase()) {
    userRole = 'ADMIN';
  } else if (email === TEKNISI_EMAIL.toLowerCase()) {
    userRole = 'TEKNISI';
  } else {
    userRole = 'VIEWER';
  }

  window.isAdminUser = (userRole === 'ADMIN');
  window.isTeknisiUser = (userRole === 'TEKNISI' || userRole === 'ADMIN');

  const currentPage = window.location.pathname.split('/').pop().toLowerCase();
  if (userRole === 'VIEWER' && VIEWER_BLOCKED_PAGES.some(p => currentPage === p || currentPage === p.replace('.html', ''))) {
    alert('Akses ditolak! Halaman Inventaris hanya dapat diakses oleh Admin dan Teknisi.');
    window.location.replace('index.html');
    return;
  }

  document.documentElement.style.visibility = 'visible';

  const applyRoleUI = () => {
    // 1. Elemen khusus ADMIN saja (Tambah master barang baru, Edit, Hapus, Cetak QR)
    if (userRole !== 'ADMIN') {
      document.querySelectorAll('.admin-only').forEach(el => el.remove());
    }

    // 2. Elemen untuk TEKNISI & ADMIN (Ambil barang inventaris, Input hasil servis AC & APAR)
    if (userRole === 'VIEWER') {
      document.querySelectorAll('.teknisi-only').forEach(el => el.remove());
    }

    // 3. Badge Role di Sidebar / Navbar
    const userBadge = document.getElementById('userBadge');
    if (userBadge) {
      let badgeStyle = 'bg-white/15 text-white border border-white/25';
      let icon = 'fa-user';
      if (userRole === 'ADMIN') {
        badgeStyle = 'bg-amber-500/20 text-amber-300 border border-amber-400/40';
        icon = 'fa-shield-halved';
      } else if (userRole === 'TEKNISI') {
        badgeStyle = 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40';
        icon = 'fa-screwdriver-wrench';
      }

      userBadge.innerHTML = `
        <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold ${badgeStyle}">
          <i class="fa-solid ${icon} mr-1"></i> ${userRole}
        </span>
      `;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyRoleUI);
  } else {
    applyRoleUI();
  }
})();

async function logoutApp() {
  await sb.auth.signOut();
  window.location.replace('login.html');
}