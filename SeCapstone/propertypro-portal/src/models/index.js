/**
 * Entity contracts.
 *
 * These JSDoc typedefs are the front-end half of the backend API contract.
 * Field names here are the exact JSON property names the REST API is expected
 * to return, so a backend implemented against `docs/api-contract.md` drops in
 * with no mapping layer.
 *
 * @module models
 */

/**
 * @typedef {Object} Property
 * @property {string} id
 * @property {string} name            e.g. "Building A"
 * @property {string} letter          e.g. "A"
 * @property {string} address
 * @property {string} city            e.g. "Pasig City"
 * @property {"boarding_house"|"apartment"} type
 * @property {number} totalUnits
 * @property {number} occupiedUnits
 * @property {number} vacantUnits
 * @property {number} noticeUnits
 * @property {number} maintenanceUnits
 * @property {number} occupancyRate   0–100
 * @property {number} monthlyRevenue  PHP, collected this cycle
 * @property {string} accent          gradient token for the card banner
 */

/**
 * @typedef {Object} Unit
 * @property {string} id
 * @property {string} propertyId
 * @property {string} letter          building letter A–D
 * @property {string} code            e.g. "A-101"
 * @property {string} floor           e.g. "Ground Floor"
 * @property {number} floorNumber
 * @property {string} type            e.g. "Single", "Double Sharing"
 * @property {"occupied"|"vacant"|"notice"|"maintenance"} status
 * @property {string|null} tenantId   null when vacant
 * @property {string|null} tenantName
 * @property {number} monthlyRent     PHP
 * @property {"individual"|"shared_occupancy"} arrangement
 * @property {number} occupants
 */

/**
 * @typedef {Object} Tenant
 * @property {string} id
 * @property {string} fullName
 * @property {string} email
 * @property {string} phone
 * @property {string} governmentId    e.g. "123-45-67890"
 * @property {string} emergencyContactName
 * @property {string} emergencyContactPhone
 * @property {string} propertyId
 * @property {string} unitId
 * @property {string} unitCode        e.g. "B-203"
 * @property {string} propertyName    e.g. "Building B"
 * @property {string} floor
 * @property {string} leaseStart      ISO date
 * @property {string} leaseAnniversary day-of-month rent is generated on
 * @property {number} monthlyRent     PHP
 * @property {"individual"|"shared_occupancy"} arrangement
 * @property {"active"|"notice"|"ended"} occupancy
 * @property {string} moveInDate      ISO date
 */

/**
 * @typedef {Object} BillLine
 * @property {string} id
 * @property {"rent"|"electricity"|"water"} category
 * @property {string} period          e.g. "Oct 2026"
 * @property {number} amount          PHP, 2 decimal places
 * @property {string} dueDate         ISO date
 * @property {"unpaid"|"tenant_reported_paid"|"paid"} paymentStatus
 * @property {string|null} sourceRef  OCR reference for utility bills
 * @property {BillLine[]|undefined} [allocations] shared-occupancy split
 */

/**
 * @typedef {Object} Bill
 * @property {string} id
 * @property {string} tenantId
 * @property {string} tenantName
 * @property {string} unitCode
 * @property {string} propertyId
 * @property {BillLine[]} lines
 * @property {number} totalDue        PHP
 * @property {string} dueDate         ISO date
 * @property {"unpaid"|"tenant_reported_paid"|"paid"} paymentStatus
 * @property {"individual"|"shared_occupancy"} arrangement
 * @property {boolean} finalized
 * @property {string|null} receiptId  only set once Manager-confirmed
 */

/**
 * @typedef {Object} Payment
 * @property {string} id
 * @property {string} billId
 * @property {string} tenantId
 * @property {number} amount          PHP
 * @property {string} reportedOn      ISO datetime (tenant action)
 * @property {string|null} confirmedOn ISO datetime (Manager action)
 * @property {"cash"|"bank_transfer"|"e_wallet"} method
 * @property {string} reference
 * @property {"tenant_reported_paid"|"paid"} status
 * @property {string|null} receiptNumber e.g. "RCP-2026-0042"
 */

/**
 * @typedef {Object} IncomingBill
 * A utility bill retrieved from the designated property-management mailbox
 * and processed by OCR. OCR only extracts — validation decides the outcome.
 * @property {string} id
 * @property {string} provider
 * @property {string} accountRef
 * @property {string|null} amountDue     null when OCR could not read it
 * @property {string|null} dueDate
 * @property {string|null} billingPeriod
 * @property {"electricity"|"water"} category
 * @property {number} confidence         0–100 extraction confidence
 * @property {"processing"|"validated"|"failed"} ocrStatus
 * @property {string} receivedAt         ISO datetime
 * @property {string} filename
 */

/**
 * @typedef {Object} ExceptionRecord
 * @property {string} id
 * @property {string} reason
 * @property {"high"|"medium"|"low"} severity
 * @property {"incoming_bill"|"billing"|"payment"} source
 * @property {string} sourceId
 * @property {string} title
 * @property {string} detail
 * @property {Array<{label:string,value:string,missing?:boolean}>} fields
 * @property {string} raisedAt           ISO datetime
 * @property {"open"|"corrected"|"revalidated"} state
 */

/**
 * @typedef {Object} ActivityEvent
 * @property {string} id
 * @property {"Utility Bill Received"|"Tenant Payment"|"Exception Queue"|
 *            "Payment Confirmed"|"Receipt Generated"|"Web Push Notification"|
 *            "Bill Finalized"|"Correction Applied"} type
 * @property {string} subject     e.g. "Meralco · Unit C-104"
 * @property {string|null} actor
 * @property {"Pending"|"Paid"|"Unpaid"|"Review"} status
 * @property {string} timestamp   ISO datetime
 * @property {string|null} href   deep link for the row
 */

/**
 * @typedef {Object} DashboardStats
 * @property {{value:number,delta:number}} totalUnits
 * @property {{value:number,delta:number}} totalTenants
 * @property {{value:number,delta:number}} incomingBills
 * @property {{value:number,delta:number}} exceptionQueue
 */

export {};
