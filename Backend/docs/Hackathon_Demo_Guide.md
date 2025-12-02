# Hackathon Demo Guide - Enhanced AMU Alert System

## Quick Setup (2 minutes before demo)

### Step 1: Seed Demo Alerts
```bash
node Backend/scripts/seedDemoAmuAlerts.js
```

This creates **6 demo alerts** (one for each type) with realistic data.

### Step 2: Login as Farmer
- Use any farmer account in your system
- Navigate to `/farmer/alerts`

---

## Demo Flow (5 minutes)

### **Part 1: Farmer View (2 minutes)**

**Navigate to Alerts Page:**
1. Show the **Stats Dashboard** - 4 cards showing alert counts
2. Click **AMU Alerts tab** - Show all 6 alert types

**Highlight Each Alert Type:**

| Alert | What to Say | Key Feature |
|-------|-------------|-------------|
| 🔴 **Historical Spike** | "This farm's usage spiked 2.25x above their own average" | Show historical comparison |
| 🟡 **Peer Comparison** | "They're using 1.6x more than similar-sized farms" | Benchmarking against peers |
| 🔴 **Absolute Threshold** | "Exceeded the industry safety limit of 0.5" | Hard regulatory limit |
| 🔵 **Trend Increase** | "40% gradual increase over 3 months - early warning" | Predictive analytics |
| 🟣 **Critical Drugs** | "50% usage of WHO Watch/Reserve antibiotics - stewardship violation" | **Point out drug breakdown!** |
| 🔴 **Sustained High** | "4 consecutive weeks of high usage - chronic problem" | Long-term monitoring |

**Drug Class Breakdown:**
- Point to the colored dots: 🟢 Access | 🟠 Watch | 🔴 Reserve
- Explain WHO AWaRe classification
- Highlight Critical Drug Usage alert specifically

### **Part 2: Regulator View (2 minutes)**

**Navigate to `/regulator/amu-management`:**

1. **Show Configuration Tab:**
   - "Regulators can adjust these 7 thresholds dynamically"
   - Show Historical Spike threshold (2.0x)
   - Show Critical Drug threshold (40%)

2. **Show Alerts Tab:**
   - "Regulators see ALL farms' alerts in one place"
   - Filter by severity (Critical/High/Medium/Low)
   - Filter by alert type

### **Part 3: Technical Highlights (1 minute)**

**Backend Intelligence:**
- 6 background jobs running on schedules (daily/weekly/monthly)
- WHO AWaRe drug classification integrated
- Peer grouping by species + herd size
- Configurable thresholds (no hardcoded values!)

**Frontend Features:**
- Real-time severity badges
- Drug class visual breakdown
- Tabbed organization (AMU/Operational/All)
- Responsive, modern UI

---

## Demo Script (Word-for-Word)

### Opening (15 seconds)
> "Our system implements WHO-recommended antimicrobial stewardship with **6 intelligent alert types** that detect inappropriate usage patterns. Let me show you."

### Farmer Alerts (1 min 30 sec)
> "As a farmer, I immediately see my **AMU Alerts dashboard**. Each alert has a **severity badge** and shows exactly what triggered it.
>
> For example, this **Historical Spike** alert tells me my usage is 2.25x my own average - something might be wrong.
>
> This **Critical Drug Usage** alert is especially important - see the breakdown? 🟢 **Access** drugs are safe, 🟠 **Watch** drugs should be limited, and 🔴 **Reserve** drugs are last-resort. I'm using 50% critical drugs when the limit is 40% - that's flagged.
>
> Each alert provides actionable insights, not just raw numbers."

### Regulator View (1 min)
> "Regulators see the big picture on the **AMU Management page**. 
>
> In the **Configuration tab**, they can adjust these industry-standard thresholds based on local conditions. Notice these are based on **WHO AWaRe classification** and **EMA/ESVAC guidelines**.
>
> The **Alerts tab** shows every farm's alerts - filterable by severity or type. A regulator can immediately identify farms needing intervention."

### Technical Close (30 seconds)
> "Under the hood, we have **6 background jobs** analyzing data:
> - Daily spike detection
> - Monthly peer benchmarking  
> - Trend analysis over 3 months
> - And more
>
> All thresholds are **configurable** - no hardcoded values. The system adapts to your regulatory framework."

---

## Troubleshooting

**No alerts showing?**
```bash
# Check if alerts were created
node Backend/scripts/seedDemoAmuAlerts.js

# Verify in MongoDB
mongosh
use livestockiq
db.highamualer ts.find({}).pretty()
```

**Wrong farmer?**
- The seed script uses the **first farmer** in your database
- Login with that farmer's credentials

**Need to reset?**
```bash
# Re-run seed script (it clears old alerts first)
node Backend/scripts/seedDemoAmuAlerts.js
```

---

## Bonus: Live Alert Creation

If you want to show alerts being **generated live** (advanced):

```bash
# Run one of the AMU analysis jobs manually
node Backend/jobs/runAmuJobs.js
```

This will analyze real data and create alerts if thresholds are exceeded.

---

## Key Talking Points

✅ **WHO-aligned** - AWaRe classification system  
✅ **Multi-layered** - 6 detection methods, not just one  
✅ **Configurable** - Regulators control thresholds  
✅ **Actionable** - Clear drug class breakdowns  
✅ **Scalable** - Background jobs, not real-time overhead  
✅ **Evidence-based** - References EMA, DANMAP, FDA guidelines  

**Impact Statement:**
> "This system helps reduce antimicrobial resistance by catching overuse patterns early, protecting both animal and human health through responsible stewardship."

---

**Good luck with your hackathon! 🚀**
