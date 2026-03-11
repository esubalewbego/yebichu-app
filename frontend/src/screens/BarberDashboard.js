import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, ScrollView } from 'react-native';
import { Scissors, Clock, CheckCircle, XCircle, ChevronRight, Star, DollarSign, TrendingUp, MessageSquare, Bell } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { getBarberAppointments, updateAppointmentStatus as updateStatus, recordCashPayment as apiRecordCash, getAdminInfo } from '../services/api';

export default function BarberDashboard({ navigation }) {
    // ... inside the component
    const recordCashPayment = async (id) => {
        try {
            await apiRecordCash(id);
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'completed', paymentStatus: 'paid', paymentMethod: 'cash' } : a));
            Alert.alert('Success', 'Cash payment recorded and appointment completed');
        } catch (error) {
            Alert.alert('Error', 'Failed to record cash payment');
        }
    };
    const { user, logout } = useAuth();
    const insets = useSafeAreaInsets();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'performance'
    const [adminUid, setAdminUid] = useState(null);

    if (user?.role?.toLowerCase() !== 'barber') {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: COLORS.text, fontSize: 18 }}>Access Denied</Text>
            </View>
        );
    }

    useEffect(() => {
        fetchSchedule();
        loadAdminInfo();
    }, []);

    const loadAdminInfo = async () => {
        try {
            const { data } = await getAdminInfo();
            setAdminUid(data.uid);
        } catch (error) {
            console.error('Failed to load admin info:', error);
        }
    };

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            const barberId = user?.uid || user?.id;
            console.log('Fetching schedule for barber:', barberId);
            const { data } = await getBarberAppointments(barberId);
            console.log('Appointments fetched:', data?.length);
            setAppointments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch Barber Schedule:', error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        pending: appointments.filter(a => {
            const s = a.status?.toLowerCase();
            return s === 'pending' || s === 'paid' || s === 'assigned';
        }).length,
        completed: appointments.filter(a => a.status?.toLowerCase() === 'completed').length,
        earnings: appointments
            .filter(a => {
                const s = a.status?.toLowerCase();
                return s === 'completed' || s === 'paid';
            })
            .reduce((sum, a) => sum + (Number(a.item?.price || a.price) || 0), 0),
        avgRating: appointments.length > 0
            ? (appointments.reduce((sum, a) => sum + (a.item?.avgRating || 5.0), 0) / appointments.length).toFixed(1)
            : '5.0'
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

    const renderPerformance = () => (
        <ScrollView style={styles.perfScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.perfCard}>
                <Text style={styles.perfTitle}>Total Earnings</Text>
                <Text style={styles.perfValue}>${stats.earnings.toLocaleString()}</Text>
                <View style={styles.perfDivider} />
                <View style={styles.perfRow}>
                    <View>
                        <Text style={styles.perfSub}>Jobs Done</Text>
                        <Text style={styles.perfSubVal}>{stats.completed}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.perfSub}>Success Rate</Text>
                        <Text style={styles.perfSubVal}>
                            {appointments.length > 0
                                ? ((stats.completed / appointments.length) * 100).toFixed(0)
                                : 0}%
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.metricGrid}>
                <View style={styles.metricBox}>
                    <Text style={styles.metricLab}>Today's Target</Text>
                    <Text style={styles.metricVal}>{stats.completed}/10</Text>
                    <View style={styles.progressBg}>
                        <View style={[styles.progressFill, { width: `${Math.min(stats.completed * 10, 100)}%` }]} />
                    </View>
                </View>
                <View style={styles.metricBox}>
                    <Text style={styles.metricLab}>Avg Rating</Text>
                    <Text style={styles.metricVal}>{stats.avgRating}/5.0</Text>
                    <View style={styles.starRow}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <Text key={i} style={{ color: COLORS.primary, fontSize: 12 }}>★</Text>
                        ))}
                    </View>
                </View>
            </View>
        </ScrollView>
    );

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
                    <Text style={styles.initialText}>{(item.userEmail || item.userName || 'C')[0].toUpperCase()}</Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.userEmail || item.userName || 'Customer'}</Text>
                    <Text style={styles.serviceName}>{item.item?.name || item.service || 'Grooming Service'}</Text>
                </View>
            </View>

            {(item.status?.toLowerCase() === 'pending' || item.status?.toLowerCase() === 'assigned') && (
                <TouchableOpacity
                    style={[styles.completeBtn, { backgroundColor: '#4CAF50', marginTop: 10 }]}
                    onPress={() => recordCashPayment(item.id)}
                >
                    <DollarSign color={COLORS.background} size={20} />
                    <Text style={styles.completeBtnText}>Record Cash Payment</Text>
                </TouchableOpacity>
            )}
            {(item.status?.toLowerCase() === 'pending' || item.status?.toLowerCase() === 'paid' || item.status?.toLowerCase() === 'assigned') && (
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
                        <Text style={styles.headerSub}>Management Console</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Chat', { receiverId: adminUid, userName: 'Admin Support' })}
                            style={[styles.logoutBtn, { marginRight: 10, borderColor: COLORS.primary + '40' }]}
                        >
                            <MessageSquare color={COLORS.primary} size={18} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Notifications')}
                            style={[styles.logoutBtn, { marginRight: 10, borderColor: COLORS.textSecondary + '40' }]}
                        >
                            <Bell color={COLORS.text} size={18} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tab Switcher */}
                <View style={styles.tabBar}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('jobs')}
                        style={[styles.tab, activeTab === 'jobs' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === 'jobs' && styles.activeTabText]}>Active Jobs</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('performance')}
                        style={[styles.tab, activeTab === 'performance' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === 'performance' && styles.activeTabText]}>Performance</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            ) : activeTab === 'jobs' ? (
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
            ) : (
                renderPerformance()
            )}
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
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
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
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginTop: 20,
        gap: 12,
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: '#333',
    },
    activeTab: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    tabText: {
        color: COLORS.textSecondary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    activeTabText: {
        color: COLORS.background,
    },
    perfScroll: {
        padding: 24,
    },
    perfCard: {
        backgroundColor: COLORS.card,
        padding: 30,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 20,
    },
    perfTitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    perfValue: {
        color: COLORS.text,
        fontSize: 48,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    perfDivider: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 20,
    },
    perfRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    perfSub: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginBottom: 4,
    },
    perfSubVal: {
        color: COLORS.primary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    metricGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    metricBox: {
        flex: 1,
        backgroundColor: COLORS.card,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    metricLab: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginBottom: 8,
    },
    metricVal: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    progressBg: {
        height: 4,
        backgroundColor: '#333',
        borderRadius: 2,
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    starRow: {
        flexDirection: 'row',
        gap: 4,
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
