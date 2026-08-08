# RunProof — Rencana Build

Deadline: **13 Agustus 2026, 12:00 UTC+2**. Tersisa 5 hari build + 1 hari submission.

| Hari | Tanggal | Isi | Status |
|---|---|---|---|
| D1 | 7 Ags | **GATE** — prasyarat, dua eksperimen, keputusan cabang, **PR bounty dibuka** | ✅ selesai 8 Ags (PR telat sehari) |
| D2 | 8 Ags | Spec format + runner | ✅ |
| D3 | 9 Ags | Runner lanjut | ✅ ditarik maju ke 8 Ags |
| D4 | 10 Ags | Tiga skenario + evidence report (HTML) | ✅ ditarik maju ke 8 Ags |
| D5 | 11 Ags | Rapikan + stretch | 🟡 TEARDOWN final ✅ · stretch x402 belum |
| D6 | 12 Ags | Video, submission, tx link | ⬜ |
| — | 13 Ags | Buffer sampai 12:00. Jangan diisi kerja baru. | — |

**Posisi per 8 Ags, sore.** D1–D4 kelar, jadi ada margin ~3 hari. Yang sudah jalan:
`pnpm test` (spec parser + verdict + `forge test` 6 tes Solidity) dan
`node --env-file=.env src/runner.js specs/*.json` (3 spec live di Sepolia, exit 0).
PR upstream: [KeeperHub/keeperhub#1975](https://github.com/KeeperHub/keeperhub/pull/1975).

Sisa nyata sebelum D6, sudah diurutkan:

- [ ] Cek visual report HTML — belum pernah dilihat mata manusia, padahal ini yang direkam
- [ ] Run bersih terakhir buat bahan video (`count` dari angka bulat)
- [ ] Video 3 menit + submission
- [ ] (opsional, buang tanpa penyesalan) stretch x402

Yang **sengaja tidak** dikerjakan, biar tidak jadi hantu di checklist:

- Retry/`recoveryOwner: "keeperhub"` — belum pernah teramati sekali pun. Kodenya ada dan
  ada tesnya, tapi jangan diklaim di video.
- Recovery milik RunProof sendiri (`runproof`) — **dihapus dari nilai yang valid.** KeeperHub
  fail-closed sebelum broadcast, jadi tidak ada yang perlu dipulihkan. Menambah retry berarti
  mengarang cerita recovery yang tidak didukung bukti.
- Automated test untuk jalur REST — jalur itu diuji oleh 3 spec live. Mock-nya cuma akan
  menguji mock, bukan KeeperHub.

---

## D1 — Gate (keputusan, bukan setup)

Aturan: **jangan tulis satu baris harness hari ini.** Arsitekturnya berbeda di tiap cabang.

### 0. Amankan secret — sebelum menyentuh apa pun

Dua hal di plan ini saling berbahaya: ia menyuruh **menyimpan respons API mentah**, dan menerbitkan **`TEARDOWN.md` secara publik**. Tanpa langkah di antaranya, org ID, wallet address, dan potongan key ikut terkirim.

- [ ] `git init` + `.gitignore` berisi `.env`, `gate-findings.md`, `raw/` — **sebelum** `.env` dibuat
- [ ] Commit `.env.example` saja, isinya nama variabel tanpa nilai
- [ ] Respons mentah masuk `raw/` yang tidak ter-commit
- [ ] Redaksi sebelum apa pun pindah ke `TEARDOWN.md` atau PR: API key, org ID, user ID, wallet address, `Authorization` header
- [ ] Sebelum push pertama: `git log -p | grep -iE 'kh_|0x[a-f0-9]{40}'` — pastikan bersih

Screenshot untuk bounty juga kena aturan ini. Crop atau blur bar API key sebelum disimpan, bukan sesudah.

### 1. Friction ledger — nyalakan sebelum apa pun

Buat `TEARDOWN.md` sekarang. Catat timestamp setiap langkah, error, dan kebingungan. Bahan bounty ini hanya bisa diambil sekali.

Empat hipotesis, **reproduksi dulu sebelum diklaim**:

**1. Node version bertentangan di branch default — ✅ TERVERIFIKASI 7 Ags, siap jadi PR**

Semuanya di branch `staging` (default repo):

| Sumber | Isi |
|---|---|
| `README.md:66` | `Node.js 22 (Next.js 16 requires >=20.9.0; Node 18 will not work)` |
| `CONTRIBUTING.md:17` | `Node.js 24+ (see .node-version)` |
| `.node-version` | `24` |

`.node-version` menyelesaikannya: 24 yang benar, README yang basi. Fix satu baris.

Yang tersisa buatmu: reproduksi di mesin sendiri — install Node 22 sesuai README, jalankan `pnpm install`, catat apa yang terjadi. Itu mengubah "dokumentasi tidak konsisten" jadi "saya mengikuti README dan ini akibatnya", yang jauh lebih kuat.

**2. Retry/gas escalation** dijanjikan di halaman hackathon, tidak dijabarkan di docs → eksperimen B jadi buktinya

**3.** ~~Audit export tidak terdokumentasi~~ → **DITARIK, salah.** Versi benar: `/keeper-runs/status-logs` tidak menautkan ke `/api/executions`, jadi pendatang baru tidak menemukannya dari titik masuk yang wajar

**4. Dukungan chain per-plugin** tidak terdokumentasi → verifikasi via `list_action_schemas`

*Catatan kaki, bukan temuan:* branch `main` menyimpan CONTRIBUTING lain (`feature/your-feature-name`) dan `.node-version` berisi `22`. Bertentangan dengan staging, tapi default branch-nya staging jadi hampir tidak ada yang mendarat di sana. Sebut sekilas kalau relevan. Melebih-lebihkan temuan lemah merusak kepercayaan pada yang kuat.

**Konvensi repo — sudah diverifikasi, tidak perlu dicek ulang:**
default branch `staging` · branch `feat/KEEP-123-description` (`CONTRIBUTING.md:72`) · commit `feat: KEEP-123 …` (:88) · base branch selalu `staging` (:107) · `pnpm check` / `pnpm type-check` / `pnpm test` ada di `package.json`

### 2. Prasyarat — selesaikan semua sebelum eksperimen

Urutannya mengikat; tiap langkah memblokir yang berikutnya.

- [ ] Daftar akun, buat organization
- [ ] **Wallet integration** via browser UI — `get_wallet_integration` harus mengembalikan wallet aktif. Write action tidak jalan tanpa ini
- [ ] Danai wallet dengan Sepolia ETH (faucet)
- [ ] **Buat organization API key** di Settings → API Keys → tab Organisation. `kh_…` hanya ditampilkan sekali, langsung simpan
- [ ] `.env`: `KEEPERHUB_API_KEY`, `SEPOLIA_RPC_URL`, `FIXTURE_ADDRESS`
- [ ] MCP: `claude mcp add --transport http --scope user keeperhub https://app.keeperhub.com/mcp` lalu `/mcp` untuk OAuth
- [ ] Deploy fixture, simpan address + ABI
- [ ] `list_action_schemas` + `tools_documentation` → kunci schema yang **nyata**, bukan yang dikutip dari docs

**Dua jalur auth, jangan tertukar:**
- MCP OAuth → dipakai Claude, **tidak bisa** dipakai `src/runner.ts` atau curl
- `kh_` Bearer key → dipakai kode dan REST. Hanya berlaku di endpoint organization-scoped
- Wallet provisioning & pembuatan key **wajib session** (browser). Tidak bisa diotomatiskan

```bash
curl -H "Authorization: Bearer kh_…" https://app.keeperhub.com/api/workflows
```

### Keputusan transport — REST murni untuk runner

`src/runner.ts` **tidak** memakai MCP SDK. Semua yang dibutuhkannya ada di REST:

| Kebutuhan | Endpoint |
|---|---|
| Buat workflow | `POST /api/workflows/create` |
| Eksekusi | `POST /api/workflows/{id}/execute` |
| Tunggu receipt | `GET /api/workflows/executions/{id}/wait` |
| Log & attempts | `GET /api/workflows/executions/{id}/logs` |
| Riwayat | `GET /api/workflows/{workflowId}/executions` |

Hanya `validate_workflow` yang MCP-only — **dan itu dibuang.** RunProof membuat workflow dari spec-nya sendiri, jadi ia mengendalikan bentuknya; kalau salah, `create` akan menolak. Itu sudah validasi.

Alasan tidak memakai MCP secara programatis: menambah `@modelcontextprotocol/sdk`, JSON-RPC, dan negosiasi session untuk mencapai endpoint yang REST sudah ekspos langsung. Biayanya sehari, hasilnya sama.

Cerita "KeeperHub-native" tetap utuh dan justru lebih jujur: **MCP adalah permukaan agent** (Claude Code → KeeperHub, dan itu yang direkam di video), **REST adalah permukaan harness**. Dua jalur, masing-masing dipakai untuk yang memang dirancang untuknya.

Balik ke MCP hanya kalau D1 menemukan bahwa `POST /execute` tidak mengembalikan `executionId` yang bisa dipoll.

### 3. Contract fixture (Sepolia, Foundry)

```solidity
contract Fixture {
    uint256 public count;
    bool public paused;
    function setPaused(bool p) external { paused = p; }
    function increment() external {
        require(!paused, "paused");   // jalur revert
        count++;
    }
}
```

Baseline = `increment()` normal. Revert = `increment()` saat `paused`. Gas underrun = `increment()` dengan absolute gas limit dipaksa rendah.

### 4. Eksperimen A — bentuk evidence

Satu tx sukses, lalu panggil semuanya dan **simpan respons mentahnya**:

- `get_execution` (MCP)
- `GET /api/workflows/executions/{id}/status`
- `GET /api/workflows/executions/{id}/wait?timeoutMs=30000`
- `GET /api/workflows/executions/{id}/logs`
- `GET /api/workflows/{workflowId}/executions`

Cari: `hash`, `gasUsed`, `gasUsedUnits`, `effectiveGasPrice`, `receiptStatus`, `blockNumber`, `startedAt`/`completedAt`. Docs menjanjikan semuanya — pastikan benar-benar terisi, bukan `optional` yang kosong.

### 5. Eksperimen B — GATE UTAMA

Set **absolute gas limit** kerendahan di Advanced pada action node → eksekusi → amati:

- Apakah transaksi **dibroadcast sama sekali**?
- Berapa execution record yang muncul?
- Apakah `/logs` menunjukkan attempt kedua di dalam satu record?
- Isi `receiptStatus`?

**Tiga kemungkinan, bukan dua:**

| | Yang terjadi | Bukti utama | Atribusi |
|---|---|---|---|
| **A** | Broadcast, out-of-gas onchain, KeeperHub mencoba lagi | tx gagal → tx mendarat → assertion hijau | `keeperhub` |
| **B** | Broadcast, out-of-gas, tidak ada retry | RunProof hapus override → execution baru → sukses | `runproof` |
| **C** | Tidak pernah dibroadcast, ditolak preflight | fail-closed: nol gas terbakar, nol tx sampah | `none` |

Cabang A **tidak mensyaratkan dua execution record.** Retry bisa muncul sebagai dua record terpisah, atau sebagai satu record dengan beberapa tx hash / attempt di `/logs`. Keduanya sama-sama sah. Atribusi ditentukan oleh bukti yang benar-benar terlihat, bukan oleh bentuk yang diharapkan — kalau kamu mencari dua record dan yang ada satu record dengan dua attempt, kamu akan salah menyimpulkan "tidak ada retry".

Cabang C adalah yang saya lewatkan di draft sebelumnya. Ia **bukan kegagalan** — "sistem menolak mengirim transaksi yang pasti gagal, dan berikut buktinya nol wei terbakar" itu cerita reliability yang sah. Tapi ia mengubah demo secara total: tidak ada failed tx untuk ditunjukkan.

**Karena itu storyboard video tidak dikunci hari ini.** Ia mengikuti hasil gate, bukan sebaliknya.

Field report: `recoveryOwner: "keeperhub" | "runproof" | "none"`. Atribusi jujur adalah produknya.

### 6. Sore — buka PR bounty

Verifikasi konvensi repo sudah selesai (lihat langkah 1), jadi PR tidak perlu menunggu D2. Semakin awal dibuka, semakin ada waktu untuk direview dan mungkin di-merge.

```bash
git checkout -b docs/KEEP-xxx-node-version-mismatch   # fork dulu
```

Isi: perbaiki `README.md:66` agar sejalan dengan `.node-version` dan CONTRIBUTING. Sertakan hasil reproduksimu.

Nada kolaboratif — "ini yang saya temukan dan cara memperbaikinya", bukan "ini yang rusak". Yang membacanya adalah orang yang menulis baris itu.

Jalankan `pnpm check` + `pnpm type-check` sebelum push.

**Output D1:** `gate-findings.md` + `TEARDOWN.md` jalan + satu tx hash Sepolia + `.env` terisi + **PR terbuka**.

---

## D2 — Harness core

Temuan lain (retry, chain support) menyusul sebagai PR kedua atau komentar di PR yang sama, begitu eksperimen selesai.

**Spec format.** Satu file JSON, jangan bikin DSL:

```json
{
  "name": "increment happy path",
  "precondition":  { "read": "count()", "expect": { "op": "gte", "value": 0 } },
  "action":        { "chainId": 11155111, "contract": "0x…", "function": "increment()" },
  "postcondition": { "read": "count()", "expect": { "op": "eq", "delta": 1 } },
  "recovery":      { "expect": "keeperhub" }
}
```

## D3 — Runner

Alur (REST sepenuhnya): parse spec → baca pre-state via RPC → `POST /api/workflows/create` → `POST /api/workflows/{id}/execute` → `GET …/wait` → `GET …/logs` → baca post-state via RPC → assert → report.

State diff **dihasilkan RunProof**, bukan diambil dari KeeperHub: baca contract state sebelum dan sesudah pakai viem. Ini inti produknya.

```
src/spec.ts      parse + validasi spec
src/runner.ts    orkestrasi satu spec
src/assert.ts    baca state + bandingkan
src/report.ts    evidence → JSON + HTML statis
```

## D4 — Tiga skenario + report

1. Baseline sukses → post-state assertion hijau
2. Gas underrun → sesuai cabang D1
3. Forced revert → gagal di simulasi, tidak pernah dibroadcast, catat gas yang tidak terbakar

`report.ts` mengeluarkan **satu file HTML statis**: timeline simulation → execution → recovery → assertions. Tanpa server, tanpa framework. Ini yang direkam di video.

## D5 — Rapikan + stretch

`TEARDOWN.md` final: berapa menit nol→tx pertama, di mana macet, fix konkret. Update PR kalau ada temuan baru. Stretch x402 hanya kalau semua hijau.

## D6 — Submission

Video tiga menit, storyboard mengikuti cabang gate. Tunjukkan **urutan peristiwa** di HTML report, bukan laporan akhirnya.

Butuh: link GitHub, video, link transaksi.

---

## Urutan potong kalau tertinggal

1. Stretch x402 (buang duluan, tanpa penyesalan)
2. Skenario 3 (revert) → sisakan baseline + gas underrun
3. HTML report → JSON saja, rekam terminal
4. **Jangan pernah dipotong:** friction ledger, PR di D1, satu tx hash yang jalan, video
