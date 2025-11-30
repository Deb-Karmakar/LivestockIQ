// Mobile/src/screens/farmer/AnimalsScreen.js
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
import { getAnimals } from '../../services/animalService';

const AnimalsScreen = ({ navigation }) => {
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
            Alert.alert('Error', 'Failed to load animals');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchAnimals();
    };

    const getMRLBadgeColor = (status) => {
        switch (status) {
            case 'SAFE':
                return '#10b981';
            case 'WITHDRAWAL_ACTIVE':
                return '#ef4444';
            case 'TEST_REQUIRED':
                return '#f59e0b';
            default:
                return '#6b7280';
        }
    };

    const renderAnimal = ({ item }) => (
        <TouchableOpacity style={styles.animalCard}>
            <View style={styles.animalHeader}>
                <View style={styles.animalInfo}>
                    <Text style={styles.animalName}>{item.name || item.tagId}</Text>
                    <Text style={styles.animalDetails}>
                        {item.species} • {item.gender} • {item.ageYears}y
                    </Text>
                </View>
                <View
                    style={[
                        styles.mrlBadge,
                        { backgroundColor: `${getMRLBadgeColor(item.mrlStatus)}20` },
                    ]}
                >
                    <Ionicons
                        name="shield-checkmark"
                        size={16}
                        color={getMRLBadgeColor(item.mrlStatus)}
                    />
                </View>
            </View>

            <View style={styles.animalFooter}>
                <View style={styles.tagContainer}>
                    <Ionicons name="pricetag" size={14} color="#6b7280" />
                    <Text style={styles.tagId}>{item.tagId}</Text>
                </View>
                {item.withdrawalActive && (
                    <View style={styles.withdrawalBadge}>
                        <Text style={styles.withdrawalText}>Withdrawal Active</Text>
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
                <Text style={styles.title}>My Animals</Text>
                <Text style={styles.subtitle}>{animals.length} total animals</Text>
            </View>

            <FlatList
                data={animals}
                keyExtractor={(item) => item.tagId}
                renderItem={renderAnimal}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="paw" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>No animals registered yet</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddAnimal')}
            >
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
    animalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    animalInfo: {
        flex: 1,
    },
    animalName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    animalDetails: {
        fontSize: 14,
        color: '#6b7280',
    },
    mrlBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    animalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tagId: {
        fontSize: 12,
        color: '#6b7280',
        marginLeft: 4,
        fontFamily: 'monospace',
    },
    withdrawalBadge: {
        backgroundColor: '#fef3c7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    withdrawalText: {
        fontSize: 11,
        color: '#d97706',
        fontWeight: '600',
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

export default AnimalsScreen;
