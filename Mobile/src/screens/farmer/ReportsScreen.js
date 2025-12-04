// Mobile/src/screens/farmer/ReportsScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import {
    getFarmerAmuReport,
    getFarmerAnimalHealthReport,
    getFarmerHerdDemographics,
    getFarmerTreatmentHistory,
    getFarmerMrlCompliance
} from '../../services/farmerService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNetwork } from '../../contexts/NetworkContext';

const ReportsScreen = () => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { isConnected } = useNetwork();
    const [selectedReport, setSelectedReport] = useState(null);
    const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);

    const REPORT_TYPES = [
        {
            value: 'AmuUsage',
            label: t('amu_usage'),
            icon: 'medkit',
            color: theme.info,
            desc: t('amu_usage_desc'),
            requiresDateRange: true
        },
        {
            value: 'AnimalHealth',
            label: t('animal_health'),
            icon: 'heart',
            color: theme.error,
            desc: t('animal_health_desc'),
            requiresDateRange: true
        },
        {
            value: 'HerdDemographics',
            label: t('demographics'),
            icon: 'people',
            color: theme.success,
            desc: t('demographics_desc'),
            requiresDateRange: false
        },
        {
            value: 'TreatmentHistory',
            label: t('treatments_report'),
            icon: 'list',
            color: theme.primary,
            desc: t('treatments_report_desc'),
            requiresDateRange: true
        },
        {
            value: 'MrlCompliance',
            label: t('mrl_compliance_report'),
            icon: 'shield-checkmark',
            color: theme.warning,
            desc: t('mrl_compliance_desc'),
            requiresDateRange: true
        }
    ];

    const handleGenerateReport = async () => {
        if (!selectedReport) return;

        setLoading(true);
        setReportData(null);

        if (!isConnected) {
            // Alert.alert(t('offline'), t('viewing_cached_report')); // Optional: notify user
        }

        try {
            const start = startDate.toISOString();
            const end = endDate.toISOString();
            let data = null;

            switch (selectedReport.value) {
                case 'AmuUsage':
                    data = await getFarmerAmuReport(start, end);
                    break;
                case 'AnimalHealth':
                    data = await getFarmerAnimalHealthReport(start, end);
                    break;
                case 'HerdDemographics':
                    data = await getFarmerHerdDemographics();
                    break;
                case 'TreatmentHistory':
                    data = await getFarmerTreatmentHistory(start, end);
                    break;
                case 'MrlCompliance':
                    data = await getFarmerMrlCompliance(start, end);
                    break;
            }
            setReportData(data);
            if (!isConnected && data) {
                // If we successfully got data while offline, it's cached
                // Maybe show a small indicator or toast
            }
        } catch (error) {
            console.error('Report generation error:', error);
            // You might want to show a toast or alert here
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (event, selectedDate, isStart) => {
        if (isStart) setShowStartPicker(Platform.OS === 'ios');
        else setShowEndPicker(Platform.OS === 'ios');

        if (selectedDate) {
            if (isStart) setStartDate(selectedDate);
            else setEndDate(selectedDate);
        }
    };

    const renderSummaryCards = () => {
        if (!reportData?.summary) return null;

        const { summary } = reportData;
        const cards = [];

        switch (reportData.reportType) {
            case 'AmuUsage':
                cards.push(
                    { label: t('total_treatments'), value: summary.totalTreatments, color: theme.info },
                    { label: t('unique_drugs'), value: summary.uniqueDrugs, color: theme.success },
                    { label: t('active_animals'), value: summary.activeAnimals, color: theme.warning },
                    { label: t('avg_month'), value: summary.averagePerMonth, color: theme.primary }
                );
                break;
            case 'AnimalHealth':
                cards.push(
                    { label: t('total_animals'), value: summary.totalAnimals, color: theme.info },
                    { label: t('compliance_rate'), value: `${summary.complianceRate}%`, color: summary.complianceRate >= 90 ? theme.success : theme.error },
                    { label: t('violations'), value: summary.mrlViolations, color: theme.error },
                    { label: t('pass_rate'), value: `${((summary.testsPassed / (summary.testsPassed + summary.testsFailed || 1)) * 100).toFixed(1)}%`, color: theme.success }
                );
                break;
            case 'HerdDemographics':
                cards.push(
                    { label: t('total_animals'), value: summary.totalAnimals, color: theme.info },
                    { label: t('species_count'), value: summary.speciesCount, color: theme.success },
                    { label: t('avg_age'), value: `${summary.averageAge} yr`, color: theme.warning },
                    { label: t('male_female'), value: `${summary.maleCount}/${summary.femaleCount}`, color: theme.primary }
                );
                break;
            case 'TreatmentHistory':
                cards.push(
                    { label: t('total_records'), value: summary.totalRecords, color: theme.info },
                    { label: t('total_treatments'), value: summary.totalTreatments, color: theme.success },
                    { label: t('feed_admin'), value: summary.totalFeedAdministrations, color: theme.warning }
                );
                break;
            case 'MrlCompliance':
                cards.push(
                    { label: t('safe'), value: summary.safeAnimals, color: theme.success },
                    { label: t('in_withdrawal'), value: summary.inWithdrawal, color: theme.warning },
                    { label: t('violations'), value: summary.violations, color: theme.error },
                    { label: t('pass_rate'), value: `${summary.testPassRate}%`, color: theme.info }
                );
                break;
        }

        return (
            <View style={styles.summaryGrid}>
                {cards.map((card, index) => (
                    <View key={index} style={[styles.summaryCard, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                        <Text style={[styles.summaryLabel, { color: theme.subtext }]}>{card.label}</Text>
                        <Text style={[styles.summaryValue, { color: card.color }]}>{card.value}</Text>
                    </View>
                ))}
            </View>
        );
    };

    const renderDataList = () => {
        if (!reportData?.data?.length) {
            return (
                <View style={styles.emptyState}>
                    <Text style={[styles.emptyStateText, { color: theme.subtext }]}>{t('no_data_available')}</Text>
                </View>
            );
        }

        return (
            <View style={[styles.dataList, { backgroundColor: theme.card }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('details')}</Text>
                {reportData.data.slice(0, 50).map((item, index) => (
                    <View key={index} style={[styles.dataItem, { borderBottomColor: theme.border }]}>
                        <View style={styles.dataItemContent}>
                            <Text style={[styles.dataItemTitle, { color: theme.text }]}>
                                {item.name || item.drug || item.animalId || 'Record'}
                            </Text>
                            <Text style={[styles.dataItemSubtitle, { color: theme.subtext }]}>
                                {item.value || item.usage || item.type || ''}
                            </Text>
                        </View>
                        {item.date && (
                            <Text style={[styles.dataItemDate, { color: theme.subtext }]}>
                                {format(new Date(item.date), 'MMM d')}
                            </Text>
                        )}
                    </View>
                ))}
            </View>
        );
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.header}
            >
                <Text style={[styles.headerTitle, { color: '#fff' }]}>{t('reports_title')}</Text>
                <Text style={[styles.headerSubtitle, { color: '#94a3b8' }]}>{t('reports_subtitle')}</Text>
            </LinearGradient>

            {/* Report Selection */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('select_report_type')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                    {REPORT_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.value}
                            style={[
                                styles.typeCard,
                                { backgroundColor: theme.card, shadowColor: theme.text },
                                selectedReport?.value === type.value && { backgroundColor: theme.background, borderColor: type.color, borderWidth: 2 },
                                { borderColor: selectedReport?.value === type.value ? type.color : 'transparent' }
                            ]}
                            onPress={() => setSelectedReport(type)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: `${type.color}20` }]}>
                                <Ionicons name={type.icon} size={24} color={type.color} />
                            </View>
                            <Text style={[styles.typeLabel, { color: theme.text }]}>{type.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Date Selection */}
            {selectedReport?.requiresDateRange && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('date_range')}</Text>
                    <View style={styles.dateRow}>
                        <TouchableOpacity
                            style={[styles.dateButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={() => setShowStartPicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color={theme.subtext} />
                            <Text style={[styles.dateText, { color: theme.text }]}>{format(startDate, 'MMM d, yyyy')}</Text>
                        </TouchableOpacity>
                        <Ionicons name="arrow-forward" size={20} color={theme.subtext} />
                        <TouchableOpacity
                            style={[styles.dateButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={() => setShowEndPicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color={theme.subtext} />
                            <Text style={[styles.dateText, { color: theme.text }]}>{format(endDate, 'MMM d, yyyy')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Generate Button */}
            <View style={styles.section}>
                <TouchableOpacity
                    style={[
                        styles.generateButton,
                        { backgroundColor: theme.primary },
                        (!selectedReport || loading) && { backgroundColor: theme.border, opacity: 0.7 }
                    ]}
                    onPress={handleGenerateReport}
                    disabled={!selectedReport || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="analytics" size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.generateButtonText}>{t('generate_report')}</Text>
                        </>
                    )}
                </TouchableOpacity>
                {!isConnected && (
                    <Text style={{ textAlign: 'center', color: theme.warning, marginTop: 8, fontSize: 12 }}>
                        {t('offline_mode_cached_data')}
                    </Text>
                )}
            </View>

            {/* Results */}
            {reportData && (
                <View style={styles.resultsContainer}>
                    <Text style={[styles.resultsTitle, { color: theme.text }]}>
                        {REPORT_TYPES.find(r => r.value === reportData.reportType)?.label} {t('results')}
                    </Text>
                    {renderSummaryCards()}
                    {renderDataList()}
                </View>
            )}

            {/* Date Pickers */}
            {showStartPicker && (
                <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={(e, date) => onDateChange(e, date, true)}
                />
            )}
            {showEndPicker && (
                <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="default"
                    onChange={(e, date) => onDateChange(e, date, false)}
                />
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 60,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        marginTop: 4,
    },
    section: {
        padding: 20,
        paddingBottom: 0,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    typeScroll: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    typeCard: {
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        width: 120,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    selectedTypeCard: {
        // Handled dynamically
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    typeLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    dateButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
    },
    dateText: {
        fontSize: 14,
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
    },
    disabledButton: {
        opacity: 0.7,
    },
    generateButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    resultsContainer: {
        padding: 20,
    },
    resultsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    summaryCard: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    summaryLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    dataList: {
        borderRadius: 12,
        padding: 16,
    },
    dataItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    dataItemContent: {
        flex: 1,
    },
    dataItemTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    dataItemSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    dataItemDate: {
        fontSize: 12,
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    emptyStateText: {
    },
});

export default ReportsScreen;
