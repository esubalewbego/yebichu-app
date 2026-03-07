import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { Calendar, Clock, ChevronLeft, Star, MapPin, Check, User } from 'lucide-react-native';
import { getBarbersList } from '../services/api';
import CustomButton from '../components/Button';

export default function BookingScreen({ route, navigation }) {
    const { item, isPackage } = route.params;
    const insets = useSafeAreaInsets();
    const [selectedDate, setSelectedDate] = useState('2026-03-10');
    const [selectedTime, setSelectedTime] = useState('10:00 AM');
    const [barbers, setBarbers] = useState([]);
    const [selectedBarber, setSelectedBarber] = useState(null);

    const times = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

    useEffect(() => {
        const fetchBarbers = async () => {
            try {
                const { data } = await getBarbersList();
                setBarbers(data);
                if (data.length > 0) setSelectedBarber(data[0].id);
            } catch (error) {
                console.error('Failed to fetch barbers:', error);
            }
        };
        fetchBarbers();
    }, []);

    const handleBooking = () => {
        if (!selectedBarber && barbers.length > 0) {
            Alert.alert('Selection Required', 'Please select a preferred barber.');
            return;
        }
        navigation.navigate('Payment', {
            item,
            date: selectedDate,
            time: selectedTime,
            barberId: selectedBarber
        });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <LinearGradient
                colors={[COLORS.primary + '20', COLORS.background]}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft color={COLORS.text} size={28} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Book Appointment</Text>
                    <View style={{ width: 44 }} />
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
                <View style={styles.serviceCard}>
                    <Image
                        source={{ uri: item.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=300' }}
                        style={styles.serviceImage}
                    />
                    <View style={styles.serviceInfo}>
                        <Text style={styles.serviceCategory}>{isPackage ? 'Premium Package' : 'Haircut Style'}</Text>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={styles.ratingRow}>
                            <Star color={COLORS.primary} size={14} fill={COLORS.primary} />
                            <Text style={styles.ratingText}>
                                {`${item.avgRating?.toFixed(1) || '0.0'} (${item.ratingCount || 0} reviews)`}
                            </Text>
                        </View>
                        <Text style={styles.itemPrice}>${item.price}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Select Date</Text>
                        <Text style={styles.monthText}>March 2026</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateList}>
                        {['10', '11', '12', '13', '14', '15', '16'].map((d, i) => {
                            const date = `2026-03-${d}`;
                            const isSelected = selectedDate === date;
                            const days = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'];
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.dateCard, isSelected && styles.selectedCard]}
                                    onPress={() => setSelectedDate(date)}
                                >
                                    <Text style={[styles.dayText, isSelected && styles.selectedText]}>{days[i]}</Text>
                                    <Text style={[styles.dateNumber, isSelected && styles.selectedText]}>{d}</Text>
                                    {isSelected && <View style={styles.activeDot} />}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Available Time</Text>
                    </View>
                    <View style={styles.timeGrid}>
                        {times.map((t, i) => {
                            const isSelected = selectedTime === t;
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.timeCard, isSelected && styles.selectedCard]}
                                    onPress={() => setSelectedTime(t)}
                                >
                                    <Text style={[styles.timeText, isSelected && styles.selectedText]}>{t}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {barbers.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Select Barber</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barberList}>
                            {barbers.map((barber) => {
                                const isSelected = selectedBarber === barber.id;
                                return (
                                    <TouchableOpacity
                                        key={barber.id}
                                        style={[styles.barberCard, isSelected && styles.selectedBarberCard]}
                                        onPress={() => setSelectedBarber(barber.id)}
                                    >
                                        <View style={styles.barberAvatarBox}>
                                            <User color={isSelected ? COLORS.background : COLORS.text} size={24} />
                                        </View>
                                        <Text style={[styles.barberName, isSelected && styles.selectedText]} numberOfLines={1}>
                                            {barber.firstName || barber.email.split('@')[0]}
                                        </Text>
                                        {isSelected && <View style={styles.activeDot} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                <View style={styles.locationSection}>
                    <Text style={styles.sectionTitle}>Location</Text>
                    <View style={styles.locationCard}>
                        <View style={styles.locIconBox}>
                            <MapPin color={COLORS.primary} size={20} />
                        </View>
                        <View>
                            <Text style={styles.locTitle}>Main Street Studio</Text>
                            <Text style={styles.locSub}>Downtown, Area 51</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.priceRow}>
                    <Text style={styles.totalLabel}>Total Price</Text>
                    <Text style={styles.totalPrice}>${item.price}</Text>
                </View>
                <CustomButton title="Confirm & Pay" onPress={handleBooking} />
            </View>
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
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 24,
    },
    headerGradient: {
        paddingBottom: 10,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    headerTitle: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    serviceCard: {
        flexDirection: 'row',
        backgroundColor: COLORS.card,
        margin: 24,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    serviceImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
    },
    serviceInfo: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    serviceCategory: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    itemName: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    ratingText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginLeft: 4,
    },
    itemPrice: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 8,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    monthText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    dateList: {
        paddingLeft: 24,
        paddingRight: 10,
    },
    dateCard: {
        backgroundColor: COLORS.card,
        width: 65,
        height: 85,
        borderRadius: 16,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    dayText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginBottom: 4,
    },
    dateNumber: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.background,
        marginTop: 4,
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 24,
        gap: 12,
    },
    timeCard: {
        backgroundColor: COLORS.card,
        width: '30.5%',
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    timeText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    selectedCard: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    selectedText: {
        color: COLORS.background,
        fontWeight: 'bold',
    },
    locationSection: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    locationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    locIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    locTitle: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    locSub: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    footer: {
        padding: 24,
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderWidth: 1,
        borderColor: '#333',
        borderBottomWidth: 0,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    totalLabel: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    totalPrice: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: 'bold',
    },
    barberList: {
        paddingLeft: 24,
        paddingRight: 10,
        gap: 12,
    },
    barberCard: {
        backgroundColor: COLORS.card,
        width: 80,
        height: 100,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        padding: 8,
    },
    selectedBarberCard: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    barberAvatarBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    barberName: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
});
