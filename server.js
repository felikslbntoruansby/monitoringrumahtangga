require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://bxthbzzslipaoztvqupw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_KEY || 'sb_publishable_y44KWW3Si2wjLlBtXaDP7Q_rnkWZIn0';

const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// 0. VERIFIKASI PIN ADMIN & PREFERENCES
// ==========================================
app.post('/api/verify-pin', (req, res) => {
  const { pin } = req.body;
  const validPin = process.env.ADMIN_PIN || 'POLTEKBANG2026';
  if (pin === validPin) {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: 'PIN Admin salah!' });
});

app.get('/api/preferences/:key', async (req, res) => {
  const { data, error } = await supabase
    .from('preferences')
    .select('value')
    .eq('key', req.params.key)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ value: data ? data.value : '' });
});

app.post('/api/preferences/:key', async (req, res) => {
  const { value } = req.body;
  const { error } = await supabase
    .from('preferences')
    .upsert({ key: req.params.key, value, updated_at: new Date() });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ==========================================
// 1. API INVENTARIS BARANG & LOG MUTASI
// ==========================================
app.get('/api/inventory', async (req, res) => {
  const { data, error } = await supabase.from('inventory').select('*').order('code', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/inventory', async (req, res) => {
  const { data, error } = await supabase.from('inventory').insert([req.body]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

app.put('/api/inventory/:id', async (req, res) => {
  const { data, error } = await supabase.from('inventory').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

app.delete('/api/inventory/:id', async (req, res) => {
  const { error } = await supabase.from('inventory').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.post('/api/inventory/transaction', async (req, res) => {
  const inventory_id = req.body.inventoryId || req.body.inventory_id;
  const type = req.body.type;
  const qty = parseInt(req.body.quantity, 10);
  const pic_name = req.body.picName || req.body.pic_name;
  const notes = req.body.notes;

  const { data: item, error: fetchErr } = await supabase.from('inventory').select('*').eq('id', inventory_id).single();
  if (fetchErr || !item) return res.status(404).json({ error: 'Barang tidak ditemukan' });

  const newIn = type === 'IN' ? (item.inQty || 0) + qty : (item.inQty || 0);
  const newOut = type === 'OUT' ? (item.outQty || 0) + qty : (item.outQty || 0);

  const { error: updErr } = await supabase.from('inventory').update({ inQty: newIn, outQty: newOut }).eq('id', inventory_id);
  if (updErr) return res.status(500).json({ error: updErr.message });

  const { data: logData, error: logErr } = await supabase
    .from('logs')
    .insert([{ inventory_id, type, quantity: qty, pic_name, notes }])
    .select();
  if (logErr) return res.status(500).json({ error: logErr.message });

  res.status(201).json(logData[0]);
});

app.get('/api/logs', async (req, res) => {
  const { data, error } = await supabase.from('logs').select('*, inventory(code, name)').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.delete('/api/logs/:id', async (req, res) => {
  const { error } = await supabase.from('logs').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ==========================================
// 2. API PEMINJAMAN RUANGAN
// ==========================================
app.get('/api/peminjaman-ruangan', async (req, res) => {
  const { data, error } = await supabase.from('peminjaman_ruangan').select('*').order('tgl_pinjam', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/peminjaman-ruangan', async (req, res) => {
  const { data, error } = await supabase.from('peminjaman_ruangan').insert([req.body]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

app.put('/api/peminjaman-ruangan/:id', async (req, res) => {
  const { data, error } = await supabase.from('peminjaman_ruangan').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

app.delete('/api/peminjaman-ruangan/:id', async (req, res) => {
  const { error } = await supabase.from('peminjaman_ruangan').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ==========================================
// 3. API PEMINJAMAN KENDARAAN
// ==========================================
app.get('/api/peminjaman-kendaraan', async (req, res) => {
  const { data, error } = await supabase.from('peminjaman_kendaraan').select('*').order('tgl_pinjam', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/peminjaman-kendaraan', async (req, res) => {
  const { data, error } = await supabase.from('peminjaman_kendaraan').insert([req.body]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

app.put('/api/peminjaman-kendaraan/:id', async (req, res) => {
  const { data, error } = await supabase.from('peminjaman_kendaraan').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

app.delete('/api/peminjaman-kendaraan/:id', async (req, res) => {
  const { error } = await supabase.from('peminjaman_kendaraan').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ==========================================
// 4. API MAINTENANCE AC
// ==========================================
app.get('/api/maintenance-ac', async (req, res) => {
  const { kode_unit, kategori_gedung } = req.query;
  let query = supabase.from('maintenance_ac').select('*').order('tgl_servis', { ascending: true });
  if (kode_unit) query = query.eq('kode_unit', kode_unit);
  if (kategori_gedung) query = query.eq('kategori_gedung', kategori_gedung);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/maintenance-ac', async (req, res) => {
  const { data, error } = await supabase.from('maintenance_ac').insert([req.body]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

app.post('/api/maintenance-ac/bulk', async (req, res) => {
  const rows = Array.isArray(req.body) ? req.body : req.body.data;
  const { data, error } = await supabase.from('maintenance_ac').insert(rows).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ inserted: data.length, data });
});

app.put('/api/maintenance-ac/:id', async (req, res) => {
  const { data, error } = await supabase.from('maintenance_ac').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

app.delete('/api/maintenance-ac/:id', async (req, res) => {
  const { error } = await supabase.from('maintenance_ac').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ==========================================
// 5. API DATA & INSPEKSI APAR
// ==========================================
app.get('/api/apar', async (req, res) => {
  const { kode_apar, kategori_gedung } = req.query;
  let query = supabase.from('apar').select('*').order('tgl_inspeksi', { ascending: true });
  if (kode_apar) query = query.eq('kode_apar', kode_apar);
  if (kategori_gedung) query = query.eq('kategori_gedung', kategori_gedung);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/apar', async (req, res) => {
  const { data, error } = await supabase.from('apar').insert([req.body]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

app.post('/api/apar/bulk', async (req, res) => {
  const rows = Array.isArray(req.body) ? req.body : req.body.data;
  const { data, error } = await supabase.from('apar').insert(rows).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ inserted: data.length, data });
});

app.put('/api/apar/:id', async (req, res) => {
  const { data, error } = await supabase.from('apar').update(req.body).eq('id', req.params.id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

app.delete('/api/apar/:id', async (req, res) => {
  const { error } = await supabase.from('apar').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ==========================================
// ROUTING HALAMAN HTML (EXPRESS V5)
// ==========================================
app.get('/rumah-tangga', (req, res) => res.sendFile(path.join(__dirname, 'rumah-tangga.html')));
app.get('/rumahtangga', (req, res) => res.sendFile(path.join(__dirname, 'rumah-tangga.html')));
app.get('/inventory', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/ac', (req, res) => res.sendFile(path.join(__dirname, 'ac.html')));
app.get('/unit-ac', (req, res) => res.sendFile(path.join(__dirname, 'unit-ac.html')));
app.get('/apar', (req, res) => res.sendFile(path.join(__dirname, 'apar.html')));
app.get('/unit-apar', (req, res) => res.sendFile(path.join(__dirname, 'unit-apar.html')));

// Fallback halaman utama ke Portal Rumah Tangga
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'rumah-tangga.html'));
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server Rumah Tangga aktif di http://localhost:${PORT}`);
  });
}

module.exports = app;