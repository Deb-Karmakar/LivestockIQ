import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { createVetVisitRequest } from '../services/vetVisitService';

const VetVisitRequestModal = ({ visible, onClose, animal, onSuccess }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const [reason, setReason] = useState('General Health Checkup');
    const [notes, setNotes] = useState('');
    const [urgency, setUrgency] = useState('Normal');
    const [loading, setLoading] = useState(false);
    const [showReasonPicker, setShowReasonPicker] = useState(false);

    const reasons = [
        'General Health Checkup',
        'Animal appears sick',
        'Vaccination required',
        'Pregnancy check',
        'Injury treatment',
        'Not eating properly',
        'Respiratory issues',
        'Skin condition',
        'Other',
    ];

    const urgencyLevels = ['Normal', 'Urgent', 'Emergency'];

    useEffect(() => {
        if (visible) {
            setReason('General Health Checkup');
            setNotes('');
            setUrgency('Normal');
        }
    }, [visible]);

    const handleSubmit = async () => {
        if (!reason) {
            Alert.alert(t('error'), 'Please select a reason');
            return;
        }

        try {
            setLoading(true);
            await createVetVisitRequest({
                animalId: animal.tagId,
                reason,
                notes,
                urgency,
            });
            Alert.alert(t('success'), 'Vet visit request submitted successfully');
            onSuccess();
            onClose();
        } catch (error) {
            Alert.alert(t('error'), 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                        <View style={styles.headerTitleContainer}>
                            <View style={[styles.iconContainer, { backgroundColor: theme.primary }]}>
                                <Ionicons name="medkit" size={20} color="#fff" />
                            </View>
                            <View>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>Request Vet Visit</Text>
                                <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>
                                    For {animal?.tagId}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.formContainer}>
                        {/* Reason Selection */}
                        <Text style={[styles.label, { color: theme.text }]}>Reason for Visit *</Text>
                        <TouchableOpacity
                            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                            onPress={() => setShowReasonPicker(!showReasonPicker)}
                        >
                            <Text style={{ color: theme.text }}>{reason}</Text>
                            <Ionicons name="chevron-down" size={20} color={theme.subtext} />
                        </TouchableOpacity>

                        {showReasonPicker && (
                            <View style={[styles.pickerContainer, { borderColor: theme.border }]}>
                                {reasons.map((r) => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[
                                            styles.pickerItem,
                                            reason === r && { backgroundColor: `${theme.primary}20` }
                                        ]}
                                        onPress={() => {
                                            setReason(r);
                                            setShowReasonPicker(false);
                                        }}
                                    >
                                        <Text style={{ color: theme.text }}>{r}</Text>
                                        {reason === r && <Ionicons name="checkmark" size={16} color={theme.primary} />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Notes */}
                        <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Additional Notes</Text>
                        <TextInput
                            style={[styles.textArea, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Describe symptoms..."
                            placeholderTextColor={theme.subtext}
                            multiline
                            numberOfLines={3}
                        />

                        {/* Urgency */}
                        <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Urgency Level</Text>
                        <View style={styles.urgencyContainer}>
                            {urgencyLevels.map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[
                                        styles.urgencyButton,
                                        { borderColor: theme.border },
                                        urgency === level && {
                                            backgroundColor: level === 'Emergency' ? '#dc2626' :
                                                level === 'Urgent' ? '#f97316' :
                                                    theme.primary,
                                            borderColor: 'transparent'
                                        }
                                    ]}
                                    onPress={() => setUrgency(level)}
                                >
                                    <Text style={[
                                        styles.urgencyText,
                                        { color: theme.subtext },
                                        urgency === level && { color: '#fff', fontWeight: 'bold' }
                                    ]}>
                                        {level}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={[styles.urgencyHelp, { color: theme.subtext }]}>
                            {urgency === 'Emergency' && '⚠️ Vet will be notified immediately'}
                            {urgency === 'Urgent' && 'Priority request'}
                            {urgency === 'Normal' && 'Standard scheduling'}
                        </Text>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: theme.primary }]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Submit Request</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalSubtitle: {
        fontSize: 14,
    },
    formContainer: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 12,
        marginTop: 8,
        overflow: 'hidden',
    },
    pickerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        textAlignVertical: 'top',
        height: 80,
    },
    urgencyContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    urgencyButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
    },
    urgencyText: {
        fontSize: 13,
    },
    urgencyHelp: {
        fontSize: 12,
        marginTop: 8,
        marginBottom: 20,
    },
    submitButton: {
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default VetVisitRequestModal;
