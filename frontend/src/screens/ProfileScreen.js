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
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={[COLORS.primary + '20', COLORS.background]}
                    style={styles.headerGradient}
                >
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                                </Text>
                            </View>
                            <View style={styles.roleBadge}>
                                <Shield color={COLORS.background} size={12} />
                                <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'USER'}</Text>
                            </View>
                        </View>
                        <Text style={styles.userName}>{user?.email ? user.email.split('@')[0] : 'User'}</Text>
                        <Text style={styles.userEmail}>{user?.email}</Text>
                    </View>
                </LinearGradient>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Details</Text>
                    <View style={styles.card}>
                        <View style={styles.infoRow}>
                            <User color={COLORS.textSecondary} size={20} />
                            <Text style={styles.infoText}>{user?.email ? user.email.split('@')[0] : 'User'}</Text>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.infoRow}>
                            <Mail color={COLORS.textSecondary} size={20} />
                            <Text style={styles.infoText}>{user?.email}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <View style={styles.card}>
                        {renderSettingItem(<Settings color={COLORS.text} size={22} />, 'App Settings', 'Theme, Language')}
                        <View style={styles.separator} />
                        {renderSettingItem(<Bell color={COLORS.text} size={22} />, 'Notifications', 'Push alerts, emails')}
                        {user?.role === 'user' && (
                            <>
                                <View style={styles.separator} />
                                {renderSettingItem(<CreditCard color={COLORS.text} size={22} />, 'Payment Methods', 'Cards, Chapa integration')}
                            </>
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support</Text>
                    <View style={styles.card}>
                        {renderSettingItem(<HelpCircle color={COLORS.text} size={22} />, 'Help & FAQ', 'Contact support team')}
                        <View style={styles.separator} />
                        {renderSettingItem(<LogOut color="#FF3B30" size={22} />, 'Log Out', null, true)}
                    </View>
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    headerGradient: {
        paddingBottom: 30,
    },
    profileHeader: {
        alignItems: 'center',
        paddingTop: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: COLORS.background,
    },
    avatarText: {
        color: COLORS.background,
        fontSize: 40,
        fontWeight: 'bold',
    },
    roleBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.background,
        gap: 4,
    },
    roleText: {
        color: COLORS.background,
        fontSize: 10,
        fontWeight: 'bold',
    },
    userName: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
        textTransform: 'capitalize',
    },
    userEmail: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    section: {
        paddingHorizontal: 24,
        marginTop: 24,
    },
    sectionTitle: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 12,
    },
    infoText: {
        color: COLORS.text,
        fontSize: 16,
    },
    separator: {
        height: 1,
        backgroundColor: '#333',
        my: 8,
        marginVertical: 8,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    settingIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingTextBox: {
        flex: 1,
    },
    settingTitle: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '500',
    },
    destructiveText: {
        color: '#FF3B30',
    },
    settingSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 13,
        marginTop: 2,
    },
});
