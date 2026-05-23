# Automated Testing Inventory - AI Spend Audit

This document catalogues the automated tests developed to verify the deterministic, finance-literate business logic of the AI Spend Audit engine. 

---

## 🛠️ Testing Infrastructure

*   **Test Runner:** [Vitest](https://vitest.dev/) (a fast, lightweight Next-Generation testing framework).
*   **Test Specification File:** [tests/auditEngine.test.ts](file:///c:/viveka/credex%20assignment/tests/auditEngine.test.ts)
*   **Target Engine File:** [lib/auditEngine.ts](file:///c:/viveka/credex%20assignment/lib/auditEngine.ts)

---

## 📋 Test Catalog

The test suite consists of **6 highly robust, finance-literate scenarios** verifying all core audit engine calculations:

### 1. Ghost Seats (Seat Over-provisioning)
*   **Purpose:** Verifies that the engine detects when a startup is paying for excess active seats compared to their actual team size, and recommends seat reduction.
*   **Input Scenario:** Team size is 5; user has 10 seats registered on Cursor Pro ($20/seat, total $200/mo).
*   **Expected Results:**
    *   Surfaces immediate monthly savings of **$100** ($1,200/year).
    *   Recommended seats count falls to **5**.
    *   Recommended action set to `"Reduce Seats to 5"`.
    *   Reason specifies exactly: *"You have 10 seats registered but your team size is 5"*.

### 2. Claude Team 5-Seat Minimum Wastage
*   **Purpose:** Verifies that the engine flags when a very small team is paying for a Claude Team subscription and losing money due to Anthropic's 5-seat billing minimum ($150/mo base).
*   **Input Scenario:** Team size is 2; user has a Claude Team plan (5 seats, $150/mo).
*   **Expected Results:**
    *   Surfaces immediate monthly savings of **$110** (150 current spend - 40 target spend).
    *   Recommended plan is `"Pro"` (individual plans).
    *   Recommended seats count falls to **2**.
    *   Recommended spend falls to **$40/mo**.
    *   Recommended action is `"Downgrade to Pro (Individual)"`.
    *   Reason flags the 5-seat minimum wastage.

### 3. IDE Autocomplete Redundancy (Cursor + Copilot)
*   **Purpose:** Verifies that the engine flags dual subscriptions to Cursor and GitHub Copilot for developers, canceling Copilot due to Cursor's superior built-in tab autocompletion.
*   **Input Scenario:** Team size is 4; user has Cursor Pro (4 seats, $80/mo) AND GitHub Copilot Business (4 seats, $76/mo).
*   **Expected Results:**
    *   Surfaces immediate monthly savings of **$76/mo** ($912/year).
    *   Recommends canceling GitHub Copilot entirely (`plan: 'None'`, `seats: 0`, `spend: 0`).
    *   Recommended action is `"Cancel GitHub Copilot"`.
    *   Reason highlights that Cursor includes its own built-in next-generation autocomplete, rendering Copilot redundant.

### 4. Chat Assistant Duplication & Consolidation
*   **Purpose:** Verifies that when a team is double-subscribed to both Claude and ChatGPT, the engine recommends consolidating to a single assistant based on the team's primary use case to save $20/dev/month.
*   **Input Scenario:** Team size is 3; primary use case is `'coding'`; user is paying for both Claude Pro (3 seats, $60/mo) AND ChatGPT Plus (3 seats, $60/mo).
*   **Expected Results:**
    *   Surfaces immediate monthly savings of **$60/mo** ($720/year).
    *   Recommends canceling ChatGPT (`plan: 'None'`, `spend: 0`).
    *   Recommended action is `"Cancel ChatGPT"`.
    *   Reason recommends keeping Claude since their primary use case is `'coding'`.

### 5. API Direct Power User Arbitrage
*   **Purpose:** Verifies that when a solo developer is spending a high amount on pay-as-you-go API keys for heavy coding contexts, the engine recommends moving to a flat-rate retail subscription to arbitrage context usage.
*   **Input Scenario:** Team size is 1; primary use case is `'coding'`; user is spending $85/month on direct Anthropic API usage.
*   **Expected Results:**
    *   Surfaces immediate monthly savings of **$65/mo** ($780/year).
    *   Recommends switching to a retail plan (`plan: 'Pro'`, `spend: 20`).
    *   Recommended action is `"Switch to Claude Pro"`.
    *   Reason advises that flat-rate retail gives unlimited high-context interactions at half the price for a power user.

### 6. Already Optimal Setup (Honesty Check)
*   **Purpose:** Verifies the engine's honesty constraint: it does not manufacture fake savings when a startup is already perfectly optimized.
*   **Input Scenario:** Team size is 10; user has ChatGPT Team (10 seats, $250/mo under annual billing).
*   **Expected Results:**
    *   Surfaces **$0** monthly savings.
    *   Flags the audit as `isAlreadyOptimal = true`.
    *   Recommended plan matches current plan; action is `"Maintain Current Plan"`.

---

## 🏃 How to Run the Tests

### 1. Local Terminal Execution
To execute the test suite locally in headless mode, run the following command in the project root:
```bash
npx vitest run
```

### 2. File Watch Mode
For active development, run Vitest in watch mode to automatically re-execute tests upon file updates:
```bash
npx vitest
```

---

## 🤖 Continuous Integration (CI)
Our test suite is fully integrated into a **GitHub Actions CI/CD Pipeline**. The workflow config is located at [.github/workflows/ci.yml](file:///c:/viveka/credex%20assignment/.github/workflows/ci.yml).

On every push to `main` or pull request, the pipeline:
1. Provisions an Ubuntu runtime environment.
2. Checks out the repository and caches npm package assets.
3. Installs clean project dependencies using `npm ci`.
4. Executes `npm run lint` to verify syntax hygiene.
5. Executes `npx vitest run` to run the unit test catalog.
