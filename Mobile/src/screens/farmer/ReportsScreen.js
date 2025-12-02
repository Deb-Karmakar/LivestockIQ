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

const ReportsScreen = () => {
    const { t } = useLanguage();
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
            color: '#3b82f6',
            desc: t('amu_usage_desc'),
            requiresDateRange: true
        },
        {
            value: 'AnimalHealth',
            label: t('animal_health'),
            icon: 'heart',
            color: '#ef4444',
            desc: t('animal_health_desc'),
            requiresDateRange: true
        },
        {
            value: 'HerdDemographics',
            label: t('demographics'),
            icon: 'people',
            color: '#10b981',
            desc: t('demographics_desc'),
            requiresDateRange: false
        },
        {
            value: 'TreatmentHistory',
            label: t('treatments_report'),
            icon: 'list',
            color: '#8b5cf6',
            desc: t('treatments_report_desc'),
            requiresDateRange: true
        },
        {
            value: 'MrlCompliance',
            label: t('mrl_compliance_report'),
            icon: 'shield-checkmark',
            color: '#f59e0b',
            desc: t('mrl_compliance_desc'),
            requiresDateRange: true
        }
    ];

    const handleGenerateReport = async () => {
        if (!selectedReport) return;

        setLoading(true);
        setReportData(null);

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
                    { label: t('total_treatments'), value: summary.totalTreatments, color: '#3b82f6' },
                    { label: t('unique_drugs'), value: summary.uniqueDrugs, color: '#10b981' },
                    { label: t('active_animals'), value: summary.activeAnimals, color: '#f59e0b' },
                    { label: t('avg_month'), value: summary.averagePerMonth, color: '#8b5cf6' }
                );
                break;
            case 'AnimalHealth':
                cards.push(
                    { label: t('total_animals'), value: summary.totalAnimals, color: '#3b82f6' },
                    { label: t('compliance_rate'), value: `${summary.complianceRate}%`, color: summary.complianceRate >= 90 ? '#10b981' : '#ef4444' },
                    { label: t('violations'), value: summary.mrlViolations, color: '#ef4444' },
                    { label: t('pass_rate'), value: `${((summary.testsPassed / (summary.testsPassed + summary.testsFailed || 1)) * 100).toFixed(1)}%`, color: '#10b981' }
                );
                break;
            case 'HerdDemographics':
                cards.push(
                    { label: t('total_animals'), value: summary.totalAnimals, color: '#3b82f6' },
                    { label: t('species_count'), value: summary.speciesCount, color: '#10b981' },
                    { label: t('avg_age'), value: `${summary.averageAge} yr`, color: '#f59e0b' },
                    { label: t('male_female'), value: `${summary.maleCount}/${summary.femaleCount}`, color: '#8b5cf6' }
                );
                break;
            case 'TreatmentHistory':
                cards.push(
                    { label: t('total_records'), value: summary.totalRecords, color: '#3b82f6' },
                    { label: t('total_treatments'), value: summary.totalTreatments, color: '#10b981' },
                    { label: t('feed_admin'), value: summary.totalFeedAdministrations, color: '#f59e0b' }
                );
                break;
            case 'MrlCompliance':
                cards.push(
                    { label: t('safe'), value: summary.safeAnimals, color: '#10b981' },
                    { label: t('in_withdrawal'), value: summary.inWithdrawal, color: '#f59e0b' },
                    { label: t('violations'), value: summary.violations, color: '#ef4444' },
                    { label: t('pass_rate'), value: `${summary.testPassRate}%`, color: '#3b82f6' }
                );
                break;
        }

        return (
            <View style={styles.summaryGrid}>
                {cards.map((card, index) => (
                    <View key={index} style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>{card.label}</Text>
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
                    <Text style={styles.emptyStateText}>{t('no_data_available')}</Text>
                </View>
            );
        }

        return (
            <View style={styles.dataList}>
                <Text style={styles.sectionTitle}>{t('details')}</Text>
                {reportData.data.slice(0, 50).map((item, index) => (
                    <View key={index} style={styles.dataItem}>
                        <View style={styles.dataItemContent}>
                            <Text style={styles.dataItemTitle}>
                                {item.name || item.drug || item.animalId || 'Record'}
                            </Text>
                            <Text style={styles.dataItemSubtitle}>
                                {item.value || item.usage || item.type || ''}
                            </Text>
                        </View>
                        {item.date && (
                            <Text style={styles.dataItemDate}>
                                {format(new Date(item.date), 'MMM d')}
                            </Text>
                        )}
                    </View>
                ))}
            </View>
        );
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('reports_title')}</Text>
                <Text style={styles.headerSubtitle}>{t('reports_subtitle')}</Text>
            </View>

            {/* Report Selection */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('select_report_type')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                    {REPORT_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.value}
                            style={[
                                styles.typeCard,
                                selectedReport?.value === type.value && styles.selectedTypeCard,
                                { borderColor: selectedReport?.value === type.value ? type.color : 'transparent' }
                            ]}
                            onPress={() => setSelectedReport(type)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: `${type.color}20` }]}>
                                <Ionicons name={type.icon} size={24} color={type.color} />
                            </View>
                            <Text style={styles.typeLabel}>{type.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Date Selection */}
            {selectedReport?.requiresDateRange && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('date_range')}</Text>
                    <View style={styles.dateRow}>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowStartPicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                            <Text style={styles.dateText}>{format(startDate, 'MMM d, yyyy')}</Text>
                        </TouchableOpacity>
                        <Ionicons name="arrow-forward" size={20} color="#9ca3af" />
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowEndPicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                            <Text style={styles.dateText}>{format(endDate, 'MMM d, yyyy')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Generate Button */}
            <View style={styles.section}>
                <TouchableOpacity
                    style={[
                        styles.generateButton,
                        (!selectedReport || loading) && styles.disabledButton
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
            </View>

            {/* Results */}
            {reportData && (
                <View style={styles.resultsContainer}>
                    <Text style={styles.resultsTitle}>
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
        backgroundColor: '#f3f4f6',
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#1e293b',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        color: '#94a3b8',
        marginTop: 4,
    },
    section: {
        padding: 20,
        paddingBottom: 0,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    typeScroll: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    typeCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        width: 120,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    selectedTypeCard: {
        backgroundColor: '#fff',
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
        color: '#374151',
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
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 8,
    },
    dateText: {
        fontSize: 14,
        color: '#374151',
    },
    generateButton: {
        backgroundColor: '#3b82f6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
    },
    disabledButton: {
        backgroundColor: '#93c5fd',
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
        color: '#1f2937',
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
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    dataList: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
    },
    dataItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dataItemContent: {
        flex: 1,
    },
    dataItemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    dataItemSubtitle: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    dataItemDate: {
        fontSize: 12,
        color: '#9ca3af',
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    emptyStateText: {
        color: '#6b7280',
    },
});

export default ReportsScreen;
