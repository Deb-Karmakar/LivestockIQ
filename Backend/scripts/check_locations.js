import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import connectDB from '../config/db.js';
import Farmer from '../models/farmer.model.js';
import Veterinarian from '../models/vet.model.js';

dotenv.config();

const checkLocations = async () => {
    try {
        await connectDB();
        let output = '';

        output += '\n--- Checking Farmers ---\n';
        const farmers = await Farmer.find({});
        output += `Total Farmers: ${farmers.length}\n`;
        farmers.forEach(f => {
            const loc = f.location || {};
            output += `FARMER: ${f.farmName} | Lat: ${loc.latitude} | Lng: ${loc.longitude}\n`;
        });

        output += '\n--- Checking Veterinarians ---\n';
        const vets = await Veterinarian.find({});
        output += `Total Vets: ${vets.length}\n`;
        vets.forEach(v => {
            const loc = v.location || {};
            output += `VET: ${v.fullName} | Lat: ${loc.latitude} | Lng: ${loc.longitude}\n`;
        });

        fs.writeFileSync('scripts/locations_dump.txt', output);
        console.log('Dumped to scripts/locations_dump.txt');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkLocations();
