// Mobile/src/screens/farmer/AnimalsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    TextInput,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAnimals, deleteAnimal } from '../../services/animalService';
import AIHealthTipModal from '../../components/AIHealthTipModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { useSync } from '../../contexts/SyncContext';
import VetVisitRequestModal from '../../components/VetVisitRequestModal';
import { Constants } from 'expo-constants'; // Ensure consistent imports if needed

const AnimalsScreen = ({ navigation }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [animals, setAnimals] = useState([]);
    const [filteredAnimals, setFilteredAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [speciesFilter, setSpeciesFilter] = useState('All');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [selectedAnimal, setSelectedAnimal] = useState(null);
    const [showVetRequestModal, setShowVetRequestModal] = useState(false);
    const [vetRequestAnimal, setVetRequestAnimal] = useState(null);

    useEffect(() => {
        fetchAnimals();
    }, []);

    useEffect(() => {
        filterAnimals();
    }, [animals, searchTerm, speciesFilter]);

    const fetchAnimals = async () => {
        try {
            setLoading(true);
            const data = await getAnimals();
            setAnimals(data);
        } catch (error) {
            Alert.alert(t('error'), t('failed_load_animals'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterAnimals = () => {
        let filtered = animals;

        if (searchTerm) {
            filtered = filtered.filter(
                (animal) =>
                    animal.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (animal.name && animal.name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (speciesFilter !== 'All') {
            filtered = filtered.filter((animal) => animal.species === speciesFilter);
        }

        setFilteredAnimals(filtered);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchAnimals();
    };

    const { isConnected } = useNetwork();
    const { addToQueue } = useSync();

    const handleDelete = async (animalId) => {
        Alert.alert(
            t('delete_animal_title'),
            t('delete_animal_confirm'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (!isConnected) {
                                await addToQueue({
                                    type: 'DELETE_ANIMAL',
                                    resourceId: animalId,
                                });
                                Alert.alert(t('offline'), t('animal_deletion_queued'));
                                // Optimistically remove from list
                                setAnimals(prev => prev.filter(a => a._id !== animalId));
                                return;
                            }

                            await deleteAnimal(animalId);
                            Alert.alert(t('success'), 'Animal deleted successfully');
                            fetchAnimals();
                        } catch (error) {
                            Alert.alert(t('error'), 'Failed to delete animal');
                        }
                    },
                },
            ]
        );
    };

    // Updated handlers for History and AI
    const handleViewHistory = (animal) => {
        navigation.navigate('AnimalHistory', { animalId: animal.tagId });
    };

    const handleMoreActions = (animal) => {
        Alert.alert(
            t('more_actions'),
            `${t('actions_for')} ${animal.tagId}`,
            [
                {
                    text: t('ai_health_tip'),
                    onPress: () => handleAIHealthTip(animal),
                },
                {
                    text: t('delete'),
                    onPress: () => handleDelete(animal._id),
                    style: 'destructive',
                },
                { text: t('cancel'), style: 'cancel' },
            ]
        );
    };

    const handleAIHealthTip = (animal) => {
        setSelectedAnimal(animal);
        setShowAIModal(true);
    };

    const handleRequestVetVisit = (animal) => {
        setVetRequestAnimal(animal);
        setShowVetRequestModal(true);
    };

    const getAnimalStatusTag = (animal) => {
        // Check if under withdrawal (active treatment with withdrawal period)
        if (animal.withdrawalEndDate) {
            const withdrawalEnd = new Date(animal.withdrawalEndDate);
            const now = new Date();
            if (withdrawalEnd > now) {
                const daysRemaining = Math.ceil((withdrawalEnd - now) / (1000 * 60 * 60 * 24));
                return {
                    label: `Withdrawal (${daysRemaining}d)`,
                    color: '#f97316', // Orange
                    bg: '#ffedd5',
                    icon: 'time'
                };
            }
        }

        // Check if new (created < 7 days ago & no withdrawal)
        if (animal.createdAt && !animal.withdrawalEndDate) {
            const createdDate = new Date(animal.createdAt);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            if (createdDate >= sevenDaysAgo) {
                return {
                    label: 'New',
                    color: '#10b981', // Emerald
                    bg: '#d1fae5',
                    icon: 'star'
                };
            }
        }
        return null;
    };



    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const ageDifMs = Date.now() - new Date(dob).getTime();
        const ageDate = new Date(ageDifMs);
        const years = Math.abs(ageDate.getUTCFullYear() - 1970);
        const months = ageDate.getUTCMonth();
        if (years > 0) return `${years}y ${months}m`;
        return `${months}m`;
    };

    const speciesList = ['All', ...new Set(animals.map((a) => a.species))];

    const renderAnimal = ({ item }) => {
        const statusTag = getAnimalStatusTag(item);

        return (
            <View style={[styles.animalCard, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                <View style={styles.animalHeader}>
                    <View style={styles.animalInfo}>
                        <Text style={[styles.animalTagId, { color: theme.text }]}>{item.tagId}</Text>
                        {item.name && <Text style={[styles.animalName, { color: theme.subtext }]}>{item.name}</Text>}
                    </View>
                </View>

                {statusTag && (
                    <View style={[styles.statusTagContainer, { backgroundColor: statusTag.bg }]}>
                        <Ionicons name={statusTag.icon} size={12} color={statusTag.color} style={{ marginRight: 4 }} />
                        <Text style={[styles.statusTagText, { color: statusTag.color }]}>{statusTag.label}</Text>
                    </View>
                )}

                <View style={styles.statsGrid}>
                    <View style={[styles.statItem, { backgroundColor: theme.background }]}>
                        <Ionicons name="paw" size={14} color={theme.subtext} />
                        <Text style={[styles.statValue, { color: theme.text }]}>{item.species}</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: theme.background }]}>
                        <Ionicons name="male-female" size={14} color={theme.subtext} />
                        <Text style={[styles.statValue, { color: theme.text }]}>{item.gender || 'N/A'}</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: theme.background }]}>
                        <Ionicons name="calendar" size={14} color={theme.subtext} />
                        <Text style={[styles.statValue, { color: theme.text }]}>{calculateAge(item.dob)}</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: theme.background }]}>
                        <Ionicons name="fitness" size={14} color={theme.subtext} />
                        <Text style={[styles.statValue, { color: theme.text }]}>{item.weight || 'N/A'}</Text>
                    </View>
                </View>



                {item.notes && (
                    <View style={[styles.notesContainer, { backgroundColor: theme.background }]}>
                        <Text style={[styles.notesLabel, { color: theme.subtext }]}>{t('notes_label')}</Text>
                        <Text style={[styles.notesText, { color: theme.text }]} numberOfLines={2}>
                            {item.notes}
                        </Text>
                    </View>
                )}

                {/* Updated Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.editButton, { backgroundColor: `${theme.info}20` }]}
                        onPress={() => navigation.navigate('AddAnimal', { animal: item })}
                    >
                        <Ionicons name="create" size={16} color={theme.info} />
                        <Text style={[styles.editButtonText, { color: theme.info }]}>{t('edit')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.historyButton, { backgroundColor: `${theme.primary}20` }]}
                        onPress={() => handleViewHistory(item)}
                    >
                        <Ionicons name="document-text" size={16} color={theme.primary} />
                        <Text style={[styles.historyButtonText, { color: theme.primary }]}>{t('history')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.moreButton, { backgroundColor: theme.background }]}
                        onPress={() => handleMoreActions(item)}
                    >
                        <Ionicons name="ellipsis-horizontal" size={16} color={theme.subtext} />
                    </TouchableOpacity>
                </View>

                {/* Vet Visit Request Button - Full Width below actions */}
                <TouchableOpacity
                    style={[styles.vetRequestButton, { borderColor: theme.border }]}
                    onPress={() => handleRequestVetVisit(item)}
                >
                    <Ionicons name="medkit-outline" size={16} color={theme.primary} />
                    <Text style={[styles.vetRequestButtonText, { color: theme.primary }]}>Request Vet Visit</Text>
                </TouchableOpacity>
            </View>

        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.subtext }]}>{t('loading_animals')}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header Banner (now rendered at the TOP) */}
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.headerBanner}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTextContainer}>
                        <Text style={[styles.headerBadge, { color: '#4ade80' }]}>
                            <Ionicons name="sparkles" size={14} color="#4ade80" /> {t('herd_management')}
                        </Text>
                        <Text style={[styles.headerTitle, { color: '#fff' }]}>{t('animals_livestock')}</Text>
                        <Text style={[styles.headerSubtitle, { color: '#94a3b8' }]}>
                            {t('you_have_registered', { count: animals.length })} <Text style={[styles.highlight, { color: '#4ade80' }]}>{animals.length} {t('animals_registered')}</Text>
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Search and Filter (moved BELOW the header) */}
            <View style={[styles.searchContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <View style={[styles.searchBox, { backgroundColor: theme.background }]}>
                    <Ionicons name="search" size={20} color={theme.subtext} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder={t('search_placeholder')}
                        placeholderTextColor={theme.subtext}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                    {searchTerm.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchTerm('')}>
                            <Ionicons name="close-circle" size={20} color={theme.subtext} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.filterButton, { backgroundColor: theme.primary }]}
                    onPress={() => setShowFilterModal(true)}
                >
                    <Ionicons name="filter" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={[styles.statsBar, { backgroundColor: theme.card }]}>
                <Text style={[styles.statsText, { color: theme.subtext }]}>
                    Showing {filteredAnimals.length} of {animals.length} animals
                </Text>
                {speciesFilter !== 'All' && (
                    <TouchableOpacity onPress={() => setSpeciesFilter('All')}>
                        <Text style={[styles.clearFilter, { color: theme.primary }]}>{t('clear_filter')}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Animal List */}
            <FlatList
                data={filteredAnimals}
                keyExtractor={(item) => item._id}
                renderItem={renderAnimal}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="paw" size={64} color={theme.border} />
                        <Text style={[styles.emptyText, { color: theme.text }]}>{t('no_animals_found')}</Text>
                        <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
                            {searchTerm || speciesFilter !== 'All'
                                ? t('no_animals_subtext')
                                : t('add_first_animal')}
                        </Text>
                    </View>
                }
            />

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate('AddAnimal')}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('filter_species')}</Text>
                            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                                <Ionicons name="close" size={24} color={theme.subtext} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.filterOptions}>
                            {speciesList.map((species) => (
                                <TouchableOpacity
                                    key={species}
                                    style={[
                                        styles.filterOption,
                                        { backgroundColor: theme.background },
                                        speciesFilter === species && { backgroundColor: `${theme.primary}20` },
                                    ]}
                                    onPress={() => {
                                        setSpeciesFilter(species);
                                        setShowFilterModal(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.filterOptionText,
                                            { color: theme.text },
                                            speciesFilter === species && { color: theme.primary, fontWeight: '600' },
                                        ]}
                                    >
                                        {species}
                                    </Text>
                                    {speciesFilter === species && (
                                        <Ionicons name="checkmark" size={20} color={theme.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* AI Health Tip Modal */}
            <AIHealthTipModal
                visible={showAIModal}
                animal={selectedAnimal}
                onClose={() => {
                    setShowAIModal(false);
                    setSelectedAnimal(null);
                }}
            />

            {/* Vet Visit Request Modal */}
            <VetVisitRequestModal
                visible={showVetRequestModal}
                animal={vetRequestAnimal}
                onClose={() => {
                    setShowVetRequestModal(false);
                    setVetRequestAnimal(null);
                }}
                onSuccess={() => {
                    fetchAnimals(); // Refresh logic if needed or just close
                }}
            />
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
    searchContainer: {
        flexDirection: 'row',
        padding: 15,
        gap: 10,
        borderBottomWidth: 1,
        marginTop: 8,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        paddingVertical: 10,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },

    /* Header Banner styles added */
    headerBanner: {
        padding: 20,
    },
    headerContent: {
        gap: 8,
    },
    headerTextContainer: {
        gap: 4,
    },
    headerBadge: {
        fontSize: 12,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 14,
    },
    highlight: {
        fontWeight: '600',
    },

    statsBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    statsText: {
        fontSize: 13,
    },
    clearFilter: {
        fontSize: 13,
        fontWeight: '600',
    },
    list: {
        padding: 15,
    },
    animalCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
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
    animalTagId: {
        fontSize: 16,
        fontWeight: '700',
        fontFamily: 'monospace',
    },
    animalName: {
        fontSize: 14,
        marginTop: 2,
    },
    mrlBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statValue: {
        fontSize: 12,
        fontWeight: '500',
    },
    mrlStatusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    mrlStatusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    notesContainer: {
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
    },
    notesLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
    },
    notesText: {
        fontSize: 12,
    },

    /* Action buttons updated styles */
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    editButton: {
    },
    editButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    deleteButton: {
    },
    deleteButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },

    /* New primaryActions + history/more styles */
    historyButton: {
    },
    historyButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    moreButton: {
        paddingHorizontal: 12,
        flex: 0,
        width: 48,
    },
    vetRequestButton: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
    },
    vetRequestButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    statusTagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 10,
        marginTop: -4,
    },
    statusTagText: {
        fontSize: 11,
        fontWeight: '700',
    },

    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    filterOptions: {
        padding: 20,
    },
    filterOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    filterOptionSelected: {
    },
    filterOptionText: {
        fontSize: 15,
        fontWeight: '500',
    },
    filterOptionTextSelected: {
        fontWeight: '600',
    },
});

export default AnimalsScreen;
