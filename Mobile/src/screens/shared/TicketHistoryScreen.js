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

const TicketHistoryScreen = () => {
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
            case 'Open': return '#3b82f6';
            case 'In Progress': return '#f59e0b';
            case 'Resolved': return '#10b981';
            case 'Closed': return '#6b7280';
            default: return '#3b82f6';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Urgent': return '#dc2626';
            case 'High': return '#ea580c';
            case 'Medium': return '#d97706';
            case 'Low': return '#16a34a';
            default: return '#d97706';
        }
    };

    const renderTicket = ({ item }) => (
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(item._id)}
                activeOpacity={0.7}
            >
                <View style={styles.headerTop}>
                    <View style={styles.badges}>
                        <View style={styles.idBadge}>
                            <Text style={styles.idText}>{item.ticketId}</Text>
                        </View>
                        <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                {item.status}
                            </Text>
                        </View>
                        <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(item.priority)}20` }]}>
                            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                                {item.priority}
                            </Text>
                        </View>
                    </View>
                    <Ionicons
                        name={expandedTicket === item._id ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#9ca3af"
                    />
                </View>

                <Text style={styles.subject}>{item.subject}</Text>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={12} color="#6b7280" />
                        <Text style={styles.metaText}>
                            {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                    <Text style={styles.categoryText}>{item.category}</Text>
                </View>
            </TouchableOpacity>

            {expandedTicket === item._id && (
                <View style={styles.detailsContainer}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Description:</Text>
                        <View style={styles.descriptionBox}>
                            <Text style={styles.descriptionText}>{item.description}</Text>
                        </View>
                    </View>

                    {item.adminResponse && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: '#059669' }]}>
                                <Ionicons name="checkmark-circle" size={14} color="#059669" /> Admin Response:
                            </Text>
                            <View style={styles.responseBox}>
                                <Text style={styles.responseText}>{item.adminResponse}</Text>
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
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
                            <Ionicons name="ticket" size={16} color="#a78bfa" />
                            <Text style={styles.headerLabel}>Support History</Text>
                        </View>
                        <Text style={styles.headerTitle}>My Tickets</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.newTicketBtn}
                        onPress={() => navigation.navigate('RaiseTicket')}
                    >
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {['all', 'Open', 'In Progress', 'Resolved', 'Closed'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.filterChip,
                                filter === status && styles.activeFilterChip
                            ]}
                            onPress={() => setFilter(status)}
                        >
                            <Text style={[
                                styles.filterText,
                                filter === status && styles.activeFilterText
                            ]}>
                                {status === 'all' ? 'All Tickets' : status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
            ) : (
                <FlatList
                    data={tickets}
                    keyExtractor={(item) => item._id}
                    renderItem={renderTicket}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="ticket-outline" size={64} color="#d1d5db" />
                            <Text style={styles.emptyText}>No tickets found</Text>
                            <TouchableOpacity
                                style={styles.createBtn}
                                onPress={() => navigation.navigate('RaiseTicket')}
                            >
                                <Text style={styles.createBtnText}>Create New Ticket</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    header: { padding: 20, paddingTop: 50, paddingBottom: 24 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { padding: 4 },
    headerTextContainer: { flex: 1, marginLeft: 16 },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    headerLabel: { color: '#a78bfa', fontSize: 14, fontWeight: '600' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    newTicketBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },

    filterContainer: { backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    filterScroll: { paddingHorizontal: 16, gap: 8 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
    activeFilterChip: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
    filterText: { fontSize: 13, color: '#4b5563', fontWeight: '500' },
    activeFilterText: { color: '#fff', fontWeight: '600' },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16 },
    card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, overflow: 'hidden' },
    cardHeader: { padding: 16 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1, marginRight: 8 },
    idBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
    idText: { fontSize: 10, fontFamily: 'monospace', color: '#4b5563' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1 },
    statusText: { fontSize: 10, fontWeight: '600' },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    priorityText: { fontSize: 10, fontWeight: '600' },
    subject: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, color: '#6b7280' },
    categoryText: { fontSize: 12, color: '#6b7280', fontStyle: 'italic' },

    detailsContainer: { borderTopWidth: 1, borderTopColor: '#f3f4f6', padding: 16, backgroundColor: '#fafafa' },
    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 12, fontWeight: '600', color: '#4b5563', marginBottom: 6 },
    descriptionBox: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8 },
    descriptionText: { fontSize: 13, color: '#374151', lineHeight: 20 },
    responseBox: { backgroundColor: '#ecfdf5', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1fae5' },
    responseText: { fontSize: 13, color: '#065f46', lineHeight: 20 },

    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyText: { marginTop: 16, fontSize: 16, color: '#9ca3af', marginBottom: 24 },
    createBtn: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#8b5cf6', borderRadius: 8 },
    createBtnText: { color: '#fff', fontWeight: '600' },
});

export default TicketHistoryScreen;
