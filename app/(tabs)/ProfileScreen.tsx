// This file defines the User Profile Screen for the React Native application.
// It contains only the Profile content, with mock navigation buttons and the bottom bar removed.

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// Import AsyncStorage to read saved user data
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Configuration (Placeholder for API URL) ---
const API_URL = "http://localhost:3000"; 

// --- THEME AND STYLES (Matching provided image theme) ---

const PrimaryColor = '#63b0a3'; // Teal (accents)
const BackgroundColor = '#f0f4f7'; // Light grey background
const CardColor = '#ffffff'; // White for cards and main elements
const TextColor = '#333333'; // Dark text
const SubtextColor = '#666666'; // Muted text for descriptions

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BackgroundColor,
  },
  header: {
    paddingTop: 50, // Adjust for status bar
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: PrimaryColor, // White header background
    marginBottom: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 2, // Subtle border
    borderColor: '#ffffffff',
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
    marginBottom: 20, // Space below email
  },
  
  actionCard: {
    backgroundColor: CardColor,
    borderRadius: 12, // Subtle roundness to match the image
    marginHorizontal: 15,
    marginBottom: 20,
    elevation: 2, // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18, // More padding for taller items
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastActionItem: {
    borderBottomWidth: 0, // No border for the last item
  },
  actionIconContainer: {
    width: 35, // Fixed width for icon container
    height: 35,
    borderRadius: 18, // Circular background for icons
    backgroundColor: '#e6f7ff', // Light blue background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionIcon: {
    fontSize: 18,
    color: PrimaryColor, // Teal for action icons
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: TextColor,
    fontWeight: '500',
  },
  arrow: {
    fontSize: 18,
    color: SubtextColor,
  },
  // Removed mock navigation styles
});

// --- USER DATA STRUCTURE based on SignupScreen response ---
interface UserData {
    name: string;
    email: string;
    profilePicture: string;
}

const DEFAULT_PROFILE_PIC = 'https://cdn.pixabay.com/photo/2016/11/29/02/05/asian-1866914_1280.jpg';

// Mock list of profile actions (Matching the image)
const PROFILE_ACTIONS = [
  { id: '1', name: 'My Saved', icon: '♥', action: 'saved' },
  { id: '2', name: 'Appointment', icon: '📝', action: 'appointment' },
  { id: '3', name: 'Payment Method', icon: '💳', action: 'payment' },
  { id: '4', name: 'FAQs', icon: '❓', action: 'faqs' },
  { id: '5', name: 'Logout', icon: '➡', action: 'logout' }, 
];

interface ProfileActionItemProps {
    name: string;
    icon: string;
    isLast: boolean;
    onPress: (action: string) => void;
    action: string;
}

/**
 * Reusable component for profile action items, styled to match the image.
 */
const ProfileActionItem: React.FC<ProfileActionItemProps> = ({ name, icon, isLast, onPress, action }) => (
    <TouchableOpacity 
        style={[styles.actionItem, isLast && styles.lastActionItem]} 
        onPress={() => onPress(action)}
    >
        <View style={styles.actionIconContainer}>
            <Text style={styles.actionIcon}>{icon}</Text>
        </View>
        <Text style={styles.actionText}>{name}</Text>
        <Text style={styles.arrow}></Text>
    </TouchableOpacity>
);

/**
 * Main Profile Screen Component
 */
export default function ProfileScreen() {
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const userDataJson = await AsyncStorage.getItem('userData');
                
                if (userDataJson) {
                    const userDataFromStorage = JSON.parse(userDataJson);
                    
                    const completeUserData: UserData = {
                        name: userDataFromStorage.name || 'User',
                        email: userDataFromStorage.email || 'No Email',
                        profilePicture: DEFAULT_PROFILE_PIC,
                    };

                    setUser(completeUserData);
                } else {
                    setUser({
                        name: 'Guest User',
                        email: 'Please log in',
                        profilePicture: DEFAULT_PROFILE_PIC,
                    });
                }
            } catch (error) {
                console.error("Error loading user data from AsyncStorage:", error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, []);

    const handleAction = (action: string) => {
        if (action === 'logout') {
            handleLogout();
        } else {
            // Placeholder for navigation/action handling in your main app
            Alert.alert(`Action: ${action}, This will navigate to the ${action} screen in your app.`);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to log out of your account?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Logout', 
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('userToken');
                            await AsyncStorage.removeItem('userData');
                            
                            Alert.alert('Logged Out', 'Successfully logged out and data cleared. You should now navigate to the Login screen.');
                            setUser(null); 
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear storage or communicate with server.');
                            console.error('Logout error:', error);
                        }
                    }, 
                    style: 'destructive' 
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={PrimaryColor} />
                <Text style={{ marginTop: 10, color: SubtextColor }}>Loading Profile...</Text>
            </View>
        );
    }
    
    // If user is null after loading (or after logout), show a prompt to log in
    if (!user) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: TextColor }}>You are not logged in.</Text>
                <TouchableOpacity onPress={() => Alert.alert('Action', 'Simulate redirect to login screen.')}>
                    <Text style={{ color: PrimaryColor, marginTop: 10, fontWeight: 'bold' }}>Log In Now</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Image source={{ uri: user.profilePicture }} style={styles.profileImage} />
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                </View>

                {/* Action Items List */}
                <View style={styles.actionCard}>
                    {PROFILE_ACTIONS.map((action, index) => (
                        <ProfileActionItem 
                            key={action.id}
                            name={action.name}
                            icon={action.icon}
                            isLast={index === PROFILE_ACTIONS.length - 1}
                            onPress={handleAction}
                            action={action.action}
                        />
                    ))}
                </View>
            </ScrollView>
            {/* The rest of your app's navigation will wrap this component */}
        </View>
    );
}