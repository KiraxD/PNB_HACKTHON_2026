# QSecure Radar — Issue Priority Matrix

**Purpose:** Visual prioritization and tracking of all identified issues

---

## ISSUE PRIORITY MATRIX (Impact vs. Effort)

```
HIGH EFFORT
     ^
  40 |                                    [#12] Scanner
     |                                     Timeout
  36 |
     |
  32 |
     |
  28 |  [#17]                          [#5] Auto-Save
  24 |   Env                               Results
     |   Vars
  20 |                              [#6] DB    [#13]
     |  [#4]                         Indexes   QR Scoring
  16 | RLS         [#9]                       [#7] Error
     | Policies    Admin                       Handling
     |             Rate Limit
  12 | [#1]        [#3] SSRF              [#16]    [#11]
     | Session     Protect                Pagination CORS
     | Validation
   8 | [#2]   [#8]          [#10]
     | Keys   Zero           Audit
     | to     Trust          Logging
   4 | Env    Enforce
     |
   0 |__________________________________________ ► LOW EFFORT
     0   4    8    12    16    20    24    28    32    36    40

    LOW RISK ──────────────────────► HIGH RISK (Impact)

Legend:
🔴 CRITICAL (Must fix immediately)
🟠 HIGH (Fix this sprint)
🟡 MEDIUM (Fix soon)
🟢 LOW (Nice to have)
```

**Interpretation:**

- **Top-Left:** Low impact, low effort = Quick wins
- **Top-Right:** High impact, high effort = Strategic projects
- **Bottom-Left:** Low impact, low effort = Demo fix (build confidence)
- **Bottom-Right:** High impact, low effort = PRIORITIES ⭐

---

## ISSUES BY SEVERITY

### 🔴 CRITICAL (4 issues)

| ID  | Title                     | Risk                    | Effort | Status      | Owner   |
| --- | ------------------------- | ----------------------- | ------ | ----------- | ------- |
| #1  | Session Validation Broken | **Auth bypass**         | 2-3h   | Not Started | Backend |
| #2  | API Keys Exposed          | **Unauthorized access** | 1h     | Not Started | DevOps  |
| #3  | SSRF in Scanner           | **Internal scanning**   | 2h     | Not Started | Backend |
| #4  | Missing RLS Policies      | **Data leakage**        | 30m    | Not Started | DBA     |

**Total:** 5.5-6.5 hours | **Timeline:** This week | **Team:** 2-3 people

---

### 🟠 HIGH (5 issues)

| ID  | Title                       | Risk                   | Effort | Status      | Owner    |
| --- | --------------------------- | ---------------------- | ------ | ----------- | -------- |
| #5  | Scan Results Not Auto-Saved | **Lost audit trail**   | 2-3h   | Not Started | Frontend |
| #6  | Missing DB Indexes          | **10x slower queries** | 1-2h   | Not Started | DBA      |
| #7  | No DB Error Feedback        | **Confusing UX**       | 2-3h   | Not Started | Frontend |
| #8  | Zero Trust Not Enforced     | **Non-compliant**      | 2h     | Not Started | Backend  |
| #9  | No Admin Rate Limiting      | **Email flood**        | 1h     | Not Started | Backend  |

**Total:** 8.5-10.5 hours | **Timeline:** Week 1-2 | **Team:** 2-3 people

---

### 🟡 MEDIUM (5 issues)

| ID  | Title                        | Risk                     | Effort | Status      | Owner    |
| --- | ---------------------------- | ------------------------ | ------ | ----------- | -------- |
| #10 | QR Scoring Inconsistent      | **Confusing results**    | 2-3h   | Not Started | Frontend |
| #11 | CORS Too Permissive          | **Cross-origin abuse**   | 1h     | Not Started | Backend  |
| #12 | No Scanner Timeout           | **Hung requests**        | 1-2h   | Not Started | Deno     |
| #13 | Generic Audit Trail          | **Poor forensics**       | 2-3h   | Not Started | Backend  |
| #14 | No Profile Update Validation | **Privilege escalation** | 1h     | Not Started | Backend  |

**Total:** 7.5-9 hours | **Timeline:** Week 2-3 | **Team:** 2 people

---

### 🟢 LOW (3 issues)

| ID  | Title                  | Risk               | Effort | Status      | Owner    |
| --- | ---------------------- | ------------------ | ------ | ----------- | -------- |
| #15 | Hardcoded Demo Data    | **Misleading**     | 30m    | Not Started | Frontend |
| #16 | No Pagination          | **Memory leak**    | 2h     | Not Started | Frontend |
| #17 | Missing Env Validation | **Poor debugging** | 30m    | Not Started | DevOps   |

**Total:** 3-3.5 hours | **Timeline:** Week 3-4 | **Team:** 1 person

---

## RESOURCE ALLOCATION PLAN

### Team Size: 5 people | Duration: 4 weeks | Budget: ~22 hours

```
Week 1 (Critical Fixes):        Week 2 (High Fixes):
├─ Backend Dev #1    (6h)       ├─ Backend Dev #1    (4h)
├─ Backend Dev #2    (3h)       ├─ Backend Dev #2    (2h)
├─ DevOps            (1h)       ├─ Frontend Dev      (4h)
├─ DBA               (0.5h)     ├─ DBA               (1.5h)
├─ Frontend Dev      (1h)       ├─ QA Testing        (3h)
└─ QA Testing        (2h)       └─ DevOps Deployment (2h)
  = 13.5 hours                      = 16.5 hours

Week 3 (Medium Priorities):     Week 4 (Polish & Scale):
├─ Frontend Dev      (3h)       ├─ All Staff         (8h)
├─ Backend Dev       (2h)       ├─ TypeScript Mgration(8h)
├─ DBA               (1h)       ├─ CI/CD Setup       (4h)
├─ DevOps            (1h)       └─ Security Audit    (4h)
└─ QA Testing        (2h)         = 24 hours (opt)
  = 9 hours

Total Committed: 22 hours
Total with Polish: 46 hours
```

---

## TECHNICAL DEPENDENCY TREE

```
┌─ Issue #1 (Session Validation)
│   ├─ Blocks: #8 (Zero Trust Enforcement)
│   ├─ Blocks: #5 (Auto-Save - needs auth)
│   └─ Depends: #2 (API Keys)
│
├─ Issue #2 (API Keys to Env)
│   ├─ Unblocks: #1, #8, #5
│   └─ Independent (can start now!)
│
├─ Issue #3 (SSRF Protection)
│   ├─ Independent
│   ├─ Enables: #12 (Timeout)
│   └─ Critical for security
│
├─ Issue #4 (RLS Policies)
│   ├─ Depends: #1 (Session validation)
│   ├─ Blocks: #7 (Error handling - needs valid user)
│   └─ Low effort, high value
│
├─ Issue #5 (Auto-Save Results)
│   ├─ Depends: #1 (Session validation)
│   ├─ Enables: #13 (Audit trail improvement)
│   ├─ Unblocks: FR14 (Reporting)
│   └─ Critical for compliance
│
├─ Issue #6 (DB Indexes)
│   ├─ Independent
│   ├─ Improves: #7 (Error handling UX)
│   └─ High ROI (10x speedup)
│
├─ Issue #7 (Error Handling)
│   ├─ Depends: #5 (Auto-save working)
│   ├─ Blocks: Nothing major
│   └─ Improves: UX
│
├─ Issue #8 (Zero Trust Enforcement)
│   ├─ Depends: #1 (Session validation)
│   ├─ FR3 compliance
│   └─ Medium effort
│
└─ Other issues: Independent & can be parallelized
```

**Recommendation:** Start with #2 (API keys) + #3 (SSRF) + #4 (RLS) in parallel, then unblock #1.

---

## PROGRESS TRACKING DASHBOARD

```
Week 1: CRITICAL FIXES
════════════════════════════════════════════════════════
Issue #1: Session Validation ......... [          ] 0%
Issue #2: API Keys ................... [          ] 0%
Issue #3: SSRF Protection ............ [          ] 0%
Issue #4: RLS Policies ............... [          ] 0%
────────────────────────────────────────────────────────
Target: 100% | Actual: 0% | Blocked: 0 | On-Track: ✓


Week 2: HIGH-PRIORITY FIXES
════════════════════════════════════════════════════════
Issue #5: Auto-Save .................. [          ] 0%
Issue #6: DB Indexes ................. [          ] 0%
Issue #7: Error Handling ............. [          ] 0%
Issue #8: Zero Trust Enforcement ..... [          ] 0%
Issue #9: Rate Limiting .............. [          ] 0%
────────────────────────────────────────────────────────
Target: 100% | Actual: 0% | Blocked: 0 | On-Track: ?


Week 3: MEDIUM-PRIORITY
════════════════════════════════════════════════════════
Issue #10-14: Medium Issues ........... [          ] 0%
────────────────────────────────────────────────────────
Target: 100% | Actual: 0% | Blocked: 0 | On-Track: ?


Week 4: POLISH & SCALE
════════════════════════════════════════════════════════
TypeScript Migration ................ [          ] 0%
CI/CD Pipeline ...................... [          ] 0%
Security Audit ...................... [          ] 0%
────────────────────────────────────────────────────────
Target: 100% | Actual: 0% | Blocked: 0 | On-Track: ?
```

---

## ISSUE CHECKLIST BY CATEGORY

### SECURITY (5 issues)

- [ ] #1 - Session Validation
- [ ] #2 - API Key Exposure
- [ ] #3 - SSRF Vulnerability
- [ ] #4 - RLS Policies
- [ ] #11 - CORS Whitelist

### PERFORMANCE (3 issues)

- [ ] #6 - Database Indexes
- [ ] #12 - Scanner Timeout
- [ ] #16 - Pagination

### DATA INTEGRITY (3 issues)

- [ ] #5 - Auto-Save Results
- [ ] #7 - Error Handling
- [ ] #13 - Audit Trail

### COMPLIANCE (2 issues)

- [ ] #8 - Zero Trust Enforcement
- [ ] #14 - Role Change Audit

### CODE QUALITY (4 issues)

- [ ] #9 - Rate Limiting
- [ ] #10 - QR Score Standardization
- [ ] #15 - Remove Demo Data
- [ ] #17 - Env Validation

---

## RISK HEAT MAP

### Before Fixes

```
         Low Risk    Medium Risk   High Risk   Critical Risk
Frontend    [✓]         [✓]          [ ]          [✗✗✗]
Backend     [✓]         [✗✗]         [✗✗✗]        [✗✓]
Database    [✓]         [✓]          [✗✗]         [ ]
DevOps      [ ]         [✗]          [✓]          [ ]
─────────────────────────────────────────────────────────
Overall:    20%         40%          35%          5%
Risk Score: 60/100 (MEDIUM)
```

### After Week 1 Fixes

```
         Low Risk    Medium Risk   High Risk   Critical Risk
Frontend    [✓✓]        [✓]          [ ]          [ ]
Backend     [✓✓]        [✗]          [✓]          [ ]
Database    [✓✓]        [✓]          [ ]          [ ]
DevOps      [✓]         [✓]          [ ]          [ ]
─────────────────────────────────────────────────────────
Overall:    60%         30%          10%          0%
Risk Score: 85/100 (LOW)
```

---

## SIGN-OFF & APPROVAL

**Technical Lead:** **********\_********** **Date:** **\_\_\_\_**

**Project Manager:** **********\_********** **Date:** **\_\_\_\_**

**Security Officer:** **********\_********** **Date:** **\_\_\_\_**

**DevOps Lead:** **********\_********** **Date:** **\_\_\_\_**

---

## VERSION HISTORY

| Version | Date         | Changes                     |
| ------- | ------------ | --------------------------- |
| 1.0     | Apr 8, 2026  | Initial assessment          |
| 1.1     | Apr 9, 2026  | Resource allocation updated |
| 1.2     | Apr 10, 2026 | Dependency tree added       |

---

**Status:** AWAITING APPROVAL  
**Next Step:** Team kickoff meeting for Week 1 sprint  
**Escalation Path:** Tech Lead → Project Manager → Steering Committee
