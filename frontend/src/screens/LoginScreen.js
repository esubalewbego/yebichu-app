import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import CustomButton from '../components/Button';
import { Mail, Lock, Scissors, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const insets = useSafeAreaInsets();
    const { login, forgotPassword } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            await login(email, password);
            // Navigation is handled automatically by AppNavigator state change
        } catch (error) {
            console.error(error);
            Alert.alert('Login Failed', 'Invalid email or password. Make sure you have signed up first!');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert('Forgot Password', 'Please enter your email address first.');
            return;
        }
        try {
            await forgotPassword(email);
            Alert.alert('Email Sent', 'Check your inbox for a password reset link.');
        } catch (error) {
            Alert.alert('Error', 'Failed to send reset email. Please check the email address.');
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <LinearGradient
                colors={[COLORS.background, COLORS.primary + '10', COLORS.background]}
                style={StyleSheet.absoluteFill}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.logoSection}>
                        <View style={styles.logoOutline}>
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.primary + '80']}
                                style={styles.logoCircle}
                            >
                                <Scissors color={COLORS.background} size={42} />
                            </LinearGradient>
                        </View>
                        <Text style={styles.logoText}>YEBICHU</Text>
                        <Text style={styles.logoSub}>BARBER STUDIO</Text>
                        <View style={styles.taglineBox}>
                            <Text style={styles.tagline}>Premium Grooming for Modern Gentlemen</Text>
                        </View>
                    </View>

                    <View style={styles.formSection}>
                        <Text style={styles.formTitle}>Welcome Back</Text>
                        <Text style={styles.formSub}>Sign in to continue your journey</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email or Username</Text>
                            <View style={styles.inputWrapper}>
                                <Mail color={COLORS.textSecondary} size={20} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="email or username"
                                    placeholderTextColor="#555"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <Lock color={COLORS.textSecondary} size={20} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#555"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
                            <Text style={styles.forgotText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <CustomButton
                            title={loading ? "Verifying..." : "Sign In"}
                            onPress={handleLogin}
                            disabled={loading}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>New to Yebichu? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.signupBtn}>
                                <Text style={styles.signupText}>Create Account</Text>
                                <ArrowRight color={COLORS.primary} size={16} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoOutline: {
        width: 100,
        height: 100,
        borderRadius: 50,
        padding: 4,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 20,
        elevation: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    logoCircle: {
        width: '100%',
        height: '100%',
        borderRadius: 46,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        color: COLORS.text,
        fontSize: 36,
        fontWeight: 'bold',
        letterSpacing: 4,
    },
    logoSub: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 2,
        marginTop: 4,
    },
    taglineBox: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: COLORS.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    tagline: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '500',
    },
    formSection: {
        width: '100%',
    },
    formTitle: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    formSub: {
        color: COLORS.textSecondary,
        fontSize: 15,
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333',
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 15,
        color: COLORS.text,
        fontSize: 16,
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: 32,
    },
    forgotText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
        gap: 8,
    },
    footerText: {
        color: COLORS.textSecondary,
        fontSize: 15,
    },
    signupBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    signupText: {
        color: COLORS.primary,
        fontSize: 15,
        fontWeight: 'bold',
    },
});
