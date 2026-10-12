# Monthly rent generation

In the existing Manager Bills & Payments screen, select **Generate today's rent**. This processes only the authenticated Manager's leases and today's Philippine calendar date. Already-generated cycles are returned without duplicate bills. A blocked lease is reported with its reason; no partial billing records are created for it.

Rent is fixed and non-prorated. The lease's original start day determines the monthly generation/due date. Short months use their last calendar day; subsequent months retain the original anniversary day. Generation stops outside the lease dates. The first cycle includes current rent and one-month advance as separate lines.

Individual leases require one eligible occupant. Shared leases split each source amount equally among generation-date occupants, using integer centavos. Remainder centavos go to ascending permanent Tenant IDs. Stored membership snapshots preserve who was charged. Advance rent and current rent reconcile separately to their source totals.

Tenants can view their own rent bills through My Bills & Payments and My Home. Generated bills start Unpaid. Payment reporting, Manager confirmation, final-cycle application of confirmed advance credit, receipts, and notifications are not implemented in this iteration. The advance is a charge only; it is not marked paid or automatically credited.

## Local automatic processing

From `SeCapstone/backend`, keep this process running alongside the web server:

```powershell
& 'C:\xampp\php\php.exe' artisan schedule:work
```

The registered job checks hourly. Alternatively run `artisan propertypro:generate-rent` or use the Manager button. The scheduler is configured but is not installed as a Windows service. It cannot process while the workstation is off. Missed past cycles are not silently backdated; a controlled recovery policy needs a later implementation. No user-supplied date is accepted by the generation API.

Database tables: `rent_cycles` (unique lease/date, source amounts, snapshot) and `rent_bills` (unique cycle/Tenant, allocated amounts, payment state). Migrations preserve existing records.
