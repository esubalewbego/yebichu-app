import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { getAllAppointments, updateAppointmentStatus, deleteAppointment, getBarbersList, assignAppointmentToBarber } from '../services/api';
import { Calendar, Clock, Scissors, XCircle, Trash2, ChevronLeft, Filter } from 'lucide-react-native';

export default function AdminBookingsScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [barbers, setBarbers] = useState([]);
    const [assignModalVisible, setAssignModalVisible] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

    useEffect(() => {
        fetchAppointments();
        fetchBarbers();
    }, []);

    const fetchBarbers = async () => {
        try {
            const { data } = await getBarbersList();
            setBarbers(data);
        } catch (error) {
            console.error('Failed to fetch barbers', error);
        }
    };

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const { data } = await getAllAppointments();
            setAppointments(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await updateAppointmentStatus(id, newStatus);
            setAppointments(prev => prev.map(appt => appt.id === id ? { ...appt, status: newStatus } : appt));
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        }
    };

    const handleDelete = (id) => {
        Alert.alert('Delete', 'Delete this record?', [
            { text: 'Cancel' },
            {
                text: 'Delete', onPress: async () => {
                    try {
                        await deleteAppointment(id);
                        setAppointments(prev => prev.filter(a => a.id !== id));
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete');
                    }
                }
            }
        ]);
    };

    const handleOpenAssignModal = (id) => {
        setSelectedAppointmentId(id);
        setAssignModalVisible(true);
    };

    const handleAssignBarber = async (barberId) => {
        try {
            await assignAppointmentToBarber(selectedAppointmentId, barberId);
            setAppointments(prev => prev.map(appt => appt.id === selectedAppointmentId ? { ...appt, status: 'assigned', barberId } : appt));
            setAssignModalVisible(false);
            setSelectedAppointmentId(null);
            Alert.alert('Success', 'Barber assigned successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to assign barber');
        }
    };

    const filteredData = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.userName || item.userEmail || 'Customer'}</Text>
                    <Text style={styles.serviceName}>{item.service}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: item.status === 'completed' ? '#4CAF5020' : item.status === 'pending' ? '#FFC10720' : '#F4433620' }]}>
                    <Text style={[styles.badgeText, { color: item.status === 'completed' ? '#4CAF50' : item.status === 'pending' ? '#FFC107' : '#F44336' }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.detailsRow}>
                <View style={styles.detail}>
                    <Calendar size={14} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>{item.date}</Text>
                </View>
                <View style={styles.detail}>
                    <Clock size={14} color={COLORS.textSecondary} />
                    <Text style={styles.detailText}>{item.time}</Text>
                </View>
            </View>

            <View style={styles.actions}>
                {(item.status === 'pending' || item.status === 'assigned') && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusUpdate(item.id, 'completed')}>
                        <Text style={[styles.actionText, { color: '#4CAF50' }]}>Complete</Text>
                    </TouchableOpacity>
                )}
                {(item.status === 'pending' || item.status === 'assigned') && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenAssignModal(item.id)}>
                        <Text style={[styles.actionText, { color: COLORS.primary }]}>
                            {item.status === 'assigned' ? 'Reassign' : 'Assign'}
                        </Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
                    <Trash2 size={18} color="#F44336" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient colors={[COLORS.primary + '20', COLORS.background]} style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft color={COLORS.text} size={28} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.title}>All Bookings</Text>
                        <Text style={styles.subtitle}>{appointments.length} Total Records</Text>
                    </View>
                </View>
            </LinearGradient>

            <View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterBar}
                    decelerationRate="fast"
                    keyboardShouldPersistTaps="handled"
                >
                    {['all', 'pending', 'assigned', 'completed', 'cancelled'].map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterChip, filter === f && styles.activeFilter]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredData}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAppointments} tintColor={COLORS.primary} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No bookings matching criteria</Text>
                    </View>
                }
            />

            {/* Assignment Modal */}
            {assignModalVisible && (
                <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Assign Barber</Text>

                        {barbers.length === 0 ? (
                            <Text style={styles.emptyText}>No barbers available.</Text>
                        ) : (
                            <FlatList
                                data={barbers}
                                keyExtractor={item => item.id || item.uid}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.barberItem}
                                        onPress={() => handleAssignBarber(item.id || item.uid)}
                                    >
                                        <Text style={styles.barberName}>{item.firstName ? `${item.firstName} ${item.lastName || ''}` : item.email}</Text>
                                        <ChevronLeft color={COLORS.primary} size={20} style={{ transform: [{ rotate: '180deg' }] }} />
                                    </TouchableOpacity>
                                )}
                                style={{ maxHeight: 300, width: '100%' }}
                            />
                        )}

                        <TouchableOpacity
                            style={styles.closeModalBtn}
                            onPress={() => setAssignModalVisible(false)}
                        >
                            <Text style={styles.closeModalText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: 24, paddingBottom: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
    subtitle: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
    filterBar: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 16, gap: 8 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: '#333' },
    activeFilter: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
    activeFilterText: { color: COLORS.background },
    list: { padding: 24, paddingTop: 0 },
    card: { backgroundColor: COLORS.card, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    userName: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
    serviceName: { color: COLORS.primary, fontSize: 13, marginTop: 2 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: 'bold' },
    detailsRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
    detail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailText: { color: COLORS.textSecondary, fontSize: 12 },
    actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#333', paddingTop: 12, justifyContent: 'space-between', alignItems: 'center' },
    actionBtn: { padding: 4 },
    actionText: { fontWeight: 'bold', fontSize: 14 },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: COLORS.textSecondary, fontSize: 14 },
    modalOverlay: { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: COLORS.card, padding: 24, borderRadius: 20, width: '85%', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    barberItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background, padding: 16, borderRadius: 12, marginBottom: 10, width: '100%', borderWidth: 1, borderColor: '#333' },
    barberName: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
    closeModalBtn: { marginTop: 20, padding: 12 },
    closeModalText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: 'bold' }
});
