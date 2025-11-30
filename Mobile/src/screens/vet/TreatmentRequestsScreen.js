// Mobile/src/screens/vet/TreatmentRequestsScreen.js
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
import { getTreatmentRequests, approveTreatment, rejectTreatment } from '../../services/treatmentService';

const TreatmentRequestsScreen = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await getTreatmentRequests();
            setRequests(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load treatment requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    const handleApprove = (request) => {
        Alert.alert(
            'Approve Treatment',
            `Approve treatment for ${request.animalId}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        try {
                            await approveTreatment(request._id, {
                                withdrawalPeriodDays: request.withdrawalPeriodDays || 0,
                            });
                            Alert.alert('Success', 'Treatment approved');
                            fetchRequests();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to approve treatment');
                        }
                    },
                },
            ]
        );
    };

    const handleReject = (request) => {
        Alert.alert(
            'Reject Treatment',
            'Reason for rejection:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await rejectTreatment(request._id, 'Not appropriate for this case');
                            Alert.alert('Success', 'Treatment rejected');
                            fetchRequests();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to reject treatment');
                        }
                    },
                },
            ]
        );
    };

    const renderRequest = ({ item }) => (
        <View style={styles.requestCard}>
            <View style={styles.cardHeader}>
                <View style={styles.requestInfo}>
                    <Text style={styles.drugName}>{item.drugName}</Text>
                    <Text style={styles.animalInfo}>
                        Animal: {item.animalId} • {item.drugType}
                    </Text>
                    <Text style={styles.farmerInfo}>
                        Farmer: {item.farmerId?.farmOwner || 'Unknown'}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#fef3c7' }]}>
                    <Text style={styles.statusText}>Pending</Text>
                </View>
            </View>

            {item.reason && (
                <View style={styles.reasonContainer}>
                    <Text style={styles.reasonLabel}>Reason:</Text>
                    <Text style={styles.reasonText}>{item.reason}</Text>
                </View>
            )}

            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <Ionicons name="medkit-outline" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>Dosage: {item.dosageAmount} {item.dosageUnit}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>Withdrawal: {item.withdrawalPeriodDays}d</Text>
                </View>
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(item)}
                >
                    <Ionicons name="close-circle" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(item)}
                >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    const pendingRequests = requests.filter(r => r.status === 'Pending');

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Treatment Requests</Text>
                <Text style={styles.subtitle}>{pendingRequests.length} pending</Text>
            </View>

            <FlatList
                data={pendingRequests}
                keyExtractor={(item) => item._id}
                renderItem={renderRequest}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="clipboard" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>No pending requests</Text>
                    </View>
                }
            />
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
    list: {
        padding: 15,
    },
    requestCard: {
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
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    requestInfo: {
        flex: 1,
    },
    drugName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    animalInfo: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 2,
    },
    farmerInfo: {
        fontSize: 13,
        color: '#3b82f6',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#d97706',
    },
    reasonContainer: {
        backgroundColor: '#f9fafb',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    reasonLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 4,
    },
    reasonText: {
        fontSize: 14,
        color: '#1f2937',
    },
    detailsRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 12,
        color: '#6b7280',
        marginLeft: 6,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
    },
    rejectButton: {
        backgroundColor: '#ef4444',
    },
    approveButton: {
        backgroundColor: '#10b981',
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
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
});

export default TreatmentRequestsScreen;
