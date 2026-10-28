# One-Tenant practice run

Use only `unit-b-water-practice-scan.pdf` as the email attachment. This is one synthetic Manila Water bill for G3-B, occupied by Jullian. It is a different utility account from the two Group 3 electricity bills and does not replace those files. The preview PNG is the same case, not another bill.

Expected result: PHP 275.50 water charge for Jullian only; due 29 October 2026, period 1-22 October 2026. Fictional account G3W0102 is mapped to G3-B. William and Khristian must not receive this charge.

1. Keep the Group 3 portal running with `npm.cmd run demo:group -- --receive` from `SeCapstone/rentara-portal`.
2. From your personal email, send to `rentara2026@gmail.com` with subject **Group 3 Demo - Single Tenant Practice**. Attach only the PDF. The sender need not be Jullian; verified account mapping determines the bill owner.
3. Open the property Gmail and apply **Rentara-Group3-Demo** to that received email. An automatic Gmail filter has not been configured.
4. Open `https://localhost:8444/` in Chrome/Edge. Sign in as `manager@propertypro.ph`, initial local-demo password `LocalDemo!2026`. Open **Bills & Payments > Sync intake**, then refresh the list after processing. Alternatively wait for the periodic mailbox check.
5. Inspect the extracted water bill and the G3-B assignment. Valid records should finalize automatically. If it enters Bills for Review, inspect the recorded reason rather than assuming success.
6. Sign out and sign in as Jullian using his submitted email (`datakanani@gmail.com`) and the same initial local-demo password. Check **My home > Personal utility tracker**, **Bills**, and the portal notification bell. Expect PHP 275.50 water with Not Marked Paid. Rent remains separate.
7. Mark the water charge personally paid, then undo it if rehearsing again. This is personal tracking; provider settlement is not verified and no utility receipt/email notice is created.

The preparation script tested the actual email parser and scanned-PDF OCR in a temporary database. It added only the mapping to the presentation portfolio: the bill itself has NOT been pre-imported. No external email was sent. A second import of this same account/period should not create another charge. Do not delete records or change the filename to bypass duplicate protection.

Regenerate/verify with `node tools/prepare-single-tenant-demo.mjs`. Re-running does not reset previously imported bills. The separate `verification.json` contains synthetic test evidence, not a real-provider accuracy claim or proof of phone/Gmail delivery.
