import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { getAllAppointments, updateAppointmentStatus, deleteAppointment } from '../services/api';
import { Calendar, Clock, Scissors, XCircle, Trash2, ChevronLeft, Filter } from 'lucide-react-native';

export default function AdminBookingsScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchAppointments();
    }, []);

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
                {item.status === 'pending' && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusUpdate(item.id, 'completed')}>
                        <Text style={[styles.actionText, { color: '#4CAF50' }]}>Complete</Text>
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

            <View style={styles.filterBar}>
                {['all', 'pending', 'completed', 'cancelled'].map(f => (
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
    emptyText: { color: COLORS.textSecondary, fontSize: 14 }
});
