import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { ArrowLeft, User, Mail, Phone, FileText, Camera, Trash2, Lock } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { updateUserProfile, updatePassword } from '../services/api';
import CustomButton from '../components/Button';

export default function EditProfileScreen({ navigation }) {
    const { user, updateUser, logout } = useAuth();
    const insets = useSafeAreaInsets();

    const [fullName, setFullName] = useState(user?.fullName || '');
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [profileImage, setProfileImage] = useState(user?.profileImageUrl || null);
    const [newImageSelected, setNewImageSelected] = useState(false);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFullName(user.fullName || '');
            setUsername(user.username || '');
            setBio(user.bio || '');
            setPhone(user.phone || '');
            if (!newImageSelected) {
                setProfileImage(user.profileImageUrl || null);
            }
        }
    }, [user]);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
            setNewImageSelected(true);
        }
    };

    const handleSave = async () => {
        if (!fullName || !username) {
            Alert.alert('Error', 'Full name and username are required.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('fullName', fullName);
            formData.append('username', username);
            formData.append('bio', bio);
            formData.append('phone', phone);

            if (newImageSelected && profileImage) {
                const filename = profileImage.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : `image`;
                formData.append('profileImage', {
                    uri: profileImage,
                    name: filename,
                    type,
                });
            }

            const { data } = await updateUserProfile(user.uid, formData);

            // Update local context
            updateUser({
                fullName: data.fullName,
                username: data.username,
                bio: data.bio,
                phone: data.phone,
                profileImageUrl: data.profileImageUrl || user.profileImageUrl
            });

            Alert.alert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Failed to update profile:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async () => {
        if (!newPassword || newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }

        setPasswordLoading(true);
        try {
            await updatePassword(user.uid, newPassword);
            Alert.alert('Success', 'Password updated successfully!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Failed to update password:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to update password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you absolutely sure you want to delete your account? This action cannot be undone and will remove all your data.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete My Account",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await deleteAccount(user.uid);
                            await logout();
                            Alert.alert('Success', 'Your account has been permanently deleted.');
                        } catch (error) {
                            console.error('Deletion failed:', error);
                            Alert.alert('Error', 'Failed to delete account. Please contact support.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.background, COLORS.primary + '05']} style={StyleSheet.absoluteFill} />

            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

                <View style={styles.imagePickerContainer}>
                    <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.profileImage} />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Camera color={COLORS.primary} size={32} />
                            </View>
                        )}
                        <View style={styles.editBadge}>
                            <Camera color={COLORS.background} size={14} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputWrapper}>
                            <User color={COLORS.textSecondary} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="John Doe"
                                placeholderTextColor="#555"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Username</Text>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.atSymbol}>@</Text>
                            <TextInput
                                style={styles.input}
                                value={username}
                                onChangeText={setUsername}
                                placeholder="johndoe"
                                placeholderTextColor="#555"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address (Cannot be changed)</Text>
                        <View style={[styles.inputWrapper, { opacity: 0.5 }]}>
                            <Mail color={COLORS.textSecondary} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={user?.email}
                                editable={false}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={styles.inputWrapper}>
                            <Phone color={COLORS.textSecondary} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="+1 234 567 8900"
                                placeholderTextColor="#555"
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bio</Text>
                        <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
                            <FileText color={COLORS.textSecondary} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { textAlignVertical: 'top' }]}
                                value={bio}
                                onChangeText={setBio}
                                placeholder="A little bit about yourself..."
                                placeholderTextColor="#555"
                                multiline
                            />
                        </View>
                    </View>

                    <View style={styles.btnWrapper}>
                        <CustomButton
                            title={loading ? "Saving..." : "Save Changes"}
                            onPress={handleSave}
                            disabled={loading}
                        />
                    </View>
                </View>

                <View style={[styles.section, { marginTop: 20 }]}>
                    <Text style={styles.sectionLabel}>Security & Password</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.inputWrapper}>
                            <Lock color={COLORS.textSecondary} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Enter new password"
                                placeholderTextColor="#555"
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm New Password</Text>
                        <View style={styles.inputWrapper}>
                            <Lock color={COLORS.textSecondary} size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirm new password"
                                placeholderTextColor="#555"
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <CustomButton
                        title={passwordLoading ? "Updating..." : "Update Password"}
                        onPress={handlePasswordUpdate}
                        variant="outline"
                        disabled={passwordLoading}
                    />
                </View>

                <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
                    <Trash2 color="#F44336" size={20} />
                    <Text style={styles.deleteBtnText}>Delete Account</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: '#222' },
    backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    headerTitle: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
    scroll: { padding: 24 },
    imagePickerContainer: { alignItems: 'center', marginBottom: 32 },
    imagePickerBtn: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary },
    profileImage: { width: '100%', height: '100%', borderRadius: 60 },
    imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: COLORS.background },
    form: { width: '100%' },
    inputGroup: { marginBottom: 20 },
    label: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 10, marginLeft: 4 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: '#333', paddingHorizontal: 16 },
    inputIcon: { marginRight: 12 },
    atSymbol: { color: COLORS.textSecondary, fontSize: 18, fontWeight: 'bold', marginRight: 12 },
    input: { flex: 1, paddingVertical: 14, color: COLORS.text, fontSize: 15 },
    btnWrapper: { marginTop: 12, marginBottom: 32 },
    sectionLabel: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
    deleteBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#F4433610', borderRadius: 16, borderWidth: 1, borderColor: '#F4433620' },
    deleteBtnText: { color: '#F44336', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }
});
