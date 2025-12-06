# User Onboarding Process - LivestockIQ

> A comprehensive guide to the in-app user registration and onboarding flow for LivestockIQ.

## Overview

LivestockIQ supports three distinct user roles, each with a tailored onboarding experience:

| Role | Target User | Key Onboarding Goal |
|------|-------------|---------------------|
| **Farmer** | Livestock farm owners | Register animals, link to supervising vet |
| **Veterinarian** | Licensed vets | Get verified, receive unique vetId |
| **Regulator** | DoAH&D officials | Access compliance dashboards after admin approval |

---

## Role-Based Registration Flows

### Entry Point: Role Selection

```
┌─────────────────────────────────────────────────────────────────┐
│                    LANDING PAGE                                  │
│  "Protect Your Livestock, Protect Your Consumers"               │
├─────────────────────────────────────────────────────────────────┤
│  [I'm a Farmer]  [I'm a Veterinarian]  [I'm a Regulator]        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Veterinarian Onboarding

> **Why Vet-First?** Farmers must link to a registered vet via `vetId`. Vets must register first.

### Registration Steps

#### Step 1: Location Setup
| Field | Type | Required |
|-------|------|----------|
| GPS Coordinates | Auto-fetch | Yes |
| State | Dropdown | Yes |
| District | Dropdown (filtered by State) | Yes |

#### Step 2: Personal Information
| Field | Type | Required |
|-------|------|----------|
| Full Name | Text | Yes |
| Gender | Dropdown | No |
| Date of Birth | Date Picker | No |

#### Step 3: Professional Details
| Field | Type | Required |
|-------|------|----------|
| Veterinary License Number | Text (e.g., APSVC/12345/2020) | Yes |
| University/College Name | Text | No |
| Graduation Year/Degree | Text | No |
| Specialization | Text | No |

#### Step 4: Account & Consent
| Field | Type | Required |
|-------|------|----------|
| Email Address | Email | Yes |
| Phone Number | Tel | No |
| Password | Password | Yes |
| Confirm Password | Password | Yes |
| Information Accuracy Consent | Checkbox | Yes |
| Data Sharing Consent | Checkbox | Yes |

### Post-Registration
- System generates unique **vetId** (e.g., `x7b2k1j`)
- Vet can share this with farmers for registration
- RSA key pair generated for digital prescription signing

---

## 2. Farmer Onboarding

### Pre-requisite
> ⚠️ Farmers **must** have their veterinarian's unique `vetId` to register.

### Registration Steps

#### Step 1: Location Auto-Fetch
- GPS coordinates captured automatically on component mount
- Status displayed: Loading → Success/Error
- Retry option if location fetch fails

#### Step 2: Account Details
| Field | Type | Required |
|-------|------|----------|
| Full Name (Farm Owner) | Text | Yes |
| Phone Number | Tel | Yes |
| Email | Email | Yes |
| Password | Password | Yes |
| Confirm Password | Password | Yes |

#### Step 3: Farm Details
| Field | Type | Required |
|-------|------|----------|
| Farm Name | Text | Yes |
| Veterinarian ID | Text (validated against existing vets) | Yes |
| State | Dropdown | Yes |
| District | Dropdown | Yes |

### VetId Validation
```javascript
// Backend validates vetId exists before farmer registration
const vetExists = await Veterinarian.findOne({ vetId: vetId });
if (!vetExists) {
    return res.status(400).json({ message: 'Invalid Veterinarian ID.' });
}
```

### Location Data Structure
```javascript
location: {
    latitude: 28.6139,
    longitude: 77.2090,
    state: "Delhi",
    district: "New Delhi"
}
```

---

## 3. Regulator Onboarding

### Registration Steps

#### Step 1: Official Information
| Field | Type | Required |
|-------|------|----------|
| Full Name | Text | Yes |
| Regulatory Agency Name | Text (e.g., State Animal Husbandry Dept.) | Yes |
| Official Regulator ID | Text (Government-issued) | Yes |
| Jurisdiction | Text (e.g., State of Maharashtra) | Yes |
| State | Dropdown | Yes |
| District | Dropdown | Yes |

#### Step 2: Account Credentials
| Field | Type | Required |
|-------|------|----------|
| Official Email Address | Email | Yes |
| Phone Number | Tel | No |
| Password | Password | Yes |
| Confirm Password | Password | Yes |
| Authorization Confirmation | Checkbox | Yes |

### Post-Registration
- Account created with `regulator` role
- Access to compliance dashboards, trend analysis, and farm/vet directories

---

## First-Time User Experience

### Recommended: Guided Onboarding Tour

After successful registration, display an interactive tour:

#### For Farmers:
1. **Dashboard Overview** - Key metrics at a glance
2. **Add Your First Animal** - Guide to ear tag scanning
3. **Request Treatment** - How to log health issues
4. **Check MRL Status** - Understanding withdrawal periods
5. **Meet IQ Buddy** - AI assistant for health guidance

#### For Veterinarians:
1. **Dashboard Overview** - Pending requests summary
2. **Treatment Requests** - How to approve/reject
3. **Digital Prescriptions** - Creating signed prescriptions
4. **Farmer Directory** - Managing client farms
5. **Share Your vetId** - Onboarding new farmers

#### For Regulators:
1. **Compliance Dashboard** - Key compliance metrics
2. **AMU Trends** - Understanding usage patterns
3. **Geographic View** - Heat map functionality
4. **Audit Trails** - Blockchain verification

---

## Mobile App Onboarding

### Simplified Flow for Field Conditions

```
Screen 1: Welcome
  └── "LivestockIQ - मवेशियों का प्रबंधन"
  └── Language selection (English/Hindi)

Screen 2: Role Selection
  └── [Farmer]  [Veterinarian]

Screen 3: Quick Registration
  └── 4-5 essential fields only
  └── GPS auto-fetch
  └── Voice input option (STT)

Screen 4: First Action Prompt
  └── "Add your first animal →" (Farmer)
  └── "View treatment requests →" (Vet)
```

### Offline Considerations
- Registration data queued locally if offline
- Syncs automatically when connection restored
- Clear visual indicator of sync status

---

## Technical Implementation

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Farmer registration |
| `/api/auth/register/vet` | POST | Veterinarian registration |
| `/api/auth/register/regulator` | POST | Regulator registration |
| `/api/auth/login` | POST | Universal login (role auto-detected) |

### Authentication Flow
```
Registration → JWT Token Generated → Stored in LocalStorage/AsyncStorage → Auto-login
```

### Role Detection on Login
```javascript
// Backend checks all collections to find user and determine role
user = await Farmer.findOne({ email });
if (user) { role = 'farmer'; }

if (!user) {
    user = await Veterinarian.findOne({ email });
    if (user) { role = 'veterinarian'; }
}

if (!user) {
    user = await Regulator.findOne({ email });
    if (user) { role = 'regulator'; }
}
```

---

## Data Collected During Onboarding

### Farmer Data Model
```javascript
{
    farmOwner: String,
    email: String,
    password: String (hashed),
    farmName: String,
    vetId: String,
    phoneNumber: String,
    location: {
        latitude: Number,
        longitude: Number,
        state: String,
        district: String
    }
}
```

### Veterinarian Data Model
```javascript
{
    fullName: String,
    email: String,
    password: String (hashed),
    licenseNumber: String,
    vetId: String (auto-generated),
    location: {
        latitude: Number,
        longitude: Number,
        state: String,
        district: String
    },
    // RSA keys for digital signatures
    publicKey: String,
    privateKeyEncrypted: String
}
```

### Regulator Data Model
```javascript
{
    fullName: String,
    email: String,
    password: String (hashed),
    agencyName: String,
    regulatorId: String,
    jurisdiction: String,
    phoneNumber: String,
    state: String,
    district: String
}
```

---

## Best Practices Implemented

| Practice | Implementation |
|----------|----------------|
| Password Security | bcrypt hashing with salt |
| Session Management | JWT with 30-day expiry |
| Location Privacy | User consent + retry option |
| Data Validation | Server-side + client-side |
| Error Handling | Clear error messages |
| Accessibility | Required field indicators |

---

## Related Documentation

- [Hackathon Demo Guide](./Hackathon_Demo_Guide.md)
- [AMU Alert System](./AMU_Alert_System_Documentation.md)
- [WHO AWaRe Classification](./WHO_AWaRe_Classification_Integration.md)
