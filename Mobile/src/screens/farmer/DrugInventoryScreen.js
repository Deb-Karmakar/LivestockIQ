// Mobile/src/screens/farmer/DrugInventoryScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DrugInventoryScreen = () => {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name="medkit" size={64} color="#d1d5db" />
            </View>
            <Text style={styles.title}>Drug Inventory</Text>
            <Text style={styles.subtitle}>Manage your drug stock</Text>
            <Text style={styles.comingSoon}>Coming Soon</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        padding: 20,
    },
    iconContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 16,
        textAlign: 'center',
    },
    comingSoon: {
        fontSize: 12,
        color: '#10b981',
        fontWeight: '600',
    },
});

export default DrugInventoryScreen;
