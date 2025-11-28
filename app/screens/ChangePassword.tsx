import { secureStorageHelper } from '@/utils/secureStorage';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- THEME ---
const PrimaryColor = '#63b0a3';
const BackgroundColor = '#f0f4f7';
const CardColor = '#ffffff';
const TextColor = '#333333';
const SubtextColor = '#666666';

// --- NEW INTERFACE for PasswordInput component ---
interface PasswordInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    isSecure: boolean;
    onToggle: () => void;
}

const ChangePasswordScreen = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const validatePasswords = () => {
        if (newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters long.');
            return false;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New password and confirm password do not match.');
            return false;
        }
        if (oldPassword === newPassword) {
            Alert.alert('Error', 'New password cannot be the same as the old password.');
            return false;
        }
        return true;
    };

    const handleChangePassword = async () => {
        if (!validatePasswords()) return;
        
        setLoading(true);
        // NOTE: In a real application, you must fetch the user token from SecureStore 
        // and call POST /api/user/change-password with the token, oldPassword, and newPassword.

        try {
            const token = await secureStorageHelper.getItem('userToken');
            if (!token) throw new Error('Authentication required.');

            // --- MOCK API CALL START ---
            // In a real app, integrate with your backend here:
            // const response = await fetch('YOUR_API_URL/user/change-password', { ... });
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
            // --- MOCK API CALL END ---

            Alert.alert('Success', 'Your password has been updated successfully!');
            // Clear fields on success
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (error) {
            console.error('Password change error:', error);
            Alert.alert('Failed', 'Could not change password. Please check your current password and try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper component for password input with toggle button
    // FIX: Apply the PasswordInputProps interface to the component's arguments
    const PasswordInput: React.FC<PasswordInputProps> = ({ value, onChangeText, placeholder, isSecure, onToggle }) => (
        <View style={styles.inputContainer}>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={isSecure}
                placeholderTextColor={SubtextColor}
            />
            <TouchableOpacity onPress={onToggle} style={styles.toggleButton}>
                <Ionicons 
                    name={isSecure ? "eye-off-outline" : "eye-outline"} 
                    size={24} 
                    color={SubtextColor} 
                />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View style={styles.headerContainer}>
                <Text style={styles.screenTitle}>Change Password</Text>
            </View>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <Text style={styles.instructionText}>
                        Your new password must be secure and different from your previous password.
                    </Text>

                    <PasswordInput
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        placeholder="Current Password"
                        isSecure={!showOldPassword}
                        onToggle={() => setShowOldPassword(prev => !prev)}
                    />
                    
                    <PasswordInput
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="New Password (min 6 characters)"
                        isSecure={!showNewPassword}
                        onToggle={() => setShowNewPassword(prev => !prev)}
                    />
                    
                    <PasswordInput
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm New Password"
                        isSecure={!showNewPassword} // Use same toggle as new password for simplicity
                        onToggle={() => setShowNewPassword(prev => !prev)}
                    />
                    
                    <TouchableOpacity
                        style={[styles.saveButton, loading && { opacity: 0.7 }]}
                        onPress={handleChangePassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={CardColor} />
                        ) : (
                            <Text style={styles.saveButtonText}>Update Password</Text>
                        )}
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default ChangePasswordScreen;

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: CardColor,
    },
    headerContainer: {
        padding: 20,
        backgroundColor: CardColor,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: TextColor,
    },
    container: {
        flex: 1,
        backgroundColor: BackgroundColor,
    },
    scrollContent: {
        padding: 20,
        flexGrow: 1,
    },
    card: {
        backgroundColor: CardColor,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    instructionText: {
        fontSize: 14,
        color: SubtextColor,
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BackgroundColor,
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 15,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: TextColor,
    },
    toggleButton: {
        padding: 5,
    },
    saveButton: {
        backgroundColor: PrimaryColor,
        borderRadius: 10,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 20,
        elevation: 3,
    },
    saveButtonText: {
        color: CardColor,
        fontSize: 18,
        fontWeight: '700',
    },
});