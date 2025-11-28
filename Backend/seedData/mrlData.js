/**
 * Seed data for MRL (Maximum Residue Limits) thresholds
 * Based on FSSAI and Codex Alimentarius standards for India
 */

const mrlSeedData = [
    // ANTIBIOTICS - TETRACYCLINES
    {
        drugName: 'Oxytetracycline',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 7,
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
        regulatoryAuthority: 'Codex Alimentarius'
    },
    {
        drugName: 'Tetracycline',
        species: 'Poultry',
        productType: 'Meat',
        mrlLimit: 200,
        unit: 'µg/kg',
        withdrawalPeriodDays: 10,
        regulatoryAuthority: 'FSSAI'
    },

    // ANTIBIOTICS - PENICILLINS
    {
        drugName: 'Penicillin',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 4,
        unit: 'µg/kg',
        withdrawalPeriodDays: 4,
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
        regulatoryAuthority: 'FSSAI'
    },
    {
        drugName: 'Amoxicillin',
        species: 'Cattle',
        productType: 'Meat',
        mrlLimit: 50,
        unit: 'µg/kg',
        withdrawalPeriodDays: 7,
        regulatoryAuthority: 'FSSAI'
    },

    // ANTIBIOTICS - SULFONAMIDES
    {
        drugName: 'Sulfamethazine',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 5,
        regulatoryAuthority: 'FSSAI'
    },
    {
        drugName: 'Sulfamethazine',
        species: 'Pig',
        productType: 'Meat',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 15,
        regulatoryAuthority: 'FSSAI'
    },

    // ANTIBIOTICS - QUINOLONES
    {
        drugName: 'Enrofloxacin',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 5,
        regulatoryAuthority: 'FSSAI',
        notes: 'Fluoroquinolone - restricted use'
    },
    {
        drugName: 'Enrofloxacin',
        species: 'Poultry',
        productType: 'Meat',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 10,
        regulatoryAuthority: 'FSSAI'
    },

    // ANTIBIOTICS - MACROLIDES
    {
        drugName: 'Tylosin',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 50,
        unit: 'µg/kg',
        withdrawalPeriodDays: 4,
        regulatoryAuthority: 'FSSAI'
    },
    {
        drugName: 'Tylosin',
        species: 'Pig',
        productType: 'Meat',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 14,
        regulatoryAuthority: 'FSSAI'
    },

    // ANTIBIOTICS - AMINOGLYCOSIDES
    {
        drugName: 'Gentamicin',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 7,
        regulatoryAuthority: 'FSSAI'
    },
    {
        drugName: 'Streptomycin',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 200,
        unit: 'µg/kg',
        withdrawalPeriodDays: 7,
        regulatoryAuthority: 'FSSAI'
    },

    // ANTIPARASITICS - AVERMECTINS
    {
        drugName: 'Ivermectin',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 10,
        unit: 'µg/kg',
        withdrawalPeriodDays: 28,
        regulatoryAuthority: 'FSSAI',
        notes: 'Long withdrawal period required'
    },
    {
        drugName: 'Ivermectin',
        species: 'Cattle',
        productType: 'Meat',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 35,
        regulatoryAuthority: 'FSSAI'
    },
    {
        drugName: 'Doramectin',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 50,
        unit: 'µg/kg',
        withdrawalPeriodDays: 28,
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
        regulatoryAuthority: 'FSSAI'
    },
    {
        drugName: 'Fenbendazole',
        species: 'Cattle',
        productType: 'Meat',
        mrlLimit: 100,
        unit: 'µg/kg',
        withdrawalPeriodDays: 14,
        regulatoryAuthority: 'FSSAI'
    },

    // HORMONES
    {
        drugName: 'Oxytocin',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 0,
        unit: 'µg/kg',
        withdrawalPeriodDays: 1,
        regulatoryAuthority: 'FSSAI',
        notes: 'Zero tolerance - use strictly controlled'
    },

    // ANTI-INFLAMMATORIES
    {
        drugName: 'Meloxicam',
        species: 'Cattle',
        productType: 'Milk',
        mrlLimit: 15,
        unit: 'µg/kg',
        withdrawalPeriodDays: 5,
        regulatoryAuthority: 'EU'
    },
    {
        drugName: 'Meloxicam',
        species: 'Cattle',
        productType: 'Meat',
        mrlLimit: 20,
        unit: 'µg/kg',
        withdrawalPeriodDays: 15,
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
        regulatoryAuthority: 'Custom',
        notes: 'Default conservative limit for unspecified antibiotics'
    }
];

export default mrlSeedData;
