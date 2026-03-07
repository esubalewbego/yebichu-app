import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView, RefreshControl, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { getAllAppointments, updateAppointmentStatus, getAdminAnalytics, getBarbersList, assignBarber, deleteAppointment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Clock, Scissors, Calendar, Package, Settings, ChevronRight, RefreshCw, TrendingUp, DollarSign, Users, BarChart3, UserPlus, Trash2, MessageSquare, ShieldCheck } from 'lucide-react-native';

const StatusBadge = ({ status }) => {
    const bgColor = status === 'completed' ? '#4CAF5020' : status === 'pending' ? '#FFC10720' : '#F4433620';
    const textColor = status === 'completed' ? '#4CAF50' : status === 'pending' ? '#FFC107' : '#F44336';

    return (
        <View style={[styles.badge, { backgroundColor: bgColor }]}>
            <Text style={[styles.badgeText, { color: textColor }]}>{status?.toUpperCase() || 'UNKNOWN'}</Text>
        </View>
    );
};

export default function AdminDashboard({ navigation }) {
    const insets = useSafeAreaInsets();
    const [appointments, setAppointments] = useState([]);
    const [stats, setStats] = useState(null);
    const [barbers, setBarbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assignModalVisible, setAssignModalVisible] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
    const { user } = useAuth();

    if (user?.role !== 'admin') {
        return (
            <View style={styles.centered}>
                <Text style={{ color: COLORS.text, fontSize: 18 }}>Access Denied</Text>
            </View>
        );
    }

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchAppointments(), fetchAnalytics(), fetchBarbers()]);
        setLoading(false);
    };

    const fetchBarbers = async () => {
        try {
            const { data } = await getBarbersList();
            setBarbers(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const { data } = await getAdminAnalytics();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch Admin Data:', error);
            setStats({
                totalAppointments: 0,
                totalRevenue: 0,
                completed: 0,
                pending: 0,
                cancelled: 0,
                monthlyRevenue: 0,
                averageTicketSize: 0
            });
        }
    };

    const fetchAppointments = async () => {
        try {
            const { data } = await getAllAppointments();
            setAppointments(data);
        } catch (error) {
            console.error(error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await updateAppointmentStatus(id, newStatus);
            setAppointments(prev => prev.map(appt => appt.id === id ? { ...appt, status: newStatus } : appt));
            Alert.alert('Success', `Appointment marked as ${newStatus}`);
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const handleDeleteAppointment = (id) => {
        Alert.alert('Delete Appointment', 'Permanently delete this appointment?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await deleteAppointment(id);
                        setAppointments(prev => prev.filter(a => a.id !== id));
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete appointment');
                    }
                }
            }
        ]);
    };

    const handleAssignBarber = async (barberId) => {
        try {
            await assignBarber(selectedAppointmentId, barberId);
            setAppointments(prev => prev.map(appt => appt.id === selectedAppointmentId ? { ...appt, status: 'assigned', barberId } : appt));
            setAssignModalVisible(false);
            Alert.alert('Success', 'Barber successfully assigned');
        } catch (error) {
            Alert.alert('Error', 'Failed to assign barber');
        }
    };

    if (loading && !stats) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.primary + '15', COLORS.background]}
                style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
            >
                <View style={styles.header}>
                    <View style={styles.adminProfile}>
                        <View style={styles.adminAvatar}>
                            <ShieldCheck color={COLORS.primary} size={24} />
                        </View>
                        <View>
                            <Text style={styles.adminName}>Administrator</Text>
                            <Text style={styles.adminRole}>Control Panel Active</Text>
                        </View>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.actionCircle}
                            onPress={() => navigation.navigate('Messages')}
                        >
                            <MessageSquare color={COLORS.text} size={20} />
                            <View style={styles.unreadDot} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCircle} onPress={fetchData}>
                            <RefreshCw color={COLORS.text} size={20} />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={COLORS.primary} />
                }
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            >
                {stats && (
                    <View style={styles.analyticsSection}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Business Intelligence</Text>
                            <TrendingUp color={COLORS.primary} size={20} />
                        </View>
                        <View style={styles.statsGrid}>
                            <LinearGradient colors={['#1a1a1a', '#0a0a0a']} style={styles.mainStatCard}>
                                <View style={styles.statHeader}>
                                    <View style={[styles.statIcon, { backgroundColor: '#4CAF5020' }]}>
                                        <DollarSign color="#4CAF50" size={24} />
                                    </View>
                                    <View style={styles.trendBadge}>
                                        <TrendingUp color="#4CAF50" size={12} />
                                        <Text style={styles.trendText}>+12%</Text>
                                    </View>
                                </View>
                                <Text style={styles.mainStatVal}>${stats.totalRevenue.toLocaleString()}</Text>
                                <Text style={styles.mainStatLab}>Total revenue this year</Text>
                            </LinearGradient>

                            <View style={styles.sideStats}>
                                <LinearGradient colors={['#1a1a1a', '#0a0a0a']} style={styles.smallStatCard}>
                                    <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '20' }]}>
                                        <Calendar color={COLORS.primary} size={18} />
                                    </View>
                                    <Text style={styles.smallStatVal}>{stats.totalAppointments}</Text>
                                    <Text style={styles.smallStatLab}>Total Bookings</Text>
                                </LinearGradient>

                                <LinearGradient colors={['#1a1a1a', '#0a0a0a']} style={styles.smallStatCard}>
                                    <View style={[styles.statIcon, { backgroundColor: '#9C27B020' }]}>
                                        <Users color="#9C27B0" size={18} />
                                    </View>
                                    <Text style={styles.smallStatVal}>{((stats.completed / (stats.totalAppointments || 1)) * 100).toFixed(0)}%</Text>
                                    <Text style={styles.smallStatLab}>Success Rate</Text>
                                </LinearGradient>
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.appointmentsSection}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Recent Bookings</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('AdminBookings')}>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.list}>
                        {appointments.map(item => (
                            <View key={item.id} style={styles.card}>
                                <View style={styles.cardTop}>
                                    <View style={styles.userInitial}>
                                        <Text style={styles.initialText}>{(item.userName || item.userEmail || 'C')[0].toUpperCase()}</Text>
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={styles.userName} numberOfLines={1}>{item.userName || item.userEmail || 'Customer'}</Text>
                                        <Text style={styles.serviceName}>{item.item?.name || item.service || 'Grooming Service'}</Text>
                                    </View>
                                    <StatusBadge status={item.status} />
                                </View>

                                <View style={styles.cardDetails}>
                                    <View style={styles.detailItem}>
                                        <Calendar color={COLORS.textSecondary} size={14} />
                                        <Text style={styles.detailText}>{item.date}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Clock color={COLORS.textSecondary} size={14} />
                                        <Text style={styles.detailText}>{item.time}</Text>
                                    </View>
                                    {item.barberName && (
                                        <View style={styles.detailItem}>
                                            <Scissors color={COLORS.textSecondary} size={14} />
                                            <Text style={styles.detailText}>{item.barberName}</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.actions}>
                                    {item.status === 'pending' && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.approveBtn]}
                                            onPress={() => {
                                                setSelectedAppointmentId(item.id);
                                                setAssignModalVisible(true);
                                            }}
                                        >
                                            <UserPlus color="#fff" size={18} />
                                            <Text style={styles.actionBtnText}>Assign</Text>
                                        </TouchableOpacity>
                                    )}
                                    {item.status === 'pending' && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, styles.cancelBtn]}
                                            onPress={() => handleStatusUpdate(item.id, 'cancelled')}
                                        >
                                            <XCircle color="#fff" size={18} />
                                            <Text style={styles.actionBtnText}>Cancel</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.deleteBtn]}
                                        onPress={() => handleDeleteAppointment(item.id)}
                                    >
                                        <Trash2 color="#fff" size={18} />
                                        <Text style={styles.actionBtnText}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                        {appointments.length === 0 && !loading && (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconBox}>
                                    <Scissors color={COLORS.textSecondary} size={48} style={{ opacity: 0.3 }} />
                                </View>
                                <Text style={styles.emptyText}>No appointments today.</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            <Modal visible={assignModalVisible} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>Assign Barber</Text>
                            <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                                <XCircle color={COLORS.textSecondary} size={28} />
                            </TouchableOpacity>
                        </View>

                        {barbers.length === 0 ? (
                            <Text style={styles.emptyText}>No registered barbers found.</Text>
                        ) : (
                            <FlatList
                                data={barbers}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.barberSelectBtn}
                                        onPress={() => handleAssignBarber(item.id)}
                                    >
                                        <View style={styles.userInitial}>
                                            <Text style={styles.initialText}>{(item.firstName || 'B')[0].toUpperCase()}</Text>
                                        </View>
                                        <Text style={styles.barberNameText}>{item.firstName} {item.lastName}</Text>
                                        <ChevronRight color={COLORS.textSecondary} size={20} />
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
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
        paddingBottom: 30,
    },
    headerGradient: {
        paddingBottom: 0,
    },
    adminProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    adminAvatar: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    adminName: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    adminRole: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    unreadDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.card,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    analyticsSection: {
        padding: 24,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        height: 180,
    },
    mainStatCard: {
        flex: 1.5,
        borderRadius: 24,
        padding: 20,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#333',
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF5015',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 4,
    },
    trendText: {
        color: '#4CAF50',
        fontSize: 10,
        fontWeight: 'bold',
    },
    mainStatVal: {
        color: COLORS.text,
        fontSize: 28,
        fontWeight: 'bold',
    },
    mainStatLab: {
        color: COLORS.textSecondary,
        fontSize: 11,
    },
    sideStats: {
        flex: 1,
        gap: 12,
    },
    smallStatCard: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    smallStatVal: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 8,
    },
    smallStatLab: {
        color: COLORS.textSecondary,
        fontSize: 10,
    },
    appointmentsSection: {
        paddingHorizontal: 24,
    },
    viewAllText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    list: {
        marginTop: 8,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    userInitial: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    initialText: {
        color: COLORS.primary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    cardInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    serviceName: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    cardDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 16,
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    approveBtn: {
        backgroundColor: '#4CAF50',
    },
    cancelBtn: {
        backgroundColor: '#F44336',
    },
    deleteBtn: {
        backgroundColor: '#333',
        borderWidth: 1,
        borderColor: '#444',
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        gap: 12,
    },
    emptyIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '80%',
        borderWidth: 1,
        borderColor: '#333',
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        color: COLORS.text,
        fontSize: 22,
        fontWeight: 'bold',
    },
    barberSelectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    barberNameText: {
        flex: 1,
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
});
