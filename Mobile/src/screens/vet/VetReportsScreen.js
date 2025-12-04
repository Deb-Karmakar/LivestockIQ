import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    getVetPracticeOverviewData,
    getVetPrescriptionAnalyticsData,
    getVetFarmSupervisionData,
    getVetComplianceMonitoringData,
    getVetWhoAwareStewardshipData
} from '../../services/vetService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNetwork } from '../../contexts/NetworkContext';

const ReportTypeCard = ({ title, description, icon, isSelected, onPress, theme }) => (
    <TouchableOpacity
        style={[
            styles.reportTypeCard,
            { backgroundColor: theme.card, borderColor: theme.border },
            isSelected && { backgroundColor: `${theme.primary}10`, borderColor: theme.primary }
        ]}
        onPress={onPress}
    >
        <View style={[
            styles.reportIconContainer,
            { backgroundColor: `${theme.primary}10` },
            isSelected && { backgroundColor: theme.primary }
        ]}>
            <Ionicons name={icon} size={24} color={isSelected ? '#fff' : theme.primary} />
        </View>
        <View style={styles.reportTextContainer}>
            <Text style={[
                styles.reportTypeTitle,
                { color: theme.text },
                isSelected && { color: theme.primary }
            ]}>{title}</Text>
            <Text style={[
                styles.reportTypeDesc,
                { color: theme.subtext },
                isSelected && { color: theme.primary }
            ]}>{description}</Text>
        </View>
    </TouchableOpacity>
);

const SummaryCard = ({ label, value, icon, trend, t, theme }) => (
    <View style={[styles.summaryCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <View style={styles.summaryHeader}>
            <Text style={[styles.summaryLabel, { color: theme.subtext }]}>{label}</Text>
            {icon && <Ionicons name={icon} size={16} color={theme.subtext} />}
        </View>
        <Text style={[styles.summaryValue, { color: theme.text }]}>{value}</Text>
        {trend && (
            <View style={[styles.trendBadge, { backgroundColor: trend === 'up' ? `${theme.success}20` : `${theme.error}20` }]}>
                <Ionicons
                    name={trend === 'up' ? 'trending-up' : 'trending-down'}
                    size={12}
                    color={trend === 'up' ? theme.success : theme.error}
                />
                <Text style={[styles.trendText, { color: trend === 'up' ? theme.success : theme.error }]}>
                    {trend === 'up' ? t('positive') : t('negative')}
                </Text>
            </View>
        )}
    </View>
);

const VetReportsScreen = () => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const { isConnected } = useNetwork();
    const [selectedReportType, setSelectedReportType] = useState(null);
    const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);

    const reportTypes = [
        {
            value: 'PracticeOverview',
            label: t('practice_overview'),
            icon: 'medkit',
            desc: t('practice_stats')
        },
        {
            value: 'PrescriptionAnalytics',
            label: t('prescription_analytics'),
            icon: 'flask',
            desc: t('drug_usage_analysis')
        },
        {
            value: 'FarmSupervision',
            label: t('farm_supervision'),
            icon: 'business',
            desc: t('supervised_farms_status')
        },
        {
            value: 'WhoAwareStewardship',
            label: t('who_aware'),
            icon: 'shield-checkmark',
            desc: t('stewardship_monitoring')
        }
    ];

    const handleGenerateReport = async () => {
        if (!selectedReportType) {
            Alert.alert(t('selection_required'), t('select_report_error'));
            return;
        }

        setLoading(true);
        try {
            const from = startDate.toISOString();
            const to = endDate.toISOString();
            let data = null;

            switch (selectedReportType) {
                case 'PracticeOverview':
                    data = await getVetPracticeOverviewData(from, to);
                    break;
                case 'PrescriptionAnalytics':
                    data = await getVetPrescriptionAnalyticsData(from, to);
                    break;
                case 'FarmSupervision':
                    data = await getVetFarmSupervisionData(from, to);
                    break;
                case 'WhoAwareStewardship':
                    data = await getVetWhoAwareStewardshipData(from, to);
                    break;
            }
            setReportData(data);
        } catch (error) {
            console.error('Report generation error:', error);
            Alert.alert(t('error'), t('failed_generate'));
        } finally {
            setLoading(false);
        }
    };

    const renderSummary = () => {
        if (!reportData?.summary) return null;
        const { summary } = reportData;
        let cards = [];

        switch (reportData.reportType) {
            case 'PracticeOverview':
                cards = [
                    { label: t('supervised_farms'), value: summary.supervisedFarms, icon: 'business' },
                    { label: t('total_prescriptions'), value: summary.totalPrescriptions, icon: 'medkit' },
                    { label: t('approval_rate'), value: `${summary.approvalRate}%`, icon: 'checkmark-circle', trend: summary.approvalRate >= 90 ? 'up' : 'down' },
                    { label: t('feed_prescriptions'), value: summary.feedPrescriptions, icon: 'nutrition' }
                ];
                break;
            case 'PrescriptionAnalytics':
                cards = [
                    { label: t('total_prescriptions'), value: summary.totalPrescriptions, icon: 'medkit' },
                    { label: t('unique_drugs'), value: summary.uniqueDrugs, icon: 'flask' },
                    { label: t('species_treated'), value: summary.speciesTreated, icon: 'paw' },
                    { label: t('access_group'), value: summary.accessCount, icon: 'shield' }
                ];
                break;
            case 'FarmSupervision':
                cards = [
                    { label: t('total_farms'), value: summary.totalFarms, icon: 'business' },
                    { label: t('total_treatments'), value: summary.totalTreatments, icon: 'medkit' },
                    { label: t('total_alerts'), value: summary.totalAlerts, icon: 'alert-circle' },
                    { label: t('farms_alerts'), value: summary.farmsWithAlerts, icon: 'warning' }
                ];
                break;
            case 'WhoAwareStewardship':
                cards = [
                    { label: t('access_group'), value: summary.accessCount, icon: 'shield-checkmark' },
                    { label: t('watch_group'), value: summary.watchCount, icon: 'eye' },
                    { label: t('reserve_group'), value: summary.reserveCount, icon: 'alert-circle' },
                    { label: t('stewardship_score'), value: `${summary.stewardshipScore}%`, icon: 'ribbon', trend: summary.stewardshipScore >= 80 ? 'up' : 'down' }
                ];
                break;
        }

        return (
            <View style={styles.summaryGrid}>
                {cards.map((card, index) => (
                    <SummaryCard key={index} {...card} t={t} theme={theme} />
                ))}
            </View>
        );
    };

    const renderDataList = () => {
        if (!reportData?.data?.length) return (
            <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: theme.subtext }]}>{t('no_data')}</Text>
            </View>
        );

        return (
            <View style={styles.dataList}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('detailed_data')}</Text>
                {reportData.data.slice(0, 10).map((item, index) => (
                    <View key={index} style={[styles.dataItem, { borderBottomColor: theme.border }]}>
                        <View>
                            <Text style={[styles.dataItemTitle, { color: theme.text }]}>{item.name || item.farmName || 'Unknown'}</Text>
                            <Text style={[styles.dataItemSubtitle, { color: theme.subtext }]}>
                                {item.farmOwner ? `Owner: ${item.farmOwner}` : ''}
                            </Text>
                        </View>
                        <Text style={[styles.dataItemValue, { color: theme.primary }]}>
                            {item.value || item.count || item.treatments || item.prescriptions || 0}
                        </Text>
                    </View>
                ))}
                {reportData.data.length > 10 && (
                    <Text style={[styles.moreText, { color: theme.subtext }]}>{t('more_items', { count: reportData.data.length - 10 })}</Text>
                )}
            </View>
        );
    };

    const onStartDateChange = (event, selectedDate) => {
        setShowStartPicker(Platform.OS === 'ios');
        if (selectedDate) setStartDate(selectedDate);
    };

    const onEndDateChange = (event, selectedDate) => {
        setShowEndPicker(Platform.OS === 'ios');
        if (selectedDate) setEndDate(selectedDate);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.headerTopRow}>
                        <Ionicons name="stats-chart" size={20} color="#60a5fa" />
                        <Text style={styles.headerLabel}>{t('reports_analytics')}</Text>
                    </View>
                    <Text style={styles.welcomeText}>{t('practice_insights')}</Text>
                    <Text style={styles.subText}>{t('generate_analyze')}</Text>
                    {!isConnected && (
                        <Text style={{ color: theme.warning, marginTop: 8, fontSize: 12 }}>
                            {t('offline_mode_cached_data')}
                        </Text>
                    )}
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Report Type Selection */}
                <Text style={[styles.sectionHeader, { color: theme.text }]}>{t('select_report_type')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                    {reportTypes.map((type) => (
                        <ReportTypeCard
                            key={type.value}
                            title={type.label}
                            description={type.desc}
                            icon={type.icon}
                            isSelected={selectedReportType === type.value}
                            onPress={() => setSelectedReportType(type.value)}
                            theme={theme}
                        />
                    ))}
                </ScrollView>

                {/* Date Selection */}
                <View style={styles.dateSection}>
                    <View style={styles.datePickerContainer}>
                        <Text style={[styles.dateLabel, { color: theme.subtext }]}>{t('from')}</Text>
                        <TouchableOpacity onPress={() => setShowStartPicker(true)} style={[styles.dateButton, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Ionicons name="calendar-outline" size={20} color={theme.subtext} />
                            <Text style={[styles.dateText, { color: theme.text }]}>{startDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                        {showStartPicker && (
                            <DateTimePicker
                                value={startDate}
                                mode="date"
                                display="default"
                                onChange={onStartDateChange}
                                maximumDate={new Date()}
                            />
                        )}
                    </View>
                    <View style={styles.datePickerContainer}>
                        <Text style={[styles.dateLabel, { color: theme.subtext }]}>{t('to')}</Text>
                        <TouchableOpacity onPress={() => setShowEndPicker(true)} style={[styles.dateButton, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Ionicons name="calendar-outline" size={20} color={theme.subtext} />
                            <Text style={[styles.dateText, { color: theme.text }]}>{endDate.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                        {showEndPicker && (
                            <DateTimePicker
                                value={endDate}
                                mode="date"
                                display="default"
                                onChange={onEndDateChange}
                                minimumDate={startDate}
                                maximumDate={new Date()}
                            />
                        )}
                    </View>
                </View>

                <TouchableOpacity
                    style={[
                        styles.generateButton,
                        { backgroundColor: theme.primary },
                        (!selectedReportType || loading) && { backgroundColor: theme.subtext }
                    ]}
                    onPress={handleGenerateReport}
                    disabled={!selectedReportType || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="download-outline" size={20} color="#fff" />
                            <Text style={styles.generateButtonText}>{t('generate_report')}</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Results */}
                {reportData && (
                    <View style={[styles.resultsContainer, { backgroundColor: theme.card }]}>
                        <Text style={[styles.sectionHeader, { color: theme.text }]}>{t('report_summary')}</Text>
                        <Text style={[styles.resultDate, { color: theme.subtext }]}>{t('generated_on', { date: new Date().toLocaleString() })}</Text>
                        {renderSummary()}
                        {renderDataList()}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, paddingTop: 60, paddingBottom: 24 },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    headerLabel: { color: '#60a5fa', fontSize: 14, fontWeight: '600' },
    welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    subText: { color: '#94a3b8', fontSize: 14 },
    content: { flex: 1, padding: 16 },
    sectionHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, marginTop: 8 },
    typeScroll: { marginBottom: 20 },
    reportTypeCard: {
        padding: 16,
        borderRadius: 12,
        marginRight: 12,
        width: 160,
        borderWidth: 1,
        height: 140,
        justifyContent: 'space-between'
    },
    reportIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    reportTypeTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
    reportTypeDesc: { fontSize: 11 },
    dateSection: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    datePickerContainer: { flex: 1 },
    dateLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8
    },
    dateText: { fontSize: 14 },
    generateButton: {
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24
    },
    generateButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    resultsContainer: { borderRadius: 16, padding: 16, marginBottom: 20 },
    resultDate: { fontSize: 12, marginBottom: 16 },
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    summaryCard: {
        width: '48%',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1
    },
    summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { fontSize: 11, fontWeight: '600' },
    summaryValue: { fontSize: 18, fontWeight: 'bold' },
    trendBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4, gap: 4 },
    trendText: { fontSize: 10, fontWeight: '600' },
    dataList: { marginTop: 16 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
    dataItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1
    },
    dataItemTitle: { fontSize: 14, fontWeight: '600' },
    dataItemSubtitle: { fontSize: 12 },
    dataItemValue: { fontSize: 14, fontWeight: 'bold' },
    moreText: { textAlign: 'center', fontSize: 12, marginTop: 12, fontStyle: 'italic' },
    emptyState: { padding: 24, alignItems: 'center' },
    emptyText: { fontSize: 14 }
});

export default VetReportsScreen;
