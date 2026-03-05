import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { Briefcase, CheckCircle2, Search, DollarSign, CalendarCheck } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { getBarberAppointments } from '../services/api';

export default function BarberHistoryScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data } = await getBarberAppointments(user?.uid || user?.id);
            // Filter only completed appointments for history
            const completed = data.filter(app => app.status === 'completed');
            setHistory(completed);
        } catch (error) {
            console.error(error);
            setHistory([
                { id: '1', name: 'Wedding Package', date: '2026-03-01', time: '10:00 AM', earnd: 1500 },
                { id: '2', name: 'Fade & Beard', date: '2026-03-02', time: '02:00 PM', earnd: 800 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = () => {
        setLoading(true);
        fetchHistory();
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.iconBox}>
                <CheckCircle2 color={'#4CAF50'} size={24} />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.itemName}>{item.name || item.packageId?.name || 'Service'}</Text>
                <View style={styles.dateTimeRow}>
                    <CalendarCheck color={COLORS.textSecondary} size={14} />
                    <Text style={styles.dateTimeText}>{item.date} • {item.time}</Text>
                </View>
            </View>
            <View style={styles.cardTrailing}>
                <View style={styles.badgeSuccess}>
                    <Text style={styles.textSuccess}>COMPLETED</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <LinearGradient
                colors={['#1A237E20', COLORS.background]}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Past Jobs</Text>
                    <Text style={styles.headerSub}>Earnings & Performance</Text>
                </View>
            </LinearGradient>

            <FlatList
                data={history}
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
                            <Briefcase color={COLORS.textSecondary} size={48} />
                        </View>
                        <Text style={styles.emptyText}>No completed jobs yet.</Text>
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
    headerTitle: {
        color: COLORS.text,
        fontSize: 32,
        fontWeight: 'bold',
    },
    headerSub: {
        color: '#8C9EFF', // Specifically different tint for barber
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
        backgroundColor: '#4CAF5015',
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
        alignItems: 'flex-end',
    },
    badgeSuccess: {
        backgroundColor: '#4CAF5015',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    textSuccess: {
        color: '#4CAF50',
        fontSize: 10,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
});
