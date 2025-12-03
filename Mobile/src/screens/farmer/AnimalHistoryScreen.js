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
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

const AnimalHistoryScreen = ({ route, navigation }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
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
                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />}
                </View>

                <View style={styles.timelineContent}>
                    <View style={[styles.card, { backgroundColor: theme.card }]}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.title}</Text>
                            <Text style={[styles.cardDate, { color: theme.subtext }]}>{formatDate(item.date)}</Text>
                        </View>

                        {item.description && (
                            <Text style={[styles.cardDescription, { color: theme.subtext }]}>{item.description}</Text>
                        )}

                        {item.details && (
                            <View style={styles.detailsContainer}>
                                {item.details && typeof item.details === 'string' ? (
                                    <Text style={[styles.detailValue, { color: theme.text }]}>{item.details}</Text>
                                ) : Array.isArray(item.details) ? (
                                    item.details.map((detail, idx) => (
                                        <View key={idx} style={styles.detailRow}>
                                            <Text style={[styles.detailLabel, { color: theme.subtext }]}>{detail.label}:</Text>
                                            <Text style={[styles.detailValue, { color: theme.text }]}>{detail.value}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={[styles.detailValue, { color: theme.text }]}>{item.details}</Text>
                                )}
                            </View>
                        )}

                        {item.status && (
                            <View style={[styles.statusBadge, { backgroundColor: theme.background }]}>
                                <Text
                                    style={[
                                        styles.statusText,
                                        { color: item.status === 'Approved' ? theme.success : theme.warning },
                                    ]}
                                >
                                    {t(item.status.toLowerCase()) || item.status}
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
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.subtext }]}>{t('loading_history')}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={[styles.title, { color: theme.text }]}>{t('medical_history')}</Text>
                    <Text style={[styles.subtitle, { color: theme.subtext }]}>{t('animal_label')}: {animalId}</Text>
                </View>
            </View>

            {/* Timeline */}
            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                {history.length > 0 ? (
                    <View style={styles.timeline}>
                        {history.map((item, index) => renderTimelineItem(item, index))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color={theme.border} />
                        <Text style={[styles.emptyText, { color: theme.text }]}>{t('no_history')}</Text>
                        <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
                            {t('no_history_subtext')}
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
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    header: {
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
    },
    subtitle: {
        fontSize: 14,
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
        marginTop: 8,
    },
    timelineContent: {
        flex: 1,
    },
    card: {
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
        marginBottom: 4,
    },
    cardDate: {
        fontSize: 12,
    },
    cardDescription: {
        fontSize: 14,
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
        fontWeight: '500',
        marginRight: 4,
    },
    detailValue: {
        fontSize: 13,
        flex: 1,
    },
    statusBadge: {
        marginTop: 12,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
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
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
});

export default AnimalHistoryScreen;