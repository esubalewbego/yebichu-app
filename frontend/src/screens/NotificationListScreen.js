import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { Bell, ChevronLeft, CheckCircle2, Clock, Calendar, Scissors, Info, Trash2 } from 'lucide-react-native';
import { getNotifications, markNotificationRead, clearNotifications } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function NotificationListScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const role = user?.role?.toLowerCase();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleClearAll = () => {
        if (notifications.length === 0) return;
        Alert.alert(
            "Clear Notifications",
            "Are you sure you want to clear all your notifications?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear All",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await clearNotifications();
                            setNotifications([]);
                        } catch (error) {
                            console.error('Failed to clear notifications:', error);
                            Alert.alert('Error', 'Failed to clear notifications.');
                        }
                    }
                }
            ]
        );
    };

    const handleNotificationPress = async (item) => {
        if (!item.read) {
            try {
                await markNotificationRead(item.id);
                setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
            } catch (error) {
                console.error('Failed to mark read:', error);
            }
        }

        // Deep navigation logic
        const type = item.type?.toLowerCase();

        if (type?.startsWith('booking_')) {
            if (role === 'admin') {
                navigation.navigate('AdminBookings');
            } else if (role === 'barber') {
                navigation.navigate('MainTabs', { screen: 'Active Jobs' });
            } else {
                navigation.navigate('MainTabs', { screen: 'My Bookings' });
            }
        } else if (type === 'chat_message') {
            navigation.navigate('Chat', {
                conversationId: item.entityId,
                userName: item.title.replace('New Message from ', '') || 'Chat'
            });
        } else if (type === 'new_user' && role === 'admin') {
            navigation.navigate('MainTabs', { screen: 'Users' });
        } else if (type === 'new_package' || type === 'new_style') {
            navigation.navigate('MainTabs', { screen: 'Home' });
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'booking_new': return <Calendar color={COLORS.primary} size={20} />;
            case 'booking_assigned': return <Scissors color={COLORS.primary} size={20} />;
            case 'booking_completed': return <CheckCircle2 color="#4CAF50" size={20} />;
            case 'booking_update': return <Clock color={COLORS.primary} size={20} />;
            default: return <Info color={COLORS.textSecondary} size={20} />;
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.notificationCard, !item.read && styles.unreadCard]}
            onPress={() => handleNotificationPress(item)}
        >
            <View style={[styles.iconBox, { backgroundColor: item.read ? COLORS.background : COLORS.primary + '15' }]}>
                {getIcon(item.type)}
            </View>
            <View style={styles.contentBox}>
                <View style={styles.headerRow}>
                    <Text style={[styles.title, !item.read && styles.unreadText]}>{item.title}</Text>
                    {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.time}>
                    {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : 'just now'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={[COLORS.primary + '20', COLORS.background]}
                style={styles.header}
            >
                <View style={[styles.headerRowMain, { justifyContent: 'space-between' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <ChevronLeft color={COLORS.text} size={28} />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.headerTitle}>Notifications</Text>
                            <Text style={styles.headerSub}>Stay updated with your activities</Text>
                        </View>
                    </View>
                    {notifications.length > 0 && (
                        <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
                            <Trash2 color={COLORS.primary} size={22} />
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>

            {loading && notifications.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={fetchNotifications} tintColor={COLORS.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Bell color={COLORS.textSecondary} size={64} style={{ opacity: 0.2 }} />
                            <Text style={styles.emptyText}>No notifications yet.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: 24, paddingBottom: 20 },
    headerRowMain: { flexDirection: 'row', alignItems: 'center' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    clearBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
    headerSub: { fontSize: 13, color: COLORS.textSecondary },
    list: { padding: 24, paddingTop: 0 },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    unreadCard: {
        borderColor: COLORS.primary + '50',
        backgroundColor: COLORS.card,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    contentBox: { flex: 1 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    title: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
    unreadText: { fontWeight: 'bold' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
    body: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 8 },
    time: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '500' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 100, gap: 16 },
    emptyText: { color: COLORS.textSecondary, fontSize: 16 },
});
