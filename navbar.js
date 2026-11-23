(function renderUniformLayout() {
  const PAGE_META = {
    'index.html': {
      title: 'Ringkasan Layanan Rumah Tangga',
      subtitle: 'Monitoring peminjaman ruangan, kendaraan dinas, inventaris gudang, pemeliharaan AC, serta kesiapan unit APAR.',
      refreshFn: 'loadAllData(true)'
    },
    'ruangan.html': {
      title: '1. Peminjaman Ruangan',
      subtitle: 'Booking ruang rapat, aula, kelas, dan jadwal pemakaian fasilitas gedung Poltekbang Surabaya.',
      refreshFn: 'loadData()'
    },
    'kendaraan.html': {
      title: '2. Peminjaman Kendaraan',
      subtitle: 'Pengajuan kendaraan dinas operasional, jadwal keberangkatan, dan driver.',
      refreshFn: 'loadData()'
    },
    'inventaris.html': {
      title: '3. Inventaris Barang & Stok Opname',
      subtitle: 'Pencatatan pengambilan barang lapangan, stok opname gudang, dan pengelolaan master inventaris.',
      refreshFn: 'loadData(true)'
    },
    'ac.html': {
      title: '4. Data & QR Unit AC',
      subtitle: 'Monitoring jadwal cuci rutin AC per gedung dan kartu kendali QR unit AC.',
      refreshFn: 'fetchAcData()'
    },
    'apar.html': {
      title: '5. Data & QR APAR',
      subtitle: 'Sinkronisasi dua arah, cetak stiker QR massal, dan peringatan masa berlaku tabung APAR.',
      refreshFn: 'fetchAparData()'
    }
  };

  const NAV_ITEMS = [
    { href: 'index.html', label: 'Ringkasan Dashboard', icon: 'fa-chart-pie', iconColor: 'text-amber-300' },
    { href: 'ruangan.html', label: '1. Peminjaman Ruangan', icon: 'fa-door-open', iconColor: 'text-sky-400' },
    { href: 'kendaraan.html', label: '2. Peminjaman Kendaraan', icon: 'fa-car-side', iconColor: 'text-emerald-400' },
    { href: 'inventaris.html', label: '3. Inventaris Barang', icon: 'fa-boxes-stacked', iconColor: 'text-amber-400', teknisiOnly: true },
    { href: 'ac.html', label: '4. Data & QR Unit AC', icon: 'fa-snowflake', iconColor: 'text-cyan-400' },
    { href: 'apar.html', label: '5. Data & QR APAR', icon: 'fa-fire-extinguisher', iconColor: 'text-rose-400' }
  ];

  window.toggleAppSidebar = function(show) {
    const sbEl = document.getElementById('appSidebar');
    const bdEl = document.getElementById('appSidebarBackdrop');
    if (sbEl) sbEl.classList.toggle('-translate-x-full', !show);
    if (bdEl) bdEl.classList.toggle('hidden', !show);
  };

  function initLayout() {
    const shell = document.getElementById('appShell');
    if (!shell) return;

    const currentFile = (shell.dataset.page || window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const meta = PAGE_META[currentFile] || PAGE_META['index.html'];

    const navHtml = NAV_ITEMS.map(item => {
      const isActive = item.href === currentFile;
      const activeCls = isActive
        ? 'bg-[#14532D] text-white font-bold border-l-4 border-amber-400 shadow-sm'
        : 'text-slate-300 font-semibold hover:bg-white/10 hover:text-white';
      const roleCls = item.teknisiOnly ? 'teknisi-only' : '';

      return `
        <a href="${item.href}" class="${roleCls} w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs transition ${activeCls}">
          <i class="fa-solid ${item.icon} w-4 text-center ${isActive ? 'text-amber-300' : item.iconColor}"></i>
          <span>${item.label}</span>
        </a>
      `;
    }).join('');

    shell.innerHTML = `
      <!-- MOBILE TOPBAR -->
      <div class="lg:hidden sticky top-0 z-30 bg-[#0B2545] text-white px-4 py-3 flex items-center justify-between shadow-md border-b border-white/10 no-print">
        <button onclick="toggleAppSidebar(true)" class="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition cursor-pointer">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div class="flex items-center gap-2">
          <img src="logo-poltekbang.png" alt="Logo Poltekbang" class="h-7 w-auto bg-white rounded px-1 py-0.5 object-contain">
          <span class="font-extrabold text-xs tracking-wide">POLTEKBANG SURABAYA</span>
        </div>
        <button onclick="logoutApp()" class="text-xs text-rose-300 font-bold cursor-pointer">Keluar</button>
      </div>

      <div id="appSidebarBackdrop" onclick="toggleAppSidebar(false)" class="fixed inset-0 bg-slate-900/50 z-40 hidden lg:hidden no-print"></div>

      <!-- SIDEBAR KIRI SERAGAM -->
      <aside id="appSidebar" class="fixed top-0 left-0 bottom-0 w-64 bg-[#0B2545] text-slate-200 z-50 flex flex-col justify-between border-r border-[#163863] transform -translate-x-full lg:translate-x-0 transition-transform duration-300 no-print">
        <div>
          <!-- IDENTITAS INSTANSI & LOGO -->
          <div class="p-4 border-b border-white/10 flex items-center justify-between bg-[#081B33]">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 shadow-sm">
                <img src="logo-poltekbang.png" alt="Logo Poltekbang Surabaya" class="max-h-full max-w-full object-contain">
              </div>
              <div>
                <h1 class="text-xs font-extrabold text-white leading-tight uppercase tracking-wide">Rumah Tangga</h1>
                <span class="text-[11px] font-medium text-amber-400 block mt-0.5">Poltekbang Surabaya</span>
              </div>
            </div>
            <button onclick="toggleAppSidebar(false)" class="lg:hidden text-slate-400 hover:text-white cursor-pointer">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- GARIS AKSEN 3 WARNA INSTANSI -->
          <div class="h-1 w-full flex">
            <div class="w-1/3 bg-[#14532D]"></div>
            <div class="w-1/3 bg-[#D97706]"></div>
            <div class="w-1/3 bg-sky-500"></div>
          </div>

          <nav class="p-3.5 space-y-1">
            <div class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Navigasi Layanan</div>
            ${navHtml}
          </nav>
        </div>

        <div class="p-4 border-t border-white/10 bg-[#081B33] space-y-2.5">
          <div class="flex items-center justify-between px-1">
            <div id="userBadge"></div>
            <span id="navClock" class="font-mono text-[11px] font-bold text-slate-300 tabular-nums">--:--:--</span>
          </div>
          <button onclick="logoutApp()" class="w-full py-2 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer">
            <i class="fa-solid fa-right-from-bracket"></i> Keluar (Logout)
          </button>
        </div>
      </aside>
    `;

    const headerMount = document.getElementById('pageHeader');
    if (headerMount) {
      headerMount.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden no-print">
          <div class="h-1.5 w-full flex">
            <div class="w-1/3 bg-[#14532D]"></div>
            <div class="w-1/3 bg-[#D97706]"></div>
            <div class="w-1/3 bg-[#0B2545]"></div>
          </div>
          <div class="p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div class="flex items-center gap-4">
              <div class="hidden sm:flex w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 p-1.5 items-center justify-center shrink-0">
                <img src="logo-poltekbang.png" alt="Logo Politeknik Penerbangan Surabaya" class="max-h-full max-w-full object-contain">
              </div>
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-[#14532D]">
                  Bidang Umum • Politeknik Penerbangan Surabaya
                </span>
                <h2 class="text-xl md:text-2xl font-extrabold text-[#0B2545] mt-0.5">
                  ${meta.title}
                </h2>
                <p class="text-xs text-slate-500 mt-1">
                  ${meta.subtitle}
                </p>
              </div>
            </div>
            <button onclick="${meta.refreshFn}" class="px-4 py-2.5 bg-[#0B2545] hover:bg-[#133863] text-white rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0">
              <i class="fa-solid fa-rotate"></i> Refresh Data
            </button>
          </div>
        </div>
      `;
    }

    setInterval(() => {
      const c = document.getElementById('navClock');
      if (c) c.innerText = new Date().toLocaleTimeString('id-ID');
    }, 1000);

    if (typeof applyRoleUI === 'function' && typeof userRole !== 'undefined') {
      applyRoleUI(userRole);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLayout);
  } else {
    initLayout();
  }
})();