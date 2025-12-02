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

const ReportTypeCard = ({ title, description, icon, isSelected, onPress }) => (
    <TouchableOpacity
        style={[styles.reportTypeCard, isSelected && styles.reportTypeCardSelected]}
        onPress={onPress}
    >
        <View style={[styles.reportIconContainer, isSelected && styles.reportIconContainerSelected]}>
            <Ionicons name={icon} size={24} color={isSelected ? '#fff' : '#3b82f6'} />
        </View>
        <View style={styles.reportTextContainer}>
            <Text style={[styles.reportTypeTitle, isSelected && styles.reportTypeTitleSelected]}>{title}</Text>
            <Text style={[styles.reportTypeDesc, isSelected && styles.reportTypeDescSelected]}>{description}</Text>
        </View>
    </TouchableOpacity>
);

const SummaryCard = ({ label, value, icon, trend }) => (
    <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
            <Text style={styles.summaryLabel}>{label}</Text>
            {icon && <Ionicons name={icon} size={16} color="#64748b" />}
        </View>
        <Text style={styles.summaryValue}>{value}</Text>
        {trend && (
            <View style={[styles.trendBadge, { backgroundColor: trend === 'up' ? '#dcfce7' : '#fee2e2' }]}>
                <Ionicons
                    name={trend === 'up' ? 'trending-up' : 'trending-down'}
                    size={12}
                    color={trend === 'up' ? '#16a34a' : '#ef4444'}
                />
                <Text style={[styles.trendText, { color: trend === 'up' ? '#16a34a' : '#ef4444' }]}>
                    {trend === 'up' ? 'Positive' : 'Negative'}
                </Text>
            </View>
        )}
    </View>
);

const VetReportsScreen = () => {
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
            label: 'Practice Overview',
            icon: 'medkit',
            desc: 'Practice stats & activity'
        },
        {
            value: 'PrescriptionAnalytics',
            label: 'Prescription Analytics',
            icon: 'flask',
            desc: 'Drug usage analysis'
        },
        {
            value: 'FarmSupervision',
            label: 'Farm Supervision',
            icon: 'business',
            desc: 'Supervised farms status'
        },
        {
            value: 'WhoAwareStewardship',
            label: 'WHO AWaRe',
            icon: 'shield-checkmark',
            desc: 'Stewardship monitoring'
        }
    ];

    const handleGenerateReport = async () => {
        if (!selectedReportType) {
            Alert.alert('Selection Required', 'Please select a report type');
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
            Alert.alert('Error', 'Failed to generate report');
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
                    { label: 'Supervised Farms', value: summary.supervisedFarms, icon: 'business' },
                    { label: 'Total Prescriptions', value: summary.totalPrescriptions, icon: 'medkit' },
                    { label: 'Approval Rate', value: `${summary.approvalRate}%`, icon: 'checkmark-circle', trend: summary.approvalRate >= 90 ? 'up' : 'down' },
                    { label: 'Feed Prescriptions', value: summary.feedPrescriptions, icon: 'nutrition' }
                ];
                break;
            case 'PrescriptionAnalytics':
                cards = [
                    { label: 'Total Prescriptions', value: summary.totalPrescriptions, icon: 'medkit' },
                    { label: 'Unique Drugs', value: summary.uniqueDrugs, icon: 'flask' },
                    { label: 'Species Treated', value: summary.speciesTreated, icon: 'paw' },
                    { label: 'Access Group', value: summary.accessCount, icon: 'shield' }
                ];
                break;
            case 'FarmSupervision':
                cards = [
                    { label: 'Total Farms', value: summary.totalFarms, icon: 'business' },
                    { label: 'Total Treatments', value: summary.totalTreatments, icon: 'medkit' },
                    { label: 'Total Alerts', value: summary.totalAlerts, icon: 'alert-circle' },
                    { label: 'Farms w/ Alerts', value: summary.farmsWithAlerts, icon: 'warning' }
                ];
                break;
            case 'WhoAwareStewardship':
                cards = [
                    { label: 'Access Group', value: summary.accessCount, icon: 'shield-checkmark' },
                    { label: 'Watch Group', value: summary.watchCount, icon: 'eye' },
                    { label: 'Reserve Group', value: summary.reserveCount, icon: 'alert-circle' },
                    { label: 'Stewardship Score', value: `${summary.stewardshipScore}%`, icon: 'ribbon', trend: summary.stewardshipScore >= 80 ? 'up' : 'down' }
                ];
                break;
        }

        return (
            <View style={styles.summaryGrid}>
                {cards.map((card, index) => (
                    <SummaryCard key={index} {...card} />
                ))}
            </View>
        );
    };

    const renderDataList = () => {
        if (!reportData?.data?.length) return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No data available for this period</Text>
            </View>
        );

        return (
            <View style={styles.dataList}>
                <Text style={styles.sectionTitle}>Detailed Data</Text>
                {reportData.data.slice(0, 10).map((item, index) => (
                    <View key={index} style={styles.dataItem}>
                        <View>
                            <Text style={styles.dataItemTitle}>{item.name || item.farmName || 'Unknown'}</Text>
                            <Text style={styles.dataItemSubtitle}>
                                {item.farmOwner ? `Owner: ${item.farmOwner}` : ''}
                            </Text>
                        </View>
                        <Text style={styles.dataItemValue}>
                            {item.value || item.count || item.treatments || item.prescriptions || 0}
                        </Text>
                    </View>
                ))}
                {reportData.data.length > 10 && (
                    <Text style={styles.moreText}>+ {reportData.data.length - 10} more items</Text>
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
        <View style={styles.container}>
            <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
                <View style={styles.headerContent}>
                    <View style={styles.headerTopRow}>
                        <Ionicons name="stats-chart" size={20} color="#60a5fa" />
                        <Text style={styles.headerLabel}>Reports & Analytics</Text>
                    </View>
                    <Text style={styles.welcomeText}>Practice Insights</Text>
                    <Text style={styles.subText}>Generate reports and analyze your practice data.</Text>
                </View>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Report Type Selection */}
                <Text style={styles.sectionHeader}>Select Report Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                    {reportTypes.map((type) => (
                        <ReportTypeCard
                            key={type.value}
                            title={type.label}
                            description={type.desc}
                            icon={type.icon}
                            isSelected={selectedReportType === type.value}
                            onPress={() => setSelectedReportType(type.value)}
                        />
                    ))}
                </ScrollView>

                {/* Date Selection */}
                <View style={styles.dateSection}>
                    <View style={styles.datePickerContainer}>
                        <Text style={styles.dateLabel}>From</Text>
                        <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
                            <Ionicons name="calendar-outline" size={20} color="#64748b" />
                            <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
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
                        <Text style={styles.dateLabel}>To</Text>
                        <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
                            <Ionicons name="calendar-outline" size={20} color="#64748b" />
                            <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
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
                    style={[styles.generateButton, (!selectedReportType || loading) && styles.generateButtonDisabled]}
                    onPress={handleGenerateReport}
                    disabled={!selectedReportType || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="download-outline" size={20} color="#fff" />
                            <Text style={styles.generateButtonText}>Generate Report</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Results */}
                {reportData && (
                    <View style={styles.resultsContainer}>
                        <Text style={styles.sectionHeader}>Report Summary</Text>
                        <Text style={styles.resultDate}>Generated on {new Date().toLocaleString()}</Text>
                        {renderSummary()}
                        {renderDataList()}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6' },
    header: { padding: 20, paddingTop: 60, paddingBottom: 24 },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    headerLabel: { color: '#60a5fa', fontSize: 14, fontWeight: '600' },
    welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
    subText: { color: '#94a3b8', fontSize: 14 },
    content: { flex: 1, padding: 16 },
    sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, marginTop: 8 },
    typeScroll: { marginBottom: 20 },
    reportTypeCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginRight: 12,
        width: 160,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        height: 140,
        justifyContent: 'space-between'
    },
    reportTypeCardSelected: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
    reportIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    reportIconContainerSelected: { backgroundColor: '#3b82f6' },
    reportTypeTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
    reportTypeTitleSelected: { color: '#1e40af' },
    reportTypeDesc: { fontSize: 11, color: '#64748b' },
    reportTypeDescSelected: { color: '#3b82f6' },
    dateSection: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    datePickerContainer: { flex: 1 },
    dateLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 8
    },
    dateText: { fontSize: 14, color: '#1e293b' },
    generateButton: {
        backgroundColor: '#3b82f6',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24
    },
    generateButtonDisabled: { backgroundColor: '#94a3b8' },
    generateButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    resultsContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20 },
    resultDate: { fontSize: 12, color: '#64748b', marginBottom: 16 },
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    summaryCard: {
        width: '48%',
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
    summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    trendBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4, gap: 4 },
    trendText: { fontSize: 10, fontWeight: '600' },
    dataList: { marginTop: 16 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
    dataItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    dataItemTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
    dataItemSubtitle: { fontSize: 12, color: '#64748b' },
    dataItemValue: { fontSize: 14, fontWeight: 'bold', color: '#3b82f6' },
    moreText: { textAlign: 'center', color: '#64748b', fontSize: 12, marginTop: 12, fontStyle: 'italic' },
    emptyState: { padding: 24, alignItems: 'center' },
    emptyText: { color: '#94a3b8', fontSize: 14 }
});

export default VetReportsScreen;
