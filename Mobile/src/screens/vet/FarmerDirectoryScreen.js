// Mobile/src/screens/vet/FarmerDirectoryScreen.js
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FarmerDirectoryScreen = () => {
    // This is a placeholder screen - you'll implement full functionality later
    const demoFarmers = [
        { id: '1', name: 'Ram Kumar', farm: 'Green Valley Farm', animals: 45 },
        { id: '2', name: 'Sita Patel', farm: 'Sunrise Dairy', animals: 32 },
    ];

    const renderFarmer = ({ item }) => (
        <TouchableOpacity style={styles.farmerCard}>
            <View style={styles.avatar}>
                <Ionicons name="person" size={30} color="#10b981" />
            </View>
            <View style={styles.farmerInfo}>
                <Text style={styles.farmerName}>{item.name}</Text>
                <Text style={styles.farmName}>{item.farm}</Text>
                <Text style={styles.animalCount}>{item.animals} animals</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>      <View style={styles.header}>
            <Text style={styles.title}>Farmer Directory</Text>
        </View>
            <FlatList
                data={demoFarmers}
                keyExtractor={(item) => item.id}
                renderItem={renderFarmer}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    header: { backgroundColor: '#fff', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
    list: { padding: 15 },
    farmerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    farmerInfo: { flex: 1 },
    farmerName: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
    farmName: { fontSize: 14, color: '#6b7280', marginBottom: 2 },
    animalCount: { fontSize: 12, color: '#10b981' },
});

export default FarmerDirectoryScreen;
