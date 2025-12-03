// Mobile/src/screens/farmer/DrugInventoryScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const DrugInventoryScreen = () => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.iconContainer}>
                <Ionicons name="medkit" size={64} color={theme.border} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Drug Inventory</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>Manage your drug stock</Text>
            <Text style={[styles.comingSoon, { color: theme.primary }]}>Coming Soon</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    iconContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
    },
    comingSoon: {
        fontSize: 12,
        fontWeight: '600',
    },
});

export default DrugInventoryScreen;
