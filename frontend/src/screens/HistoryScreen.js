import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { CalendarCheck, Clock, CheckCircle2, ChevronRight, Scissors, AlertCircle, XCircle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { getUserAppointments } from '../services/api';

export default function HistoryScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data } = await getUserAppointments(user?.uid || user?.id);
            setAppointments(data);
        } catch (error) {
            console.error('Failed to fetch History Data:', error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        try {
            // Reusing the update status endpoint for simplicity 
            // In a real app we might have a specific cancel endpoint for customers
            const { updateAppointmentStatus } = require('../services/api');
            await updateAppointmentStatus(id, 'cancelled');
            setAppointments(prev => prev.map(appt => appt.id === id ? { ...appt, status: 'cancelled' } : appt));
        } catch (error) {
            console.error(error);
        }
    };

    const onRefresh = () => {
        setLoading(true);
        fetchHistory();
    };

    const renderItem = ({ item }) => (
        <View style={styles.cardContainer}>
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
                <View style={[styles.iconBox, item.status === 'completed' ? styles.statusCompleted : styles.statusPending]}>
                    <CalendarCheck color={item.status === 'completed' ? '#4CAF50' : COLORS.primary} size={24} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.itemName}>{item.name || item.package?.name || item.service}</Text>
                    <View style={styles.dateTimeRow}>
                        <Clock color={COLORS.textSecondary} size={14} />
                        <Text style={styles.dateTimeText}>{item.date} • {item.time}</Text>
                    </View>
                </View>
                <View style={styles.cardTrailing}>
                    <View style={[styles.badge, item.status === 'completed' ? styles.badgeSuccess : styles.badgePending]}>
                        <Text style={[styles.badgeText, item.status === 'completed' ? styles.textSuccess : styles.textPending]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
            {item.status === 'pending' && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
                    <XCircle color="#F44336" size={16} />
                    <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <LinearGradient
                colors={[COLORS.primary + '20', COLORS.background]}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Appointments</Text>
                    <Text style={styles.headerSub}>Manage your salon visits</Text>
                </View>
            </LinearGradient>

            <FlatList
                data={appointments}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <AlertCircle color={COLORS.textSecondary} size={48} />
                        </View>
                        <Text style={styles.emptyText}>No appointments found.</Text>
                        <TouchableOpacity style={styles.bookNowBtn}>
                            <Text style={styles.bookNowText}>Book Your First Session</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 30,
    },
    headerGradient: {
        paddingBottom: 0,
    },
    headerTitle: {
        color: COLORS.text,
        fontSize: 32,
        fontWeight: 'bold',
    },
    headerSub: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    listContent: {
        padding: 24,
        paddingTop: 0,
    },
    card: {
        backgroundColor: COLORS.card,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    statusCompleted: {
        backgroundColor: '#4CAF5015',
    },
    statusPending: {
        backgroundColor: COLORS.primary + '15',
    },
    cardInfo: {
        flex: 1,
    },
    itemName: {
        color: COLORS.text,
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    dateTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateTimeText: {
        color: COLORS.textSecondary,
        fontSize: 13,
    },
    cardTrailing: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    badgeSuccess: {
        backgroundColor: '#4CAF5015',
    },
    badgePending: {
        backgroundColor: COLORS.primary + '20',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    textSuccess: {
        color: '#4CAF50',
    },
    textPending: {
        color: COLORS.primary,
    },
    cardContainer: {
        marginBottom: 16,
    },
    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#F4433615',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: '#333',
        marginTop: -20, // Overlap with card above
        paddingTop: 24, // Account for overlap
        gap: 8,
    },
    cancelBtnText: {
        color: '#F44336',
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.card,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    emptyText: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 24,
    },
    bookNowBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    bookNowText: {
        color: COLORS.background,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
