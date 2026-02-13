# BETA Aircraft Dashboard - Version 2.0 Changelog

## Major Transformation: From Visual Dashboard to Functional Program-Tracking System

This release transforms the dashboard from a static display into a **fully functional aircraft program tracking system** with rule-based logic, calculated delivery dates, dependency management, and risk detection.

---

## 🎯 Core Philosophy Change

**Before (v1.0):** Static visual dashboard with hardcoded data  
**After (v2.0):** Dynamic program tracking system with business logic and calculated states

---

## 🚀 Major New Features

### 1. **Certification Milestone Dependencies**
- ✅ Milestones now have explicit dependency chains
- ✅ Aircraft cannot progress to delivery without completing prerequisite certifications
- ✅ System detects and displays blocked milestones
- ✅ Dependency depth calculation for risk detection

**Example:** Flight Test Authorization (`cert-005`) cannot complete until Ground Test Protocol (`cert-004`) is approved.

**Impact:** Realistic certification progression that mirrors actual FAA requirements.

### 2. **Calculated Delivery Readiness** 
- ✅ Delivery dates are **derived from certification state**, not static fields
- ✅ Delivery readiness calculated from completion of delivery-blocking milestones
- ✅ Confidence levels (high/medium/low) based on completion rate
- ✅ Days-to-delivery estimation from remaining milestone count

**Before:**
```typescript
estimatedDeliveryDate: "2025-03-15" // Hardcoded
```

**After:**
```typescript
deliveryReadiness: {
  isReady: false,
  readinessPercentage: 88,
  estimatedDeliveryDate: "2025-03-28", // Calculated from milestones
  blockingMilestones: ["cert-009", "cert-010"],
  daysToDelivery: 112,
  confidence: "medium"
}
```

### 3. **Mission Profile-Based Sustainability Calculations**
- ✅ Parameterized calculations based on actual operational profile
- ✅ Inputs: utilization (hrs/year), mission distance (nm), service life (years)
- ✅ Calculations follow EPA and ICAO methodologies
- ✅ Net carbon reduction accounts for electricity grid emissions

**Before:**
```typescript
sustainabilityMetrics: {
  estimatedCO2AvoidedKg: 95000, // Static guess
  equivalentTreesPlanted: 4300,
  conventionalFuelSavedGallons: 24000
}
```

**After:**
```typescript
sustainabilityMetrics: {
  totalCO2AvoidedKg: 124680, // From baseline aircraft
  electricityConsumedKwh: 180000, // Calculated from mission profile
  netCarbonReductionKg: 54960, // Actual reduction after grid emissions
  equivalentTreesPlanted: 125, // Based on service life
  calculatedFrom: missionProfile, // Transparent inputs
  methodology: { ... } // Full calculation disclosure
}
```

### 4. **Comprehensive Methodology Disclosure**
- ✅ Full transparency on sustainability calculation assumptions
- ✅ Baseline aircraft comparison (Cessna 208B Grand Caravan)
- ✅ EPA CO₂ emission factors (9.57 kg/gallon Jet-A)
- ✅ Grid carbon intensity (US average: 0.386 kg CO₂/kWh)
- ✅ Energy consumption rates (1.8 kWh/nm)
- ✅ Expandable methodology section in UI

**Impact:** Users can audit calculations and understand limitations.

### 5. **Rule-Based Program Risk Detection**
Automatically detects and flags 4 categories of program risks:

#### A. **Schedule Slip Risks**
- Overdue milestones (past estimated completion date)
- Program duration exceeding typical timeline (>2.6 years)
- Severity based on count and criticality

#### B. **Certification Blocker Risks**
- Delivery-blocking milestones stuck due to incomplete dependencies
- Critical path delays
- Identifies which dependencies are blocking progress

**Example:**
```
CRITICAL: Delivery-blocking milestone "Type Certificate Issued" is blocked 
by 2 incomplete dependencies
Impact: Cannot proceed to delivery until dependency chain is resolved
Related: cert-009, cert-007, cert-008
```

#### C. **Utilization Mismatch Risks**
- Low utilization (<200 hrs/year) → Economic viability concern
- High utilization (>1000 hrs/year) → Battery degradation risk
- Mission distance outside optimal range (25-200 nm for ALIA-250)

**Example:**
```
MEDIUM: Planned utilization (180 hrs/year) is below economic threshold
Impact: May not achieve break-even on total cost of ownership vs conventional aircraft
```

#### D. **Dependency Delay Risks**
- Long dependency chains (3+ levels deep)
- Cascade risk if any upstream milestone delays

### 6. **State-Driven Lifecycle Phases**
- ✅ Current phase calculated from milestone completion, not manually set
- ✅ Phase transitions automatic based on certification progress
- ✅ Blocked phases visible when dependencies incomplete

**Logic:**
```
Manufacturing → Ground Testing → Flight Testing → Certification → Ready → Delivered
```

Phase advances only when all milestones for that phase complete AND dependencies are satisfied.

---

## 📊 Data Model Changes

### New Types Added

```typescript
enum RiskLevel {
  NONE, LOW, MEDIUM, HIGH, CRITICAL
}

enum RiskType {
  SCHEDULE_SLIP,
  CERTIFICATION_BLOCKER,
  UTILIZATION_MISMATCH,
  DEPENDENCY_DELAY
}

interface MissionProfile {
  averageFlightHoursPerYear: number;
  averageMissionDistanceNm: number;
  expectedServiceLifeYears: number;
  primaryMissionType: 'cargo' | 'passenger' | 'medical' | 'mixed';
  baseLocation?: string;
}

interface SustainabilityMethodology {
  baselineAircraftType: string;
  baselineFuelConsumptionGphPerNm: number;
  co2PerGallonJetFuelKg: number;
  gridCarbonIntensityKgPerKwh: number;
  batteryCapacityKwh: number;
  energyConsumptionKwhPerNm: number;
  treeCo2SequestrationKgPerYear: number;
  calculationDate: string;
}

interface ProgramRisk {
  id: string;
  type: RiskType;
  level: RiskLevel;
  description: string;
  impact: string;
  detectedDate: string;
  relatedMilestones?: string[];
}

interface DeliveryReadiness {
  isReady: boolean;
  readinessPercentage: number;
  estimatedDeliveryDate?: string;
  blockingMilestones: string[];
  daysToDelivery?: number;
  confidence: 'high' | 'medium' | 'low';
}
```

### Updated Aircraft Model

```typescript
interface Aircraft {
  // Removed static fields:
  // - estimatedDeliveryDate (now calculated)
  // - currentPhase (now calculated)
  // - lifecycleStages (now calculated)
  
  // Added source-of-truth fields:
  manufacturingStartDate: string;
  missionProfile: MissionProfile;
  
  // Added calculated fields:
  deliveryReadiness: DeliveryReadiness; // Replaces static date
  programRisks: ProgramRisk[]; // New risk detection
  sustainabilityMetrics: SustainabilityMetrics; // Now calculated from mission profile
}
```

---

## 🏗️ New Backend Services

### 1. `certificationLogic.ts` (320 lines)
Core business logic for certification system:
- `calculateCurrentPhase()` - Determines phase from milestone completion
- `calculateDeliveryReadiness()` - Computes delivery date and blockers
- `calculateLifecycleStages()` - Generates timeline from milestones
- `isMilestoneBlocked()` - Checks dependency completion
- `getBlockingMilestones()` - Identifies what's blocking a milestone

### 2. `sustainabilityCalculator.ts` (220 lines)
Parameterized environmental impact calculations:
- `calculateSustainabilityMetrics()` - Main calculation function
- `getSustainabilityDisclosure()` - Full methodology documentation
- Model-specific capacity adjustments
- EPA/ICAO-compliant methodology

### 3. `riskDetection.ts` (280 lines)
Automated program risk identification:
- `detectScheduleRisks()` - Overdue milestones, extended timelines
- `detectCertificationRisks()` - Blocked delivery, critical path delays
- `detectUtilizationRisks()` - Economic viability, battery degradation
- `detectDependencyRisks()` - Deep dependency chains
- `aggregateRiskCounts()` - Summary statistics

---

## 🎨 UI Enhancements

### New Components

**1. ProgramRisks.tsx**
- Displays detected risks by severity
- Color-coded risk levels (red/orange/yellow/green)
- Shows impact and related milestones
- "No risks" state for healthy programs

**2. MissionProfile.tsx**
- Displays operational parameters
- Shows utilization, distance, service life
- Calculates total flight hours and distance
- Mission type indicator

**3. Enhanced SustainabilityMetrics.tsx**
- Expandable methodology disclosure
- Baseline vs electric comparison
- Net carbon reduction after grid emissions
- Calculation transparency

### Updated Components

**Timeline.tsx**
- Shows blocked phases with warning
- Displays blocking milestone count
- Visual indicators for blocked state

**CertificationChecklist.tsx**
- Now uses delivery readiness data
- Shows confidence level
- Highlights delivery-blocking milestones

**Dashboard.tsx**
- Added program risk summary
- Risk counts by severity level

**AircraftList.tsx**
- Displays calculated delivery dates
- "TBD" for aircraft without estimate

---

## 🔌 New API Endpoints

```
GET /api/aircraft/:id/risks
Returns program risks for specific aircraft

GET /api/sustainability/methodology
Returns full calculation methodology disclosure
```

---

## 📈 Realistic Test Data

12 aircraft with varied progression levels:
- **2 delivered** (all milestones complete)
- **3 ready** (delivery-blocking milestones complete)
- **2 in certification** (flight testing done)
- **2 in flight testing** (ground testing done)
- **2 in ground testing** (early stage)
- **1 just starting** (application only)

Mission profiles trigger realistic risks:
- Low utilization (180 hrs/year) → Economic viability risk
- Long missions (220 nm) → Range optimization risk
- High utilization (800 hrs/year) → Battery degradation risk

---

## 🧪 Testing the System

### Verify Milestone Dependencies
Look at aircraft N256BA (ac-007):
- Has flight test authorization
- Missing structural testing (cert-006)
- **Result:** Blocked from proceeding to certification
- **Risk:** Shows certification blocker

### Verify Delivery Calculation
Look at aircraft N253BA (ac-004):
- Missing Type Certificate (cert-009) and Production Certificate (cert-010)
- **Result:** Estimated delivery ~90 days out
- **Confidence:** Medium (88% progress)

### Verify Risk Detection
Look at aircraft N257BA (ac-008):
- Mission profile: 180 hrs/year
- **Result:** Utilization mismatch risk flagged
- **Level:** Medium
- **Impact:** "May not achieve break-even on TCO"

### Verify Sustainability Calculations
Look at aircraft N251BA (ac-002):
- Mission: 400 hrs/year × 18 years = 7,200 flight hours
- **Baseline:** 124,680 kg CO₂ (Cessna 208B equivalent)
- **Electric:** 69,720 kg CO₂ (from grid electricity)
- **Net Reduction:** 54,960 kg (44% reduction)

---

## ⚙️ Configuration & Customization

### Adjust Sustainability Assumptions
Edit `backend/src/services/sustainabilityCalculator.ts`:
```typescript
const STANDARD_METHODOLOGY: SustainabilityMethodology = {
  gridCarbonIntensityKgPerKwh: 0.386, // Change for different regions
  energyConsumptionKwhPerNm: 1.8, // Update with actual test data
  baselineFuelConsumptionGphPerNm: 0.52, // Different baseline aircraft
  // ...
}
```

### Adjust Risk Thresholds
Edit `backend/src/services/riskDetection.ts`:
```typescript
if (missionProfile.averageFlightHoursPerYear < 200) { // Economic threshold
  // Change to 150, 250, etc.
}

if (programDurationDays > typicalProgramDurationDays * 1.3) { // Schedule slip
  // Change multiplier to 1.2, 1.5, etc.
}
```

---

## 🎓 Learning Outcomes

This v2.0 demonstrates:

1. **State Machines** - Aircraft phase calculated from certification state
2. **Dependency Graphs** - Milestone prerequisites and blocking logic
3. **Business Rule Engines** - Risk detection from program state
4. **Calculated Fields** - Delivery dates derived, not hardcoded
5. **Methodology Transparency** - Full disclosure of calculation assumptions
6. **Domain Modeling** - Aviation certification accurately represented

---

## 🚧 Known Limitations

1. **No Database** - Still using in-memory data (seeded on startup)
2. **No Persistence** - State resets when server restarts
3. **No User Input** - Cannot update milestones via UI
4. **Simplified FAA Process** - Real certification has 100+ milestones
5. **Fixed Methodology** - Cannot customize calculations per aircraft

---

## 🔮 Future Enhancements

Potential next steps:
- [ ] Database integration (PostgreSQL)
- [ ] Milestone completion API (mark milestones done)
- [ ] Monte Carlo simulation for delivery date confidence
- [ ] Real-time updates (WebSockets)
- [ ] Historical trending (completion velocity)
- [ ] Multi-program comparison
- [ ] Export to PDF reports
- [ ] Role-based access (customer vs internal views)

---

## 📚 References

Calculation methodologies based on:
- EPA GHG Emission Factors (2024)
- ICAO Carbon Emissions Calculator
- SAE Aerospace Lifecycle Analysis Standards
- FAA Part 23 Certification Requirements

---

## ✅ Migration Notes

**Breaking Changes:**
- `estimatedDeliveryDate` removed from Aircraft type
- `sustainabilityMetrics` structure changed (new fields added)
- Frontend types must be updated to match backend

**Data Migration:**
If you have custom aircraft data, update to new structure:
```typescript
// OLD
{
  estimatedDeliveryDate: "2025-06-15"
}

// NEW
{
  manufacturingStartDate: "2024-01-15",
  certificationMilestones: [ ... ], // These drive delivery date
  missionProfile: { ... } // These drive sustainability
}
```

---

**Version:** 2.0.0  
**Release Date:** 2026-02-06  
**Focus:** Correctness & believable system behavior over UI polish
