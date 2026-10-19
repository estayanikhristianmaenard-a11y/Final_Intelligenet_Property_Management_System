# Storage policy

Keep SQLite for local capstone development. Documents stay in the data directory as files; the database holds structured records and file references. Base64 upload payloads are not retained as document copies in SQLite.

## Space reductions implemented

- New identical source uploads share one content-addressed file. Separate intake IDs, email metadata, duplicate checks and exception history remain. Existing source paths are supported; old duplicate files are not automatically deleted.
- OCR text of at least 1 KB is gzip-compressed inside its incoming-record JSON only when the encoded compressed representation is smaller. Reads restore the original text exactly. Ordinary fields remain readable JSON; older uncompressed records still work. Compression applies on subsequent saves, not through a bulk rewrite of existing records.
- Expired login sessions are pruned at startup and during scheduler ticks. Active sessions, accounts, financial records and audit history are retained. SQLite can reuse freed pages; cleanup does not necessarily shrink the database file immediately.
- PDF/JPEG/PNG originals, bills, allocation snapshots, payment and receipt references, correction versions and Tenant tracking history are preserved. Images are not downscaled or recompressed before OCR.

## Backup and operating limits

Back up the SQLite database using its consistent backup function and include the source/document directories. A database-only backup does not contain original bills. Keep the OCR language cache; repeatedly removing it would force regeneration or downloads and slow processing. Do not delete source files independently of their referencing records.

Upload limits remain 10 MB per file, with supported extraction boundaries enforced by the integration. Storage grows with genuine billing and audit history; no zero-growth claim is made. Optional offline VACUUM and future historical-retention decisions should be planned separately with a verified backup. No automatic deletion of financial or audit history is introduced.

Validation: 33 tests passed, including lossless compressed OCR reads, identical-file reuse, preserved duplicate review, expired versus active sessions, authenticated source download and browser document preview. No current database was bulk migrated or manually compacted.
