import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createTicket } from '../../services/ticketService';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

const RaiseTicketScreen = () => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        category: '',
        priority: 'Medium',
        description: '',
    });

    const categories = [
        'Technical Issue',
        'Account Problem',
        'Feature Request',
        'Bug Report',
        'General Inquiry',
        'Other',
    ];

    const priorities = ['Low', 'Medium', 'High', 'Urgent'];

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validate = () => {
        if (!formData.subject.trim()) {
            Alert.alert('Validation Error', 'Subject is required');
            return false;
        }
        if (!formData.category) {
            Alert.alert('Validation Error', 'Please select a category');
            return false;
        }
        if (!formData.description.trim()) {
            Alert.alert('Validation Error', 'Description is required');
            return false;
        }
        if (formData.description.trim().length < 20) {
            Alert.alert('Validation Error', 'Description must be at least 20 characters');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const ticketData = {
                ...formData,
                createdByName: user?.fullName || user?.farmOwner || 'Unknown User',
                createdByRole: user?.role || 'User'
            };
            const response = await createTicket(ticketData);
            Alert.alert(
                'Success',
                `Ticket Created Successfully!\nTicket ID: ${response.ticket.ticketId}`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setFormData({
                                subject: '',
                                category: '',
                                priority: 'Medium',
                                description: '',
                            });
                            navigation.goBack();
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error creating ticket:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to create ticket');
        } finally {
            setLoading(false);
        }
    };

    const renderDropdown = (label, options, selectedValue, field) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label} <Text style={styles.required}>*</Text></Text>
            <View style={styles.pillsContainer}>
                {options.map((option) => (
                    <TouchableOpacity
                        key={option}
                        style={[
                            styles.pill,
                            selectedValue === option && styles.activePill,
                            field === 'priority' && selectedValue === option && getPriorityStyle(option)
                        ]}
                        onPress={() => handleChange(field, option)}
                    >
                        <Text style={[
                            styles.pillText,
                            selectedValue === option && styles.activePillText
                        ]}>
                            {option}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'Low': return { backgroundColor: '#dbeafe', borderColor: '#3b82f6' };
            case 'Medium': return { backgroundColor: '#fef3c7', borderColor: '#f59e0b' };
            case 'High': return { backgroundColor: '#fee2e2', borderColor: '#ef4444' };
            case 'Urgent': return { backgroundColor: '#fecaca', borderColor: '#dc2626' };
            default: return {};
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <View style={styles.headerTopRow}>
                            <Ionicons name="help-circle" size={16} color="#60a5fa" />
                            <Text style={styles.headerLabel}>Support Center</Text>
                        </View>
                        <Text style={styles.headerTitle}>Raise a Ticket</Text>
                        <Text style={styles.headerSubtitle}>
                            Submit a support request and we'll help you out.
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.historyBtn}
                        onPress={() => navigation.navigate('TicketHistory')}
                    >
                        <Ionicons name="time-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView style={styles.formContainer} contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Subject <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Brief summary of your issue"
                            value={formData.subject}
                            onChangeText={(text) => handleChange('subject', text)}
                            maxLength={100}
                        />
                    </View>

                    {renderDropdown('Category', categories, formData.category, 'category')}
                    {renderDropdown('Priority', priorities, formData.priority, 'priority')}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe your issue in detail..."
                            value={formData.description}
                            onChangeText={(text) => handleChange('description', text)}
                            multiline
                            textAlignVertical="top"
                            numberOfLines={6}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, loading && styles.disabledBtn]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="send" size={20} color="#fff" />
                                <Text style={styles.submitBtnText}>Submit Ticket</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    header: { padding: 20, paddingTop: 50, paddingBottom: 24 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { padding: 4 },
    headerTextContainer: { flex: 1, marginLeft: 16 },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    headerLabel: { color: '#60a5fa', fontSize: 14, fontWeight: '600' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    headerSubtitle: { color: '#94a3b8', fontSize: 14 },
    historyBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    formContainer: { flex: 1 },
    scrollContent: { padding: 16 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    required: { color: '#ef4444' },
    input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, fontSize: 15, color: '#1f2937', backgroundColor: '#f9fafb' },
    textArea: { height: 120 },
    pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
    activePill: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
    pillText: { fontSize: 13, color: '#4b5563' },
    activePillText: { color: '#2563eb', fontWeight: '600' },
    submitBtn: { backgroundColor: '#2563eb', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12, gap: 8, marginTop: 8 },
    disabledBtn: { opacity: 0.7 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default RaiseTicketScreen;
