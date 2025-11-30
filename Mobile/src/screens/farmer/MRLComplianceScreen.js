// Mobile/src/screens/farmer/MRLComplianceScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAnimals } from '../../services/animalService';

const MRLComplianceScreen = () => {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAnimals();
    }, []);

    const fetchAnimals = async () => {
        try {
            setLoading(true);
            const data = await getAnimals();
            setAnimals(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load MRL data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchAnimals();
    };

    const getMRLStatusInfo = (status) => {
        switch (status) {
            case 'SAFE':
                return { text: 'Safe for Sale', color: '#10b981', icon: 'shield-checkmark' };
            case 'WITHDRAWAL_ACTIVE':
                return { text: 'Withdrawal Active', color: '#ef4444', icon: 'shield' };
            case 'TEST_REQUIRED':
                return { text: 'Test Required', color: '#f59e0b', icon: 'alert-circle' };
            case 'NEW':
                return { text: 'New Animal', color: '#3b82f6', icon: 'sparkles' };
            default:
                return { text: 'Unknown', color: '#6b7280', icon: 'help-circle' };
        }
    };

    const renderAnimal = ({ item }) => {
        const statusInfo = getMRLStatusInfo(item.mrlStatus);

        return (
            <View style={styles.animalCard}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.animalName}>{item.name || item.tagId}</Text>
                        <Text style={styles.species}>{item.species} • {item.tagId}</Text>
                    </View>
                    <View
                        style={[styles.statusIcon, { backgroundColor: `${statusInfo.color}20` }]}
                    >
                        <Ionicons name={statusInfo.icon} size={24} color={statusInfo.color} />
                    </View>
                </View>

                <View
                    style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}
                >
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>
                        {statusInfo.text}
                    </Text>
                </View>

                {item.withdrawalEndDate && (
                    <View style={styles.dateContainer}>
                        <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                        <Text style={styles.dateText}>
                            Withdrawal ends: {new Date(item.withdrawalEndDate).toLocaleDateString()}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    const stats = {
        safe: animals.filter(a => a.mrlStatus === 'SAFE').length,
        withdrawal: animals.filter(a => a.mrlStatus === 'WITHDRAWAL_ACTIVE').length,
        testRequired: animals.filter(a => a.mrlStatus === 'TEST_REQUIRED').length,
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>MRL Compliance</Text>
                <Text style={styles.subtitle}>Maximum Residue Limit Status</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Ionicons name="shield-checkmark" size={24} color="#10b981" />
                    <Text style={styles.statValue}>{stats.safe}</Text>
                    <Text style={styles.statLabel}>Safe</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="shield" size={24} color="#ef4444" />
                    <Text style={styles.statValue}>{stats.withdrawal}</Text>
                    <Text style={styles.statLabel}>Withdrawal</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="alert-circle" size={24} color="#f59e0b" />
                    <Text style={styles.statValue}>{stats.testRequired}</Text>
                    <Text style={styles.statLabel}>Test Required</Text>
                </View>
            </View>

            <FlatList
                data={animals}
                keyExtractor={(item) => item.tagId}
                renderItem={renderAnimal}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 15,
        justifyContent: 'space-around',
    },
    statCard: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    list: {
        padding: 15,
    },
    animalCard: {
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
        alignItems: 'center',
        marginBottom: 12,
    },
    animalName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
    },
    species: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 2,
    },
    statusIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 12,
        color: '#6b7280',
        marginLeft: 6,
    },
});

export default MRLComplianceScreen;
