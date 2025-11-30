import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAnimalHealthTip } from '../services/aiService';

const AIHealthTipModal = ({ visible, animal, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [tip, setTip] = useState('');

    useEffect(() => {
        if (visible && animal) {
            fetchTip();
        }
    }, [visible, animal]);

    const fetchTip = async () => {
        setLoading(true);
        try {
            const data = await getAnimalHealthTip(animal._id);
            setTip(data.tip);
        } catch (error) {
            setTip('Sorry, I was unable to generate a health tip at this time. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="sparkles" size={24} color="#10b981" />
                        </View>
                        <Text style={styles.title}>AI Health Tip</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#10b981" />
                            <Text style={styles.loadingText}>Analyzing animal health...</Text>
                        </View>
                    ) : (
                        <View style={styles.tipContainer}>
                            <Text style={styles.animalInfo}>
                                For: {animal?.name || animal?.tagId}
                            </Text>
                            <Text style={styles.tipText}>{tip}</Text>
                        </View>
                    )}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#10b98120',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginLeft: 12,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
    },
    tipContainer: {
        paddingVertical: 10,
    },
    animalInfo: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 12,
    },
    tipText: {
        fontSize: 15,
        color: '#1f2937',
        lineHeight: 22,
    },
    closeButton: {
        backgroundColor: '#10b981',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginTop: 20,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AIHealthTipModal;