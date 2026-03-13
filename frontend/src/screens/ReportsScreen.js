import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { FileDown, Users, Calendar, DollarSign, ArrowLeft, BarChart, Scissors, Package, LayoutGrid } from 'lucide-react-native';
import { getAdminAnalytics, getAllAppointments } from '../services/api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

const { width } = Dimensions.get('window');

export default function ReportsScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalBookings: 0,
        completedBookings: 0,
        totalRevenue: 0,
        totalUsers: 0,
        totalPackages: 0,
        totalStyles: 0
    });
    const [allAppointments, setAllAppointments] = useState([]);
    const [filteredStats, setFilteredStats] = useState(null);
    const [filter, setFilter] = useState('All Time'); // 'Today' | 'This Month' | 'This Year' | 'All Time'
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    useEffect(() => {
        applyFilter();
    }, [filter, allAppointments]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const [{ data: analytics }, { data: appointments }] = await Promise.all([
                getAdminAnalytics(),
                getAllAppointments()
            ]);

            setStats({
                totalBookings: appointments.length,
                completedBookings: analytics.completed,
                totalRevenue: analytics.totalRevenue,
                totalUsers: analytics.totalUsers,
                totalPackages: analytics.totalPackages,
                totalStyles: analytics.totalStyles
            });
            setAllAppointments(appointments);
        } catch (error) {
            console.error('Error fetching reports:', error);
            Alert.alert('Error', 'Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = () => {
        if (filter === 'All Time') {
            setFilteredStats(null);
            return;
        }

        const now = new Date();
        let start = new Date();

        if (filter === 'Today') {
            start.setHours(0, 0, 0, 0);
        } else if (filter === 'This Month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (filter === 'This Year') {
            start = new Date(now.getFullYear(), 0, 1);
        }

        const filtered = allAppointments.filter(a => {
            const date = new Date(a.createdAt || a.date);
            return date >= start;
        });

        const completed = filtered.filter(a => a.status?.toLowerCase() === 'completed');
        const revenue = completed.reduce((sum, a) => sum + (Number(a.price) || 0), 0);

        setFilteredStats({
            totalBookings: filtered.length,
            completedBookings: completed.length,
            totalRevenue: revenue
        });
    };

    const exportToCSV = async () => {
        try {
            setExporting(true);
            if (allAppointments.length === 0) {
                Alert.alert('Info', 'No data to export');
                return;
            }

            // CSV Header
            let csvContent = 'ID,User,Email,BarberID,Date,Time,Price,Status,CreatedAt\n';

            // CSV Body
            allAppointments.forEach(a => {
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

    const exportToPDF = async () => {
        try {
            setExporting(true);
            if (allAppointments.length === 0) {
                Alert.alert('Info', 'No data to export');
                return;
            }

            const html = `
                <html>
                    <head>
                        <style>
                            body { font-family: 'Helvetica', sans-serif; padding: 20px; }
                            h1 { color: #8B0000; text-align: center; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                            th { background-color: #8B0000; color: white; }
                            tr:nth-child(even) { background-color: #f9f9f9; }
                            .summary { margin-top: 30px; padding: 15px; background: #f5f5f5; border-radius: 8px; }
                        </style>
                    </head>
                    <body>
                        <h1>Yebichu Bookings Report</h1>
                        <p>Generated on: ${new Date().toLocaleString()}</p>
                        
                        <div class="summary">
                            <h3>Business Summary (${filter})</h3>
                            <p>Total Bookings: ${activeStats.totalBookings}</p>
                            <p>Completed: ${activeStats.completedBookings}</p>
                            <p>Total Revenue: ${activeStats.totalRevenue.toLocaleString()} ETB</p>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${allAppointments.map(a => `
                                    <tr>
                                        <td>${a.userName || 'N/A'}</td>
                                        <td>${a.date || 'N/A'}</td>
                                        <td>${a.time || 'N/A'}</td>
                                        <td>${a.price || 0}</td>
                                        <td>${a.status || 'pending'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            } else {
                Alert.alert('Success', `PDF generated at: ${uri}`);
            }
        } catch (error) {
            console.error('PDF Export error:', error);
            Alert.alert('Error', 'Failed to generate PDF report');
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

    const activeStats = filteredStats || stats;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.primary + '30', COLORS.background]}
                style={[styles.header, { paddingTop: insets.top + 10 }]}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Business Reports</Text>
                    <Text style={styles.headerSub}>Real-time performance metrics</Text>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.filterRow}>
                        {['Today', 'This Month', 'This Year', 'All Time'].map((f) => (
                            <TouchableOpacity
                                key={f}
                                style={[styles.filterChip, filter === f && styles.activeChip]}
                                onPress={() => setFilter(f)}
                            >
                                <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>{f}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.grid}>
                        <StatCard
                            title="Total Bookings"
                            value={activeStats.totalBookings}
                            icon={Calendar}
                            color="#2196F3"
                        />
                        <StatCard
                            title="Completed"
                            value={activeStats.completedBookings}
                            icon={BarChart}
                            color="#4CAF50"
                        />
                        <StatCard
                            title="Revenue"
                            value={activeStats.totalRevenue.toLocaleString()}
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
                        <StatCard
                            title="Premium Packages"
                            value={stats.totalPackages}
                            icon={Package}
                            color="#9C27B0"
                        />
                        <StatCard
                            title="Haircut Styles"
                            value={stats.totalStyles}
                            icon={Scissors}
                            color="#FF5722"
                        />
                    </View>

                    <View style={styles.actionSection}>
                        <Text style={styles.sectionTitle}>Data Portability</Text>
                        <Text style={styles.sectionDesc}>Export all your business data to CSV for offline analysis and accounting.</Text>

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
                                        <Text style={styles.btnText}>Export All to CSV</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.exportBtn, { marginTop: 15 }]}
                            onPress={exportToPDF}
                            disabled={exporting}
                        >
                            <LinearGradient
                                colors={['#444', '#222']}
                                style={styles.btnGradient}
                            >
                                {exporting ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <FileDown color="#FFF" size={20} />
                                        <Text style={styles.btnText}>Export All to PDF</Text>
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
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
    headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20 },
    filterRow: { flexDirection: 'row', marginBottom: 20, gap: 8 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.card, borderWidth: 1, borderColor: '#333' },
    activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
    activeFilterText: { color: COLORS.background },
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
