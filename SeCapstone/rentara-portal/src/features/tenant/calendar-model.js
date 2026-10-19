/** Presentation-only entries. Estimates never create bills, reminders or amounts. */
export function calendarEntries(bills, tenant, year, month, now = new Date()) {
  const entries = bills.filter(bill => /^\d{4}-\d{2}-\d{2}$/.test(bill.dueDate ?? "")).map(bill => ({...bill, estimated:false}));
  const today = now.toLocaleDateString("en-CA",{timeZone:"Asia/Manila"});
  const next = new Date(`${today.slice(0,7)}-01T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth()+1);
  const target = `${year}-${String(month+1).padStart(2,"0")}`;
  // Only the next month's known rent anniversary is previewed, never utilities.
  if (target !== next.toISOString().slice(0,7)) return entries;
  const originalDay = Number(tenant.leaseAnniversary || String(tenant.leaseStart ?? "").slice(-2));
  if (!Number.isInteger(originalDay) || originalDay < 1 || originalDay > 31 || !tenant.leaseStart) return entries;
  const day = Math.min(originalDay,new Date(Date.UTC(year,month+1,0)).getUTCDate());
  const dueDate = `${target}-${String(day).padStart(2,"0")}`;
  const start = [tenant.leaseStart,tenant.assignmentStart].filter(Boolean).sort().at(-1);
  const end = [tenant.leaseEnd,tenant.assignmentEnd].filter(Boolean).sort()[0];
  if (dueDate < start || (end && dueDate > end)) return entries;
  if (!entries.some(bill => bill.dueDate === dueDate && bill.lines?.every(line=>line.category === "rent"))) {
    entries.push({id:`scheduled-rent-${dueDate}`,dueDate,estimated:true,lines:[{category:"rent"}]});
  }
  return entries;
}
