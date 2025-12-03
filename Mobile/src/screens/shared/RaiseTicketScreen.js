// Mobile/src/screens/shared/RaiseTicketScreen.js
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
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

const RaiseTicketScreen = () => {
    const { t } = useLanguage();
    const { theme } = useTheme();
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

    const getCategoryLabel = (category) => {
        switch (category) {
            case 'Technical Issue': return t('technical_issue');
            case 'Account Problem': return t('account_problem');
            case 'Feature Request': return t('feature_request');
            case 'Bug Report': return t('bug_report');
            case 'General Inquiry': return t('general_inquiry');
            case 'Other': return t('other');
            default: return category;
        }
    };

    const getPriorityLabel = (priority) => {
        switch (priority) {
            case 'Low': return t('low');
            case 'Medium': return t('medium');
            case 'High': return t('high');
            case 'Urgent': return t('urgent');
            default: return priority;
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validate = () => {
        if (!formData.subject.trim()) {
            Alert.alert(t('validation_error'), t('subject_required'));
            return false;
        }
        if (!formData.category) {
            Alert.alert(t('validation_error'), t('select_category'));
            return false;
        }
        if (!formData.description.trim()) {
            Alert.alert(t('validation_error'), t('description_required'));
            return false;
        }
        if (formData.description.trim().length < 20) {
            Alert.alert(t('validation_error'), t('description_min_length'));
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
                t('success'),
                `${t('ticket_created_success')}\nTicket ID: ${response.ticket.ticketId}`,
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
            Alert.alert(t('error'), error.response?.data?.message || t('failed_create_ticket'));
        } finally {
            setLoading(false);
        }
    };

    const renderDropdown = (label, options, selectedValue, field) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>{label} <Text style={styles.required}>*</Text></Text>
            <View style={styles.pillsContainer}>
                {options.map((option) => (
                    <TouchableOpacity
                        key={option}
                        style={[
                            styles.pill,
                            { backgroundColor: theme.background, borderColor: theme.border },
                            selectedValue === option && { backgroundColor: theme.primary + '20', borderColor: theme.primary },
                            field === 'priority' && selectedValue === option && getPriorityStyle(option)
                        ]}
                        onPress={() => handleChange(field, option)}
                    >
                        <Text style={[
                            styles.pillText,
                            { color: theme.subtext },
                            selectedValue === option && { color: theme.primary, fontWeight: '600' }
                        ]}>
                            {field === 'category' ? getCategoryLabel(option) : getPriorityLabel(option)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'Low': return { backgroundColor: theme.info + '20', borderColor: theme.info };
            case 'Medium': return { backgroundColor: theme.warning + '20', borderColor: theme.warning };
            case 'High': return { backgroundColor: theme.error + '20', borderColor: theme.error };
            case 'Urgent': return { backgroundColor: theme.error + '40', borderColor: theme.error };
            default: return {};
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <LinearGradient
                colors={[theme.primary, theme.secondary || theme.primary]}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <View style={styles.headerTopRow}>
                            <Ionicons name="help-circle" size={16} color="#60a5fa" />
                            <Text style={styles.headerLabel}>{t('support_center')}</Text>
                        </View>
                        <Text style={styles.headerTitle}>{t('raise_ticket')}</Text>
                        <Text style={styles.headerSubtitle}>
                            {t('raise_ticket_subtitle')}
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
                <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>{t('subject')} <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                            placeholder={t('subject_placeholder')}
                            placeholderTextColor={theme.subtext}
                            value={formData.subject}
                            onChangeText={(text) => handleChange('subject', text)}
                            maxLength={100}
                        />
                    </View>

                    {renderDropdown(t('category'), categories, formData.category, 'category')}
                    {renderDropdown(t('priority'), priorities, formData.priority, 'priority')}

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.text }]}>{t('description_label')} <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                            placeholder={t('description_placeholder')}
                            placeholderTextColor={theme.subtext}
                            value={formData.description}
                            onChangeText={(text) => handleChange('description', text)}
                            multiline
                            textAlignVertical="top"
                            numberOfLines={6}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: theme.primary }, loading && styles.disabledBtn]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="send" size={20} color="#fff" />
                                <Text style={styles.submitBtnText}>{t('submit_ticket')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
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
    card: { borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    required: { color: '#ef4444' },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15 },
    textArea: { height: 120 },
    pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    pillText: { fontSize: 13 },
    submitBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12, gap: 8, marginTop: 8 },
    disabledBtn: { opacity: 0.7 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default RaiseTicketScreen;
