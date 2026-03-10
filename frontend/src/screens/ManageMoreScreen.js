import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { Tag, BarChart2, Settings, ChevronRight, LogOut, Info, Shield, HelpCircle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export default function ManageMoreScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { logout } = useAuth();

    const menuItems = [
        {
            title: 'Categories',
            subtitle: 'Organize your styles & services',
            icon: Tag,
            color: '#4CAF50',
            onPress: () => navigation.navigate('Categories')
        },
        {
            title: 'Reports',
            subtitle: 'View detailed business metrics',
            icon: BarChart2,
            color: '#2196F3',
            onPress: () => navigation.navigate('Reports')
        },
        {
            title: 'System Settings',
            subtitle: 'App preferences and configurations',
            icon: Settings,
            color: COLORS.primary,
            onPress: () => { } // Placeholder
        },
        {
            title: 'Security',
            subtitle: 'Access logs and permissions',
            icon: Shield,
            color: '#FF9800',
            onPress: () => { } // Placeholder
        },
    ];

    const supportItems = [
        { title: 'Help Center', icon: HelpCircle, onPress: () => { } },
        { title: 'App Info', icon: Info, onPress: () => { } },
    ];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.primary + '20', COLORS.background]}
                style={[styles.header, { paddingTop: insets.top + 20 }]}
            >
                <Text style={styles.title}>Management</Text>
                <Text style={styles.subtitle}>Extended Controls</Text>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            >
                <View style={styles.section}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuCard}
                            onPress={item.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                                <item.icon color={item.color} size={22} />
                            </View>
                            <View style={styles.menuInfo}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                            </View>
                            <ChevronRight color={COLORS.textSecondary} size={20} />
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionLabel}>Support & Info</Text>
                </View>

                <View style={styles.supportSection}>
                    {supportItems.map((item, index) => (
                        <TouchableOpacity key={index} style={styles.supportRow} onPress={item.onPress}>
                            <item.icon color={COLORS.textSecondary} size={20} />
                            <Text style={styles.supportText}>{item.title}</Text>
                            <ChevronRight color="#333" size={18} />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <LinearGradient
                        colors={['#F4433620', '#F4433610']}
                        style={styles.logoutGradient}
                    >
                        <LogOut color="#F44336" size={20} />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: 24, paddingBottom: 30 },
    title: { fontSize: 32, fontWeight: 'bold', color: COLORS.text },
    subtitle: { fontSize: 13, color: COLORS.primary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
    scrollContent: { padding: 24, paddingBottom: 100 },
    section: { marginBottom: 32 },
    menuCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333'
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    menuInfo: { flex: 1 },
    menuTitle: { color: COLORS.text, fontSize: 17, fontWeight: 'bold' },
    menuSubtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
    sectionTitleRow: { marginBottom: 16, marginLeft: 4 },
    sectionLabel: { color: COLORS.textSecondary, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    supportSection: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 8,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 32
    },
    supportRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16
    },
    supportText: { flex: 1, color: COLORS.text, fontSize: 16 },
    logoutBtn: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#F4433630' },
    logoutGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 12
    },
    logoutText: { color: '#F44336', fontSize: 16, fontWeight: 'bold' }
});
