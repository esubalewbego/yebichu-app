import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { CreditCard, ChevronLeft, ShieldCheck, CheckCircle2, Lock, Smartphone, X } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import CustomButton from '../components/Button';
import { initializePayment, verifyPayment, createAppointment } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PaymentScreen({ route, navigation }) {
    const { item, date, time, barberId } = route.params;
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState(null);
    const [showWebView, setShowWebView] = useState(false);
    const [currentTxRef, setCurrentTxRef] = useState(null);
    const { user } = useAuth();

    const handlePayment = async (method) => {
        if (method === 'cash') {
            setLoading(true);
            try {
                const txRef = `cash-${Date.now()}`;
                await createAppointment({
                    userId: user?.uid || user?.id || 'anonymous',
                    barberId,
                    item,
                    date,
                    time,
                    status: 'paid',
                    tx_ref: txRef
                });
                Alert.alert('Success', 'Appointment confirmed with Cash payment.', [
                    { text: 'OK', onPress: () => navigation.navigate('MainTabs') }
                ]);
            } catch (error) {
                console.error(error);
                Alert.alert('Error', 'Failed to confirm appointment.');
            } finally {
                setLoading(false);
            }
            return;
        }

        setLoading(true);
        try {
            const txRef = `tx-${Date.now()}`;

            const safeEmail = (user?.email && user.email.includes('@')) ? user.email.trim() : 'customer@yebichu.com';
            const safeFirstName = (user?.firstName || user?.displayName?.split(' ')[0] || 'Customer').trim();
            const safeLastName = (user?.lastName || user?.displayName?.split(' ')[1] || 'User').trim();
            const safePhone = (user?.phoneNumber && user.phoneNumber.length >= 9) ? user.phoneNumber.trim() : '0900123456';
            const safeAmount = item?.price ? Number(item.price).toString() : '100';

            const paymentData = {
                amount: safeAmount,
                currency: 'ETB',
                email: safeEmail,
                first_name: safeFirstName,
                last_name: safeLastName,
                phone_number: safePhone,
                tx_ref: txRef,
                callback_url: 'https://webhook.site/placeholder', // Backend webhook
                return_url: 'https://www.google.com/', // Must be a valid HTTP URL for Chapa
            };

            const { data } = await initializePayment(paymentData);

            if (data.status === 'success' && data.data.checkout_url) {
                // Open Chapa checkout page inside a true in-app WebView
                setCurrentTxRef(txRef);
                setCheckoutUrl(data.data.checkout_url);
                setShowWebView(true);
            } else {
                throw new Error('Failed to initialize payment');
            }

        } catch (error) {
            console.error('Payment Error Details:', error.response?.data || error.message);
            const errDetails = error.response?.data?.error || error.response?.data || error.message;
            Alert.alert('Checkout Error', `Failed to open Chapa. Details: ${JSON.stringify(errDetails)}`);
            setLoading(false);
        }
    };

    const handleWebViewNavigation = (navState) => {
        // Stop loading spinner once the webview url starts loading
        if (loading) setLoading(false);

        // Chapa redirects to your return_url when payment completes successfully
        if (navState.url.includes('google.com')) {
            setShowWebView(false);
            verifyAndConfirm(currentTxRef);
        }
    };

    const closeWebView = () => {
        setShowWebView(false);
        Alert.alert(
            'Payment Cancelled',
            'Did you complete the payment before closing?',
            [
                { text: 'No, Cancel', style: 'cancel' },
                {
                    text: 'Yes, Verify It',
                    onPress: () => verifyAndConfirm(currentTxRef)
                }
            ]
        );
    };

    const verifyAndConfirm = async (txRef) => {
        setLoading(true);
        try {
            const { data } = await verifyPayment(txRef);

            if (data.status === 'success') {
                await createAppointment({
                    userId: user?.uid || user?.id || 'anonymous',
                    barberId,
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
                    <Text style={styles.sectionTitle}>Select Payment Method</Text>

                    <TouchableOpacity
                        style={styles.methodCard}
                        onPress={() => handlePayment('chapa')}
                        disabled={loading}
                    >
                        <View style={styles.methodIconBox}>
                            <CreditCard color={COLORS.primary} size={24} />
                        </View>
                        <View style={styles.methodInfo}>
                            <Text style={styles.methodName}>{loading ? "Processing..." : "Chapa Payment"}</Text>
                            <Text style={styles.methodSub}>Telebirr, Cards, Mobile Banking</Text>
                        </View>
                        <View style={styles.actionArrow}>
                            <ChevronLeft color={COLORS.primary} size={20} style={{ transform: [{ rotate: '180deg' }] }} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            if (user?.role === 'barber') handlePayment('cash');
                            else Alert.alert('Restricted', 'Cash at Studio is only available for Barbers to register payments.');
                        }}
                        disabled={loading || user?.role !== 'barber'}
                    >
                        <View style={styles.methodIconBox}>
                            <Smartphone color={user?.role === 'barber' ? COLORS.primary : COLORS.textSecondary} size={24} />
                        </View>
                        <View style={styles.methodInfo}>
                            <Text style={[styles.methodName, user?.role !== 'barber' && { color: COLORS.textSecondary }]}>Cash at Studio</Text>
                            <Text style={styles.methodSub}>{user?.role === 'barber' ? 'Register a cash payment' : 'Barber-only feature'}</Text>
                        </View>
                        {user?.role === 'barber' && (
                            <View style={styles.actionArrow}>
                                <ChevronLeft color={COLORS.primary} size={20} style={{ transform: [{ rotate: '180deg' }] }} />
                            </View>
                        )}
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

            {/* True In-App Checkout Overlay */}
            <Modal
                visible={showWebView}
                animationType="slide"
                onRequestClose={closeWebView}
            >
                <View style={[styles.webviewHeader, { paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={closeWebView} style={styles.webviewCloseBtn}>
                        <X color={COLORS.text} size={24} />
                    </TouchableOpacity>
                    <View style={styles.secureBadge}>
                        <Lock color={COLORS.success} size={14} />
                        <Text style={styles.secureBadgeText}>SECURE CHAPA CHECKOUT</Text>
                    </View>
                    <View style={{ width: 44 }} />
                </View>
                {checkoutUrl && (
                    <WebView
                        source={{ uri: checkoutUrl }}
                        style={{ flex: 1, backgroundColor: COLORS.background }}
                        onNavigationStateChange={handleWebViewNavigation}
                        startInLoadingState={true}
                        renderLoading={() => (
                            <View style={styles.webviewLoader}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                            </View>
                        )}
                    />
                )}
            </Modal>
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
    actionArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    webviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.card,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    webviewCloseBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#222',
        borderRadius: 12,
    },
    webviewLoader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
});
