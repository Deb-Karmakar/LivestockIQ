import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const VetPlaceholderScreen = ({ route }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>{route.name} Screen</Text>
            <Text style={styles.subText}>Coming Soon</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
    text: { fontSize: 24, fontWeight: 'bold', color: '#374151' },
    subText: { fontSize: 16, color: '#6b7280', marginTop: 8 },
});

export default VetPlaceholderScreen;
