// Fixed getDemographicsData function for regulator.controller.js

export const getDemographicsData = async (req, res) => {
    try {
        const [
            herdCompositionRaw,
            ageDistributionRaw,
            speciesGenderRaw
        ] = await Promise.all([
            // Group animals by species
            Animal.aggregate([
                { $group: { _id: '$species', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            // Group animals into age buckets
            Animal.aggregate([
                { $project: { age: { $divide: [{ $subtract: [new Date(), '$dob'] }, (365 * 24 * 60 * 60 * 1000)] } } },
                { $bucket: { groupBy: "$age", boundaries: [0, 1, 3, 5, 10, Infinity], default: "Unknown", output: { "count": { $sum: 1 } } } }
            ]),
            // Group animals by both species and gender
            Animal.aggregate([
                { $match: { species: { $ne: null }, gender: { $ne: null } } },
                { $group: { _id: { species: '$species', gender: '$gender' }, count: { $sum: 1 } } }
            ])
        ]);

        const herdComposition = herdCompositionRaw.map(item => ({
            name: item._id,
            value: item.count
        }));

        const ageLabels = ['0-1 Years', '1-3 Years', '3-5 Years', '5-10 Years', '10+ Years'];
        const ageDistribution = ageDistributionRaw.map((bucket, index) => ({
            name: ageLabels[index] || 'Unknown',
            count: bucket.count
        }));

        const speciesGenderMap = {};
        speciesGenderRaw.forEach(item => {
            const { species, gender } = item._id;
            const count = item.count;

            if (!speciesGenderMap[species]) {
                speciesGenderMap[species] = { species: species, total: 0, Male: 0, Female: 0 };
            }

            speciesGenderMap[species].total += count;
            if (gender === 'Male' || gender === 'Female') {
                speciesGenderMap[species][gender] += count;
            }
        });
        const speciesGenderBreakdown = Object.values(speciesGenderMap).sort((a, b) => b.total - a.total);

        res.json({ herdComposition, ageDistribution, speciesGenderBreakdown });

    } catch (error) {
        console.error("Error in getDemographicsData:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};
