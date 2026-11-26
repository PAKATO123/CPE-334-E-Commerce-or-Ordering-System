# **CPE334 Lab 6: Independent User Acceptance Testing and Defect Management** 

**Course:** CPE334 Software Engineering Laboratory | Semester 1/2026 **Due Date:** 22 November 2026 at 23:59 ICT (LEB2 Submission) **Weight:** 100 Lab Points | 5% of Course Grade 

## **Cover & Identification** 

### **Team & Application Identification (Product Team)** 

- **Project Theme / Context:** Theme 4 — E-Commerce or Ordering System (TechTent Everyday Consumer Electronics) 

- **Delivered Sprint 1 Scope:** 

   - <mark>`F-01`</mark> : User Authentication & Role-Based Session Control ( <mark>`CUSTOMER`</mark> , <mark>`OPERATOR`</mark> , <mark>`ADMIN`</mark> ). 

   - <mark>`F-02`</mark> : Everyday Tech Catalog Browsing & Real-Time Stock Availability (5 categories). 

   - <mark>`F-03`</mark> : Multi-Item Order Creation, Authoritative Pricing, and Atomic Stock Reservation. 

   - <mark>`F-04`</mark> : Customer Order Details & Chronological History with Historic Price Preservation. 

   - <mark>`F-05`</mark> : Operator Order Fulfillment Queue ( <mark>`PENDING`</mark> ➔ <mark>`ACCEPTED`</mark> / <mark>`REJECTED`</mark> with Inventory Restoral). 

- **Participating Students:** 

   1. **Student 1:** Pattarapon Sribuathong — Student ID: <mark>`67070503434`</mark> — GitHub: <mark>`@PAKATO123`</mark> 

   2. **Student 2:** Wai Phyo — Student ID: <mark>`67070503487`</mark> — GitHub: <mark>`@Joey-pku`</mark> 

- **Product Repository URL:** <mark>`https://github.com/PAKATO123/CPE-334-ECommerce-or-Ordering-System`</mark> 

- **Tested Release Tag / Commit:** <mark>`e17f136f543a4ebb1336e36b714149bb598febc8`</mark> (Release Tag: <mark>`v1.0.0sprint1`</mark> ) 

- **Deployed Production URL / Version:** 

<mark>`https://techtent-693107188088.asia-southeast1.run.app`</mark> (Revision: <mark>`techtent-00003-smt`</mark> ) 

### **Independent UAT Partner Team Identification (Testers of Our Product)** 

- **Partner Project Theme / Context:** <mark>`Personal Money and Expense Logging System - MoneyLog`</mark> 

- **Partner Repository URL:** <u>https://github.com/Tammathorn/moneylog</u> 

- **Partner Tested Release Tag / Commit:** d0a13043d4ad44db3823d01085a7285f7e25d4e0 / 088148a 

- **Partner Deployed URL / Version:** <u>https://moneylog-73939023981.asiasoutheast1.run.app/</u> / v0.1.0 

- **Independent UAT Testers:** 

   1. **Partner Student 1: chakriwat srivilai** — Student ID: <mark>`67070503407`</mark> — GitHub: **<mark>`GusGusxz`</mark>** 

   2. **Partner Student 2: tammathorn kananurak** — Student ID: <mark>`67070503489`</mark> — GitHub: <mark>`Tammathorn`</mark> 

- **Final Independent Sprint 1 UAT Acceptance Decision:** <mark>`[SELECT ONE: Accepted | Accepted with explicitly documented minor limitations | Not Accepted]`</mark> 

## **Table of Contents & Evidence Directory** 

|**Part**|**Section**<br>**Heading**|**Assessed Material (Handout**<br>**Section 4.1)**|**Evidence IDs**|**Page**|
|---|---|---|---|---|
|**Part A**|Part A: UAT<br>Preparation<br>and Handoff|Complete Sprint 1 UAT cases,<br>requirement/AC references,<br>handoff instructions; tested scope,<br>safe accounts, setup/cleanup,<br>version|`EVID-A-01`<br>to<br>`EVID-`<br>`A-06`|Page 2|
|**Part B**|Part B:<br>Independent<br>Execution|Other team/tester identities and<br>tested Sprint 1 release; all agreed<br>cases executed, actual results,<br>dates/testers, selected readable<br>evidence|`EVID-B-01`<br>to<br>`EVID-`<br>`B-05`|Page 5|
|**Part C**|Part C: Defect<br>Reporting and<br>Triage|Outgoing reports, if any; all<br>received findings with<br>classification, severity,<br>disposition, resolution status;<br>documented minor limitations|`EVID-C-01`<br>to<br>`EVID-`<br>`C-02`|Page 8|



|**Part**|**Section**<br>**Heading**|**Assessed Material (Handout**<br>**Section 4.1)**|**Evidence IDs**|**Page**|
|---|---|---|---|---|
|**Part D**|Part D:<br>Resolution<br>and<br>Independent<br>Retest|Accepted-defect chain: regression<br>test excerpt and red/green output,<br>code diff, review/CI/release<br>evidence, deployed fix version,<br>partner retest/closure,<br>contributions, AI use, limitations|`EVID-D-01`<br>to<br>`EVID-`<br>`D-04`|Page 11|



# **Part A: UAT Preparation and Handoff** 

**Handout Reference §4.1 (Part A):** _Your complete Sprint 1 UAT cases, requirement/AC references and handoff instructions; tested scope, safe accounts, setup/cleanup and version._ 

### **A.1 Tested Scope & Release Version** 

- **Application Context:** TechTent Everyday Electronics Ordering System (Theme 4). 

- **Delivered Sprint 1 Scope:** Feature contracts <mark>`F-01`</mark> through <mark>`F-05`</mark> (Authentication, Tech Catalog, Multi-item Orders with Atomic Reservation, Preserved Receipts, and Operator Queue). 

- **Explicit Exclusions (Deferred Scope):** Customer-side cancellation ( <mark>`F-07`</mark> ), catalog editing/restocking CRUD ( <mark>`F-06`</mark> ), third-party payment gateways ( <mark>`F-08`</mark> ), and turnaround sales analytics ( <mark>`F-09`</mark> ) are scheduled for Sprints 2 and 3 and are explicitly not part of this Sprint 1 acceptance. 

- **Tested Release Tag / Commit:** <mark>`e17f136f543a4ebb1336e36b714149bb598febc8`</mark> (Release Tag: <mark>`v1.0.0sprint1`</mark> ). 

- **Deployed Cloud Run Revision:** <mark>`techtent-00003-smt`</mark> . 

- **Live Deployed URL:** <mark>`https://techtent-693107188088.asiasoutheast1.run.app`</mark> . 

### **A.2 Safe Test Accounts & Private Credentials Handoff** 

As required by Section 3.1, credentials are provided privately to the UAT Team through course communication channels. Only safe role labels appear in this public document without secret values. 

|**Account**<br>**Label**|**System**<br>**Role**|**Safe UAT Purpose**|**Permitted Operations**|
|---|---|---|---|
|`Account-`<br>`Customer-1`|`CUSTOME`<br>`R`|Catalog browsing, multi-<br>item order placement,<br>viewing own receipts|Access to<br>`/`and<br>`/orders`;<br>denied<br>`/operator/orders`|
|`Account-`<br>`Customer-2`|`CUSTOME`<br>`R`|Cross-customer ownership<br>isolation verification|Access to<br>`/`and<br>`/orders`;<br>denied viewing Customer-1<br>receipts|
|`Account-`<br>`Operator-1`|`OPERATO`<br>`R`|Fulfillment queue<br>processing (accept/reject<br>orders)|Access to<br>`/operator/orders`;<br>cannot place customer<br>orders|
|`Account-`<br>`Admin-1`|`ADMIN`|Administrative supervision<br>and fallback|Full access across<br>operational and admin<br>endpoints|



### **A.3 Data Setup, Catalog Lineup & Reset/Cleanup Instructions** 

- **Synthetic Electronics Catalog Setup:** 

   - Product `1` : <mark>`PHON-PRO-256`</mark> — Flagship Pro Smartphone 256GB — $899.00 (Initial Stock: 10) 

   - Product `2` : <mark>`TAB-ULTRA-11`</mark> — Ultra Tablet 11" 128GB — $549.00 (Initial Stock: 8) 

   - Product `3` : <mark>`TV-SMART-55`</mark> — 55" 4K Smart OLED TV — $699.00 (Initial Stock: 5) 

   - Product `4` : <mark>`KB-MECH-RGB`</mark> — Wireless Mechanical Keyboard — $79.00 (Initial Stock: 15) 

   - Product `5` : <mark>`CHG-GAN-65W`</mark> — 65W GaN Fast Charger USB-C — $29.00 (Initial Stock: 25) 

   - Product `6` : <mark>`PHON-FLIP-LTD`</mark> — Flip Smartphone Limited Edition — $999.00 (Initial Stock: **0** — Out-of-Stock Demo) 

   - Product `7` : <mark>`DISCONT-OLD-GEN`</mark> — Discontinued 30-Pin Cable — $9.99 (Initial Stock: 50, <mark>`isActive = false`</mark> — Inactive Demo) 

- **Setup & Sequencing:** Test cases are independent, but testing rejection in <mark>`UAT-TT-06`</mark> should occur after placing orders in <mark>`UAT-TT-01`</mark> . 

- **Reset & Cleanup Procedures:** 

1. _Inventory Restoral:_ Rejecting an order in <mark>`/operator/orders`</mark> automatically restores reserved stock in PostgreSQL. 

2. _Idempotent Seed Reset:_ If test accounts or stock require a clean baseline, running <mark>`npm run prisma:seed`</mark> in the deployment environment idempotently restores initial products and demo accounts without data loss. 

3. _Session Invalidation:_ Click "Sign Out" or clear <mark>`connect.sid`</mark> cookie. 

### **A.4 Complete Executable Sprint 1 UAT Test Cases** 

#### **<mark>`UAT-TT-01`</mark> : Customer Multi-Item Electronics Purchase & Preserved Receipt (** **<mark>`EVID-A-01`</mark> )** 

- **Test Category:** Category 1 — Normal Domain Journey 

- **Requirement / AC Reference:** <mark>`FR-01`</mark> , <mark>`FR-03`</mark> , <mark>`FR-04`</mark> , <mark>`AC-ORD-01`</mark> , <mark>`AC-ORD-05`</mark> 

- **Purpose:** Verify customer can assemble a multi-item electronics cart, place an order with authoritative calculation, and verify the historic receipt. 

- **Role:** <mark>`Account-Customer-1` (</mark> <mark>`CUSTOMER`</mark> ) 

- **Preconditions:** Seeded catalog active; <mark>`PHON-PRO-256`</mark> (Price: 899.00 _,Stock_ :10 ) _;_ ‘ _KB_ - _MECH_ - _RGB_ ‘( _Price_ :79.00, Stock: 15). 

- **Synthetic Inputs:** 1 unit of <mark>`PHON-PRO-256`</mark> , 2 units of <mark>`KB-MECH-RGB`</mark> . 

- **Numbered User Actions:** 

1. Open <mark>`https://techtent-693107188088.asia-`</mark> 

<mark>`southeast1.run.app/login`</mark> and log in as <mark>`Account-Customer-1`</mark> . 

2. On catalog `/` , locate <mark>`Flagship Pro Smartphone 256GB`</mark> and click "Add to Cart". 

3. Locate <mark>`Wireless Mechanical Keyboard`</mark> , increment quantity stepper to `2` , and click "Add to Cart". 

4. Open Cart drawer; verify calculated subtotal: (1 × 899.00 )+( 2 _×_ 79.00) = **$1,057.00 USD** . 

5. Click "Place Order" and confirm order creation dialog. Record the generated Order ID <mark>(</mark> <mark>`ORD-YYYYMMDD-XXXX`</mark> ). 

6. Navigate to <mark>`/orders`</mark> and click "View Receipt" for the placed order. 

- **Specific Expected Results:** 

   - Order status is <mark>`PENDING`</mark> (yellow badge). 

   - Itemized receipt displays exact preserved prices (899.00∧¿79.00), quantities (1 and 2), and grand total of **$1,057.00** . 

   - Catalog stock for <mark>`PHON-PRO-256`</mark> decrements from 10 to 9; <mark>`KB-MECH-RGB`</mark> decrements from 15 to 13. 

#### **<mark>`UAT-TT-02`</mark> : Inventory Boundary Limit & Insufficient Stock Enforcement** **<mark>(</mark>** **<mark>`EVID-A-02`</mark> )** 

- **Test Category:** Category 2 — Business-Rule / Boundary Case 

- **Requirement / AC Reference:** <mark>`BR-03`</mark> , <mark>`NFR-02`</mark> , <mark>`AC-BR-03`</mark> 

- **Purpose:** Verify that ordering quantity exceeding available stock is rejected and stock remains untouched. 

- **Role:** <mark>`Account-Customer-1` (</mark> <mark>`CUSTOMER`</mark> ) 

- **Preconditions:** <mark>`55" 4K Smart OLED TV` (</mark> <mark>`TV-SMART-55`</mark> ) has current stock = `5` . 

- **Synthetic Inputs:** Quantity = `6` units of <mark>`TV-SMART-55`</mark> (exceeds stock by 1). 

- **Numbered User Actions:** 

   1. Sign in as <mark>`Account-Customer-1`</mark> . 

   2. On catalog page `/` , locate <mark>`55" 4K Smart OLED TV`</mark> . 

   3. Enter `6` in the quantity input and attempt to checkout / place order. 

- **Specific Expected Results:** 

   - UI client validation blocks order submission or backend responds with HTTP <mark>`409 Conflict` (</mark> <mark>`INSUFFICIENT_STOCK`</mark> ). 

   - Zero orders are created in the database. 

   - Stock for <mark>`TV-SMART-55`</mark> remains exactly `5` units. 

#### **<mark>`UAT-TT-03`</mark> : Cross-Customer Order Isolation & Access Control (** **<mark>`EVIDA-03`</mark> )** 

- **Test Category:** Category 3 — Forbidden Role / Ownership Case 

- **Requirement / AC Reference:** <mark>`FR-06`</mark> , <mark>`AC-SEC-01`</mark> , <mark>`BR-04`</mark> 

- **Purpose:** Verify Customer A cannot view or access Customer B's order receipt. 

- **Role:** <mark>`Account-Customer-2` (</mark> <mark>`CUSTOMER`</mark> ) 

- **Preconditions:** Order <mark>`#1`</mark> belongs to <mark>`Account-Customer-1`</mark> . <mark>`AccountCustomer-2`</mark> is an independent customer account. 

- **Synthetic Inputs:** Target URL <mark>`/orders/1`</mark> . 

- **Numbered User Actions:** 

   1. Sign in as <mark>`Account-Customer-2`</mark> . 

   2. Verify <mark>`/orders`</mark> list does not show Order <mark>`#1`</mark> . 

   3. In browser address bar, navigate manually to <mark>`/orders/1`</mark> . 

- **Specific Expected Results:** 

   - Customer-1's receipt data is NOT displayed. 

   - Application renders an access restricted error card: _"Order not found or permission denied"_ . 

- Backend API responds with HTTP <mark>`403 Forbidden` (</mark> <mark>`FORBIDDEN`</mark> ). Zero line items or customer data are disclosed. 

#### **<mark>`UAT-TT-04`</mark> : Role Boundary — Customer Denied Operator Endpoints** **<mark>(</mark>** **<mark>`EVID-A-04`</mark> )** 

- **Test Category:** Category 3 — Forbidden Role / Access Control 

- **Requirement / AC Reference:** <mark>`BR-05`</mark> , <mark>`AC-SEC-02`</mark> 

- **Purpose:** Verify Customer role cannot access the Operator Order Queue. 

- **Role:** <mark>`Account-Customer-1` (</mark> <mark>`CUSTOMER`</mark> ) 

- **Preconditions:** Active customer session. 

- **Synthetic Inputs:** URL <mark>`/operator/orders`</mark> and API <mark>`GET /api/operator/orders`</mark> . 

- **Numbered User Actions:** 

   1. Sign in as Customer <mark>(</mark> <mark>`Account-Customer-1`</mark> ). 

   2. Navigate directly to <mark>`/operator/orders`</mark> in browser. 

   3. Execute <mark>`fetch('/api/operator/orders')`</mark> from browser console. 

- **Specific Expected Results:** 

   - Frontend navigation guard blocks route and redirects to `/` with an access denied alert. 

   - Backend API returns HTTP <mark>`403 Forbidden` (</mark> <mark>`FORBIDDEN`</mark> ). No order queue data is returned. 

#### **<mark>`UAT-TT-05`</mark> : Out-of-Stock Product Disablement in Catalog (** **<mark>`EVID-A-05`</mark> )** 

- **Test Category:** Category 2 — Business-Rule / Boundary Case 

- **Requirement / AC Reference:** <mark>`FR-02`</mark> , <mark>`AC-CAT-03`</mark> 

- **Purpose:** Verify products with 0 stock display Out-of-Stock state and prevent ordering. 

- **Role:** Anonymous / Customer 

- **Preconditions:** <mark>`Flip Smartphone Limited Edition` (</mark> <mark>`PHON-FLIP-LTD`</mark> ) has <mark>`stockQuantity = 0`</mark> . 

- **Synthetic Inputs:** Product card for <mark>`PHON-FLIP-LTD`</mark> on `/` . 

- **Numbered User Actions:** 

   1. Open catalog page `/` and locate <mark>`Flip Smartphone Limited Edition`</mark> . 

- **Specific Expected Results:** 

   - Product card displays red/muted **"Out of Stock"** indicator badge. 

   - Quantity controls are disabled/hidden, and "Add to Cart" button is strictly disabled <mark>(</mark> <mark>`disabled`</mark> attribute in DOM). 

#### **<mark>`UAT-TT-06`</mark> : Operator Fulfillment Lifecycle — Rejection & Atomic Stock Restoral** **<mark>(</mark>** **<mark>`EVID-A-06`</mark> )** 

- **Test Category:** Category 4 — State / History / Persistence Case 

- **Requirement / AC Reference:** <mark>`FR-08`</mark> , <mark>`FR-09`</mark> , <mark>`BR-06`</mark> , <mark>`AC-OP-03`</mark> 

- **Purpose:** Verify Operator queue order rejection updates persistent order status and atomically restores product stock in PostgreSQL. 

- **Role:** <mark>`Account-Customer-1`</mark> then <mark>`Account-Operator-1`</mark> 

- **Preconditions:** <mark>`65W GaN Fast Charger USB-C` (</mark> <mark>`CHG-GAN-65W`</mark> ) has initial stock = <mark>`25`</mark> . 

- **Synthetic Inputs:** Customer-1 orders 3 units of <mark>`CHG-GAN-65W`</mark> ; Operator selects "Reject Order". 

- **Numbered User Actions:** 

   1. As <mark>`Account-Customer-1`</mark> , place order for 3 units of <mark>`CHG-GAN-65W`</mark> . Catalog stock drops to 22. Record Order ID (e.g. <mark>`#42`</mark> ). 

   2. Sign in as <mark>`Account-Operator-1`</mark> and open <mark>`/operator/orders`</mark> . 

   3. Under "Pending" tab, locate Order <mark>`#42`</mark> and click **"Reject Order"** . 

   4. Confirm rejection in modal dialog. 

   5. Observe order status badge update to <mark>`REJECTED`</mark> . 

   6. Attempt to click "Accept" or "Reject" again on the same order. 

   7. Check public catalog stock for <mark>`65W GaN Fast Charger USB-C`</mark> . 

- **Specific Expected Results:** 

   - Order status is permanently persisted as <mark>`REJECTED`</mark> . 

   - Subsequent status update attempts return HTTP <mark>`409 ORDER_ALREADY_PROCESSED`</mark> . 

   - The 3 reserved units are atomically restored; catalog stock returns to exactly **<mark>`25`</mark> units** . 

# **Part B: Independent Execution** 

**Handout Reference §4.1 (Part B):** _Other team/tester identities and tested Sprint 1 release; all agreed cases executed, actual results, dates/testers and selected readable evidence._ 

### **B.1 Other Team / Tester Identities & Tested Sprint 1 Release** 

- **Partner Product Team Being Tested:** Group Name / EN-043 

- **Partner Application Theme / Context:** Personal Money and Expense Logging System / MoneyLog 

- **Partner Repository URL:** <u>https://github.com/Tammathorn/moneylog</u> 

- **Tested Partner Release Tag / Commit:** d0a13043d4ad44db3823d01085a7285f7e25d4e0 / 088148a 

- **Tested Partner Deployed URL / Revision:** <u>https://moneylog-73939023981.asiasoutheast1.run.app/</u> / moneylog-00006-6qc 

- **Testing Team (Our Team):** 

   - **Tester 1:** Pattarapon Sribuathong ( <mark>`67070503434`</mark> ) 

   - **Tester 2:** Wai Phyo <mark>(</mark> <mark>`67070503407`</mark> ) 

- **Execution Date Window:** <mark>`26 November 2026`</mark> 

### **B.2 All Agreed Cases Executed, Actual Results, Dates & Testers** 

Tested Version : <mark>`d0a13043d4ad44db3823d01085a7285f7e25d4e0`</mark> (applies to all tests) 

#### **Normal journey: salary, split card purchase, card repayment** 

**Case ID:** **<mark>`UAT-01`</mark>** 

**Tester:** <mark>`Pattarapon Sribuathong`</mark> **Execution Date/Time:** <mark>`26/11/26 5:42 PM`</mark> 

##### **Input:** 

- i. New transaction → Money received, into KBank Savings, today, total 25000.00, description UAT-01 salary, one line: Salary 25000.00. Save. 

- ii. New transaction → Payment / charge, from KTC Credit Card, today, total 1850.00, description UAT-01 card purchase, lines: Dining 650.00 and Groceries 1200.00. Save. 

- iii. New transaction → Payment / charge, from KBank Savings, today, total 1000.00, description UAT-01 card repayment, one line: KTC Credit Card 1000.00. Save. 

##### **Expected Results :** 

- KBank Savings = before + 25,000.00 − 1,000.00 = before + 24,000.00. 

- KTC Credit Card owed = before + 1,850.00 − 1,000.00 = before + 850.00. 

- Salary = before + 25,000.00; Dining = before + 650.00; Groceries = before + 1,200.00. 

- Overview: Income = before + 25,000.00; Expenses = before + 1,850.00 (the 1,000.00 repayment is not an expense); Net = before + 23,150.00. 

- Each save shows a "Transaction saved" confirmation. 

##### **Observed Results :** 

- KBank Savings = 26,000.00 (2,000.00 + 24,000.00) 

- KTC Credit Card owed = 850.00 (850.00 + 0.00) 

- Salary = 27,000.00 (2,000.00 + 25,000.00) 

- Dining = 650.00 (0.00 + 650.00) 

- Groceries = 1,200.00 (0.00 + 1,200.00) 

- Overview: Income = 27,000.00 (2,000.00 + 25,000.00) 

- Expenses = 1,850.00 (0.00 + 1,850.00) 

   - Net = 25,150.00 (2000.00 + 23,150.00) 

   - Every save shows a "Transaction saved" confirmation. 

- **Supporting Screenshots:** 

Before: 



<!-- Start of picture text -->
82,000.00 persetid 80.00 82,000.00 80.00 82,000.00<br>80.00<br>Cash and bank ‘Spending by category<br><!-- End of picture text -->



<!-- Start of picture text -->
Accounts<br><!-- End of picture text -->



Creation: 



<!-- Start of picture text -->
New transaction<br>Action ines<br>sony -|(aae<br><!-- End of picture text -->



<!-- Start of picture text -->
Transaction saved<br><!-- End of picture text -->



<!-- Start of picture text -->
New transaction<br>Alecaontns<br><!-- End of picture text -->



<!-- Start of picture text -->
Transaction saved<br><!-- End of picture text -->



<!-- Start of picture text -->
New transaction<br>mount im<br><!-- End of picture text -->



<!-- Start of picture text -->
Transaction saved<br><!-- End of picture text -->



<!-- Start of picture text -->
Results:<br><!-- End of picture text -->



<!-- Start of picture text -->
Gui<br>826,000.00 8850.00Rind 80.00 827,000.00 81,850.00 825,150.00<br>Cash and bank ‘Spending by category<br>‘KBank Savings. (826,000.00 Groceries ee 61,200.00<br>Wallet 0.00 Dining — 8650.00<br><!-- End of picture text -->



<!-- Start of picture text -->
Cash & bank<br>Loans given (owed to you)<br><!-- End of picture text -->





*I went back and created second K bank Received because I’ve accidentally missed one digit of 0 during first creation 

### **Outcome: PASS** 

#### **Business rule and boundary: lines must add up to the total** 

**Case ID:** **<mark>`UAT-02`</mark> Tester:** <mark>`Pattarapon Sribuathong`</mark> **Execution Date/Time:** <mark>`26/11/26 6:43 PM`</mark> **Input (given instructions):** 

- i. New transaction → Payment / charge from KTC Credit Card, today, total 1850.00, lines Dining 650.00 and Groceries 1199.99. 

- ii. Look at Allocated, Remaining and the Save transaction button. 

- iii. Change Groceries to 1200.00 and look again. Do not save; leave the page. 

- iv. Start again with total 12.345 (three decimals) and one Dining line 12.345. 

- v. Open History. 

##### **Expected Results :** 

- Step ii: Allocated ฿1,849.99, Remaining ฿0.01 shown as an error (red), and Save transaction is disabled. 

- Step iii: Remaining ฿0.00 and Save becomes enabled (proves the boundary is exact to one satang). 

- Step iv: the amount is not accepted (Save stays disabled), because only 0–2 decimals are allowed. 

- Step v: the History row count is the same as before (nothing was saved). 

##### **Observed Results :** 

   - Step ii: Remaining ฿0.01 is shown in red and Save button is disabled. 

   - Step iii: Remaining ฿0.00 is shown in black  and Save button is back to being enabled 

   - Step iv: The Save button stays disabled 

   - Step v: the History row count remains unchanged 

- **Supporting Screenshots:** 



<!-- Start of picture text -->
New transaction<br><!-- End of picture text -->



<!-- Start of picture text -->
New transaction<br>Alocation ines<br>Alot 1,850.00: Remaining 80.00<br><!-- End of picture text -->



<!-- Start of picture text -->
New transaction<br>ic retard © (aeons B) (se<br>ecsion fee<br>maresDining » |poras4g ) -<br><!-- End of picture text -->



<!-- Start of picture text -->
a i pe i rota<br><!-- End of picture text -->

History stays the same 

**Outcome: PASS** 

**Business rule and boundary: Opening balance rules Case ID:** **<mark>`UAT-03`</mark>** 

**Tester:** <mark>`Wai Phyo`</mark> **Execution Date/Time:** <mark>`26/11/26`</mark> [Confirm time] 

##### **Input (given instructions):** 

- i. Open Accounts. Write down the Wallet balance and its current opening amount (shown under the name, if any). 

- ii. Press Set opening balance on Wallet, enter 500.00 with date 2026-11-01, and save. 

- iii. Check whether Salary or Dining (income/expense) offer Set opening balance. 

##### **Expected Results :** 

- Wallet shows "Opening ฿500.00 on 2026-11-01" and its balance = before − old opening (0 if none) + 500.00. 

- Income and expense accounts have no opening-balance action (opening balances only apply to cash and loan accounts). 

##### **Observed Results :** 

- The initial Wallet balance was ฿0.00 

- The Wallet opening balance was successfully saved as ฿500.00 on 2026-11-01 

- The Wallet balance increased to ฿500.00 

- **Salary and Dining did not provide an opening balance option during the initial inspection** 

##### **Supporting Screenshots:** 

Before: 



<!-- Start of picture text -->
os<br><!-- End of picture text -->

_Initial financial overview of Bob (U2), showing a Wallet balance of_ ฿ _0.00 before setting the opening balance._ 



<!-- Start of picture text -->
€ > © 5 money TO ansnmap mF 0 ot thom @ o x<br>Pn we mf<br>Accounts<br>cath acbank<br>Loans taken creditcard<br>Loans given (owed you)<br>Income<br>Expenses<br>Teco to<br><!-- End of picture text -->

_Initial account configuration showing a Wallet balance of_ ฿ _0.00. Opening balance options are available for eligible financial accounts but are absent from income and expense accounts._ 



<!-- Start of picture text -->
Accounts<br>Cash & bank<br>KBank Savings 80.00 set opening balance<br>‘Wallet 8500.00<br>Opening 8500.00 on 2026-01-26<br><!-- End of picture text -->



<!-- Start of picture text -->
Accounts<br>Cash & bank<br>KBank Savings 80.00 Set opening balance<br>Wallet 8500.00 Set opening balance<br>Opening 8500.00 on 2026-11-01<br><!-- End of picture text -->

_Successfully saved Wallet opening balance of_ ฿ _500.00 with the opening date 2026-11-01, matching the required test inputs._ 

**Outcome: PASS** 

#### **Forbidden role and ownership** 

**Case ID:** **<mark>`UAT-04`</mark>** 

**Tester:** <mark>`Wai Phyo`</mark> **Execution Date/Time:** <mark>`26/11/26`</mark> [Confirm time] 

##### **Input (given instructions):** 

- i. As U1 open **History** , open the UAT-01 salary row and write down the number at the end of the address (/transactions/<id>). Sign out. 

- ii. Sign in as U2. Type <URL>/transactions/<id> (U1's id) in the address bar. 

- iii. As U2 type <URL>/api/transactions/<id> in the address bar. 

- iv. As U2 open <URL>/admin/users, then <URL>/api/admin/users. Sign out. 

- v. Sign in as A1. Note where you land. Then open <URL>/api/accounts, <URL>/api/summary and <URL>/api/transactions. 

- vi. Sign out and open <URL>/api/accounts while signed out. 

##### **Expected Results :** 

- Step ii: the page shows "That record was not found." and **none** of U1's amounts, accounts or description. 

- Step iii: {"error":{"code":"NOT_FOUND","message":"That record was not found."}} — the same as for an id that does not exist. 

- Step iv: the page says "This page is not available for your role."; the API returns 403 with FORBIDDEN_ROLE. 

- Step v: A1 lands on **Users** (no money menus). Each financial API returns {"error": {"code":"FORBIDDEN_ROLE",…}} and **no** financial data. 

- Step vi: {"error":{"code":"AUTH_REQUIRED",…}}. 

- U1's data is unchanged afterwards (check U1's History if you want). 

##### **Observed Results :** 

- The initial Wallet balance was ฿0.00 

- The Wallet opening balance was successfully saved as ฿500.00 on 2026-11-01 

- The Wallet balance increased to ฿500.00 

- **Salary and Dining did not provide an opening balance option during the initial inspection** 

##### **Supporting Screenshots: Authorized access (U1):** 



<!-- Start of picture text -->
Received - 822,500.00<br><!-- End of picture text -->

Alice (U1) successfully accessed her own transaction (ID: 5), establishing the reference record for cross-user access testing. 

##### **Unauthorized access (U2) — API-level ownership restriction:** © > 6 manag na ans soueartinnappanctens 

The transaction request returned HTTP 404 Not Found while authenticated as Bob (U2), demonstrating backend enforcement of cross-user ownership restrictions. 

##### **Administrator access restriction (U2):** 



<!-- Start of picture text -->
(© mennlog- T0008 sham apni cee con #0 8 tiem @ - 2 x<br>Not available<br>‘Wis page is ot valabl for youre,<br><!-- End of picture text -->

_Bob (U2) attempted to access the administrator user management page. The application denied access and displayed "This page is not available for your role." No administrative functionality or user records were disclosed._ 

#### **History, detail and persistence after sign-out** 

**Case ID:** **<mark>`UAT-05`</mark>** 

**Tester:** <mark>`Pattarapon Sribuathong`</mark> **Execution Date/Time:** <mark>`26/11/26 8:07 PM`</mark> 

##### **Input (given instructions):** 

- i. Sign out completely and close the tab. Open the URL again and sign in as U1. 

- ii. Open History. 

iii. Open UAT-01 card purchase. 

- iv. On Overview set From and To to today's date and press Apply. Then press Clear. 

##### **Expected Results :** 

- Step ii: the three UAT-01 records are listed, newest first, with the right kind and totals (25,000.00, 1,850.00, 1,000.00). 

- Step iii: detail shows Paid from KTC Credit Card, total ฿1,850.00, lines Dining ฿650.00 and Groceries ฿1,200.00. 

- Step iv: with today's range, Income and Expenses include only today's lines (at least 25,000.00 and 1,850.00 from UAT-01); the account balances stay the same with or without the range. 

- The balances from UAT-01 are still the same after signing in again (the data is stored in the database, not the browser). 

##### **Observed Results :** 

- Step ii: the four UAT-01 records are listed (because of earlier mistake), ordered by newest first, and have accurate totals (22,500.00 + 2,500.00,  1,850.00, 1,000.00). 

- Step iii: accurate details, showing that its Paid from KTC, with accurate totals, the lines Dining being ฿650.00 and Groceries being ฿1,200.00. 

- Step iv: shows income being 25,000.00 (-2,000) and net being 23,150.00 (-2,000), while the balance stays the same 

- Every transactions stays the same after closing the tab signing in again 

##### **Supporting Screenshots:** 



<!-- Start of picture text -->
Sign in to MoneyLog<br><!-- End of picture text -->

Signed out 



<!-- Start of picture text -->
aG Gama) O |<br>omat mes az (G)<br>a . +<br><!-- End of picture text -->

Tab closed 



<!-- Start of picture text -->
Sign in to MoneyLog<br><!-- End of picture text -->

Reopen and sign in 



Step i & ii: the three(4* due to earlier mistake) UAT-01 records are kept, newest first (25,000.00, 1,850.00, 1,000.00). 



<!-- Start of picture text -->
History<br>Payment - 61,850.00<br>Date 2026-1126<br>Paid from KC Credit Card<br>Description UAT-O1 card purchase<br>Account Note Amount<br>Dining 65000<br>Groceries #120000<br><!-- End of picture text -->

Step iii: detail shows Paid from KTC Credit Card, total ฿1,850.00, lines Dining ฿650.00 and Groceries ฿1,200.00. 



<!-- Start of picture text -->
From dé-——noy To dé—-yny 8 Apply (chou<br>826,000.00 petted8850.00 80.00 827,000.00 81,850.00 825,150.00<br>Cash and bank ‘Spending by category<br>Bank Savings #2500000 Groceries ED #120000<br>Water #00 Dining — 650.00<br>KIC Credit Card (owed #85000<br><!-- End of picture text -->



<!-- Start of picture text -->
frm) 2-n0r- 206 0) w 26m ome 61 |( wo) cw<br>826,000.00 pe8850.00 80.00 825,000.00 81,850.00 823,150.00<br>Cash and bank ‘Spending by category<br>Bank Savings #2500000 Groceries _—_- #120000<br>Water 8000 Dining — 650.00<br>IC Credit Crd (owed #25000<br><!-- End of picture text -->

Step iv: with today's range, Income and Expenses include only today's lines, the account balances stay the same with or without the range. (also shows that the data retains after resigning in) 

### **Outcome: PASS** 

#### **Administrator disables and enables a user** 

**Case ID:** **<mark>`UAT-06`</mark>** 

**Tester:** <mark>`Pattarapon Sribuathong`</mark> 

**Execution Date/Time:** <mark>`26/11/26 8:32 PM`</mark> 

##### **Input (given instructions):** 

- i. Window 1: sign in as U2 and stay on **Overview** . 

- ii. Window 2: sign in as A1. On **Users** , check the columns, then press **Disable** on bob@moneylog.test. 

- iii. Window 1: reload the page. iv. Window 1: try to sign in as U2 again with the right password. 

- v. Window 2: press **Enable** on bob@moneylog.test. Window 1: sign in as U2. 

- vi. Window 2: look at A1's own row. 

##### **Expected Results :** 

- Step ii: the list shows e-mail, name, role and status only (no money). Bob's badge changes to **Disabled** . 

- Step iii: U2 is sent to the sign-in page (the session ended). 

- Step iv: "E-mail or password is incorrect." — the same message as a wrong password. 

- Step v: U2 can sign in again. 

- Step vi: A1's own row shows **You** and no Disable button. 

##### **Observed Results :** 

- Step ii: the list shows e-mail, name, role and status of users, and the bob status became disabled 

- Step iii: U2 is sent to back to sign in page upon reloading the page 

- Step iv: "E-mail or password is incorrect" Error is shown on trying to log into disabled U2 account 

- Step v: U2 is allowed to sign in 

- Step vi: A1 account row (current one) shows **‘You’** and doesn’t have the Disable button. 

##### **Supporting Screenshots:** 



<!-- Start of picture text -->
Sign in to MoneyLog<br><!-- End of picture text -->



<!-- Start of picture text -->
8500.00 7 J 80.00 80.00 80.00 80.00<br>80.00<br><!-- End of picture text -->

##### Signed in as U2 



<!-- Start of picture text -->
Sign in to MoneyLog<br><!-- End of picture text -->

Signing in as A1 in new tab 



<!-- Start of picture text -->
° " 5 : »<br>Moneylog Users Pim Admin CRA Sign out<br>Users<br>Email Name Role Status<br>admin@moneylog test Pin Admin Administrator 7 ¥<br>sice@moneylogtest Alice chaiyo User abled mes<br>bob@moneylog test Bob Somsak User abled aie<br>dave@moneylog test Dave Disabled User abled snabie<br><!-- End of picture text -->

User page 



<!-- Start of picture text -->
Moneylog Users Pim Admin IRAE Sign cut<br>Users<br>E-mail Name Role Status<br>‘admin@moneylog test Pim Admin Adminstrator 4 x<br>sice@moneylogtest Alice Chaiyo User bes =e<br>bob@moneylog test Bob Somsak User a<br><!-- End of picture text -->

Disabled U2(bob) 



<!-- Start of picture text -->
2 e a CG . » :<br>Sign in to MoneyLog<br><!-- End of picture text -->

U2 is kicked out after refreshing 



<!-- Start of picture text -->
Sign in to MoneyLog<br><!-- End of picture text -->

U2 trying to sign in causes errors saying the email or password is incorrect 



<!-- Start of picture text -->
Users<br><!-- End of picture text -->

##### Re enabled U2 



<!-- Start of picture text -->
overview<br>8500.00 —e 80.00 80.00 80.00 80.00<br>80.00<br><!-- End of picture text -->

U2 can now sign in 



<!-- Start of picture text -->
Users<br><!-- End of picture text -->

Admin account cannot be disabled and instead theres ‘You’ in place of disable button 

### **Outcome: PASS** 

#### **7 (copy pasted template, unchanged)** 

**Case ID:** **<mark>`UAT-05`</mark>** 

**Tester:** <mark>`Pattarapon Sribuathong`</mark> **Execution Date/Time:** <mark>`26/11/26 8:07 PM`</mark> 

##### **Input (given instructions):** 

- v. Sign out completely and close the tab. Open the URL again and sign in as U1. 

- vi. Open History. 

- vii. Open UAT-01 card purchase. 

- viii. On Overview set From and To to today's date and press Apply. Then press Clear. 

##### **Expected Results :** 

- Step ii: the three UAT-01 records are listed, newest first, with the right kind and totals (25,000.00, 1,850.00, 1,000.00). 

- Step iii: detail shows Paid from KTC Credit Card, total ฿1,850.00, lines Dining ฿650.00 and Groceries ฿1,200.00. 

- Step iv: with today's range, Income and Expenses include only today's lines (at least 25,000.00 and 1,850.00 from UAT-01); the account balances stay the same with or without the range. 

- The balances from UAT-01 are still the same after signing in again (the data is stored in the database, not the browser). 

##### **Observed Results :** 

- **Supporting Screenshots:** 

### **Outcome: PASS** 

# **Part C: Defect Reporting and Triage** 

**Handout Reference §4.1 (Part C):** _Outgoing reports, if any; all received findings with classification, severity, disposition and resolution status; documented minor limitations if any._ 

### **C.1 Outgoing Defect Reports (Filed Against Partner Application)** 

_For each actual defect found during Part B testing of the partner application, document reproducible steps and user impact. If no natural defects arose, state that and refer to Section 3.5._ 

#### **Defect Report** **<mark>`[ISSUE-PARTNER-01]`</mark>** 

- **Issue Identifier:** <mark>`[ISSUE-PARTNER-01]`</mark> 

- **Product Owner / Team:** <mark>`Group Name`</mark> 

- **Reporter (Our Team):** <mark>`Pattarapon Sribuathong`</mark> 

- **Tested Application Version:** d0a13043d4ad44db3823d01085a7285f7e25d4e0 

- **Linked Case / Requirement:** **<mark>`Exploratory Testing`</mark>** 

- **Preconditions & Test Data:** <mark>`Any User account that is enabled`</mark> 

- **Step-by-Step Reproduction:** 

- i. 1 **New transaction** → Money received, into **KBank Savings** , today, total 25000.00, description UAT-01 salary, one line: Salary 25000.00. Save. 

- ii. Look at the Transaction saved confirmation page 

- iii. Look at history page 

- **Expected Result:** <mark>`Description is formatted properly`</mark> 

- **Actual Result:** <mark>`Description goes completely offscreen`</mark> 

- **Severity Level:** <mark>`Minor`</mark> 

- **Supporting Evidence Reference:** 



<!-- Start of picture text -->
Received - 89,999,999.00<br><!-- End of picture text -->



##### ● **Partner Notification & Outcome:** <mark>`9:20 PM 26/11/26`</mark> 

### **C.2 All Received Findings with Classification, Severity, Disposition & Resolution Status** 

_Master table of all findings received from the UAT Partner Team after testing TechTent._ 

|**Findin**<br>**g ID**|**Repo**<br>**rted**|**Repor**<br>**ter**|**Initi**<br>**al**|**Formal**<br>**Classifica**|**Triage**<br>**Rationale**|**O**<br>**w**|**Fix**<br>**Status**|**Disposition**|
|---|---|---|---|---|---|---|---|---|
||**Sum**|**(UAT**|**Seve**|**tion**|**&**|**ne**|||
||**mary**|**Team**<br>**)**|**rity**||**Specificati**<br>**on**|**r**|||



||||||**Reference**||||
|---|---|---|---|---|---|---|---|---|
|`[FIND`<br>`-01]`|`[Su`<br>`mma`<br>`ry`<br>`of`<br>`fin`<br>`din`<br>`g]`|`[Par`<br>`tner`<br>`Name`<br>`]`|`[Cr`<br>`iti`<br>`cal`<br>`/`<br>`Maj`<br>`or/`<br>`Min`<br>`or]`|`[Accept`<br>`ed`<br>`Defect`<br>`/`<br>`Duplica`<br>`te /`<br>`Not-`<br>`Defect`<br>`/`<br>`Enhance`<br>`ment]`|`[Reason`<br>`tied to`<br>`Sprint`<br>`1`<br>`contrac`<br>`t; cite`<br>`section`<br>`/AC]`|`[S`<br>`tu`<br>`de`<br>`nt`<br>`]`|`[Fix`<br>`ed /`<br>`Not`<br>`Fixe`<br>`d /`<br>`N/A]`|`[Accepte`<br>`d /`<br>`Rejected`<br>`/`<br>`Deferred`<br>`]`|
|`[FIND`<br>`-02]`|`[Su`<br>`mma`<br>`ry`<br>`of`<br>`fin`<br>`din`<br>`g]`|`[Par`<br>`tner`<br>`Name`<br>`]`|`[Cr`<br>`iti`<br>`cal`<br>`/`<br>`Maj`<br>`or/`<br>`Min`<br>`or]`|`[Accept`<br>`ed`<br>`Defect`<br>`/`<br>`Duplica`<br>`te /`<br>`Not-`<br>`Defect`<br>`/`<br>`Enhance`<br>`ment]`|`[Reason`<br>`tied to`<br>`Sprint`<br>`1`<br>`contrac`<br>`t; cite`<br>`section`<br>`/AC]`|`[S`<br>`tu`<br>`de`<br>`nt`<br>`]`|`[Fix`<br>`ed /`<br>`Not`<br>`Fixe`<br>`d /`<br>`N/A]`|`[Accepte`<br>`d /`<br>`Rejected`<br>`/`<br>`Deferred`<br>`]`|
|`[FIND`<br>`-03]`|`[Su`<br>`mma`<br>`ry`<br>`of`<br>`fin`<br>`din`<br>`g]`|`[Par`<br>`tner`<br>`Name`<br>`]`|`[Cr`<br>`iti`<br>`cal`<br>`/`<br>`Maj`<br>`or/`<br>`Min`<br>`or]`|`[Accept`<br>`ed`<br>`Defect`<br>`/`<br>`Duplica`<br>`te /`<br>`Not-`<br>`Defect`<br>`/`<br>`Enhance`<br>`ment]`|`[Reason`<br>`tied to`<br>`Sprint`<br>`1`<br>`contrac`<br>`t; cite`<br>`section`<br>`/AC]`|`[S`<br>`tu`<br>`de`<br>`nt`<br>`]`|`[Fix`<br>`ed /`<br>`Not`<br>`Fixe`<br>`d /`<br>`N/A]`|`[Accepte`<br>`d /`<br>`Rejected`<br>`/`<br>`Deferred`<br>`]`|



### **C.3 Triage Classification Rationale & Documented Known Minor Limitations** 

#### **1. Accepted Defects (Release-Blocking)** 

- **Finding ID:** <mark>`[FIND-01]`</mark> 

- **Classification: Accepted Defect** (Critical / Major blocks release) 

- **Contract Reference & Technical Analysis:** <mark>`[Analyze failure against Sprint 1 specification, explain root cause in code, and specify correction plan]`</mark> 

#### **2. Rejected / Out-of-Scope Findings (Not-a-Defect / Enhancement)** 

- **Finding ID:** <mark>`[FIND-02]`</mark> 

- **Classification:** <mark>`[Not-Defect | Enhancement]`</mark> 

- **Contract Justification:** 

```
[Cite specific Sprint 1 contract / decision sheet clause
confirming this feature was not part of Sprint 1 scope]
```

#### **3. Documented Minor Limitations (If Any, Agreed by UAT Team)** 

- **Finding ID:** <mark>`[FIND-03 (if any)]`</mark> 

- **Classification: Minor Limitation** 

- **Agreed Impact & Limitation Terms:** 

   - <mark>`[Describe minor limitation, explain why it does not block core value, and confirm UAT Team's explicit agreement]`</mark> 

# **Part D: Resolution and Independent Retest** 

**Handout Reference §4.1 (Part D):** _Your own accepted-defect chain: regression test excerpt and red/green output, relevant code diff, review/CI/release evidence, deployed fix version and partner retest/closure. Include contributions, AI use and limitations._ 

### **D.1 Accepted-Defect Chain** 

#### **Step 1: Automated Regression Test Excerpt & RED/GREEN Output** **<mark>(</mark>** **<mark>`EVID-D-01`</mark> ,** **<mark>`EVID-D-02`</mark> )** 

_Demonstrate an automated test reproducing the reported defect failing on defective code (RED) and passing on corrected code (GREEN)._ 

- **Automated Test Command:** <mark>`npm --prefix server run test:unit`</mark> 

- **Test File & Identifier:** <mark>`server/tests/unit/uat-defectreproduction.test.ts`</mark> 

- **Tested Defective Commit (RED):** <mark>`[Baseline Commit SHA e.g. e17f136]`</mark> 

- **Relevant Test Setup & Assertion Excerpt:** 

   - `// [Paste exact test assertion reproducing the defect]` 

- **Actual Terminal Failure Output (RED —** **<mark>`EVID-D-01`</mark> ):** 

```
// [Paste actual terminal failure output on defective
implementation]
```

- **Actual Terminal Passing Output (GREEN —** **<mark>`EVID-D-02`</mark> ):** 

```
// [Paste actual terminal output showing test passing and
regression suite counts]
```

- **Regression Suite Counts:** Passed: <mark>`[e.g. 79 unit + 43 client = 122]`</mark> , Failed: `0` , Skipped: `0` . 

#### **Step 2: Relevant Code Diff Summary** 

```
    // [Paste clean git diff of source files modified to fix the
defect]
```

#### **Step 3: Review, CI and Release Evidence (** **<mark>`EVID-D-03`</mark> )** 

- **Fix Branch:** <mark>`[Branch name branched from sprint staging]`</mark> 

- **Pull Request URL & Number:** <mark>`[PR URL e.g. PR #48]`</mark> 

- **Author:** <mark>`[Student 1 Name]`</mark> | **Peer Reviewer:** <mark>`[Student 2 Name]`</mark> 

- **Peer Review Verdict: Approved** 

- **Readable Review Comment Excerpt:** 

```
"[Paste teammate's substantive technical review comment
evaluating the fix and test coverage]"
```

- **CI / Integration Run Link:** <mark>`[URL to GitHub Actions CI run]`</mark> 

- **Merged to Main Commit:** <mark>`[Commit SHA on main]`</mark> 

#### **Step 4: Deployed Fix Version & Smoke Checks** 

- **Automated Release Workflow:** <mark>`[URL to deploy workflow run]`</mark> 

- **Image Digest:** <mark>`sha256:[Digest hash]`</mark> 

- **Corrected Deployed Cloud Run Revision:** <mark>`[e.g. techtent-00004-uat]`</mark> 

- **Post-Deployment Smoke Check Results:** 

   - <mark>`GET /api/health`</mark> ➔ HTTP <mark>`200 OK`</mark> 

   - <mark>`GET /api/ready`</mark> ➔ HTTP <mark>`200 OK`</mark> (database connected) 

### **D.2 Partner Retest & Closure: Independent Sprint 1 Acceptance Decision** **<mark>(</mark>** **<mark>`EVID-D-04`</mark> )** 

_The UAT Partner Team independently re-tests the corrected release on Cloud Run and records their final acceptance decision._ 

#### **Partner Retest Execution Record** 

|**Retest**<br>**Item**|**Tested**<br>**Fix / Case**|**Tester**<br>**Name**<br>**(Partner**<br>**Team)**|**Date &**<br>**Time**|**Input /**<br>**Action**|**Observed**<br>**Actual**<br>**Result**|**Status**<br>**(PASS/F**<br>**AIL)**|
|---|---|---|---|---|---|---|
|**Retest**<br>**1**|`[Defect`<br>`1`<br>`Retest]`|`[Partner`<br>`Tester`<br>`Name]`|`[Date`<br>`/`<br>`Time]`|`[Reprod`<br>`uction`<br>`Input]`|`[Observe`<br>`d`<br>`correcte`<br>`d`<br>`result]`|**PASS**|
|**Retest**<br>**2**|`[Affect`<br>`ed Case`<br>`Re-run]`|`[Partner`<br>`Tester`<br>`Name]`|`[Date`<br>`/`<br>`Time]`|`[Case`<br>`Inputs]`|`[Observe`<br>`d actual`<br>`result]`|**PASS**|



#### **Documented Final Sprint 1 UAT Acceptance Decision** 

```
=======================================================================
=================
                              INDEPENDENT UAT ACCEPTANCE DECISION
                                          SPRINT 1
=======================================================================
```



<!-- Start of picture text -->
=================<br>    APPLICATION UNDER TEST:  TechTent Everyday Electronics Ordering<br>System (Theme 4)<br>    TESTED RELEASE VERSION:  Git Commit [INSERT SHA] (Release Tag:<br>[INSERT TAG])<br>    DEPLOYED CLOUD RUN REV:  [INSERT DEPLOYED REVISION e.g.<br>techtent-00004-uat]<br>    PUBLIC SERVICE URL:      https://techtent-693107188088.asia-<br>southeast1.run.app<br>    INDEPENDENT UAT TEAM:<br>    Lead Tester:             [INSERT: Partner Lead Tester Name]<br>(Student ID: [INSERT ID])<br>    Associate Tester:        [INSERT: Partner Associate Tester Name]<br>(Student ID: [INSERT ID])<br>    FINAL SPRINT 1 DECISION:<br>    [ ] ACCEPTED (Full unconditional acceptance)<br>    [ ] ACCEPTED with explicitly documented minor limitations<br>    [ ] NOT ACCEPTED<br>    GROUNDS & ACCEPTANCE SUMMARY:<br>    [INSERT: Explicit statement of reasons for acceptance or rejection.<br>Detail verification of<br>    Sprint 1 requirements (F-01 to F-05), resolution of release-<br>blocking defects, and any<br>    documented minor limitations.]<br>    EXPLICITLY DOCUMENTED MINOR LIMITATIONS (IF ANY):<br>    1. [List any accepted minor limitation, or write "None" if<br>unconditional acceptance]<br>    DECISION DATE:           [INSERT DATE: e.g. 20 November 2026]<br>    TESTER SIGNATURES:       [INSERT Partner Tester 1 Name / Electronic<br>Signature]<br>                             [INSERT Partner Tester 2 Name / Electronic<br>Signature]<br>=======================================================================<br>=================<br><!-- End of picture text -->

### **D.3 Version Traceability Table (Handout §4.2)** 

_Connects the tested Sprint 1 baseline, defective commit(s) if any, test changes, corrected main release, and deployed revision._ 

|**Milestone**|**Git Ref /**<br>**Commit SHA**|**Revision /**<br>**Target**|**Date &**<br>**Time**|**Outcome /**<br>**Verification**<br>**Summary**|
|---|---|---|---|---|
|**Sprint 1**<br>**Baseline**|`e17f136`(Tag<br>`v1.0.0-`<br>`sprint1`)|`techtent-`<br>`00003-smt`|`[Date/`<br>`Time]`|Handed to UAT<br>Team; defect<br>identified|
|**Defect**<br>**Reproduction**<br>**(RED)**|`[Branch /`<br>`Commit]`|Local Test<br>Suite|`[Date/`<br>`Time]`|Automated<br>reproduction test fails|
|**Defect**<br>**Correction**<br>**(GREEN)**|`[Commit SHA]`|Local Test<br>Suite|`[Date/`<br>`Time]`|Full regression suite<br>passes (0 failures)|
|**Teammate**<br>**Code Review**|`[Pull`<br>`Request #]`|GitHub<br>Actions|`[Date/`<br>`Time]`|Substantive peer<br>review approved|
|**Merged to**<br>**Main**|`[Commit SHA]`|Main Branch|`[Date/`<br>`Time]`|Merged via required<br>merge ruleset|
|**Cloud Run**<br>**Redeployment**|`sha256:`<br>`[Digest]`|`[Revision`<br>`Name]`|`[Date/`<br>`Time]`|Deploy workflow<br>passed; 100% traffic|
|**Independent**<br>**Retest**|`[Revision`<br>`Name]`|Live Cloud<br>URL|`[Date/`<br>`Time]`|Retested by UAT<br>Team:**ACCEPTED**|



### **D.4 Contributions, AI Use and Limitations (Handout §4.1, §4.2)** 

#### **Team Member Contributions Table** 

|**Student Name**|**Student ID**|**Pair Work & Specific Engineering / UAT**<br>**Responsibilities**|
|---|---|---|
|**Pattarapon**|`6707050343`|`[Specify parts authored, partner`|
|**Sribuathong**|`4`|`testing executed, tests created,`<br>`review, PDF compilation]`|
|**Wai Phyo**|`6707050348`<br>`7`|`[Specify parts authored, partner`<br>`testing executed, code fixes,`<br>`review, Cloud Run deployment]`|



#### **AI Usage Declaration** 

- **AI Tool(s) Used:** Antigravity AI Assistant (Google DeepMind Gemini). 

- **Scope of AI Assistance:** Used to formulate this document, General guidance, bug fixing 

- **Student Verification & Responsibility:** All test cases, boundary conditions, code modifications, and acceptance criteria were conceived, verified, and executed by the student team. 

#### **Known Limitations** 

- <mark>`[List any known minor limitations or technical debt deferred to Sprint 2, or write "None outside documented minor limitations"]`</mark> . 

- **ACTION CHECKLIST & COMPLETION STEPS (DELETE BEFORE SUBMITTING TO LEB2)** 

**IMPORTANT:** Follow these steps to complete this document with your partner and the other team. Once all placeholders <mark>`[INSERT: ...]`</mark> are replaced, **DELETE THIS ENTIRE SECTION** before converting to PDF and submitting to LEB2! 

### **Step 1: Send UAT Handoff File to Partner Group** 

1. Send <u><mark>`docs/labs/lab-06/UAT_HANDOFF_TO_PARTNER_TEAM.md`</mark></u> to your partner testing team. 

2. Provide test account credentials privately for <mark>`Account-Customer-1`</mark> , <mark>`AccountCustomer-2`</mark> , <mark>`Account-Operator-1`</mark> , and <mark>`Account-Admin-1`</mark> . 

3. Receive the partner team's UAT test cases and credentials for their application. 

### **Step 2: Execute Independent UAT on Partner App (Part B)** 

1. Both students on your team must test the partner application: 

- Student 1 executes normal journeys and boundary cases. 

- Student 2 executes role access restrictions and state persistence checks. 

2. Fill in the **Part B.2 Execution Matrix** with actual timestamps, exact inputs, observed behaviors, and PASS/FAIL outcomes. 

### **Step 3: Defect Reporting & Triage (Part C)** 

1. If you found a bug in the partner application during Part B, fill in **Section C.1** <mark>(</mark> <mark>`ISSUEPARTNER-01`</mark> ) and send it to the partner team. 

2. Receive findings reported by the partner team against TechTent. 

3. Fill in the **Section C.2 Triage Table** classifying each finding as: 

- <mark>`Accepted Defect`</mark> : violates Sprint 1 contract. 

- <mark>`Not-Defect`</mark> or <mark>`Enhancement`</mark> : outside Sprint 1 scope (e.g. cancellation <mark>`F-07`</mark> or payment gateways <mark>`F-08`</mark> ). 

- <mark>`Minor Limitation`</mark> : cosmetic/minor item agreed to be accepted without blocking release. 

### **Step 4: Defect Resolution & Retest (Part D)** 

1. For your accepted defect (or controlled exercise): 

   - Run the automated reproduction test: <mark>`npm --prefix server run test:unit`</mark> 

   - Capture terminal output showing RED failure and save to <mark>`EVID-D-01`</mark> . 

   - Apply code fix in your branch, verify all unit + client tests pass (GREEN), and save output to <mark>`EVID-D-02`</mark> . 

2. Open PR on GitHub, obtain peer review approval from teammate with substantive comment <mark>(</mark> <mark>`EVID-D-03`</mark> ), and merge to <mark>`main`</mark> . 

3. Let GitHub Actions deploy revision to Cloud Run (or trigger deploy workflow). Record new revision (e.g. <mark>`techtent-00004-uat`</mark> ). 

4. Ask the partner UAT Team to retest the bug on the new revision. 

5. Have the partner team sign the **Section D.2 Independent UAT Acceptance Decision** <mark>(</mark> <mark>`EVID-D-04`</mark> ). 

### **Step 5: Final Review & PDF Export** 

1. Verify all <mark>`[INSERT: ...]`</mark> placeholders have been replaced with real data. 

2. Verify all sections mirror the Section 4.1 table of the handout. 

3. Delete this **ACTION CHECKLIST & COMPLETION STEPS** section. 

Submit PDF on LEB2 by 22 November 2026, 23:59. 

