import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { User, Mail, Shield, LogOut, ChevronRight, Settings, Bell, CreditCard, HelpCircle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await logout();
                        } catch (error) {
                            console.error('Logout failed', error);
                        }
                    }
                }
            ]
        );
    };

    const renderSettingItem = (icon, title, subtitle = null, isDestructive = false) => (
        <TouchableOpacity style={styles.settingItem} onPress={isDestructive ? handleLogout : undefined}>
            <View style={styles.settingIconBox}>
                {icon}
            </View>
            <View style={styles.settingTextBox}>
                <Text style={[styles.settingTitle, isDestructive && styles.destructiveText]}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {!isDestructive && <ChevronRight color={COLORS.textSecondary} size={20} />}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top, paddingBottom: insets.bottom + 40 }
                ]}
            >
                <LinearGradient
                    colors={[COLORS.primary + '25', COLORS.background]}
                    style={styles.heroSection}
                >
                    <View style={styles.profileBox}>
                        <View style={styles.avatarLarge}>
                            <Text style={styles.avatarTxt}>
                                {user?.email ? user.email.charAt(0).toUpperCase() : 'Y'}
                            </Text>
                            <View style={styles.rankBadge}>
                                <Shield color="#000" size={12} fill="#000" />
                            </View>
                        </View>
                        <Text style={styles.profileName}>{user?.email ? user.email.split('@')[0] : 'Valued Client'}</Text>
                        <Text style={styles.profileEmail}>{user?.email}</Text>

                        <View style={styles.statsRow}>
                            <View style={styles.stat}>
                                <Text style={styles.statVal}>12</Text>
                                <Text style={styles.statLab}>Visits</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.stat}>
                                <Text style={styles.statVal}>4</Text>
                                <Text style={styles.statLab}>Faves</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.settingsGroup}>
                    <Text style={styles.groupLabel}>ACCOUNT MANAGEMENT</Text>
                    <View style={styles.settingsCard}>
                        {renderSettingItem(<Settings color={COLORS.primary} size={20} />, 'Profile Preferences', 'Personalize your experience')}
                        <View style={styles.divider} />
                        {renderSettingItem(<Bell color={COLORS.primary} size={20} />, 'Push Notifications', 'Manage arrival alerts')}
                        {user?.role === 'user' && (
                            <>
                                <View style={styles.divider} />
                                {renderSettingItem(<CreditCard color={COLORS.primary} size={20} />, 'Stored Payments', 'Fast checkout setup')}
                            </>
                        )}
                    </View>
                </View>

                <View style={styles.settingsGroup}>
                    <Text style={styles.groupLabel}>PREMIUM SUPPORT</Text>
                    <View style={styles.settingsCard}>
                        {renderSettingItem(<HelpCircle color={COLORS.textSecondary} size={20} />, 'Concierge Help', 'Chat with our support team')}
                        <View style={styles.divider} />
                        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
                            <View style={styles.logoutIconBox}>
                                <LogOut color="#F44336" size={20} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.logoutTitle}>Terminate Session</Text>
                                <Text style={styles.logoutSub}>Securely log out of your account</Text>
                            </View>
                            <ChevronRight color="#333" size={18} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { paddingBottom: 100 },
    heroSection: { paddingVertical: 40, alignItems: 'center', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
    profileBox: { alignItems: 'center', width: '100%' },
    avatarLarge: {
        width: 110, height: 110, borderRadius: 55,
        backgroundColor: COLORS.primary,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 4, borderColor: COLORS.background,
        elevation: 10, shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3, shadowRadius: 10
    },
    avatarTxt: { color: COLORS.background, fontSize: 44, fontWeight: 'bold' },
    rankBadge: {
        position: 'absolute', bottom: 2, right: 2,
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: COLORS.primary,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: COLORS.background
    },
    profileName: { color: COLORS.text, fontSize: 26, fontWeight: 'bold', marginTop: 16, textTransform: 'capitalize' },
    profileEmail: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
    statsRow: {
        flexDirection: 'row', alignItems: 'center',
        marginTop: 24, backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 28, paddingVertical: 14, borderRadius: 20
    },
    stat: { alignItems: 'center', paddingHorizontal: 16 },
    statVal: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
    statLab: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2, textTransform: 'uppercase' },
    statDivider: { width: 1, height: 20, backgroundColor: '#333' },
    settingsGroup: { paddingHorizontal: 24, marginTop: 32 },
    groupLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 16, marginLeft: 4 },
    settingsCard: { backgroundColor: COLORS.card, borderRadius: 24, padding: 8, borderWidth: 1, borderColor: '#333' },
    settingItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 16 },
    settingIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    settingTextBox: { flex: 1 },
    settingTitle: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
    settingSubtitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
    divider: { height: 1, backgroundColor: '#333', marginHorizontal: 12, marginVertical: 4 },
    logoutRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 16 },
    logoutIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F4433610', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F4433620' },
    logoutTitle: { color: '#F44336', fontSize: 16, fontWeight: 'bold' },
    logoutSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 }
});
