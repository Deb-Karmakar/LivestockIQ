// Mobile/src/screens/farmer/MoreScreen.js
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const MoreScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { t, language, changeLanguage } = useLanguage();

    const menuItems = [
        {
            section: t('treatment_records'), // Health & Treatments
            items: [
                { name: t('treatment_records'), icon: 'medkit', screen: 'Treatments', color: '#3b82f6' },
                { name: t('mrl_compliance'), icon: 'shield-checkmark', screen: 'MRLCompliance', color: '#10b981' },
            ],
        },
        {
            section: t('compliance_inventory'), // Inventory & Feed
            items: [
                { name: t('drug_inventory'), icon: 'cube', screen: 'Inventory', color: '#6366f1' },
                { name: t('feed_inventory'), icon: 'nutrition', screen: 'FeedInventory', color: '#f59e0b' },
                { name: t('feed_administration'), icon: 'clipboard', screen: 'FeedAdmin', color: '#8b5cf6' },
            ],
        },
        {
            section: t('reports_support'), // Analytics & Support
            items: [
                { name: t('reports'), icon: 'document-text', screen: 'Reports', color: '#06b6d4' },
                { name: t('support'), icon: 'help-circle', screen: 'RaiseTicket', color: '#ef4444' },
            ],
        },
        {
            section: t('account'),
            items: [
                { name: t('settings'), icon: 'settings', screen: 'Settings', color: '#6b7280' },
            ],
        },
    ];

    return (
        <ScrollView style={styles.container}>
            {/* Profile Header */}
            <View style={styles.header}>
                <View style={styles.profileIcon}>
                    <Ionicons name="person" size={32} color="#fff" />
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{user?.farmOwner || 'Farmer'}</Text>
                    <Text style={styles.profileEmail}>{user?.email}</Text>
                    <Text style={styles.farmName}>{user?.farmName || 'Your Farm'}</Text>
                </View>
            </View>

            {/* Menu Sections */}
            {menuItems.map((section, sectionIndex) => (
                <View key={sectionIndex} style={styles.section}>
                    <Text style={styles.sectionTitle}>{section.section}</Text>
                    <View style={styles.sectionCard}>
                        {section.items.map((item, itemIndex) => (
                            <TouchableOpacity
                                key={item.name}
                                style={[
                                    styles.menuItem,
                                    itemIndex < section.items.length - 1 && styles.menuItemBorder,
                                ]}
                                onPress={() => navigation.navigate(item.screen)}
                            >
                                <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}20` }]}>
                                    <Ionicons name={item.icon} size={22} color={item.color} />
                                </View>
                                <Text style={styles.menuItemText}>{item.name}</Text>
                                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ))}

            {/* Language Toggle Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('language')}</Text>
                <View style={styles.sectionCard}>
                    <TouchableOpacity
                        style={[styles.menuItem, language === 'en' && styles.selectedLang]}
                        onPress={() => changeLanguage('en')}
                    >
                        <View style={[styles.menuIconContainer, { backgroundColor: '#e0f2fe' }]}>
                            <Text style={{ fontSize: 18 }}>🇺🇸</Text>
                        </View>
                        <Text style={styles.menuItemText}>{t('english')}</Text>
                        {language === 'en' && <Ionicons name="checkmark" size={20} color="#10b981" />}
                    </TouchableOpacity>
                    <View style={styles.menuItemBorder} />
                    <TouchableOpacity
                        style={[styles.menuItem, language === 'hi' && styles.selectedLang]}
                        onPress={() => changeLanguage('hi')}
                    >
                        <View style={[styles.menuIconContainer, { backgroundColor: '#ffedd5' }]}>
                            <Text style={{ fontSize: 18 }}>🇮🇳</Text>
                        </View>
                        <Text style={styles.menuItemText}>{t('hindi')}</Text>
                        {language === 'hi' && <Ionicons name="checkmark" size={20} color="#10b981" />}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Ionicons name="log-out" size={20} color="#ef4444" />
                <Text style={styles.logoutText}>{t('logout')}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>LivestockIQ v1.0.0</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        backgroundColor: '#1e293b',
        padding: 24,
        paddingTop: 40,
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 13,
        color: '#cbd5e1',
        marginBottom: 4,
    },
    farmName: {
        fontSize: 14,
        color: '#10b981',
        fontWeight: '600',
    },
    section: {
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuItemText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: '#1f2937',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 24,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#ef4444',
        marginLeft: 8,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#9ca3af',
    },
    selectedLang: {
        backgroundColor: '#f0fdf4',
    }
});

export default MoreScreen;
