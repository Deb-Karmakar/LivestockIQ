import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAnimalHistory } from '../../services/animalService';

const AnimalHistoryScreen = ({ route, navigation }) => {
    const { animalId } = route.params;
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await getAnimalHistory(animalId);
            // The backend returns { animalDetails, timeline }
            // We need to extract the timeline array
            const timeline = response.timeline || [];

            // Sort by date descending (newest first)
            const sorted = timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
            setHistory(sorted);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getTimelineIcon = (type) => {
        // Backend returns uppercase types (TREATMENT, FEED, SALE, LOGGED)
        const lowerType = type ? type.toLowerCase() : '';

        switch (lowerType) {
            case 'treatment':
                return { name: 'medkit', color: '#3b82f6', bg: '#3b82f620' };
            case 'feed':
                return { name: 'nutrition', color: '#8b5cf6', bg: '#8b5cf620' };
            case 'test':
                return { name: 'flask', color: '#f59e0b', bg: '#f59e0b20' };
            case 'sale':
                return { name: 'cash', color: '#10b981', bg: '#10b98120' };
            case 'logged':
                return { name: 'add-circle', color: '#6b7280', bg: '#6b728020' };
            default:
                return { name: 'information-circle', color: '#6b7280', bg: '#6b728020' };
        }
    };

    const renderTimelineItem = (item, index) => {
        const icon = getTimelineIcon(item.type);
        const isLast = index === history.length - 1;

        return (
            <View key={item._id || index} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
                        <Ionicons name={icon.name} size={20} color={icon.color} />
                    </View>
                    {!isLast && <View style={styles.timelineLine} />}
                </View>

                <View style={styles.timelineContent}>
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
                        </View>

                        {item.description && (
                            <Text style={styles.cardDescription}>{item.description}</Text>
                        )}

                        {item.details && (
                            <View style={styles.detailsContainer}>
                                {item.details && typeof item.details === 'string' ? (
                                    <Text style={styles.detailValue}>{item.details}</Text>
                                ) : Array.isArray(item.details) ? (
                                    item.details.map((detail, idx) => (
                                        <View key={idx} style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>{detail.label}:</Text>
                                            <Text style={styles.detailValue}>{detail.value}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.detailValue}>{item.details}</Text>
                                )}
                            </View>
                        )}

                        {item.status && (
                            <View style={styles.statusBadge}>
                                <Text
                                    style={[
                                        styles.statusText,
                                        { color: item.status === 'Approved' ? '#10b981' : '#f59e0b' },
                                    ]}
                                >
                                    {item.status}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.loadingText}>Loading history...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.title}>Medical History</Text>
                    <Text style={styles.subtitle}>Animal: {animalId}</Text>
                </View>
            </View>

            {/* Timeline */}
            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {history.length > 0 ? (
                    <View style={styles.timeline}>
                        {history.map((item, index) => renderTimelineItem(item, index))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
                        <Text style={styles.emptyText}>No history yet</Text>
                        <Text style={styles.emptySubtext}>
                            Medical events will appear here once recorded
                        </Text>
                    </View>
                )}
            </ScrollView>
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
        backgroundColor: '#f3f4f6',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
    },
    header: {
        backgroundColor: '#1e293b',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 16,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#cbd5e1',
        marginTop: 4,
    },
    content: {
        flex: 1,
    },
    timeline: {
        padding: 20,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    timelineLeft: {
        alignItems: 'center',
        marginRight: 16,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#e5e7eb',
        marginTop: 8,
    },
    timelineContent: {
        flex: 1,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    cardHeader: {
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 4,
    },
    cardDate: {
        fontSize: 12,
        color: '#9ca3af',
    },
    cardDescription: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 12,
    },
    detailsContainer: {
        gap: 6,
    },
    detailRow: {
        flexDirection: 'row',
    },
    detailLabel: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
        marginRight: 4,
    },
    detailValue: {
        fontSize: 13,
        color: '#1f2937',
        flex: 1,
    },
    statusBadge: {
        marginTop: 12,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 8,
    },
});

export default AnimalHistoryScreen;