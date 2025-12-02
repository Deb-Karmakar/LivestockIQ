# AMU Alert System - Complete Documentation

**LivestockIQ Enhanced AMU Monitoring System**  
**Version:** 2.0  
**Last Updated:** December 2025

---

## Table of Contents
1. [Overview](#overview)
2. [AMU Intensity Calculation](#amu-intensity-calculation)
3. [The 6 Alert Types](#the-6-alert-types)
4. [Severity Scoring](#severity-scoring)
5. [Job Scheduling](#job-scheduling)
6. [Real-World Example](#real-world-example)
7. [Configuration Reference](#configuration-reference)
8. [References & Sources](#references--sources)

---

## Overview

The Enhanced AMU (Antimicrobial Usage) Monitoring System implements **6 distinct alert types** to detect inappropriate or excessive antimicrobial use in livestock farms. The system is designed based on international veterinary antimicrobial stewardship guidelines and WHO recommendations.

**Key Features:**
- Multi-layered detection approach
- Context-aware (historical & peer comparison)
- WHO AWaRe drug classification integration
- Configurable thresholds
- Automated severity scoring

---

## AMU Intensity Calculation

**Formula:**
```
AMU Intensity = Total AMU Events / Herd Size
```

**AMU Events Include:**
- Individual animal treatments (count: 1 per treatment)
- Medicated feed administrations (count: number of animals fed)

**Example:**
- Farm: 100 cattle
- Month activity: 15 individual treatments + 20 animals on medicated feed
- Total events: 35
- **AMU Intensity = 35/100 = 0.35 treatments per animal per month**

**Source:** European Medicines Agency (EMA) guidelines on monitoring antimicrobial consumption in animals
- [EMA/ESVAC Guidelines](https://www.ema.europa.eu/en/veterinary-regulatory/overview/antimicrobial-resistance/european-surveillance-veterinary-antimicrobial-consumption-esvac)

---

## The 6 Alert Types

### 1. HISTORICAL_SPIKE 🔴

**Definition:** Current AMU exceeds farm's own historical average

**Threshold:** `historicalSpikeThreshold: 2.0` (default = 2x historical average)

**Calculation:**
```javascript
deviationMultiplier = currentIntensity / farm6MonthAverage
if (deviationMultiplier > threshold) → ALERT
```

**Example:**
- Farm's 6-month average: 0.20
- Current week: 0.45
- Deviation: 0.45 / 0.20 = **2.25x**
- ✅ **ALERT: "AMU spike detected: 2.25x higher than farm's 6-month average"**

**Severity:** High (2.25x = 225% of threshold)

**Why It Matters:**  
Sudden spikes indicate:
- Disease outbreak
- Changes in management practices
- Potential inappropriate prescribing

**Sources:**
- AACTING Network (European monitoring framework for veterinary antimicrobial usage)
  - [AACTING Guidelines](https://www.ema.europa.eu/en/documents/report/aacting-network-strengthening-veterinary-surveillance-antimicrobial-use_en.pdf)
- FDA Guidance #213: "New Animal Drugs and New Animal Drug Combination Products Administered in or on Medicated Feed"
  - [FDA CVM Guidance](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/cvm-gfi-213-new-animal-drugs-and-new-animal-drug-combination-products-administered-or-medicated-feed)

**Run Frequency:** Daily

---

### 2. PEER_COMPARISON_SPIKE 🟠

**Definition:** Farm's AMU exceeds peer group average

**Threshold:** `peerComparisonThreshold: 1.5` (default = 1.5x peer average)

**Peer Grouping:**
- Species (cattle/sheep/goats)
- Herd size (Small: ≤50, Medium: 51-200, Large: >200)

**Calculation:**
```javascript
peerAverage = averageIntensity(samePeerGroup)
if (farmIntensity / peerAverage > threshold) → ALERT
```

**Example:**
- Farm: Medium cattle operation (150 head)
- Farm AMU: 0.40
- Peer average: 0.25
- Ratio: 0.40 / 0.25 = **1.6x**
- ✅ **ALERT: "AMU usage 1.6x higher than similar farms"**

**Severity:** Medium

**Why It Matters:**  
Benchmarking against peers helps identify:
- Farms with poor disease management
- Potential antibiotic overuse
- Need for veterinary intervention

**Sources:**
- European Commission Joint Research Centre - Benchmarking approaches for antimicrobial use
  - [EC JRC Report](https://publications.jrc.ec.europa.eu/repository/handle/JRC117742)
- DANMAP (Danish Integrated Antimicrobial Resistance Monitoring Programme)
  - [DANMAP Methodology](https://www.danmap.org/)
- Netherlands Veterinary Medicines Authority (SDa) benchmarking system
  - [SDa Indicator](https://www.autoriteitdiergeneesmiddelen.nl/en)

**Run Frequency:** Monthly (1st of each month)

---

### 3. ABSOLUTE_THRESHOLD 🔴

**Definition:** AMU intensity exceeds absolute safe limit

**Threshold:** `absoluteIntensityThreshold: 0.5` (default = 0.5 treatments/animal/month)

**Calculation:**
```javascript
if (farmIntensity > absoluteThreshold) → ALERT
```

**Example:**
- Farm AMU: 0.65
- Threshold: 0.5
- ✅ **ALERT: "Absolute AMU threshold exceeded: 0.65 (limit: 0.5)"**

**Severity:** Critical (30% over limit)

**Why It Matters:**  
Industry best practice indicates >0.5 suggests:
- Potential overuse
- Chronic disease issues
- Herd health crisis

**Sources:**
- OIE (World Organisation for Animal Health) - Responsible and Prudent Use of Antimicrobial Agents
  - [OIE Standards](https://www.woah.org/en/what-we-do/standards/codes-and-manuals/terrestrial-code-online-access/?id=169&L=1&htmfile=chapitre_antibio_use.htm)
- British Veterinary Association (BVA) - Responsible Use of Antimicrobials
  - [BVA Guidelines](https://www.bva.co.uk/resources-support/medicines/responsible-use-of-antimicrobials/)
- American Association of Bovine Practitioners (AABP) - Judicious Use Guidelines
  - [AABP Prudent Use](https://www.aabp.org/Resources/AABP_Guidelines/Judicious_Antimicrobial_Use.aspx)

**Run Frequency:** Weekly (every Monday)

---

### 4. TREND_INCREASE 🔵

**Definition:** Sustained upward trend in AMU over 3 months

**Threshold:** `trendIncreaseThreshold: 0.30` (default = 30% increase)

**Calculation:**
```javascript
trendIncrease = (month3Intensity - month1Intensity) / month1Intensity
if (trendIncrease > threshold) → ALERT
```

**Example:**
- Month 1: 0.20
- Month 2: 0.24
- Month 3: 0.28
- Increase: (0.28 - 0.20) / 0.20 = **40%**
- ✅ **ALERT: "AMU trending upward: +40% over last 3 months"**

**Severity:** Low (gradual, not sudden)

**Why It Matters:**  
Identifies worsening trends before they become critical:
- Deteriorating herd health
- Biosecurity breaches
- Management practice changes

**Sources:**
- EPRUMA (European Platform for the Responsible Use of Medicines in Animals)
  - [EPRUMA Best Practice Framework](https://epruma.eu/)
- FDA Center for Veterinary Medicine - Antimicrobial Use and Sales Reporting
  - [FDA CVM Reports](https://www.fda.gov/animal-veterinary/antimicrobial-resistance/antimicrobial-sales-and-distribution-reporting-animals)

**Run Frequency:** Monthly (1st of each month)

---

### 5. CRITICAL_DRUG_USAGE 🟣

**Definition:** Excessive use of WHO Watch/Reserve antibiotics

**Threshold:** `criticalDrugThreshold: 0.40` (default = 40% of total AMU)

**WHO AWaRe Classification:**
- **Access:** First-line, lower resistance risk (e.g., Penicillin, Tetracycline)
- **Watch:** Second-line, higher resistance potential (e.g., Fluoroquinolones, 3rd-gen Cephalosporins)
- **Reserve:** Last resort, critically important (e.g., Colistin, Carbapenems)

**Calculation:**
```javascript
criticalPercentage = (watchCount + reserveCount) / totalAMUEvents
if (criticalPercentage > threshold) → ALERT
```

**Example:**
- Total events: 50
- Access: 25
- Watch: 18
- Reserve: 7
- Critical %: (18+7)/50 = **50%**
- ✅ **ALERT: "Critical antibiotic usage: 50% of AMU uses Watch/Reserve drugs"**

**Severity:** High (antimicrobial stewardship violation)

**Data Captured:**
```javascript
drugClassBreakdown: {
  access: 25,
  watch: 18,
  reserve: 7,
  unclassified: 0
}
```

**Why It Matters:**  
Overuse of critical antibiotics:
- Accelerates resistance development
- Reduces effectiveness for human medicine
- Violates antimicrobial stewardship principles

**Sources:**
- **WHO AWaRe Classification (Primary Source)**
  - [WHO AWaRe Book 2023](https://www.who.int/publications/i/item/9789240062382)
  - [WHO List of Critically Important Antimicrobials (CIA)](https://www.who.int/publications/i/item/9789241515528)
- EMA Categorisation of Antibiotics (AMEG)
  - [EMA/AMEG Categorisation](https://www.ema.europa.eu/en/documents/report/categorisation-antibiotics-european-union-answer-request-european-commission-updating-scientific_en.pdf)
- FDA Guidance #152: Evaluating the Safety of Antimicrobial New Animal Drugs
  - [FDA GFI #152](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/cvm-gfi-152-evaluating-safety-antimicrobial-new-animal-drugs-regard-their-microbiological-effects)

**Run Frequency:** Weekly (every Monday)

---

### 6. SUSTAINED_HIGH_USAGE 🔴

**Definition:** High AMU persists for extended period

**Threshold:** `sustainedHighUsageDuration: 4` (default = 4 consecutive weeks)

**Calculation:**
```javascript
consecutiveHighWeeks = weeks where (weeklyIntensity > 2x farmAverage)
if (consecutiveHighWeeks >= threshold) → ALERT
```

**Example:**
- Average: 0.25
- Week 1: 0.52 (>2x)
- Week 2: 0.48 (>2x)
- Week 3: 0.55 (>2x)
- Week 4: 0.50 (>2x)
- ✅ **ALERT: "Sustained high AMU: 4 consecutive weeks above 2x farm average"**

**Severity:** Critical (chronic problem)

**Why It Matters:**  
Indicates:
- Chronic disease issues (not isolated outbreak)
- Systemic herd health problems
- Inadequate biosecurity
- Need for urgent veterinary investigation

**Sources:**
- RONAFA (Responsible Use of Antimicrobials in Aquaculture and Agriculture)
  - [RONAFA Framework](https://www.efsa.europa.eu/en/efsajournal/pub/6955)
- European Medicines Agency - Advice on impact measures of antibiotic use
  - [EMA Impact Assessment](https://www.ema.europa.eu/en/documents/scientific-guideline/reflection-paper-use-fluoroquinolones-food-producing-animals-european-union-development-resistance_en.pdf)

**Run Frequency:** Weekly (every Monday)

---

## Severity Scoring

Severity is automatically calculated based on deviation from threshold:

```javascript
calculateSeverity(alertType, deviationMultiplier):
  if (alertType === 'CRITICAL_DRUG_USAGE'):
    if (deviationMultiplier >= 0.6) return 'Critical'  // >60% critical drugs
    if (deviationMultiplier >= 0.4) return 'High'
    return 'Medium'
  
  // For other alert types
  if (deviationMultiplier >= 3.0) return 'Critical'  // 300%+ of threshold
  if (deviationMultiplier >= 2.0) return 'High'      // 200%+ of threshold
  if (deviationMultiplier >= 1.5) return 'Medium'    // 150%+ of threshold
  return 'Low'
```

**Source:** Adapted from European Centre for Disease Prevention and Control (ECDC) risk assessment methodology
- [ECDC Risk Assessment](https://www.ecdc.europa.eu/en/publications-data/ecdc-protocol-evaluating-antimicrobial-stewardship-programmes-and-interventions)

---

## Job Scheduling

| Alert Type | Frequency | Cron Schedule | Rationale |
|------------|-----------|---------------|-----------|
| Historical Spike | Daily | `0 0 * * *` | Detect outbreaks quickly |
| Peer Comparison | Monthly | `0 0 1 * *` | Sufficient data accumulation |
| Absolute Threshold | Weekly | `0 0 * * 1` | Balance between responsiveness & noise |
| Trend Increase | Monthly | `0 0 1 * *` | Requires 3-month data |
| Critical Drug Usage | Weekly | `0 0 * * 1` | Monitor stewardship adherence |
| Sustained High Usage | Weekly | `0 0 * * 1` | Track chronic issues |

**Note:** All times in UTC, adjust for local timezone as needed.

---

## Real-World Example

**Farm Profile:**
```
Name: Green Valley Dairy Farm
Species: Cattle (dairy)
Herd Size: 200 head
Location: West Bengal, India
6-Month Avg AMU: 0.18
```

**Scenario: Disease Outbreak**

### Week 1
- Respiratory disease outbreak
- Veterinarian prescribes treatments
- **80 animals treated**
- AMU Intensity: 80/200 = **0.40**

**Alerts Triggered:**
1. ✅ **HISTORICAL_SPIKE** 
   - Calculation: 0.40 / 0.18 = 2.22x
   - Severity: High
   - Message: "AMU spike detected: 2.22x higher than farm's 6-month average (0.18)"

### Week 4
- High usage continues
- **SUSTAINED_HIGH_USAGE triggered**
- Severity: Critical
- Message: "Sustained high AMU: 4 consecutive weeks above 2x farm average"

### Drug Analysis
- 80 treatments total:
  - 45 Penicillin (Access)
  - 28 Enrofloxacin (Watch)
  - 7 Colistin (Reserve)
- Critical drugs: (28+7)/80 = **43.75%**

**Alert Triggered:**
3. ✅ **CRITICAL_DRUG_USAGE**
   - Severity: High
   - Message: "Critical antibiotic usage: 44% uses Watch/Reserve drugs (limit: 40%)"

### Monthly Review
- Farm AMU: 0.40
- Peer group (medium dairy): 0.22
- Ratio: 0.40 / 0.22 = **1.82x**

**Alert Triggered:**
4. ✅ **PEER_COMPARISON_SPIKE**
   - Severity: Medium
   - Message: "AMU 1.82x higher than similar farms (medium dairy operations)"

**Total Alerts: 4 types**, each highlighting different aspects of the AMU issue!

---

## Configuration Reference

Default thresholds (configurable via AMU Management page):

```javascript
{
  // Historical comparison
  historicalSpikeThreshold: 2.0,          // 2x farm's 6-month average
  
  // Peer benchmarking  
  peerComparisonThreshold: 1.5,           // 1.5x peer group average
  
  // Absolute limits
  absoluteIntensityThreshold: 0.5,        // 0.5 treatments/animal/month
  
  // Trend analysis
  trendIncreaseThreshold: 0.30,           // 30% increase over 3 months
  
  // Antimicrobial stewardship
  criticalDrugThreshold: 0.40,            // 40% Watch/Reserve drugs
  
  // Sustained usage
  sustainedHighUsageDuration: 4,          // 4 consecutive weeks
  
  // Noise reduction
  minimumEventsThreshold: 5               // Minimum 5 events to trigger alert
}
```

**Adjustment Guidelines:**
- **Less Strict:** Increase thresholds (fewer alerts, higher specificity)
- **More Strict:** Decrease thresholds (more alerts, higher sensitivity)
- **Recommended:** Start with defaults, adjust based on 3-month observations

---

## References & Sources

### Primary Guidelines

1. **World Health Organization (WHO)**
   - WHO AWaRe Classification of Antibiotics (2023)
     - https://www.who.int/publications/i/item/9789240062382
   - WHO List of Critically Important Antimicrobials for Human Medicine (6th Revision)
     - https://www.who.int/publications/i/item/9789241515528

2. **European Medicines Agency (EMA)**
   - European Surveillance of Veterinary Antimicrobial Consumption (ESVAC)
     - https://www.ema.europa.eu/en/veterinary-regulatory/overview/antimicrobial-resistance/european-surveillance-veterinary-antimicrobial-consumption-esvac
   - EMA/AMEG Categorisation of Antibiotics
     - https://www.ema.europa.eu/en/documents/report/categorisation-antibiotics-european-union-answer-request-european-commission-updating-scientific_en.pdf

3. **World Organisation for Animal Health (OIE/WOAH)**
   - OIE Standards on Responsible and Prudent Use of Antimicrobial Agents
     - https://www.woah.org/en/what-we-do/standards/codes-and-manuals/terrestrial-code-online-access/?id=169&L=1&htmfile=chapitre_antibio_use.htm

4. **U.S. Food and Drug Administration (FDA)**
   - FDA Center for Veterinary Medicine Guidance Documents
     - GFI #152: Evaluating Safety of Antimicrobial New Animal Drugs
     - GFI #213: New Animal Drugs in Medicated Feed
     - https://www.fda.gov/animal-veterinary/guidance-regulations/guidances-cvm

### National Monitoring Programs

5. **DANMAP (Denmark)**
   - Danish Integrated Antimicrobial Resistance Monitoring and Research Programme
     - https://www.danmap.org/

6. **SDa (Netherlands)**
   - Netherlands Veterinary Medicines Authority Benchmarking System
     - https://www.autoriteitdiergeneesmiddelen.nl/en

7. **UK-VARSS (United Kingdom)**
   - UK Veterinary Antibiotic Resistance and Sales Surveillance
     - https://www.gov.uk/government/collections/veterinary-antimicrobial-resistance-and-sales-surveillance

### Industry Associations

8. **EPRUMA (Europe)**
   - European Platform for the Responsible Use of Medicines in Animals
     - https://epruma.eu/

9. **AABP (United States)**
   - American Association of Bovine Practitioners - Judicious Use Guidelines
     - https://www.aabp.org/Resources/AABP_Guidelines/Judicious_Antimicrobial_Use.aspx

10. **BVA (United Kingdom)**
    - British Veterinary Association - Responsible Use of Antimicrobials
      - https://www.bva.co.uk/resources-support/medicines/responsible-use-of-antimicrobials/

### Research & Methodologies

11. **European Commission Joint Research Centre**
    - Benchmarking Approaches for Antimicrobial Use
      - https://publications.jrc.ec.europa.eu/repository/handle/JRC117742

12. **ECDC (European Centre for Disease Prevention and Control)**
    - ECDC Protocol for Evaluating Antimicrobial Stewardship Programmes
      - https://www.ecdc.europa.eu/en/publications-data/ecdc-protocol-evaluating-antimicrobial-stewardship-programmes-and-interventions

13. **AACTING Network**
    - European Framework for Veterinary Antimicrobial Surveillance
      - https://www.ema.europa.eu/en/documents/report/aacting-network-strengthening-veterinary-surveillance-antimicrobial-use_en.pdf

---

## Implementation Notes

**Version History:**
- v2.0 (Dec 2025): Enhanced system with 6 alert types, WHO AWaRe integration
- v1.0 (Sept 2025): Basic historical spike detection

**Technical Implementation:**
- Backend: Node.js/Express
- Database: MongoDB with indexed queries for performance
- Jobs: Node-cron scheduled tasks
- Alert Storage: `HighAmuAlert` collection with full audit trail

**Compliance:**
- Aligns with EU Veterinary Medicines Regulation (EU) 2019/6
- Supports One Health antimicrobial stewardship principles
- Implements WHO tripartite (WHO-FAO-WOAH) AMR action plan recommendations

---

**Document Prepared By:** LivestockIQ Development Team  
**Based On:** International veterinary antimicrobial stewardship best practices  
**Last Review:** December 2025  
**Next Review:** June 2026

---

*For questions or clarifications, consult with veterinary antimicrobial stewardship specialists or regulatory authorities.*
