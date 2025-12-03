// Mobile/src/screens/farmer/FeedAdminScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const FeedAdminScreen = () => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.iconContainer}>
                <Ionicons name="clipboard" size={64} color={theme.border} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Feed Administration</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>Track feed administration</Text>
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

export default FeedAdminScreen;
