require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

// Kredensial Supabase proyek monitoringrumahtangga
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bxthbzzslipaoztvqupw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_y44KWW3Si2wjLlBtXaDP7Q_rnkWZIn0';

const supabase = createClient(supabaseUrl, supabaseKey);

const ALLOWED_TABLES = [
  'peminjaman_ruangan',
  'peminjaman_kendaraan',
  'inventaris_rt',
  'data_ac',
  'data_apar_hydrant'
];

// Verifikasi PIN Admin
app.post('/api/verify-pin', (req, res) => {
  const { pin } = req.body;
  const validPin = process.env.ADMIN_PIN || 'POLTEKBANG2026';
  if (pin === validPin) {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: 'PIN Admin salah!' });
});

// Ambil seluruh data modul
app.get('/api/data/:table', async (req, res) => {
  const { table } = req.params;
  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Tabel tidak valid' });
  }
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('id', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// Tambah data baru
app.post('/api/data/:table', async (req, res) => {
  const { table } = req.params;
  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Tabel tidak valid' });
  }
  const { data, error } = await supabase
    .from(table)
    .insert([req.body])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// Update status / kondisi
app.patch('/api/data/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Tabel tidak valid' });
  }
  const { error } = await supabase
    .from(table)
    .update(req.body)
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Hapus data
app.delete('/api/data/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Tabel tidak valid' });
  }
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Halaman utama (menggunakan app.use agar aman di Express v5)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Rumah Tangga aktif di http://localhost:${PORT}`);
});