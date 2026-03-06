import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView, RefreshControl, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { getAllAppointments, updateAppointmentStatus, getAdminAnalytics, getBarbersList, assignBarber, deleteAppointment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, Clock, Scissors, Calendar, Package, Settings, ChevronRight, RefreshCw, TrendingUp, DollarSign, Users, BarChart3, UserPlus, Trash2 } from 'lucide-react-native';

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
            // Fallback for mock mode
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

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.userName}>{item.userName || 'Customer'}</Text>
                    <Text style={styles.serviceName}>{item.service}</Text>
                </View>
                <StatusBadge status={item.status} />
            </View>

            <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                    <Calendar color={COLORS.primary} size={16} />
                    <Text style={styles.detailText}>{item.date}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Clock color={COLORS.primary} size={16} />
                    <Text style={styles.detailText}>{item.time}</Text>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleStatusUpdate(item.id, 'completed')}
                >
                    <CheckCircle color="#fff" size={20} />
                    <Text style={styles.actionBtnText}>Complete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn]}
                    onPress={() => handleStatusUpdate(item.id, 'cancelled')}
                >
                    <XCircle color="#fff" size={20} />
                    <Text style={styles.actionBtnText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

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

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <LinearGradient
                colors={[COLORS.primary + '20', COLORS.background]}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Admin Panel</Text>
                        <Text style={styles.subtitle}>Studio Management</Text>
                    </View>
                    <TouchableOpacity onPress={fetchData} style={styles.refreshBtn}>
                        <RefreshCw color={COLORS.primary} size={20} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={COLORS.primary} />
                }
            >
                {stats && (
                    <View style={styles.analyticsSection}>
                        <Text style={styles.sectionTitle}>Business Intelligence</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
                            <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.statBox}>
                                <View style={[styles.statIcon, { backgroundColor: '#4CAF5020' }]}>
                                    <DollarSign color="#4CAF50" size={20} />
                                </View>
                                <Text style={styles.statVal}>${stats.totalRevenue.toLocaleString()}</Text>
                                <Text style={styles.statLab}>Total Revenue</Text>
                            </LinearGradient>

                            <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.statBox}>
                                <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '20' }]}>
                                    <BarChart3 color={COLORS.primary} size={20} />
                                </View>
                                <Text style={styles.statVal}>{stats.totalAppointments}</Text>
                                <Text style={styles.statLab}>Bookings</Text>
                            </LinearGradient>

                            <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.statBox}>
                                <View style={[styles.statIcon, { backgroundColor: '#2196F320' }]}>
                                    <TrendingUp color="#2196F3" size={20} />
                                </View>
                                <Text style={styles.statVal}>{((stats.completed / (stats.totalAppointments || 1)) * 100).toFixed(0)}%</Text>
                                <Text style={styles.statLab}>Success Rate</Text>
                            </LinearGradient>

                            <LinearGradient colors={['#1a1a1a', '#0f0f0f']} style={styles.statBox}>
                                <View style={[styles.statIcon, { backgroundColor: '#FF980020' }]}>
                                    <Users color="#FF9800" size={20} />
                                </View>
                                <Text style={styles.statVal}>${stats.averageTicketSize.toFixed(0)}</Text>
                                <Text style={styles.statLab}>Avg Ticket</Text>
                            </LinearGradient>
                        </ScrollView>
                    </View>
                )}
                <View style={styles.managementSection}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.mgmtGrid}>
                        <TouchableOpacity
                            style={styles.mgmtCard}
                            onPress={() => navigation.navigate('Services')}
                        >
                            <View style={[styles.iconBox, { backgroundColor: COLORS.primary + '15' }]}>
                                <Package color={COLORS.primary} size={28} />
                            </View>
                            <Text style={styles.mgmtCardTitle}>Services</Text>
                            <Text style={styles.mgmtCardSub}>CRUD Packages</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.mgmtCard}
                            onPress={() => navigation.navigate('Users')}
                        >
                            <View style={[styles.iconBox, { backgroundColor: '#4CAF5015' }]}>
                                <Users color="#4CAF50" size={28} />
                            </View>
                            <Text style={styles.mgmtCardTitle}>Users</Text>
                            <Text style={styles.mgmtCardSub}>Manage Roles</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.appointmentsHeader}>
                    <Text style={styles.sectionTitle}>Recent Bookings</Text>
                </View>

                <View style={styles.list}>
                    {appointments.map(item => (
                        <View key={item.id} style={styles.card}>
                            <View style={styles.cardTop}>
                                <View style={styles.userInitial}>
                                    <Text style={styles.initialText}>{(item.userName || 'C')[0].toUpperCase()}</Text>
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.userName}>{item.userEmail || item.userName || 'Customer'}</Text>
                                    <Text style={styles.serviceName}>{item.item?.name || item.service || 'Grooming Service'}</Text>
                                </View>
                                <StatusBadge status={item.status} />
                            </View>

                            <View style={styles.separator} />

                            <View style={styles.cardDetails}>
                                <View style={styles.detailItem}>
                                    <Calendar color={COLORS.textSecondary} size={14} />
                                    <Text style={styles.detailText}>{item.date}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Clock color={COLORS.textSecondary} size={14} />
                                    <Text style={styles.detailText}>{item.time}</Text>
                                </View>
                            </View>

                            {/* Actions for ALL statuses */}
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
                                    style={[styles.actionBtn, { backgroundColor: '#F44336', borderColor: '#F44336' }]}
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
                            <Scissors color={COLORS.textSecondary} size={48} style={{ opacity: 0.3 }} />
                            <Text style={styles.emptyText}>No appointments today.</Text>
                        </View>
                    )}
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

const StatusBadge = ({ status }) => {
    const bgColor = status === 'completed' ? '#4CAF5020' : status === 'pending' ? '#FFC10720' : '#F4433620';
    const textColor = status === 'completed' ? '#4CAF50' : status === 'pending' ? '#FFC107' : '#F44336';

    return (
        <View style={[styles.badge, { backgroundColor: bgColor }]}>
            <Text style={[styles.badgeText, { color: textColor }]}>{status.toUpperCase()}</Text>
        </View>
    );
};

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
    analyticsSection: {
        paddingTop: 24,
        paddingBottom: 8,
    },
    statsScroll: {
        paddingHorizontal: 24,
        gap: 16,
    },
    statBox: {
        width: 140,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statVal: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLab: {
        color: COLORS.textSecondary,
        fontSize: 11,
        marginTop: 4,
        fontWeight: '500',
    },
    refreshBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    managementSection: {
        padding: 24,
    },
    mgmtGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    mgmtCard: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
    },
    mgmtCardTitle: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 12,
    },
    mgmtCardSub: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 4,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    appointmentsHeader: {
        paddingHorizontal: 24,
        marginTop: 10,
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
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    userInitial: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    initialText: {
        color: COLORS.primary,
        fontSize: 20,
        fontWeight: 'bold',
    },
    cardInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    serviceName: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 12,
    },
    cardDetails: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    approveBtn: {
        backgroundColor: '#4CAF50',
    },
    cancelBtn: {
        backgroundColor: '#F44336',
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        gap: 16,
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: '50%',
        maxHeight: '80%',
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    barberSelectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 16,
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
});
