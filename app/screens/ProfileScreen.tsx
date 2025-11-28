import { API_URL } from '@/config/api';
import { secureStorageHelper } from '@/utils/secureStorage';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Configuration ---
// 🚨 CRITICAL: Replace "http://YOUR_LOCAL_IP:3000/api" with your server's actual IPv4 address!
// const BASE_URL = "http://YOUR_LOCAL_IP:3000/api"; 
const DEFAULT_PROFILE_PIC = 'https://placehold.co/100x100/63b0a3/FFFFFF?text=A';

// --- THEME ---
const PrimaryColor = '#63b0a3'; 
const BackgroundColor = '#f0f4f7'; 
const CardColor = '#ffffff'; 
const TextColor = '#333333'; 
const SubtextColor = '#666666'; 

// --- Data Structure for Local State ---
interface UserDetails {
    id: string;
    name: string;
    username: string;
    email: string;
    phone: string; 
    address: string; 
    avatarUri: string;
}

/**
 * Custom Input Field component for consistent styling
 */
interface CustomInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    placeholder?: string;
    editable?: boolean;
}

const CustomInput: React.FC<CustomInputProps> = ({ label, value, onChangeText, keyboardType = 'default', placeholder, editable = true }) => (
    <View style={inputStyles.container}>
        <Text style={inputStyles.label}>{label}</Text>
        <TextInput
            style={[inputStyles.input, !editable && inputStyles.disabledInput]}
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            placeholder={placeholder}
            editable={editable}
            placeholderTextColor={SubtextColor}
        />
    </View>
);

const inputStyles = StyleSheet.create({
    container: {
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: PrimaryColor,
        marginBottom: 8,
    },
    input: {
        backgroundColor: CardColor,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: TextColor,
    },
    disabledInput: {
        backgroundColor: '#f9f9f9',
        color: SubtextColor,
    }
});


const ProfileScreen = () => { 
    const router = useRouter(); 
    const [user, setUser] = useState<UserDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // State to hold editable profile data
    const [editableData, setEditableData] = useState({
        name: '',
        phone: '',
        address: '',
        newAvatarUri: '',
    });

    // --- Load User Data from Storage ---
    const loadUserData = useCallback(async () => {
        try {
            const userDataJson = await AsyncStorage.getItem('userData');
            const token = await secureStorageHelper.getItem('userToken');

            if (userDataJson && token) {
                const data = JSON.parse(userDataJson);
                
                // Construct complete user data with defaults
                const completeUserData: UserDetails = {
                    id: data.id || '',
                    name: data.name || 'User',
                    username: data.username || 'user_handle',
                    email: data.email || 'No Email',
                    avatarUri: data.avatarUri || DEFAULT_PROFILE_PIC,
                    phone: data.phone || '', 
                    address: data.address || '',
                };

                setUser(completeUserData);
                setEditableData({
                    name: completeUserData.name,
                    phone: completeUserData.phone,
                    address: completeUserData.address,
                    newAvatarUri: '', 
                });

            } else {
                // If token or data is missing, signal session failure
                setUser(null); 
            }
        } catch (error) {
            console.error("Error loading user data from AsyncStorage:", error);
            setUser(null); 
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUserData();
    }, [loadUserData]);


    // --- Profile Picture Logic ---
    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setEditableData(prev => ({ ...prev, newAvatarUri: result.assets[0].uri }));
        }
    };
    
    // --- Save Profile Changes ---
    const handleSaveChanges = async () => {
        if (isSaving || !user) return;
        
        setIsSaving(true);
        const token = await secureStorageHelper.getItem('userToken');

        // Data to send to the server (only send fields that can be updated)
        const updatePayload = {
            name: editableData.name,
            phone: editableData.phone,
            address: editableData.address,
        };

        let newAvatarUrl = user.avatarUri;

        // 1. Handle Image Upload First (MOCKED)
        if (editableData.newAvatarUri) {
             Alert.alert('Image Upload Pending (MOCK)', 'Image would be uploaded now. Update your backend routes/user.js with this logic!');
             newAvatarUrl = editableData.newAvatarUri; // Mocking the successful URL:
        }

        // 2. Send Profile Data to Backend (MOCKED: PUT /api/user/profile/:id)
        try {
            // NOTE: This fetch call is mocked and relies on a valid BASE_URL
            const response = await fetch(`${API_URL}/user/profile/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({...updatePayload, avatarUri: newAvatarUrl}),
            });

            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                let errorDetails = "Failed to update profile.";
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const error = await response.json();
                    errorDetails = error.message || errorDetails;
                }
                throw new Error(errorDetails);
            }

            // MOCK: Assuming successful backend update and receiving new user data
            const updatedUserResponse = {
                user: {
                    id: user.id,
                    name: editableData.name,
                    username: user.username,
                    email: user.email,
                    avatarUri: newAvatarUrl,
                    phone: editableData.phone,
                    address: editableData.address,
                }
            };

            // 3. Update Local Storage & State on Success
            const updatedDataInStorage = { 
                ...JSON.parse(await AsyncStorage.getItem('userData') || '{}'),
                ...updatedUserResponse.user
            };
            await AsyncStorage.setItem('userData', JSON.stringify(updatedDataInStorage));

            setUser(updatedUserResponse.user); 
            setEditableData(prev => ({ ...prev, newAvatarUri: '' })); 

            Alert.alert('Success', 'Your profile details have been successfully updated!');

        } catch (error: any) {
            console.error("Save failed:", error);
            Alert.alert('Update Failed', `Could not save changes. ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={PrimaryColor} />
                <Text style={{ marginTop: 10, color: SubtextColor }}>Loading Profile...</Text>
            </View>
        );
    }
    
    if (!user) {
        return (
             <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Ionicons name="alert-circle-outline" size={50} color="#FF3B30" style={{ marginBottom: 15 }} />
                <Text style={{ color: TextColor, fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 10 }}>
                    Session Expired
                </Text>
                <Text style={{ color: SubtextColor, fontSize: 14, textAlign: 'center', marginBottom: 30 }}>
                    Your session has expired or is invalid. Please log in again to continue.
                </Text>
                {/* Button to navigate to the login screen */}
                <TouchableOpacity 
                    style={styles.errorButton}
                    onPress={() => router.replace('/(auth)/login')} // Navigate to login route
                >
                    <Text style={styles.errorButtonText}>Go to Login Screen</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Determine which image to show: the new local image or the old one
    const displayAvatar = editableData.newAvatarUri || user.avatarUri;

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    
                    {/* Header Section - Profile Picture */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
                            <Image source={{ uri: displayAvatar }} style={styles.profileImage} />
                            <View style={styles.cameraIcon}>
                                <Ionicons name="camera-outline" size={20} color={CardColor} />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.userName}>{user.username}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                    </View>

                    {/* Input Fields Card */}
                    <View style={styles.actionCard}>
                        <Text style={styles.sectionTitle}>Account Details</Text>
                        <CustomInput
                            label="Full Name"
                            value={editableData.name}
                            onChangeText={(text) => setEditableData(prev => ({ ...prev, name: text }))}
                            placeholder="Enter your full name"
                        />
                        <CustomInput
                            label="Username"
                            value={user.username}
                            onChangeText={() => {}} 
                            editable={false}
                            placeholder="Your unique handle"
                        />
                        <CustomInput
                            label="Email"
                            value={user.email}
                            onChangeText={() => {}}
                            editable={false}
                            placeholder="Primary email address"
                            keyboardType="email-address"
                        />
                         <CustomInput
                            label="Phone Number"
                            value={editableData.phone}
                            onChangeText={(text) => setEditableData(prev => ({ ...prev, phone: text }))}
                            placeholder="e.g., +91 9876543210"
                            keyboardType="phone-pad"
                        />
                         <CustomInput
                            label="Address"
                            value={editableData.address}
                            onChangeText={(text) => setEditableData(prev => ({ ...prev, address: text }))}
                            placeholder="Enter your street address or city"
                        />
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity 
                        style={styles.saveButton}
                        onPress={handleSaveChanges}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color={CardColor} />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>

                    {/* Placeholder for Password/Security Link */}
                    <TouchableOpacity style={styles.securityLink} onPress={() => Alert.alert('Security', 'Navigate to Change Password Screen')}>
                        <Text style={styles.securityLinkText}>Change Password or Security Settings</Text>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BackgroundColor,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    header: {
        paddingTop: 40,
        paddingBottom: 30,
        alignItems: 'center',
        backgroundColor: CardColor, 
        marginBottom: 10,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
        borderWidth: 3, 
        borderColor: PrimaryColor,
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 5,
        right: 0,
        backgroundColor: PrimaryColor,
        borderRadius: 15,
        padding: 5,
        borderWidth: 2,
        borderColor: CardColor,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: TextColor,
        marginBottom: 5, 
    },
    userEmail: {
        fontSize: 14,
        color: SubtextColor,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: TextColor,
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 10,
    },
    actionCard: {
        backgroundColor: CardColor,
        borderRadius: 12, 
        marginHorizontal: 15,
        marginBottom: 20,
        elevation: 2, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        paddingVertical: 10,
    },
    saveButton: {
        backgroundColor: PrimaryColor,
        borderRadius: 10,
        paddingVertical: 15,
        marginHorizontal: 20,
        alignItems: 'center',
        marginTop: 10,
        elevation: 3,
    },
    saveButtonText: {
        color: CardColor,
        fontSize: 18,
        fontWeight: '700',
    },
    // New style specifically for the error state button
    errorButton: {
        backgroundColor: PrimaryColor,
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 30,
        alignItems: 'center',
        marginTop: 10,
    },
    errorButtonText: {
        color: CardColor,
        fontSize: 16,
        fontWeight: '600',
    },
    securityLink: {
        alignItems: 'center',
        marginTop: 20,
    },
    securityLinkText: {
        color: PrimaryColor,
        fontSize: 14,
        fontWeight: '600',
    }
});

export default ProfileScreen;