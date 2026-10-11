import { passwordHash } from "./service.js";
import { philippineDate } from "./rules.js";
export function bootstrap(
  service,
  { adminPassword, managerPassword, tenantPassword, demo = false } = {},
) {
  const s = service.s;
  if (s.all("users").length)
    throw new Error(
      "Database already initialized; setup never overwrites existing accounts.",
    );
  const now = philippineDate();
  s.transaction(() => {
    s.save("settings", {
      id: "billing",
      intakeMailbox: "",
      allocationRule: "equal_split",
      advanceRentEnabled: true,
      prorateEnabled: false,
      reminderDays: 3,
      pushEnabled: true,
    });
    s.save("users", {
      id: "usr-admin",
      name: "System Administrator",
      email: "admin@propertypro.ph",
      role: "admin",
      status: "active",
      tenantId: null,
      passwordHash: passwordHash(adminPassword),
    });
    s.save("users", {
      id: "usr-manager",
      name: "Karla Dizon",
      email: "manager@propertypro.ph",
      role: "manager",
      status: "active",
      tenantId: null,
      passwordHash: passwordHash(managerPassword),
    });
    if (demo) {
      for (const letter of ["A", "B", "C", "D"]) {
        s.save("properties", {
          id: "prp-" + letter.toLowerCase(),
          name: "Building " + letter,
          letter,
          address: "Demo property — replace with actual address",
          city: "Pasig City",
          type: "apartment",
          accent: ["#4f46e5", "#312e81"],
        });
        s.save("units", {
          id: "unt-" + letter.toLowerCase(),
          propertyId: "prp-" + letter.toLowerCase(),
          letter,
          code: letter === "B" ? "B-203" : letter + "-101",
          floor: letter === "B" ? "Second Floor" : "Ground Floor",
          floorNumber: letter === "B" ? 2 : 1,
          type: "Studio Unit",
          status: "vacant",
          monthlyRent: letter === "B" ? 21750 : 9500,
          arrangement: letter === "B" ? "shared_occupancy" : "individual",
        });
      }
      for (const [i, name] of [
        "Maria Santos",
        "Alice Reyes",
        "Ben Cruz",
      ].entries()) {
        const id = "tnt-" + String(i + 1).padStart(3, "0");
        s.save("tenants", {
          id,
          unitId: "unt-b",
          propertyId: "prp-b",
          fullName: name,
          email:
            i === 0
              ? "maria.santos@gmail.com"
              : `occupant${i + 1}@example.test`,
          phone: "",
          governmentId: "",
          emergencyContactName: "",
          emergencyContactPhone: "",
          leaseStart: now,
          leaseEnd: null,
          assignmentStart: now,
          assignmentEnd: null,
          occupancy: "active",
          moveInDate: now,
        });
        s.save("assignments", {
          id: "assignment-" + id,
          tenantId: id,
          unitId: "unt-b",
          start: now,
          end: null,
          occupancy: "active",
        });
        s.save("leases", {
          id: "lease-" + id,
          tenantId: id,
          unitId: "unt-b",
          start: now,
          end: null,
          anniversaryDay: Number(now.slice(-2)),
        });
      }
      s.save("users", {
        id: "usr-tenant",
        name: "Maria Santos",
        email: "maria.santos@gmail.com",
        role: "tenant",
        tenantId: "tnt-001",
        unitCode: "B-203",
        status: "active",
        passwordHash: passwordHash(tenantPassword),
      });
      s.save("mappings", {
        id: "map-demo",
        unitId: "unt-b",
        provider: "meralco",
        account: "MER-552194",
        category: "electricity",
      });
    }
    s.audit(
      null,
      "Database initialized",
      demo ? "Explicit local demonstration data" : "Empty portfolio",
    );
  });
  if (demo) service.generateRent(now);
}
