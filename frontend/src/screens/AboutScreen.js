import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { ArrowLeft, User, Mail, Smartphone, Globe, Code, ShieldCheck, Heart } from 'lucide-react-native';

export default function AboutScreen({ navigation }) {
    const insets = useSafeAreaInsets();

    const handleLink = (url) => {
        Linking.openURL(url);
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.background, COLORS.card]} style={StyleSheet.absoluteFill} />

            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>About Yebichu</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

                <View style={styles.logoSection}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoText}>Y</Text>
                    </View>
                    <Text style={styles.appName}>Yebichu App</Text>
                    <Text style={styles.version}>Version 1.0.0</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <ShieldCheck color={COLORS.primary} size={20} />
                        <Text style={styles.cardTitle}>Our Mission</Text>
                    </View>
                    <Text style={styles.cardText}>
                        Yebichu is dedicated to connecting clients with extraordinary barbers.
                        We believe grooming is an art form, and our platform makes it effortless
                        to discover, book, and refine your signature look with elite professionals.
                    </Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Code color={COLORS.primary} size={20} />
                        <Text style={styles.cardTitle}>Developer Info</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <User color={COLORS.textSecondary} size={18} />
                        <Text style={styles.infoLabel}>Built By:</Text>
                        <Text style={styles.infoValue}>Esubalew Bego</Text>
                    </View>

                    <TouchableOpacity style={styles.infoRow} onPress={() => handleLink('mailto:esubalewbego9@gmail.com')}>
                        <Mail color={COLORS.textSecondary} size={18} />
                        <Text style={styles.infoLabel}>Email:</Text>
                        <Text style={styles.infoLink}>esubalewbego9@gmail.com</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.infoRow} onPress={() => handleLink('tel:+251967491981')}>
                        <Smartphone color={COLORS.textSecondary} size={18} />
                        <Text style={styles.infoLabel}>Mobile:</Text>
                        <Text style={styles.infoLink}>+251967491981</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.infoRow} onPress={() => handleLink('https://esubalewbego.vercel.app')}>
                        <Globe color={COLORS.textSecondary} size={18} />
                        <Text style={styles.infoLabel}>Website:</Text>
                        <Text style={styles.infoLink}>esubalewbego.vercel.app</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Heart color="#F44336" size={16} style={{ marginRight: 6 }} />
                    <Text style={styles.footerText}>Crafted with passion in Ethiopia</Text>
                </View>
                <Text style={styles.copyright}>© {new Date().getFullYear()} Esubalew Bego. All rights reserved.</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
    backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
    scroll: { padding: 24 },
    logoSection: { alignItems: 'center', marginBottom: 40, marginTop: 10 },
    logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 12, marginBottom: 16 },
    logoText: { color: COLORS.background, fontSize: 48, fontWeight: '900' },
    appName: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
    version: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
    card: { backgroundColor: COLORS.card, borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#333' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    cardTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    cardText: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
    infoLabel: { color: COLORS.textSecondary, fontSize: 14, marginLeft: 10, width: 80 },
    infoValue: { color: COLORS.text, fontSize: 14, fontWeight: '600', flex: 1 },
    infoLink: { color: COLORS.primary, fontSize: 14, fontWeight: '600', flex: 1, textDecorationLine: 'underline' },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30, marginBottom: 8 },
    footerText: { color: COLORS.textSecondary, fontSize: 13 },
    copyright: { color: '#555', fontSize: 11, textAlign: 'center' }
});
