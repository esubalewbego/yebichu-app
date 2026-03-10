import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { FileDown, Users, Calendar, DollarSign, ArrowLeft, BarChart } from 'lucide-react-native';
import { db } from '../config/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

export default function ReportsScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalBookings: 0,
        completedBookings: 0,
        totalRevenue: 0,
        totalUsers: 0
    });
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const appointmentsSnapshot = await getDocs(query(collection(db, 'appointments'), orderBy('createdAt', 'desc')));
            const usersSnapshot = await getDocs(collection(db, 'users'));

            const appointments = appointmentsSnapshot.docs.map(doc => doc.data());

            const completed = appointments.filter(a => a.status?.toLowerCase() === 'completed');
            const revenue = completed.reduce((sum, a) => sum + (Number(a.price) || 0), 0);

            setStats({
                totalBookings: appointments.length,
                completedBookings: completed.length,
                totalRevenue: revenue,
                totalUsers: usersSnapshot.size
            });
        } catch (error) {
            console.error('Error fetching reports:', error);
            Alert.alert('Error', 'Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = async () => {
        try {
            setExporting(true);
            const snapshot = await getDocs(query(collection(db, 'appointments'), orderBy('createdAt', 'desc')));
            const appointments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (appointments.length === 0) {
                Alert.alert('Info', 'No data to export');
                return;
            }

            // CSV Header
            let csvContent = 'ID,User,Email,BarberID,Date,Time,Price,Status,CreatedAt\n';

            // CSV Body
            appointments.forEach(a => {
                const row = [
                    a.id,
                    `"${a.userName || 'N/A'}"`,
                    `"${a.userEmail || 'N/A'}"`,
                    a.barberId || 'None',
                    a.date || 'N/A',
                    a.time || 'N/A',
                    a.price || 0,
                    a.status || 'pending',
                    a.createdAt || 'N/A'
                ].join(',');
                csvContent += row + '\n';
            });

            const fileName = `Yebichu_Bookings_Report_${new Date().toISOString().split('T')[0]}.csv`;
            const fileUri = FileSystem.documentDirectory + fileName;

            await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Success', `CSV saved to: ${fileUri}`);
            }
        } catch (error) {
            console.error('Export error:', error);
            Alert.alert('Error', 'Failed to export CSV');
        } finally {
            setExporting(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, suffix = '' }) => (
        <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                <Icon color={color} size={24} />
            </View>
            <View>
                <Text style={styles.statValue}>{value}{suffix}</Text>
                <Text style={styles.statTitle}>{title}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.primary + '30', COLORS.background]}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Business Reports</Text>
            </LinearGradient>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.grid}>
                        <StatCard
                            title="Total Bookings"
                            value={stats.totalBookings}
                            icon={Calendar}
                            color="#2196F3"
                        />
                        <StatCard
                            title="Completed"
                            value={stats.completedBookings}
                            icon={BarChart}
                            color="#4CAF50"
                        />
                        <StatCard
                            title="Total Revenue"
                            value={stats.totalRevenue}
                            icon={DollarSign}
                            color="#FFC107"
                            suffix=" ETB"
                        />
                        <StatCard
                            title="Total Clients"
                            value={stats.totalUsers}
                            icon={Users}
                            color="#E91E63"
                        />
                    </View>

                    <View style={styles.actionSection}>
                        <Text style={styles.sectionTitle}>Data Portability</Text>
                        <Text style={styles.sectionDesc}>Export your business data to CSV for offline analysis and accounting.</Text>

                        <TouchableOpacity
                            style={styles.exportBtn}
                            onPress={exportToCSV}
                            disabled={exporting}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, '#8B0000']}
                                style={styles.btnGradient}
                            >
                                {exporting ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <FileDown color="#FFF" size={20} />
                                        <Text style={styles.btnText}>Export Bookings to CSV</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    statCard: {
        width: (width - 50) / 2,
        backgroundColor: COLORS.card,
        padding: 20,
        borderRadius: 24,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#333'
    },
    statIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    statValue: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
    statTitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
    actionSection: { marginTop: 30, backgroundColor: COLORS.card, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#333' },
    sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
    sectionDesc: { color: COLORS.textSecondary, fontSize: 14, marginTop: 8, lineHeight: 20 },
    exportBtn: { marginTop: 20, borderRadius: 16, overflow: 'hidden' },
    btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
    btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
