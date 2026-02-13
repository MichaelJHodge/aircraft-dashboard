# Quick Start Guide - BETA Aircraft Dashboard v2.0

## What's New in v2.0?

This version transforms the dashboard from a **static display** into a **functional program-tracking system**. Key changes:

✅ **Delivery dates are calculated** from certification progress (not hardcoded)  
✅ **Milestones have dependencies** that block progress  
✅ **Sustainability metrics are calculated** from mission profiles  
✅ **Program risks are detected automatically**  
✅ **Full methodology disclosure** for all calculations

---

## Installation (Same as v1)

```bash
# Backend
cd backend
npm install
npm run dev
# Runs on http://localhost:3001

# Frontend (new terminal)
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## Key Concepts

### 1. Certification Milestones Drive Everything

Aircraft progress through **10 FAA certification milestones**:

```
cert-001: Type Certification Application
cert-002: Certification Basis Established (BLOCKS DELIVERY)
cert-003: Compliance Plan Approved (BLOCKS DELIVERY)
cert-004: Ground Test Protocol Approval
cert-005: Flight Test Authorization
cert-006: Structural Testing Complete (BLOCKS DELIVERY)
cert-007: Flight Test Program Completion (BLOCKS DELIVERY)
cert-008: Production Certificate Application
cert-009: Type Certificate Issued (BLOCKS DELIVERY)
cert-010: Production Certificate Issued (BLOCKS DELIVERY)
```

**Key Rule:** Milestones have **dependencies**. For example:
- `cert-007` (Flight Tests) depends on `cert-005` AND `cert-006`
- Cannot complete flight tests without flight authorization AND structural tests

### 2. Delivery Readiness is Calculated

**Old way (v1):**
```typescript
estimatedDeliveryDate: "2025-03-15" // Just a date someone picked
```

**New way (v2):**
```typescript
deliveryReadiness: {
  isReady: false, // Calculated from milestones
  readinessPercentage: 88, // % of all milestones complete
  estimatedDeliveryDate: "2025-03-28", // Calculated from remaining work
  blockingMilestones: ["cert-009", "cert-010"], // What's blocking delivery
  daysToDelivery: 112, // Days until all blockers clear
  confidence: "medium" // Based on completion velocity
}
```

**Try it:** Look at aircraft N253BA (ac-004). It's 88% complete but missing Type Certificate. System calculates ~90 days to delivery.

### 3. Mission Profiles Drive Sustainability

**Old way (v1):**
```typescript
sustainabilityMetrics: {
  estimatedCO2AvoidedKg: 95000 // Generic estimate
}
```

**New way (v2):**
```typescript
missionProfile: {
  averageFlightHoursPerYear: 500,
  averageMissionDistanceNm: 75,
  expectedServiceLifeYears: 20,
  primaryMissionType: "medical"
}

// System calculates:
sustainabilityMetrics: {
  totalCO2AvoidedKg: 124680, // What conventional aircraft would emit
  electricityConsumedKwh: 180000, // What electric aircraft uses
  netCarbonReductionKg: 54960, // Actual reduction (accounts for grid emissions)
  methodology: { ... } // Full calculation transparency
}
```

**Try it:** Click "View Methodology & Assumptions" on any aircraft detail page to see the full calculation breakdown.

### 4. Automatic Risk Detection

System detects 4 types of risks:

**Schedule Risks:**
- Milestones past their estimated completion date
- Program taking longer than typical timeline (>2 years)

**Certification Blockers:**
- Delivery-blocking milestones stuck due to incomplete dependencies
- Critical path delays

**Utilization Mismatches:**
- Too low (<200 hrs/year) → economic viability concern
- Too high (>1000 hrs/year) → battery degradation risk
- Mission distance outside optimal range (25-200 nm)

**Dependency Delays:**
- Deep dependency chains (3+ levels) that amplify delays

**Try it:** Look at aircraft N257BA (ac-008). It has 180 hrs/year utilization, which triggers a "utilization mismatch" risk.

---

## Exploring the Dashboard

### Dashboard Overview

**Top Cards:**
- Total Aircraft
- Ready for Delivery (calculated from cert state)
- In Certification
- In Testing

**New: Program Risks Section**
- Shows risk counts by severity (Critical/High/Medium/Low)
- Aggregated across all aircraft

### Aircraft List

**Key columns:**
- **Certification Progress:** % of milestones complete
- **Est. Delivery:** Calculated date (or "TBD" if too early)

**Try it:** Sort by clicking column headers. Notice aircraft with higher cert % have sooner delivery dates.

### Aircraft Detail Page

**New sections in v2:**

1. **Delivery Readiness**
   - Ready status (yes/no)
   - Readiness percentage
   - Confidence level
   - Days to delivery

2. **Lifecycle Timeline**
   - Shows BLOCKED status if dependencies incomplete
   - Warning when phase can't progress

3. **Program Risks** (if any detected)
   - Risk severity and type
   - Impact description
   - Related milestones

4. **Operational Profile**
   - Mission parameters
   - Annual utilization
   - Expected service life

5. **Sustainability Impact**
   - Calculated metrics from mission profile
   - Baseline comparison
   - Expandable methodology disclosure

---

## Understanding Specific Aircraft

### N250BA (ac-001) - Fully Delivered
- All 10 milestones complete
- No blocking dependencies
- No risks
- High utilization (500 hrs/year)

### N253BA (ac-004) - In Certification
- 8/10 milestones complete
- Missing Type Certificate and Production Certificate
- ~90 days to estimated delivery
- Medium confidence

### N256BA (ac-007) - BLOCKED
- Has flight test authorization (cert-005)
- Missing structural testing (cert-006)
- **Cannot proceed** to flight test completion (cert-007) until cert-006 done
- Shows CERTIFICATION BLOCKER risk

### N257BA (ac-008) - Low Utilization Risk
- Mission profile: 180 hrs/year
- System flags MEDIUM risk: "below economic threshold"
- Impact: "May not achieve break-even on TCO"

### N259BA (ac-010) - Range Mismatch Risk
- Mission profile: 220 nm average distance
- System flags MEDIUM risk: "exceeds optimal range"
- Impact: "May require payload reduction or charging stops"

---

## API Testing

### Test Calculated Delivery

```bash
curl http://localhost:3001/api/aircraft/ac-004 | jq '.deliveryReadiness'
```

Expected output:
```json
{
  "isReady": false,
  "readinessPercentage": 88,
  "estimatedDeliveryDate": "2025-03-28",
  "blockingMilestones": ["cert-009", "cert-010"],
  "daysToDelivery": 112,
  "confidence": "medium"
}
```

### Test Risk Detection

```bash
curl http://localhost:3001/api/aircraft/ac-008/risks | jq
```

Expected: Risk with type "utilization_mismatch"

### Test Sustainability Methodology

```bash
curl http://localhost:3001/api/sustainability/methodology | jq
```

Returns full disclosure with EPA standards, baseline aircraft specs, and assumptions.

---

## Customization Examples

### Change Economic Viability Threshold

Edit `backend/src/services/riskDetection.ts`:

```typescript
// Line ~115
if (missionProfile.averageFlightHoursPerYear < 200) { // Currently 200
  // Change to 150 or 250 based on your business model
```

### Use Different Baseline Aircraft

Edit `backend/src/services/sustainabilityCalculator.ts`:

```typescript
const STANDARD_METHODOLOGY: SustainabilityMethodology = {
  baselineAircraftType: 'Cessna 208B Grand Caravan (turboprop)',
  baselineFuelConsumptionGphPerNm: 0.52, // Change to different aircraft
```

### Add More Aircraft

Edit `backend/src/data/seedData.ts`:

```typescript
buildAircraft(
  'ac-013',
  'N262BA',
  AircraftModel.ALIA_250,
  5, // Completion level (0-10)
  'medical', // Mission profile type
  '2024-12-01', // Manufacturing start
  'Customer Name'
)
```

---

## Troubleshooting

**Q: Delivery date shows "TBD"**  
A: Aircraft has <3 milestones complete. Not enough data to estimate.

**Q: No risks showing but should be**  
A: Check risk thresholds in `riskDetection.ts`. May need to adjust for your use case.

**Q: Sustainability numbers seem wrong**  
A: Check mission profile values. 500 hrs/year × 20 years × 100 knots = 1,000,000 nm total distance. Calculations compound over service life.

**Q: Milestone can't complete (blocked)**  
A: Check dependencies in `seedData.ts`. Make sure prerequisite milestones are complete.

---

## What This Demonstrates

1. **Derived State** - Current phase calculated from milestones, not hardcoded
2. **Dependency Logic** - Certification can't skip steps
3. **Business Rules** - Risk detection from operational assumptions
4. **Transparency** - Full methodology disclosure for auditing
5. **Realistic Modeling** - Based on actual FAA certification requirements

---

## Next Steps

**Learn the codebase:**
1. Start with `backend/src/services/certificationLogic.ts` - core business logic
2. See `backend/src/services/sustainabilityCalculator.ts` - calculation engine
3. Review `backend/src/services/riskDetection.ts` - automated risk flagging
4. Check `backend/src/data/seedData.ts` - how aircraft are built from milestones

**Experiment:**
- Change a milestone's `completed` status to `false` and see delivery date recalculate
- Modify mission profile and watch sustainability metrics update
- Adjust risk thresholds and see which aircraft get flagged

**Build on it:**
- Add database persistence
- Create API to update milestone completion
- Add historical trending
- Export reports as PDF

---

**Questions?** Check CHANGELOG-v2.md for technical details.
