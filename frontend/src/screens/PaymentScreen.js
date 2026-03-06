import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { CreditCard, ChevronLeft, ShieldCheck, CheckCircle2, Lock, Smartphone } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import CustomButton from '../components/Button';
import { initializePayment, verifyPayment, createAppointment } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PaymentScreen({ route, navigation }) {
    const { item, date, time } = route.params;
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            const txRef = `tx-${Date.now()}`;

            const paymentData = {
                amount: item.price,
                currency: 'ETB',
                email: user?.email || 'customer@gmail.com',
                first_name: user?.firstName || user?.displayName?.split(' ')[0] || 'Customer',
                last_name: user?.lastName || user?.displayName?.split(' ')[1] || 'User',
                phone_number: user?.phoneNumber || '0912345678',
                tx_ref: txRef,
                callback_url: 'https://webhook.site/placeholder', // Backend webhook
                return_url: 'barbershop://payment-complete', // Deep link back to the app
            };

            const { data } = await initializePayment(paymentData);

            if (data.status === 'success' && data.data.checkout_url) {
                // Open Chapa checkout page inside the app overlay
                await WebBrowser.openBrowserAsync(data.data.checkout_url);

                // When the modal is closed natively, verify the payment status
                Alert.alert(
                    'Verification',
                    'Did you complete the payment?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Yes, Verify',
                            onPress: () => verifyAndConfirm(txRef)
                        }
                    ]
                );
            } else {
                throw new Error('Failed to initialize payment');
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Payment initialization failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const verifyAndConfirm = async (txRef) => {
        setLoading(true);
        try {
            const { data } = await verifyPayment(txRef);

            if (data.status === 'success') {
                await createAppointment({
                    userId: user?.uid || user?.id || 'anonymous',
                    item,
                    date,
                    time,
                    status: 'paid',
                    tx_ref: txRef
                });

                Alert.alert('Success', 'Payment verified! Your appointment is confirmed.', [
                    { text: 'OK', onPress: () => navigation.navigate('MainTabs') }
                ]);
            } else {
                Alert.alert('Pending', 'Payment not yet confirmed. Please try again or contact support.');
            }
        } catch (error) {
            Alert.alert('Verification', 'Please ensure you completed the payment. (Demo: Redirecting to home)', [
                { text: 'OK', onPress: () => navigation.navigate('MainTabs') }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const { user } = useAuth();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={[COLORS.primary + '20', COLORS.background]}
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeft color={COLORS.text} size={28} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Checkout</Text>
                    <View style={styles.secureBadge}>
                        <Lock color={COLORS.success} size={14} />
                        <Text style={styles.secureBadgeText}>SECURE</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.summaryCard}>
                    <View style={styles.summaryTop}>
                        <Text style={styles.summaryTitle}>Order Summary</Text>
                        <View style={styles.dateTag}>
                            <Text style={styles.dateTagText}>{date}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <View style={styles.itemMain}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemTime}>{time}</Text>
                        </View>
                        <Text style={styles.itemPrice}>${item.price}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Grand Total</Text>
                        <Text style={styles.totalAmount}>${item.price}</Text>
                    </View>
                </View>

                <View style={styles.methodSection}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>

                    <TouchableOpacity style={[styles.methodCard, styles.activeMethod]}>
                        <View style={styles.methodIconBox}>
                            <CreditCard color={COLORS.primary} size={24} />
                        </View>
                        <View style={styles.methodInfo}>
                            <Text style={styles.methodName}>Chapa Payment</Text>
                            <Text style={styles.methodSub}>Telebirr, Cards, Mobile Banking</Text>
                        </View>
                        <View style={styles.radioActive}>
                            <View style={styles.radioInner} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.methodCard} disabled>
                        <View style={styles.methodIconBox}>
                            <Smartphone color={COLORS.textSecondary} size={24} />
                        </View>
                        <View style={styles.methodInfo}>
                            <Text style={[styles.methodName, { color: COLORS.textSecondary }]}>Cash at Studio</Text>
                            <Text style={styles.methodSub}>Unavailable for packages</Text>
                        </View>
                        <View style={styles.radioInactive} />
                    </TouchableOpacity>
                </View>

                <View style={styles.trustFooter}>
                    <View style={styles.trustItem}>
                        <ShieldCheck color={COLORS.success} size={24} />
                        <Text style={styles.trustText}>Encrypted Payment</Text>
                    </View>
                    <View style={styles.trustItem}>
                        <CheckCircle2 color={COLORS.success} size={24} />
                        <Text style={styles.trustText}>Verified Merchant</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <CustomButton
                    title={loading ? "Processing..." : `Confirm Payment`}
                    onPress={handlePayment}
                    disabled={loading}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
    secureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.success + '15',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 6,
    },
    secureBadgeText: {
        color: COLORS.success,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 120,
    },
    summaryCard: {
        backgroundColor: COLORS.card,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 32,
    },
    summaryTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryTitle: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    dateTag: {
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    dateTagText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemMain: {
        flex: 1,
    },
    itemName: {
        color: COLORS.text,
        fontSize: 17,
        fontWeight: '600',
    },
    itemTime: {
        color: COLORS.textSecondary,
        fontSize: 13,
        marginTop: 4,
    },
    itemPrice: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    totalAmount: {
        color: COLORS.primary,
        fontSize: 28,
        fontWeight: 'bold',
    },
    methodSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 16,
    },
    activeMethod: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '05',
    },
    methodIconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    methodInfo: {
        flex: 1,
    },
    methodName: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    methodSub: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    radioActive: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
    },
    radioInactive: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: '#444',
    },
    trustFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 32,
        marginTop: 10,
    },
    trustItem: {
        alignItems: 'center',
        gap: 8,
    },
    trustText: {
        color: COLORS.textSecondary,
        fontSize: 11,
        fontWeight: '500',
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
        backgroundColor: COLORS.background,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
});
