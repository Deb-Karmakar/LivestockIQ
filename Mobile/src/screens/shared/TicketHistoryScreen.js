// Mobile/src/screens/shared/TicketHistoryScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getMyTickets } from '../../services/ticketService';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

const TicketHistoryScreen = () => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const navigation = useNavigation();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');
    const [expandedTicket, setExpandedTicket] = useState(null);

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true);
            const filters = filter !== 'all' ? { status: filter } : {};
            const data = await getMyTickets(filters);
            setTickets(data.tickets || []);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTickets();
    };

    const toggleExpand = (ticketId) => {
        setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return theme.info;
            case 'In Progress': return theme.warning;
            case 'Resolved': return theme.success;
            case 'Closed': return theme.subtext;
            default: return theme.info;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Urgent': return theme.error;
            case 'High': return '#ea580c';
            case 'Medium': return theme.warning;
            case 'Low': return theme.success;
            default: return theme.warning;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'Open': return t('open');
            case 'In Progress': return t('in_progress');
            case 'Resolved': return t('resolved');
            case 'Closed': return t('closed');
            default: return status;
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

    const renderTicket = ({ item }) => (
        <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.text }]}>
            <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(item._id)}
                activeOpacity={0.7}
            >
                <View style={styles.headerTop}>
                    <View style={styles.badges}>
                        <View style={[styles.idBadge, { backgroundColor: theme.background, borderColor: theme.border }]}>
                            <Text style={[styles.idText, { color: theme.subtext }]}>{item.ticketId}</Text>
                        </View>
                        <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                {getStatusLabel(item.status)}
                            </Text>
                        </View>
                        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                                {getPriorityLabel(item.priority)}
                            </Text>
                        </View>
                    </View>
                    <Ionicons
                        name={expandedTicket === item._id ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={theme.subtext}
                    />
                </View>

                <Text style={[styles.subject, { color: theme.text }]}>{item.subject}</Text>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={12} color={theme.subtext} />
                        <Text style={[styles.metaText, { color: theme.subtext }]}>
                            {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                    <Text style={[styles.categoryText, { color: theme.subtext }]}>{getCategoryLabel(item.category)}</Text>
                </View>
            </TouchableOpacity>

            {expandedTicket === item._id && (
                <View style={[styles.detailsContainer, { borderTopColor: theme.border, backgroundColor: theme.background + '50' }]}>
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.subtext }]}>{t('description_label')}:</Text>
                        <View style={[styles.descriptionBox, { backgroundColor: theme.background }]}>
                            <Text style={[styles.descriptionText, { color: theme.text }]}>{item.description}</Text>
                        </View>
                    </View>

                    {item.adminResponse && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: theme.success }]}>
                                <Ionicons name="checkmark-circle" size={14} color={theme.success} /> {t('admin_response')}:
                            </Text>
                            <View style={[styles.responseBox, { backgroundColor: theme.success + '10', borderColor: theme.success + '30' }]}>
                                <Text style={[styles.responseText, { color: theme.success }]}>{item.adminResponse}</Text>
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
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
                            <Ionicons name="ticket" size={16} color="#a78bfa" />
                            <Text style={styles.headerLabel}>{t('support_history')}</Text>
                        </View>
                        <Text style={styles.headerTitle}>{t('my_tickets')}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.newTicketBtn}
                        onPress={() => navigation.navigate('RaiseTicket')}
                    >
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={[styles.filterContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {['all', 'Open', 'In Progress', 'Resolved', 'Closed'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.filterChip,
                                { backgroundColor: theme.background, borderColor: theme.border },
                                filter === status && { backgroundColor: theme.primary, borderColor: theme.primary }
                            ]}
                            onPress={() => setFilter(status)}
                        >
                            <Text style={[
                                styles.filterText,
                                { color: theme.subtext },
                                filter === status && { color: '#fff', fontWeight: '600' }
                            ]}>
                                {status === 'all' ? t('all_tickets') : getStatusLabel(status)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={tickets}
                    keyExtractor={(item) => item._id}
                    renderItem={renderTicket}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="ticket-outline" size={64} color={theme.border} />
                            <Text style={[styles.emptyText, { color: theme.subtext }]}>{t('no_tickets_found')}</Text>
                            <TouchableOpacity
                                style={[styles.createBtn, { backgroundColor: theme.primary }]}
                                onPress={() => navigation.navigate('RaiseTicket')}
                            >
                                <Text style={styles.createBtnText}>{t('create_new_ticket')}</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, paddingTop: 50, paddingBottom: 24 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { padding: 4 },
    headerTextContainer: { flex: 1, marginLeft: 16 },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    headerLabel: { color: '#a78bfa', fontSize: 14, fontWeight: '600' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    newTicketBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },

    filterContainer: { paddingVertical: 12, borderBottomWidth: 1 },
    filterScroll: { paddingHorizontal: 16, gap: 8 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    filterText: { fontSize: 13, fontWeight: '500' },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16 },
    card: { borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, overflow: 'hidden' },
    cardHeader: { padding: 16 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1, marginRight: 8 },
    idBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
    idText: { fontSize: 10, fontFamily: 'monospace' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1 },
    statusText: { fontSize: 10, fontWeight: '600' },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    priorityText: { fontSize: 10, fontWeight: '600' },
    subject: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12 },
    categoryText: { fontSize: 12, fontStyle: 'italic' },

    detailsContainer: { borderTopWidth: 1, padding: 16 },
    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
    descriptionBox: { padding: 12, borderRadius: 8 },
    descriptionText: { fontSize: 13, lineHeight: 20 },
    responseBox: { padding: 12, borderRadius: 8, borderWidth: 1 },
    responseText: { fontSize: 13, lineHeight: 20 },

    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { marginTop: 16, fontSize: 16, marginBottom: 24 },
    createBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
    createBtnText: { color: '#fff', fontWeight: '600' },
});

export default TicketHistoryScreen;
