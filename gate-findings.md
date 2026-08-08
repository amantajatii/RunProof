# Gate findings — D1, 7 Agustus 2026

Fixture: `0xfc8cb154446563CdCD1c73996918Cd4459a8d176` (Sepolia)
Respons mentah: `raw/` (tidak di-commit)

## Keputusan cabang

Plan menyiapkan tiga cabang untuk gas underrun. **Tidak satu pun kena** — ada cabang keempat.

`gasLimitMultiplier` tidak berpengaruh apa pun. Multiplier `0.3` dan `0.001` menghasilkan
`gasUsed` yang identik (50814) dan keduanya sukses. Relayer sponsorship menentukan gas limit
sendiri; nilai yang diminta tidak pernah sampai ke transaksi.

**Konsekuensi: Skenario 2 (gas underrun) tidak bisa dibangun.** Bukan sulit — tidak tersedia
lewat kontrol mana pun yang diekspos.

## Yang menggantikannya

Jalur revert memberi demo yang lebih kuat dari gas underrun. Fixture di-pause, lalu
`increment()` dijalankan dua kali dengan `failOnError` berbeda:

| | `failOnError: true` | `failOnError: false` |
|---|---|---|
| `execution.status` | `error` | **`success`** |
| `output.success` | — | **`true`** |
| transactionHash | tidak ada | tidak ada |
| receipt | tidak ada | tidak ada |
| `error` | `Contract call failed: Error(paused)` | `Contract call failed: Error(paused)` |
| `count` onchain | tidak berubah | **tidak berubah** |

Kolom kanan itu inti RunProof: KeeperHub melaporkan **sukses** untuk operasi yang tidak
pernah terjadi. Errornya ada, tapi tersimpan di field yang tidak dilihat siapa pun yang
membaca `status`. State diff independen menangkapnya dalam satu baris.

Ini demo yang lebih baik daripada gas underrun, karena kegagalannya *senyap* — bukan merah
menyala yang toh sudah kelihatan.

## Perilaku yang terverifikasi

- **Fail-closed sebelum broadcast.** Revert tertangkap di simulasi. Nol gas terbakar, nol tx
  sampah. Ini perilaku bagus dan layak ditunjukkan apa adanya.
- **Eksekusi headless jalan** tanpa prompt browser, meski `isManaged: false`.
- **Semua gas disponsori relayer.** Saldo wallet tidak bergerak sepanjang seluruh eksperimen.
- **Receipt direkonsiliasi onchain** oleh KeeperHub sendiri (`verified: true`, `receiptStatus`)
  sebelum eksekusi difinalkan.
- **Retry akan terlihat sebagai `transactionHashes[]` dengan panjang > 1.** Tidak ada field
  `attempt` atau `retryCount` di `/logs`.

## Atribusi

`recoveryOwner` untuk skenario revert = **`none`** — tidak pernah dibroadcast, jadi tidak ada
yang perlu dipulihkan. Cabang `keeperhub` belum pernah teramati sama sekali; tidak ada
retry yang terpicu di seluruh eksperimen hari ini.

Jangan klaim perilaku retry di video tanpa pernah melihatnya.

## Dampak ke rencana

- Skenario 2 diganti: gas underrun → jebakan `failOnError`
- Storyboard video sekarang bisa dikunci: sukses → revert fail-closed → jebakan senyap
- Endpoint di plan (`/status`, `/wait`, `/logs`, `/executions`) semuanya nyata dan `200`
- Runner tetap REST. Sesi MCP OAuth melempar 401 intermiten; `kh_` key tidak pernah gagal
