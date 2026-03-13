import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import CustomButton from '../components/Button';
import { uploadProfileImage } from '../services/api';
import { Mail, Lock, User, ChevronLeft, ArrowLeft, ShieldCheck, Smartphone, Scissors, Camera } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

export default function SignupScreen({ navigation }) {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [loading, setLoading] = useState(false);
    const insets = useSafeAreaInsets();
    const { signup } = useAuth();

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled) {
                await uploadImageToBackend(result.assets[0]);
            }
        } catch (error) {
            console.error('Pick image error:', error);
            Alert.alert('Error', 'Failed to open image gallery.');
        }
    };

    const uploadImageToBackend = async (asset) => {
        setUploadingImage(true);
        try {
            const formDataToUpload = new FormData();
            const filename = asset.uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const ext = match ? match[1] : 'jpg';
            const type = `image/${ext}`;

            formDataToUpload.append('image', {
                uri: asset.uri,
                type: type,
                name: filename || 'upload.jpg',
            });

            const { data } = await uploadProfileImage(formDataToUpload);
            setProfileImageUrl(data.url);
        } catch (error) {
            console.error('Image upload failed:', error);
            Alert.alert('Upload Error', 'Failed to upload the image.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSignup = async () => {
        if (!email || !password || !fullName || !username) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            const signupData = {
                fullName,
                username,
                email,
                password,
                profileImageUrl: profileImageUrl || ''
            };

            await signup(signupData);

            Alert.alert('Success', `Account created successfully!`, [
                { text: 'Login Now', onPress: () => navigation.navigate('Login') }
            ]);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Signup failed: ' + (e.response?.data?.error || e.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.background, COLORS.primary + '05', COLORS.background]}
                style={StyleSheet.absoluteFill}
            />

            <View style={[styles.header, { marginTop: insets.top }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Account</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.scroll,
                        { paddingBottom: insets.bottom + 40 }
                    ]}
                >
                    <View style={styles.introSection}>
                        <Text style={styles.welcomeText}>Join Yebichu</Text>
                        <Text style={styles.subtitle}>Extraordinary grooming for extraordinary people.</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.imagePickerContainer}>
                            <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage} disabled={uploadingImage}>
                                {uploadingImage ? (
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                ) : profileImageUrl ? (
                                    <>
                                        <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
                                        <View style={styles.editBadge}>
                                            <Camera color={COLORS.background} size={14} />
                                        </View>
                                    </>
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <Camera color={COLORS.primary} size={32} />
                                        <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputWrapper}>
                                <User color={COLORS.textSecondary} size={20} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="John Doe"
                                    placeholderTextColor="#555"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Username</Text>
                            <View style={styles.inputWrapper}>
                                <Scissors color={COLORS.textSecondary} size={20} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="johndoe"
                                    placeholderTextColor="#555"
                                    value={username}
                                    onChangeText={setUsername}
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputWrapper}>
                                <Mail color={COLORS.textSecondary} size={20} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="your@email.com"
                                    placeholderTextColor="#555"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
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
                                    placeholder="Minimum 8 characters"
                                    placeholderTextColor="#555"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>


                        <View style={styles.termsBox}>
                            <Text style={styles.termsText}>
                                By joining, you agree to our <Text style={styles.linkText}>Terms</Text> and <Text style={styles.linkText}>Privacy Policy</Text>.
                            </Text>
                        </View>

                        <CustomButton
                            title={loading ? "Creating Account..." : "Get Started"}
                            onPress={handleSignup}
                            disabled={loading}
                        />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Existing member? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginText}>Sign In</Text>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
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
        fontSize: 18,
        fontWeight: 'bold',
    },
    scroll: {
        padding: 24,
        paddingTop: 10,
    },
    introSection: {
        marginBottom: 32,
    },
    welcomeText: {
        color: COLORS.text,
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        color: COLORS.textSecondary,
        fontSize: 15,
        lineHeight: 22,
    },
    imagePickerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    imagePickerBtn: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    imagePlaceholderText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 4,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.background,
    },
    form: {
        width: '100%',
    },
    row: {
        flexDirection: 'row',
    },
    inputGroup: {
        marginBottom: 20,
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
        paddingVertical: 14,
        color: COLORS.text,
        fontSize: 15,
    },
    activeDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },
    termsBox: {
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    termsText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    linkText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
        marginBottom: 40,
    },
    footerText: {
        color: COLORS.textSecondary,
        fontSize: 15,
    },
    loginText: {
        color: COLORS.primary,
        fontSize: 15,
        fontWeight: 'bold',
    },
});
