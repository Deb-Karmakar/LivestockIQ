// backend/jobs/diseaseAlertJob.js

import cron from 'node-cron';
import axios from 'axios';
import Farmer from '../models/farmer.model.js';
import DiseaseAlert from '../models/diseaseAlert.model.js';

// --- Disease Rules Engine ---
// We can add more complex rules here in the future
const checkWeatherForDiseaseRisk = (forecast) => {
    // Rule for Haemorrhagic Septicaemia (HS), common in India during humid/rainy seasons
    const highHumidityDays = forecast.list.filter(period => {
        const forecastDate = new Date(period.dt * 1000);
        // Check for high humidity in the next 3 days
        return forecastDate < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) && period.main.humidity > 80;
    }).length;

    // If there are more than 4 periods (i.e., 12 hours) of high humidity in the next 3 days
    if (highHumidityDays > 4) {
        return {
            diseaseName: 'Haemorrhagic Septicaemia (HS)',
            riskLevel: 'High',
            message: 'High humidity forecasted for your area, increasing the risk of Haemorrhagic Septicaemia (HS).',
            preventiveMeasures: [
                'Ensure animals are vaccinated against HS.',
                'Avoid wallowing in stagnant water.',
                'Keep feed and water sources clean.'
            ]
        };
    }
    const highTempAndHumidityPeriods = forecast.list.filter(p => p.main.humidity > 70 && p.main.temp > 28);
    if (highTempAndHumidityPeriods.length > 4) {
        return {
            diseaseName: 'Foot and Mouth Disease (FMD)',
            riskLevel: 'Moderate',
            message: 'High temperature and humidity forecasted, increasing the risk of FMD.',
            preventiveMeasures: [
                'Ensure strict biosecurity measures.',
                'Disinfect farm equipment regularly.',
                'Monitor animals for signs of lameness or blisters.'
            ]
        };
    }
    const rainyPeriods = countPeriods(p => p.weather.some(w => w.main.toLowerCase().includes('rain')));
    if (rainyPeriods > 3) {
        return {
            diseaseName: 'Black Quarter (BQ)',
            riskLevel: 'High',
            message: 'Rainy and humid conditions detected, increasing BQ risk in grazing animals.',
            preventiveMeasures: [
                'Vaccinate animals in endemic areas.',
                'Avoid grazing in muddy or waterlogged fields.',
                'Dispose of carcasses properly to prevent soil contamination.'
            ]
        };
    }

    // Rule 4: Heat Stress
    const heatStressPeriods = countPeriods(p => p.main.temp > 35 && p.main.humidity > 60);
    if (heatStressPeriods > 3) {
        return {
            diseaseName: 'Heat Stress Disorders',
            riskLevel: 'Moderate',
            message: 'High temperature and humidity may cause heat stress in livestock.',
            preventiveMeasures: [
                'Provide shade and cooling (fans/sprinklers).',
                'Ensure constant supply of clean water.',
                'Avoid overstocking in sheds.'
            ]
        };
    }

    // Rule 5: Bluetongue
    const bluetongueRisk = countPeriods(p => p.main.humidity > 75 && p.main.temp > 20);
    if (bluetongueRisk > 3) {
        return {
            diseaseName: 'Bluetongue Disease',
            riskLevel: 'High',
            message: 'Warm and humid conditions favor biting midges, increasing Bluetongue risk.',
            preventiveMeasures: [
                'House animals during dusk/dawn when midges are active.',
                'Use insect repellents or nets.',
                'Vaccinate sheep in endemic areas.'
            ]
        };
    }

    // Rule 6: Lumpy Skin Disease (LSD)
    const lsdRisk = countPeriods(p => p.main.humidity > 70 && p.weather.some(w => w.main.toLowerCase().includes('rain')));
    if (lsdRisk > 2) {
        return {
            diseaseName: 'Lumpy Skin Disease (LSD)',
            riskLevel: 'Moderate',
            message: 'Rainy and humid weather may increase fly/mosquito populations, raising LSD risk.',
            preventiveMeasures: [
                'Vaccinate cattle if available in the region.',
                'Control flies and mosquitoes around sheds.',
                'Isolate affected animals immediately.'
            ]
        };
    }

    // Rule 7: Tick-borne diseases (Theileriosis, Babesiosis)
    const tickRisk = countPeriods(p => p.main.temp > 25 && p.main.humidity > 65);
    if (tickRisk > 4) {
        return {
            diseaseName: 'Tick-borne Diseases (Theileriosis, Babesiosis)',
            riskLevel: 'Moderate',
            message: 'Warm and humid conditions can increase tick populations, raising disease risk.',
            preventiveMeasures: [
                'Regular tick control with acaricides.',
                'Rotate pastures to reduce tick load.',
                'Check animals frequently for ticks.'
            ]
        };
    }

    // Rule 8: Anthrax
    const anthraxRisk = countPeriods(p => p.weather.some(w => w.main.toLowerCase().includes('rain')));
    if (anthraxRisk > 2) {
        return {
            diseaseName: 'Anthrax',
            riskLevel: 'High',
            message: 'Heavy rainfall may expose anthrax spores in soil, increasing risk.',
            preventiveMeasures: [
                'Vaccinate in endemic zones.',
                'Do not graze animals on marshy or flood-prone lands.',
                'Dispose of dead animals safely by burning or deep burial.'
            ]
        };
    }

    // Rule 9: Enterotoxaemia
    const enterotoxaemiaRisk = countPeriods(p => p.weather.some(w => w.main.toLowerCase().includes('rain')));
    if (enterotoxaemiaRisk > 3) {
        return {
            diseaseName: 'Enterotoxaemia (ET)',
            riskLevel: 'Moderate',
            message: 'Sudden rainfall may cause lush pasture growth, raising risk of ET in sheep/goats.',
            preventiveMeasures: [
                'Vaccinate susceptible animals.',
                'Avoid sudden shift to lush grazing.',
                'Provide balanced diet and controlled grazing.'
            ]
        };
    }

    // Rule 10: Mastitis
    const mastitisRisk = countPeriods(p => p.main.humidity > 75 && p.weather.some(w => w.main.toLowerCase().includes('rain')));
    if (mastitisRisk > 3) {
        return {
            diseaseName: 'Mastitis',
            riskLevel: 'High',
            message: 'High humidity and damp conditions increase mastitis risk in dairy cattle.',
            preventiveMeasures: [
                'Maintain proper milking hygiene.',
                'Keep bedding dry and clean.',
                'Use teat dips after milking.'
            ]
        };
    }
    return null; // No risk detected
};

export const runDiseasePrediction = async () => {
    console.log('Starting daily disease prediction job...');
    try {
        // 1. Get all unique farm locations
        const uniqueLocations = await Farmer.distinct('location', { 
            'location.latitude': { $exists: true, $ne: null }
        });

        for (const location of uniqueLocations) {
            const { latitude, longitude } = location;
            const API_KEY = process.env.OPENWEATHER_API_KEY;
            const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;

            // 2. Fetch weather forecast for each location
            const response = await axios.get(url);
            const forecast = response.data;
            
            // 3. Check forecast against our rules
            const risk = checkWeatherForDiseaseRisk(forecast);

            if (risk) {
                // 4. If risk is found, find all farmers in that location and create alerts
                const farmersInRegion = await Farmer.find({ 'location.latitude': latitude, 'location.longitude': longitude });
                for (const farmer of farmersInRegion) {
                    // Check if a similar alert already exists
                    const existingAlert = await DiseaseAlert.findOne({ farmerId: farmer._id, diseaseName: risk.diseaseName, status: 'New' });
                    if (!existingAlert) {
                        await DiseaseAlert.create({
                            farmerId: farmer._id,
                            ...risk
                        });
                        console.log(`Disease alert for ${risk.diseaseName} created for farmer ${farmer._id}`);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error during disease prediction job:', error.message);
    }
    console.log('Daily disease prediction job finished.');
};

export const startDiseasePredictionJob = () => {
    // Schedule to run once a day at 1 AM
    cron.schedule('0 1 * * *', runDiseasePrediction);
    console.log('✅ Disease prediction job has been scheduled to run every night at 1:00 AM.');
};