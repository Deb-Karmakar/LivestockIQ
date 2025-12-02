/**
 * Seed data for MRL (Maximum Residue Limits) thresholds
 * Based on FSSAI and Codex Alimentarius standards for India
 * 
 * WHO AWaRe Classification added for antimic stewardship:
 * - Access: First-line antibiotics, lower resistance risk
 * - Watch: Second-line, higher resistance potential 
 * - Reserve: Last resort, critically important for human medicine
 */

const mrlSeedData = [
    // ANTIBIOTICS - TETRACYCLINES (Access Group)
    {
        drugName: 'Oxytetracycline',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 7,
        whoAWaReClass: 'Access',
        regulatoryAuthority: 'FSSAI',
        referenceDocument: 'FSSAI Food Safety Standards (Contaminants, Toxins and Residues) Regulations, 2011',
        notes: 'Commonly used for respiratory infections and mastitis'
    },
    {
        drugName: 'Oxytetracycline',
        species: 'Cattle',
        productType: 'Meat',
        mrlLimit: 200,
        unit: 'µg/kg',
        withdrawalPeriodDays: 14,
        whoAWaReClass: 'Access',
        regulatoryAuthority: 'FSSAI',
        notes: 'Muscle tissue limit'
    },
    {
        drugName: 'Tetracycline',
        species: 'Poultry',
        productType: 'Eggs',
        mrlLimit: 200,
        unit: 'µg/kg',
        withdrawalPeriodDays: 7,
        whoAWaReClass: 'Access',
        regulatoryAuthority: 'Codex Alimentarius'
    },
    {
        drugName: 'Tetracycline',
        species: 'Poultry',
        productType: 'Meat',
        mrlLimit: 200,
        unit: 'µg/kg',
        withdrawalPeriodDays: 10,
        whoAWaReClass: 'Access',
        regulatoryAuthority: 'FSSAI'
    },

    // ANTIBIOTICS - PENICILLINS (Access Group)
    {
        drugName: 'Penicillin',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 4,
        unit: 'µg/kg',
        withdrawalPeriodDays: 4,
        whoAWaReClass: 'Access',
        regulatoryAuthority: 'FSSAI',
        notes: 'Very low MRL - highly sensitive'
    },
    {
        drugName: 'Amoxicillin',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 4,
        unit: 'µg/kg',
        withdrawalPeriodDays: 4,
        whoAWaReClass: 'Access',
        regulatoryAuthority: 'FSSAI'
    },
    {
        drugName: 'Amoxicillin',
        species: 'Cattle',
        productType: 'Meat',
        mrlLimit: 50,
        unit: 'µg/kg',
        withdrawalPeriodDays: 7,
        whoAWaReClass: 'Access',
        regulatoryAuthority: 'FSSAI'
    },

    // ANTIBIOTICS - SULFONAMIDES (Access Group)
    {
        drugName: 'Sulfamethazine',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 5,
        whoAWaReClass: 'Access',
        regulatoryAuthority: 'FSSAI'
    },
    {
        drugName: 'Sulfamethazine',
        species: 'Pig',
        productType: 'Meat',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 15,
        whoAWaReClass: 'Access',
        regulatoryAuthority: 'FSSAI'
    },

    // ANTIBIOTICS - FLUOROQUINOLONES (Watch Group - Critically Important!)
    {
        drugName: 'Enrofloxacin',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 5,
        whoAWaReClass: 'Watch',
        regulatoryAuthority: 'FSSAI',
        notes: 'Fluoroquinolone - restricted use, WHO Watch group'
    },
    {
        drugName: 'Enrofloxacin',
        species: 'Poultry',
        productType: 'Meat',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 10,
        whoAWaReClass: 'Watch',
        regulatoryAuthority: 'FSSAI'
    },

    // ANTIBIOTICS - MACROLIDES (Watch Group)
    {
        drugName: 'Tylosin',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 50,
        unit: 'µg/kg',
        withdrawalPeriodDays: 4,
        whoAWaReClass: 'Watch',
        regulatoryAuthority: 'FSSAI'
    },
    {
        drugName: 'Tylosin',
        species: 'Pig',
        productType: 'Meat',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 14,
        whoAWaReClass: 'Watch',
        regulatoryAuthority: 'FSSAI'
    },

    // ANTIBIOTICS - AMINOGLYCOSIDES (Watch Group)
    {
        drugName: 'Gentamicin',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 7,
        whoAWaReClass: 'Watch',
        regulatoryAuthority: 'FSSAI'
    },
    {
        drugName: 'Streptomycin',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 200,
        unit: 'µg/kg',
        withdrawalPeriodDays: 7,
        whoAWaReClass: 'Access',
        regulatoryAuthority: 'FSSAI'
    },

    // ANTIPARASITICS (Not antibiotics - Unclassified for AWaRe)
    {
        drugName: 'Ivermectin',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 10,
        unit: 'µg/kg',
        withdrawalPeriodDays: 28,
        whoAWaReClass: 'Unclassified',
        regulatoryAuthority: 'FSSAI',
        notes: 'Long withdrawal period required - Antiparasitic, not antibiotic'
    },
    {
        drugName: 'Ivermectin',
        species: 'Cattle',
        productType: 'Meat',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 35,
        whoAWaReClass: 'Unclassified',
        regulatoryAuthority: 'FSSAI'
    },
    {
        drugName: 'Doramectin',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 50,
        unit: 'µg/kg',
        withdrawalPeriodDays: 28,
        whoAWaReClass: 'Unclassified',
        regulatoryAuthority: 'FSSAI'
    },

    // ANTIPARASITICS - BENZIMIDAZOLES
    {
        drugName: 'Albendazole',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 5,
        whoAWaReClass: 'Unclassified',
        regulatoryAuthority: 'FSSAI'
    },
    {
        drugName: 'Fenbendazole',
        species: 'Cattle',
        productType: 'Meat',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 14,
        whoAWaReClass: 'Unclassified',
        regulatoryAuthority: 'FSSAI'
    },

    // HORMONES (Not antibiotics)
    {
        drugName: 'Oxytocin',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 0,
        unit: 'µg/kg',
        withdrawalPeriodDays: 1,
        whoAWaReClass: 'Unclassified',
        regulatoryAuthority: 'FSSAI',
        notes: 'Zero tolerance - use strictly controlled. Hormone, not antibiotic'
    },

    // ANTI-INFLAMMATORIES (Not antibiotics)
    {
        drugName: 'Meloxicam',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 15,
        unit: 'µg/kg',
        withdrawalPeriodDays: 5,
        whoAWaReClass: 'Unclassified',
        regulatoryAuthority: 'EU'
    },
    {
        drugName: 'Meloxicam',
        species: 'Cattle',
        productType: 'Meat',
        mrlLimit: 20,
        unit: 'µg/kg',
        withdrawalPeriodDays: 15,
        whoAWaReClass: 'Unclassified',
        regulatoryAuthority: 'EU'
    },

    // GENERAL FALLBACK LIMITS
    {
        drugName: 'Unknown Antibiotic',
        species: 'All Species',
        productType: 'Milk',
        mrlLimit: 50,
        unit: 'µg/kg',
        withdrawalPeriodDays: 7,
        whoAWaReClass: 'Unclassified',
        regulatoryAuthority: 'Custom',
        notes: 'Default conservative limit for unspecified antibiotics'
    },
    {
        drugName: 'Unknown Antibiotic',
        species: 'All Species',
        productType: 'Meat',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 14,
        whoAWaReClass: 'Unclassified',
        regulatoryAuthority: 'Custom',
        notes: 'Default conservative limit for unspecified antibiotics'
    }
];

export default mrlSeedData;
