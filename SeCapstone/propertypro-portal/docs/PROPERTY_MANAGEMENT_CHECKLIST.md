# Property and Tenant management

Use the integrated portal at `/portal` and sign in with a Manager account.

1. Properties: **Add property** creates a record; **Edit property** opens that card's record in the existing modal. Save refreshes the portfolio.
2. Units: **Add unit** selects a Manager-owned property; **Edit** changes the selected unit. Building and status filters use actual records. **Assign** opens Occupancy assignments.
3. Tenants: **Add tenant** creates an account. Click a tenant row to view the existing detail panel; **Edit tenant** updates details/password. Leave the password blank to preserve it.
4. Leases: select a unit, inclusive dates, arrangement, and integer monthly rent in centavos. Overlapping leases for the same unit are rejected.
5. Occupancy assignments: select a lease and Tenant, with dates inside the lease. Tenant overlap and peak capacity are checked before saving. Use the edit selector to adjust an assignment.
6. Dashboard and Tenant home show updated database records. Tenants see only their own active assignment; Managers cannot read or modify another Manager's records. Admin cannot perform property operations.

Leases with assignments cannot be amended yet. The property/capacity of a unit with leases is protected against changes. No delete operation is introduced. Billing and payment history workflows must be completed before enabling destructive changes or lease amendments that could affect them.

The prototype's Export and portal-message features are not part of this completed module. Live Tenant panels expose record editing and assignment navigation instead of a nonfunctional messaging action. Billing, OCR, receipts, and Web Push remain subsequent iterations.
