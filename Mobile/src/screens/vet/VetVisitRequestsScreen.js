// Mobile/src/screens/vet/VetVisitRequestsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Modal,
    TextInput,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getVetVisitRequests, respondToVetVisitRequest } from '../../services/vetVisitService';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

const VetVisitRequestsScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [respondingTo, setRespondingTo] = useState(null);

    const fetchRequests = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const params = {};
            if (statusFilter !== 'all') params.status = statusFilter;

            const response = await getVetVisitRequests(params);
            setRequests(response.data || []);
        } catch (error) {
            Alert.alert(t('error'), error.response?.data?.message || 'Failed to load visit requests.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [statusFilter, t]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const filteredRequests = requests.filter(req => {
        const matchesSearch = searchTerm === '' ||
            req.animalId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.animalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.farmerId?.farmOwner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.farmerId?.farmName?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const pendingCount = requests.filter(r => r.status === 'Requested').length;
    const acceptedCount = requests.filter(r => r.status === 'Accepted').length;

    const statusFilters = [
        { value: 'all', label: t('filter_all') },
        { value: 'Requested', label: t('filter_pending') },
        { value: 'Accepted', label: t('filter_accepted') },
        { value: 'Completed', label: t('filter_completed') },
        { value: 'Declined', label: t('filter_declined') },
    ];

    const getUrgencyStyle = (urgency) => {
        switch (urgency) {
            case 'Emergency':
                return { backgroundColor: '#ef4444', icon: 'alert-circle' };
            case 'Urgent':
                return { backgroundColor: '#f97316', icon: 'warning' };
            default:
                return { backgroundColor: '#3b82f6', icon: 'time' };
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Requested':
                return { backgroundColor: '#fef3c7', color: '#b45309', borderColor: '#fbbf24' };
            case 'Accepted':
                return { backgroundColor: '#d1fae5', color: '#059669', borderColor: '#10b981' };
            case 'Declined':
                return { backgroundColor: '#f3f4f6', color: '#6b7280', borderColor: '#9ca3af' };
            case 'Completed':
                return { backgroundColor: '#ede9fe', color: '#7c3aed', borderColor: '#8b5cf6' };
            default:
                return { backgroundColor: theme.card, color: theme.text, borderColor: theme.border };
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.subtext }]}>{t('loading_visit_requests')}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: '#0f172a' }]}>
                <View style={styles.headerContent}>
                    <View style={styles.headerBadge}>
                        <Ionicons name="sparkles" size={14} color="#14b8a6" />
                        <Text style={styles.headerBadgeText}>{t('farm_visits')}</Text>
                    </View>
                    <Text style={styles.headerTitle}>{t('visit_requests')}</Text>
                    <Text style={styles.headerSubtitle}>
                        <Text style={styles.pendingText}>{t('pending_count', { count: pendingCount })}</Text> {t('and')}{' '}
                        <Text style={styles.acceptedText}>{t('scheduled_count', { count: acceptedCount })}</Text> {t('visits')}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => fetchRequests(true)} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <View style={[styles.filtersContainer, { backgroundColor: theme.card }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    {statusFilters.map((filter) => (
                        <TouchableOpacity
                            key={filter.value}
                            style={[
                                styles.filterChip,
                                { borderColor: theme.border },
                                statusFilter === filter.value && { backgroundColor: theme.primary, borderColor: theme.primary }
                            ]}
                            onPress={() => setStatusFilter(filter.value)}
                        >
                            <Text style={[
                                styles.filterChipText,
                                { color: theme.text },
                                statusFilter === filter.value && { color: '#fff' }
                            ]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Search */}
                <View style={[styles.searchContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Ionicons name="search" size={18} color={theme.subtext} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder={t('search_farmer_animal')}
                        placeholderTextColor={theme.subtext}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>

                <Text style={[styles.resultsCount, { color: theme.subtext }]}>
                    {t('showing_results', { filtered: filteredRequests.length, total: requests.length })}
                </Text>
            </View>

            {/* Request Cards */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchRequests(true)}
                        colors={[theme.primary]}
                        tintColor={theme.primary}
                    />
                }
            >
                {filteredRequests.length > 0 ? (
                    filteredRequests.map((request) => (
                        <VisitRequestCard
                            key={request._id}
                            request={request}
                            theme={theme}
                            t={t}
                            getUrgencyStyle={getUrgencyStyle}
                            getStatusStyle={getStatusStyle}
                            onRespond={() => setRespondingTo(request)}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIconContainer, { backgroundColor: theme.card }]}>
                            <Ionicons name="medkit-outline" size={48} color={theme.subtext} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('no_visit_requests')}</Text>
                        <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
                            {statusFilter !== 'all'
                                ? t('try_changing_filter')
                                : t('farmers_request_here')}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Respond Modal */}
            <RespondModal
                request={respondingTo}
                isOpen={!!respondingTo}
                onClose={() => setRespondingTo(null)}
                onSuccess={() => {
                    setRespondingTo(null);
                    fetchRequests();
                }}
                theme={theme}
                t={t}
                getUrgencyStyle={getUrgencyStyle}
            />
        </View>
    );
};

// Visit Request Card Component
const VisitRequestCard = ({ request, theme, t, getUrgencyStyle, getStatusStyle, onRespond }) => {
    const isPending = request.status === 'Requested';
    const isAccepted = request.status === 'Accepted';
    const urgencyStyle = getUrgencyStyle(request.urgency);
    const statusStyle = getStatusStyle(request.status);

    const getStatusText = (status) => {
        switch (status) {
            case 'Requested': return t('status_pending');
            case 'Accepted': return t('status_accepted');
            case 'Declined': return t('status_declined');
            case 'Completed': return t('status_completed');
            default: return status;
        }
    };

    const getUrgencyText = (urgency) => {
        switch (urgency) {
            case 'Emergency': return t('urgency_emergency');
            case 'Urgent': return t('urgency_urgent');
            default: return t('urgency_routine');
        }
    };

    return (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
            {/* Card Header */}
            <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                    <View style={[styles.cardIcon, { backgroundColor: '#14b8a620' }]}>
                        <Ionicons name="medkit" size={20} color="#14b8a6" />
                    </View>
                    <View>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>
                            {request.animalName || request.animalId}
                        </Text>
                        <Text style={[styles.cardSubtitle, { color: theme.subtext }]}>
                            {request.animalId}
                        </Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor, borderColor: statusStyle.borderColor }]}>
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>
                        {getStatusText(request.status)}
                    </Text>
                </View>
            </View>

            {/* Farmer Info */}
            <View style={[styles.farmerInfo, { backgroundColor: theme.background }]}>
                <View style={styles.infoRow}>
                    <Ionicons name="person" size={16} color={theme.subtext} />
                    <Text style={[styles.farmerName, { color: theme.text }]}>
                        {request.farmerId?.farmOwner}
                    </Text>
                </View>
                <Text style={[styles.farmName, { color: theme.subtext }]}>
                    {request.farmerId?.farmName}
                </Text>
                {request.farmerId?.phoneNumber && (
                    <TouchableOpacity style={styles.phoneRow}>
                        <Ionicons name="call" size={14} color="#3b82f6" />
                        <Text style={styles.phoneText}>{request.farmerId.phoneNumber}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Reason & Notes */}
            <View style={styles.reasonContainer}>
                <View style={styles.infoRow}>
                    <Ionicons name="warning" size={16} color="#f97316" />
                    <Text style={[styles.reasonText, { color: theme.text }]}>{request.reason}</Text>
                </View>
                {request.notes && (
                    <View style={[styles.notesBox, { backgroundColor: '#eff6ff' }]}>
                        <Text style={styles.notesText}>"{request.notes}"</Text>
                    </View>
                )}
            </View>

            {/* Urgency & Date */}
            <View style={styles.urgencyRow}>
                <View style={[styles.urgencyBadge, { backgroundColor: urgencyStyle.backgroundColor }]}>
                    <Ionicons name={urgencyStyle.icon} size={14} color="#fff" />
                    <Text style={styles.urgencyText}>
                        {request.urgency === 'Emergency' ? '🚨 ' : ''}{getUrgencyText(request.urgency)}
                    </Text>
                </View>
                <View style={styles.dateRow}>
                    <Ionicons name="time" size={14} color={theme.subtext} />
                    <Text style={[styles.dateText, { color: theme.subtext }]}>
                        {format(new Date(request.createdAt), 'MMM d, h:mm a')}
                    </Text>
                </View>
            </View>

            {/* Scheduled Date */}
            {isAccepted && request.scheduledDate && (
                <View style={[styles.scheduledBox, { backgroundColor: '#d1fae5', borderColor: '#10b981' }]}>
                    <Ionicons name="calendar" size={16} color="#059669" />
                    <Text style={styles.scheduledText}>
                        {t('scheduled_label')} {format(new Date(request.scheduledDate), 'PPP')}
                    </Text>
                </View>
            )}

            {/* Action Button */}
            {isPending && (
                <TouchableOpacity style={[styles.respondButton, { backgroundColor: '#14b8a6' }]} onPress={onRespond}>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.respondButtonText}>{t('respond_to_request')}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

// Respond Modal Component
const RespondModal = ({ request, isOpen, onClose, onSuccess, theme, t, getUrgencyStyle }) => {
    const [action, setAction] = useState('accept');
    const [scheduledDate, setScheduledDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [vetNotes, setVetNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAction('accept');
            setScheduledDate(new Date());
            setVetNotes('');
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (action === 'accept' && !scheduledDate) {
            Alert.alert(t('error'), t('select_visit_date'));
            return;
        }

        setIsSubmitting(true);
        try {
            await respondToVetVisitRequest(request._id, {
                action,
                scheduledDate: action === 'accept' ? scheduledDate.toISOString() : undefined,
                vetNotes
            });
            Alert.alert(
                t('success'),
                action === 'accept'
                    ? t('farmer_notified_visit')
                    : t('farmer_notified')
            );
            onSuccess();
        } catch (error) {
            Alert.alert(t('error'), error.response?.data?.message || t('failed_respond'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setScheduledDate(selectedDate);
        }
    };

    if (!request) return null;

    const urgencyStyle = getUrgencyStyle(request.urgency);

    return (
        <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                    {/* Modal Header */}
                    <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                        <View style={styles.modalHeaderLeft}>
                            <View style={[styles.modalIcon, { backgroundColor: '#14b8a6' }]}>
                                <Ionicons name="medkit" size={20} color="#fff" />
                            </View>
                            <View>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>{t('respond_to_visit_request')}</Text>
                                <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>
                                    {t('from_for', { farmer: request?.farmerId?.farmOwner, animal: request?.animalName || request?.animalId })}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {/* Request Details */}
                        <View style={[styles.detailsBox, { backgroundColor: theme.background }]}>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('reason_label')}</Text>
                                <Text style={[styles.detailValue, { color: theme.text }]}>{request.reason}</Text>
                            </View>
                            {request.notes && (
                                <View style={styles.detailNotes}>
                                    <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('notes_label')}</Text>
                                    <Text style={[styles.detailNotesText, { color: theme.text }]}>"{request.notes}"</Text>
                                </View>
                            )}
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: theme.subtext }]}>{t('urgency_label')}</Text>
                                <View style={[styles.urgencyBadge, { backgroundColor: urgencyStyle.backgroundColor }]}>
                                    <Text style={styles.urgencyText}>{request.urgency}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Action Selection */}
                        <Text style={[styles.sectionLabel, { color: theme.text }]}>{t('your_response')}</Text>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    action === 'accept'
                                        ? { backgroundColor: '#059669' }
                                        : { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }
                                ]}
                                onPress={() => setAction('accept')}
                            >
                                <Ionicons
                                    name="checkmark-circle"
                                    size={18}
                                    color={action === 'accept' ? '#fff' : theme.text}
                                />
                                <Text style={[styles.actionButtonText, { color: action === 'accept' ? '#fff' : theme.text }]}>
                                    {t('action_accept')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    action === 'decline'
                                        ? { backgroundColor: '#dc2626' }
                                        : { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }
                                ]}
                                onPress={() => setAction('decline')}
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={18}
                                    color={action === 'decline' ? '#fff' : theme.text}
                                />
                                <Text style={[styles.actionButtonText, { color: action === 'decline' ? '#fff' : theme.text }]}>
                                    {t('action_decline')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Scheduled Date (if accepting) */}
                        {action === 'accept' && (
                            <View style={styles.dateSection}>
                                <Text style={[styles.sectionLabel, { color: theme.text }]}>
                                    {t('visit_date')} <Text style={{ color: '#ef4444' }}>{t('required')}</Text>
                                </Text>
                                <TouchableOpacity
                                    style={[styles.dateInput, { borderColor: theme.border, backgroundColor: theme.background }]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Ionicons name="calendar" size={18} color={theme.subtext} />
                                    <Text style={[styles.dateInputText, { color: theme.text }]}>
                                        {format(scheduledDate, 'PPP')}
                                    </Text>
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={scheduledDate}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                        onChange={onDateChange}
                                        minimumDate={new Date()}
                                    />
                                )}
                            </View>
                        )}

                        {/* Notes */}
                        <Text style={[styles.sectionLabel, { color: theme.text }]}>
                            {t('notes_for_farmer')} <Text style={{ color: theme.subtext }}>{t('optional')}</Text>
                        </Text>
                        <TextInput
                            style={[styles.notesInput, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                            value={vetNotes}
                            onChangeText={setVetNotes}
                            placeholder={action === 'accept'
                                ? t('preparation_instructions')
                                : t('decline_reason_optional')}
                            placeholderTextColor={theme.subtext}
                            multiline
                            numberOfLines={3}
                        />
                    </ScrollView>

                    {/* Footer Buttons */}
                    <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: theme.border }]}
                            onPress={onClose}
                            disabled={isSubmitting}
                        >
                            <Text style={[styles.cancelButtonText, { color: theme.text }]}>{t('cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                { backgroundColor: action === 'accept' ? '#059669' : '#dc2626' }
                            ]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons
                                        name={action === 'accept' ? 'checkmark-circle' : 'close-circle'}
                                        size={18}
                                        color="#fff"
                                    />
                                    <Text style={styles.submitButtonText}>
                                        {action === 'accept' ? t('schedule_visit') : t('decline_request')}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    loadingText: { fontSize: 16, fontWeight: '500' },

    // Header
    header: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20 },
    backButton: { marginBottom: 16 },
    headerContent: {},
    headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    headerBadgeText: { color: '#14b8a6', fontSize: 12, fontWeight: '600' },
    headerTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
    headerSubtitle: { color: '#94a3b8', fontSize: 14 },
    pendingText: { color: '#14b8a6', fontWeight: '600' },
    acceptedText: { color: '#60a5fa', fontWeight: '600' },
    refreshButton: { position: 'absolute', top: 50, right: 20, padding: 8 },

    // Filters
    filtersContainer: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    filterScroll: { marginBottom: 12 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
    filterChipText: { fontSize: 13, fontWeight: '500' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    searchInput: { flex: 1, fontSize: 14 },
    resultsCount: { fontSize: 12, marginTop: 8 },

    // Cards
    scrollView: { flex: 1 },
    scrollContent: { padding: 16, gap: 16 },
    card: { borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '600' },
    cardSubtitle: { fontSize: 13 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
    statusText: { fontSize: 12, fontWeight: '600' },

    // Farmer Info
    farmerInfo: { padding: 12, borderRadius: 12, marginBottom: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    farmerName: { fontWeight: '600', fontSize: 14 },
    farmName: { fontSize: 13, marginTop: 2, marginLeft: 24 },
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginLeft: 24 },
    phoneText: { color: '#3b82f6', fontSize: 13 },

    // Reason
    reasonContainer: { marginBottom: 12 },
    reasonText: { fontSize: 14, fontWeight: '500' },
    notesBox: { padding: 8, borderRadius: 8, marginTop: 8 },
    notesText: { fontSize: 13, color: '#1e40af', fontStyle: 'italic' },

    // Urgency
    urgencyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    urgencyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    urgencyText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dateText: { fontSize: 12 },

    // Scheduled
    scheduledBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
    scheduledText: { color: '#059669', fontSize: 14, fontWeight: '600' },

    // Respond Button
    respondButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
    respondButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },

    // Empty State
    emptyState: { alignItems: 'center', paddingVertical: 48 },
    emptyIconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
    emptySubtitle: { fontSize: 14, textAlign: 'center', maxWidth: 280 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, borderBottomWidth: 1 },
    modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    modalIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    modalSubtitle: { fontSize: 13, marginTop: 2 },
    modalBody: { padding: 20 },

    // Details Box
    detailsBox: { padding: 16, borderRadius: 12, marginBottom: 20 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    detailLabel: { fontSize: 13 },
    detailValue: { fontSize: 14, fontWeight: '500' },
    detailNotes: { marginBottom: 8 },
    detailNotesText: { fontSize: 13, fontStyle: 'italic', marginTop: 4 },

    // Action Buttons
    sectionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    actionButtons: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10 },
    actionButtonText: { fontSize: 14, fontWeight: '600' },

    // Date Section
    dateSection: { marginBottom: 16 },
    dateInput: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
    dateInputText: { fontSize: 14 },

    // Notes Input
    notesInput: { borderWidth: 1, borderRadius: 12, padding: 12, textAlignVertical: 'top', height: 80, marginBottom: 20 },

    // Modal Footer
    modalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1 },
    cancelButton: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    cancelButtonText: { fontSize: 15, fontWeight: '600' },
    submitButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 14, borderRadius: 12 },
    submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

export default VetVisitRequestsScreen;
