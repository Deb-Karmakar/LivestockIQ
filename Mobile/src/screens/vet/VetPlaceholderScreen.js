import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';

const VetPlaceholderScreen = ({ route }) => {
    const { t } = useLanguage();
    const { title } = route.params || { title: t('screen') };

    return (
        <View style={styles.container}>
            <Ionicons name="construct-outline" size={64} color="#9ca3af" />
            <Text style={styles.text}>{title} {t('coming_soon')}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
    },
    text: {
        marginTop: 16,
        fontSize: 18,
        color: '#4b5563',
        fontWeight: '600',
    },
});

export default VetPlaceholderScreen;
