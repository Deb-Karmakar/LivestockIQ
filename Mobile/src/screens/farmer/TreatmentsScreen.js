// Mobile/src/screens/farmer/TreatmentsScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTreatments } from '../../services/treatmentService';

const TreatmentsScreen = () => {
    const [treatments, setTreatments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all'); // all, pending, approved, completed

    useEffect(() => {
        fetchTreatments();
    }, []);

    const fetchTreatments = async () => {
        try {
            setLoading(true);
            const data = await getTreatments();
            setTreatments(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load treatments');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchTreatments();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved':
                return '#10b981';
            case 'Pending':
                return '#f59e0b';
            case 'Rejected':
                return '#ef4444';
            case 'In Progress':
                return '#3b82f6';
            case 'Completed':
                return '#6b7280';
            default:
                return '#9ca3af';
        }
    };

    const filteredTreatments = treatments.filter((t) => {
        if (filter === 'all') return true;
        return t.status.toLowerCase() === filter;
    });

    const renderTreatment = ({ item }) => (
        <TouchableOpacity style={styles.treatmentCard}>
            <View style={styles.treatmentHeader}>
                <View style={styles.treatmentInfo}>
                    <Text style={styles.drugName}>{item.drugName}</Text>
                    <Text style={styles.animalInfo}>
                        Animal: {item.animalId} • {item.drugType}
                    </Text>
                </View>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(item.status)}20` },
                    ]}
                >
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status}
                    </Text>
                </View>
            </View>

            <View style={styles.treatmentDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>
                {item.withdrawalPeriodDays > 0 && (
                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={16} color="#6b7280" />
                        <Text style={styles.detailText}>
                            {item.withdrawalPeriodDays} days withdrawal
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Treatments</Text>
                <Text style={styles.subtitle}>{filteredTreatments.length} treatments</Text>
            </View>

            <View style={styles.filterContainer}>
                {['all', 'pending', 'approved', 'completed'].map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterButton, filter === f && styles.filterButtonActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text
                            style={[styles.filterText, filter === f && styles.filterTextActive]}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredTreatments}
                keyExtractor={(item) => item._id}
                renderItem={renderTreatment}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="medical" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>No treatments found</Text>
                    </View>
                }
            />

            <TouchableOpacity style={styles.fab}>
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        paddingTop: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#fff',
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: '#f3f4f6',
    },
    filterButtonActive: {
        backgroundColor: '#10b981',
    },
    filterText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#fff',
    },
    list: {
        padding: 15,
    },
    treatmentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    treatmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    treatmentInfo: {
        flex: 1,
    },
    drugName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    animalInfo: {
        fontSize: 14,
        color: '#6b7280',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    treatmentDetails: {
        flexDirection: 'row',
        gap: 15,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 12,
        color: '#6b7280',
        marginLeft: 6,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
        marginTop: 16,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});

export default TreatmentsScreen;
