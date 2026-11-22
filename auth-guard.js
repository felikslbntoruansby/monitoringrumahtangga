const SUPABASE_URL = 'https://bxthbzzslipaoztvqupw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_y44KWW3Si2wjLlBtXaDP7Q_rnkWZIn0';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Daftar Email Role
const ADMIN_EMAILS = ['admin@rumahtangga.ac.id'];
const VIEWER_EMAILS = ['viewerrt@rumahtangga.ac.id'];

// Halaman yang HANYA boleh diakses oleh Admin
const ADMIN_ONLY_PAGES = ['inventaris.html', 'ac.html', 'apar.html'];

window.isAdminUser = false;
window.currentUserEmail = '';

(async function checkAuth() {
  const { data: { session } } = await sb.auth.getSession();

  // 1. Jika belum login -> paksa pindah ke login.html
  if (!session) {
    window.location.replace('login.html');
    return;
  }

  const email = (session.user.email || '').toLowerCase().trim();
  const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email);

  window.currentUserEmail = email;
  window.isAdminUser = isAdmin;

  // 2. Jika Viewer mencoba membuka halaman khusus Admin -> alihkan kembali ke index.html
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  if (!isAdmin && ADMIN_ONLY_PAGES.includes(currentPage)) {
    window.location.replace('index.html');
    return;
  }

  // 3. Tampilkan halaman setelah verifikasi berhasil
  document.documentElement.style.visibility = 'visible';

  document.addEventListener('DOMContentLoaded', () => {
    if (!isAdmin) {
      document.querySelectorAll('.admin-only').forEach(el => el.remove());
    }
    const userBadge = document.getElementById('userBadge');
    if (userBadge) {
      userBadge.innerHTML = `
        <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold ${isAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-200'}">
          <i class="fa-solid ${isAdmin ? 'fa-shield-halved' : 'fa-user'} mr-1"></i> ${isAdmin ? 'ADMIN' : 'VIEWER'}
        </span>
      `;
    }
  });
})();

async function logoutApp() {
  await sb.auth.signOut();
  window.location.replace('login.html');
}