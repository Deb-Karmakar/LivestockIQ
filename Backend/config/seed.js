// backend/config/seed.js

import Admin from '../models/admin.model.js';

const seedAdminUser = async () => {
    try {
        const adminEmail = 'admin@livestockiq.com';

        // Check if the admin user already exists
        const adminExists = await Admin.findOne({ email: adminEmail });

        if (!adminExists) {
            // If not, create the admin user
            await Admin.create({
                fullName: 'Default Admin',
                email: adminEmail,
                password: '123', // The password will be automatically hashed by the model
            });
            console.log('Default admin user created successfully.');
        } else {
            console.log('Default admin user already exists.');
        }
    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

export default seedAdminUser;