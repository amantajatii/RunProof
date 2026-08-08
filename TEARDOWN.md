# TEARDOWN — friction ledger

Catatan mentah perjalanan nol → transaksi pertama di KeeperHub.
Semua sudah diredaksi: tidak ada API key, org ID, user ID, atau wallet address.

| Waktu (UTC+2) | Langkah | Yang terjadi | Friksi |
|---|---|---|---|
| 7 Ags ~11:5x | Faucet Sepolia | 0.05 ETH masuk, nonce 0 | — |
| 7 Ags ~11:57 | Wallet integration dibuat | type `web3`, `isManaged: false` | Tidak jelas dari UI apakah wallet unmanaged bisa dipakai eksekusi headless |
| 7 Ags | MCP OAuth (`/mcp`) | scope `mcp:read/write/admin`, tool langsung muncul | — |

## Temuan

### 0. Write action dieksekusi lewat relayer + EIP-7702, tidak terdokumentasi

Transfer pertama (native, Sepolia) berhasil headless — tanpa prompt browser sama sekali,
meski integration melaporkan `isManaged: false`. Tapi receipt onchain-nya tidak seperti dugaan:

| Field | Nilai |
|---|---|
| `from` (receipt) | EOA relayer KeeperHub, **bukan** wallet integration |
| `to` (receipt) | contract executor, bukan recipient yang diminta |
| `gasUsed` | 74757 — jauh di atas 21000 untuk transfer native |
| balance wallet | **tidak berubah** sedikit pun; gas disponsori relayer |
| nonce wallet | 0 → 1 (terpakai oleh otorisasi delegasi) |
| `eth_getCode` wallet | `0xef0100…` → indikator delegasi **EIP-7702** |

Artinya wallet EOA didelegasikan ke contract implementasi, lalu relayer yang membroadcast.
Tidak ada satu pun di UI atau docs yang menyebutkan ini saat wallet dihubungkan.

Konsekuensi untuk siapa pun yang membangun di atas KeeperHub:
- `receipt.from` **bukan** aktor yang kamu kira — atribusi naif akan salah
- gas tidak keluar dari wallet user, jadi funding faucet mungkin tidak diperlukan
  untuk write action (hanya untuk transfer bernilai)
- assertion berbasis selisih balance harus memperhitungkan gas yang disponsori

### 0b. Sesi MCP OAuth melempar `401 Unauthorized` secara intermiten

Satu sesi, scope `mcp:read mcp:write mcp:admin`, tanpa re-auth di antaranya:

| Waktu | Panggilan | Hasil |
|---|---|---|
| 11:06 | `create_workflow` | 200 |
| ~11:1x | `execute_workflow` | **401** |
| 12:28 | `create_workflow` | 200 |
| ~12:3x | `update_workflow` | **401** |
| ~12:3x | `create_workflow` (lagi) | **401** |

Dugaan pertama saya salah — ini bukan "eksekusi tidak diizinkan lewat OAuth", karena
`create` yang tadinya lolos pun akhirnya ditolak. Polanya waktu, bukan tool: mirip token
kedaluwarsa tanpa refresh otomatis.

Yang bikin mahal buat pendatang baru: `401` telanjang tanpa pesan tidak membedakan
"token habis, auth ulang" dari "kamu memang tidak punya izin". Saya sempat menyimpulkan
yang kedua dan hampir menulisnya sebagai temuan yang salah.

Jalur `kh_` Bearer + REST tidak pernah gagal sekali pun sepanjang sesi yang sama.

### 0d. `gasLimitMultiplier` diabaikan diam-diam di jalur sponsored

`web3/write-contract` mengekspos `gasLimitMultiplier` sebagai optional field. Tiga eksekusi
`increment()` pada fixture yang sama, hanya multiplier yang berbeda:

| multiplier | hasil | gasUsed |
|---|---|---|
| (tidak diset) | success | 67914 (SSTORE 0→1) |
| `0.3` | success | 50814 |
| `0.001` | success | **50814** — identik |

0.001 × estimasi seharusnya kehabisan gas jauh sebelum SSTORE. Angka yang identik antara
0.3 dan 0.001 menunjukkan nilainya tidak pernah sampai ke transaksi: relayer sponsorship
menentukan gas limit sendiri.

Kalau memang tidak berlaku untuk write yang disponsori, field-nya sebaiknya ditolak saat
validasi atau ditandai di UI — bukan diterima lalu dibuang. Knob yang menerima input dan
tidak melakukan apa pun lebih buruk daripada tidak ada knob.

### 0c. Tiga label yang menyesatkan di payload evidence

Baseline `increment()` sukses, `raw/wait.json` + `raw/status.json`:

| Field | Nilai | Masalah |
|---|---|---|
| `gasUsedWei` | `"67914"` | Ini gas **units**, identik dengan `gasUsed`/`gasUsedUnits`. Wei-nya seharusnya units × `effectiveGasPrice` |
| `workflowType` | `"read"` | Workflow-nya satu node `web3/write-contract` — jelas write |
| `progress` | `totalSteps: 0`, `completedSteps: 2`, `percentage: 0` | Eksekusi sudah `success`; progress-nya tidak pernah terisi benar |

### 1. Node version bertentangan (branch `staging`)

- `README.md:66` → Node.js 22
- `CONTRIBUTING.md:17` + `.node-version` → 24

Reproduksi: _(isi setelah install Node 22 dan `pnpm install`)_

## Total waktu nol → tx pertama

_(isi di D5)_
