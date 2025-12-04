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
import { useTheme } from '../../contexts/ThemeContext';

const MoreScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const { theme } = useTheme();

    const menuItems = [
        {
            section: t('treatment_records'), // Health & Treatments
            items: [
                { name: t('treatment_records'), icon: 'medkit', screen: 'Treatments', color: theme.primary },
                { name: t('mrl_compliance'), icon: 'shield-checkmark', screen: 'MRLCompliance', color: theme.success },
            ],
        },
        {
            section: t('compliance_inventory'), // Inventory & Feed
            items: [
                { name: t('drug_inventory'), icon: 'cube', screen: 'Inventory', color: theme.info },
                { name: t('feed_inventory'), icon: 'nutrition', screen: 'FeedInventory', color: theme.warning },
                { name: t('feed_administration'), icon: 'clipboard', screen: 'FeedAdmin', color: theme.primary },
                { name: t('sales'), icon: 'cart', screen: 'Sales', color: theme.success },
            ],
        },
        {
            section: t('reports_support'), // Analytics & Support
            items: [
                { name: t('reports'), icon: 'document-text', screen: 'Reports', color: theme.info },
                { name: t('support'), icon: 'help-circle', screen: 'RaiseTicket', color: theme.error },
            ],
        },
        {
            section: t('account'),
            items: [
                { name: t('settings'), icon: 'settings', screen: 'Settings', color: theme.subtext },
            ],
        },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Profile Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                <View style={[styles.profileIcon, { backgroundColor: `${theme.primary}20` }]}>
                    <Ionicons name="person" size={32} color={theme.primary} />
                </View>
                <View style={styles.profileInfo}>
                    <Text style={[styles.profileName, { color: theme.text }]}>{user?.farmOwner || 'Farmer'}</Text>
                    <Text style={[styles.profileEmail, { color: theme.subtext }]}>{user?.email}</Text>
                    <Text style={[styles.farmName, { color: theme.primary }]}>{user?.farmName || 'Your Farm'}</Text>
                </View>
            </View>

            {/* Menu Sections */}
            {menuItems.map((section, sectionIndex) => (
                <View key={sectionIndex} style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.subtext }]}>{section.section}</Text>
                    <View style={[styles.sectionCard, { backgroundColor: theme.card, shadowColor: theme.text }]}>
                        {section.items.map((item, itemIndex) => (
                            <TouchableOpacity
                                key={item.name}
                                style={[
                                    styles.menuItem,
                                    itemIndex < section.items.length - 1 && [styles.menuItemBorder, { borderBottomColor: theme.border }],
                                ]}
                                onPress={() => navigation.navigate(item.screen)}
                            >
                                <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}20` }]}>
                                    <Ionicons name={item.icon} size={22} color={item.color} />
                                </View>
                                <Text style={[styles.menuItemText, { color: theme.text }]}>{item.name}</Text>
                                <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ))}

            {/* Logout Button */}
            <TouchableOpacity
                style={[styles.logoutButton, { backgroundColor: theme.card, borderColor: `${theme.error}40` }]}
                onPress={logout}
            >
                <Ionicons name="log-out" size={20} color={theme.error} />
                <Text style={[styles.logoutText, { color: theme.error }]}>{t('logout')}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.subtext }]}>LivestockIQ v1.0.0</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        paddingTop: 40,
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
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
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 13,
        marginBottom: 4,
    },
    farmName: {
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    sectionCard: {
        borderRadius: 12,
        overflow: 'hidden',
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
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginTop: 24,
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 8,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    footerText: {
        fontSize: 12,
    },
});

export default MoreScreen;
