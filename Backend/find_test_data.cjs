const mongoose = require('mongoose');
const User = require('./models/user.model');
const Animal = require('./models/animal.model');
require('dotenv').config();

const findData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const farmer = await User.findOne({ role: 'farmer' });
        const regulator = await User.findOne({ role: 'regulator' });

        if (!farmer) {
            console.log('No farmer found');
            process.exit(1);
        }

        const animal = await Animal.findOne({ farmerId: farmer._id });

        console.log('TEST_DATA:', JSON.stringify({
            farmer: { email: farmer.email, password: 'password123' }, // Assuming default password from seed
            regulator: { email: regulator ? regulator.email : 'regulator@example.com', password: 'password123' },
            animalId: animal ? animal._id : null
        }, null, 2));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

findData();
