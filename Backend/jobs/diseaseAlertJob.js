// backend/jobs/diseaseAlertJob.js

import cron from 'node-cron';
import axios from 'axios';
import Farmer from '../models/farmer.model.js';
import DiseaseAlert from '../models/diseaseAlert.model.js';

// Helper function to count periods based on a condition
const countPeriods = (forecast, condition) => {
    return forecast.list.filter(condition).length;
};

// --- Disease Rules Engine ---
// We can add more complex rules here in the future
const checkWeatherForDiseaseRisk = (forecast) => {
    // Helper function to count periods
    const countPeriods = (condition) => {
        return forecast.list.filter(condition).length;
    };

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

    const rainyPeriods = countPeriods(p => p.weather && p.weather.some(w => w.main.toLowerCase().includes('rain')));
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
    const lsdRisk = countPeriods(p => p.main.humidity > 70 && p.weather && p.weather.some(w => w.main.toLowerCase().includes('rain')));
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
    const anthraxRisk = countPeriods(p => p.weather && p.weather.some(w => w.main.toLowerCase().includes('rain')));
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
    const enterotoxaemiaRisk = countPeriods(p => p.weather && p.weather.some(w => w.main.toLowerCase().includes('rain')));
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
    const mastitisRisk = countPeriods(p => p.main.humidity > 75 && p.weather && p.weather.some(w => w.main.toLowerCase().includes('rain')));
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
        // Check if API key exists
        const API_KEY = process.env.OPENWEATHER_API_KEY;
        if (!API_KEY) {
            console.error('OpenWeather API key is missing from environment variables');
            return;
        }

        // 1. Get all unique farm locations
        const uniqueLocations = await Farmer.distinct('location', { 
            'location.latitude': { $exists: true, $ne: null },
            'location.longitude': { $exists: true, $ne: null }
        });

        console.log(`Found ${uniqueLocations.length} unique locations to check`);

        if (uniqueLocations.length === 0) {
            console.log('No farmers with valid location data found');
            return;
        }

        for (const location of uniqueLocations) {
            try {
                const { latitude, longitude } = location;
                
                // Validate coordinates
                if (!latitude || !longitude || 
                    isNaN(latitude) || isNaN(longitude) ||
                    latitude < -90 || latitude > 90 ||
                    longitude < -180 || longitude > 180) {
                    console.log(`Invalid coordinates: lat=${latitude}, lon=${longitude}, skipping...`);
                    continue;
                }

                console.log(`Checking weather for location: ${latitude}, ${longitude}`);
                
                const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;

                // 2. Fetch weather forecast for each location
                const response = await axios.get(url, {
                    timeout: 10000, // 10 second timeout
                    headers: {
                        'User-Agent': 'LivestockIQ-Disease-Prediction/1.0'
                    }
                });
                
                const forecast = response.data;
                
                // Validate forecast data
                if (!forecast || !forecast.list || !Array.isArray(forecast.list)) {
                    console.log(`Invalid forecast data received for location ${latitude}, ${longitude}`);
                    continue;
                }

                console.log(`Received ${forecast.list.length} forecast periods for location ${latitude}, ${longitude}`);
                
                // 3. Check forecast against our rules
                const risk = checkWeatherForDiseaseRisk(forecast);

                if (risk) {
                    console.log(`Disease risk detected: ${risk.diseaseName} (${risk.riskLevel}) for location ${latitude}, ${longitude}`);
                    
                    // 4. If risk is found, find all farmers in that location and create alerts
                    const farmersInRegion = await Farmer.find({ 
                        'location.latitude': latitude, 
                        'location.longitude': longitude 
                    });
                    
                    console.log(`Found ${farmersInRegion.length} farmers in this region`);
                    
                    for (const farmer of farmersInRegion) {
                        try {
                            // Check if a similar alert already exists
                            const existingAlert = await DiseaseAlert.findOne({ 
                                farmerId: farmer._id, 
                                diseaseName: risk.diseaseName, 
                                status: 'New' 
                            });
                            
                            if (!existingAlert) {
                                await DiseaseAlert.create({
                                    farmerId: farmer._id,
                                    ...risk
                                });
                                console.log(`✅ Disease alert for ${risk.diseaseName} created for farmer ${farmer._id}`);
                            } else {
                                console.log(`Alert for ${risk.diseaseName} already exists for farmer ${farmer._id}`);
                            }
                        } catch (alertError) {
                            console.error(`Error creating alert for farmer ${farmer._id}:`, alertError.message);
                        }
                    }
                } else {
                    console.log(`No disease risk detected for location ${latitude}, ${longitude}`);
                }

                // Add a small delay between API calls to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (locationError) {
                if (locationError.response) {
                    console.error(`API Error for location ${location.latitude}, ${location.longitude}:`, {
                        status: locationError.response.status,
                        statusText: locationError.response.statusText,
                        data: locationError.response.data
                    });
                } else if (locationError.request) {
                    console.error(`Network Error for location ${location.latitude}, ${location.longitude}:`, locationError.message);
                } else {
                    console.error(`Error for location ${location.latitude}, ${location.longitude}:`, locationError.message);
                }
                continue; // Continue with next location
            }
        }
    } catch (error) {
        console.error('Error during disease prediction job:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
    console.log('Daily disease prediction job finished.');
};

export const startDiseasePredictionJob = () => {
    // Schedule to run once a day at 1 AM
    cron.schedule('0 1 * * *', runDiseasePrediction);
    console.log('✅ Disease prediction job has been scheduled to run every night at 1:00 AM.');
};