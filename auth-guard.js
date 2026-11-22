const SUPABASE_URL = 'https://bxthbzzslipaoztvqupw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_y44KWW3Si2wjLlBtXaDP7Q_rnkWZIn0';
const ADMIN_EMAIL = 'admin@rumahtangga.ac.id';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Hanya halaman inventaris yang diblokir total dari Viewer
const ADMIN_ONLY_PAGES = ['inventaris.html'];

let currentUser = null;
let isAdmin = false;
window.isAdminUser = false;

(async function checkAuth() {
  const { data: { session } } = await sb.auth.getSession();

  if (!session || !session.user) {
    window.location.replace('login.html');
    return;
  }

  currentUser = session.user;
  isAdmin = currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  window.isAdminUser = isAdmin;

  const currentPage = window.location.pathname.split('/').pop().toLowerCase();
  if (!isAdmin && ADMIN_ONLY_PAGES.some(p => currentPage === p || currentPage === p.replace('.html', ''))) {
    alert('Akses ditolak! Halaman Inventaris hanya dapat diakses oleh Admin.');
    window.location.replace('index.html');
    return;
  }

  // Tampilkan halaman setelah verifikasi lolos
  document.documentElement.style.visibility = 'visible';

  const applyRoleUI = () => {
    if (!isAdmin) {
      document.querySelectorAll('.admin-only').forEach(el => el.remove());
    }
    const userBadge = document.getElementById('userBadge');
    if (userBadge) {
      userBadge.innerHTML = `
        <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold ${isAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : 'bg-white/15 text-white border border-white/25'}">
          <i class="fa-solid ${isAdmin ? 'fa-shield-halved' : 'fa-user'} mr-1"></i> ${isAdmin ? 'ADMIN' : 'VIEWER'}
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