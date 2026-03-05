import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Scissors, Clock, CheckCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { getBarberAppointments, updateAppointmentStatus as updateStatus } from '../services/api';

export default function BarberDashboard() {
    const { user, logout } = useAuth();
    const insets = useSafeAreaInsets();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    if (user?.role !== 'barber') {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: COLORS.text, fontSize: 18 }}>Access Denied</Text>
            </View>
        );
    }

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            const { data } = await getBarberAppointments(user?.uid || user?.id);
            setAppointments(data);
        } catch (error) {
            console.error('Failed to fetch Barber Schedule:', error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const markAsCompleted = async (id) => {
        try {
            await updateStatus(id, 'completed');
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a));
            Alert.alert('Success', 'Appointment marked as completed');
        } catch (error) {
            Alert.alert('Error', 'Failed to update appointment status');
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.timeBox}>
                    <Clock color={COLORS.primary} size={14} />
                    <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <View style={[styles.statusBadge, item.status === 'completed' ? styles.statusSuccess : styles.statusPending]}>
                    <Text style={[styles.statusText, item.status === 'completed' ? styles.textSuccess : styles.textPending]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.userInitial}>
                    <Text style={styles.initialText}>{(item.userName || 'C')[0].toUpperCase()}</Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.userName || 'Customer'}</Text>
                    <Text style={styles.serviceName}>{item.package?.name || item.service || 'Service'}</Text>
                </View>
            </View>

            {item.status === 'pending' && (
                <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => markAsCompleted(item.id)}
                >
                    <CheckCircle color={COLORS.background} size={20} />
                    <Text style={styles.completeBtnText}>Mark as Completed</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <LinearGradient
                colors={[COLORS.primary + '15', COLORS.background]}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Barber Portal</Text>
                        <Text style={styles.headerSub}>Today's Schedule</Text>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{appointments.filter(a => a.status === 'pending').length}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{appointments.filter(a => a.status === 'completed').length}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                </View>
            </LinearGradient>

            <FlatList
                data={appointments}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchSchedule} tintColor={COLORS.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Scissors color={COLORS.textSecondary} size={48} style={{ opacity: 0.3 }} />
                        <Text style={styles.emptyText}>No appointments scheduled today.</Text>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 20,
    },
    headerGradient: {
        paddingBottom: 24,
    },
    headerTitle: {
        color: COLORS.text,
        fontSize: 28,
        fontWeight: 'bold',
    },
    headerSub: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    logoutBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: '#333',
    },
    logoutText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: 'bold',
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 16,
        marginTop: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
    },
    statValue: {
        color: COLORS.primary,
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 4,
    },
    list: {
        padding: 24,
        paddingTop: 0,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    timeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timeText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusSuccess: {
        backgroundColor: '#4CAF5015',
    },
    statusPending: {
        backgroundColor: COLORS.primary + '15',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    textSuccess: {
        color: '#4CAF50',
    },
    textPending: {
        color: COLORS.primary,
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    userInitial: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    initialText: {
        color: COLORS.primary,
        fontSize: 20,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    serviceName: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginTop: 2,
    },
    completeBtn: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
        marginTop: 8,
    },
    completeBtnText: {
        color: COLORS.background,
        fontWeight: 'bold',
        fontSize: 15,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
        gap: 16,
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
});
