// This file defines the App Settings Screen for the React Native application.
// It uses the clean, teal-accented theme established in the Profile.tsx file.

import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Alert,
    Switch
} from 'react-native';

// --- THEME AND STYLES (Matching provided image theme) ---

const PrimaryColor = '#00a38d'; // Teal (accents)
const BackgroundColor = '#f0f4f7'; // Light grey background
const CardColor = '#ffffff'; // White for cards and main elements
const TextColor = '#333333'; // Dark text
const SubtextColor = '#666666'; // Muted text for descriptions
const DividerColor = '#f0f0f0';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BackgroundColor,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: TextColor,
        paddingHorizontal: 20,
        paddingTop: 50, // Adjust for status bar
        paddingBottom: 20,
        backgroundColor: CardColor, // White background for the header area
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: DividerColor,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: SubtextColor,
        marginTop: 20,
        marginBottom: 8,
        paddingHorizontal: 20,
        textTransform: 'uppercase',
    },
    actionCard: {
        backgroundColor: CardColor,
        borderRadius: 12, 
        marginHorizontal: 15,
        marginBottom: 10,
        elevation: 2, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15, 
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: DividerColor,
    },
    lastItem: {
        borderBottomWidth: 0,
    },
    settingText: {
        fontSize: 16,
        color: TextColor,
        flex: 1, // Allows text to take up available space
        fontWeight: '500',
    },
    arrow: {
        fontSize: 18,
        color: SubtextColor,
        marginLeft: 10,
    },
});

// --- SETTING ITEM COMPONENTS ---

interface NavItemProps {
    name: string;
    isLast?: boolean;
    onPress: () => void;
}

/**
 * Standard item that navigates to another page (shows an arrow).
 */
const NavSettingItem: React.FC<NavItemProps> = ({ name, isLast, onPress }) => (
    <TouchableOpacity 
        style={[styles.settingItem, isLast && styles.lastItem]} 
        onPress={onPress}
    >
        <Text style={styles.settingText}>{name}</Text>
        <Text style={styles.arrow}></Text>
    </TouchableOpacity>
);

interface SwitchItemProps {
    name: string;
    isLast?: boolean;
    initialValue: boolean;
    onToggle: (value: boolean) => void;
}

/**
 * Item with a toggle switch.
 */
const SwitchSettingItem: React.FC<SwitchItemProps> = ({ name, isLast, initialValue, onToggle }) => {
    const [isEnabled, setIsEnabled] = useState(initialValue);

    const toggleSwitch = () => {
        const newValue = !isEnabled;
        setIsEnabled(newValue);
        onToggle(newValue);
    };

    return (
        <View style={[styles.settingItem, isLast && styles.lastItem]}>
            <Text style={styles.settingText}>{name}</Text>
            <Switch
                trackColor={{ false: DividerColor, true: PrimaryColor }}
                thumbColor={isEnabled ? CardColor : CardColor}
                onValueChange={toggleSwitch}
                value={isEnabled}
            />
        </View>
    );
};

// --- MAIN SCREEN COMPONENT ---

export default function SettingsScreen() {
    
    // Mock state for preferences
    const [isPushEnabled, setIsPushEnabled] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isLocationEnabled, setIsLocationEnabled] = useState(true);

    const handleNavigation = (settingName: string) => {
        Alert.alert('Navigation', `Simulating navigation to: ${settingName}`);
    };

    const handleToggle = (settingName: string, value: boolean) => {
        // In a real app, this would update a local state or API preferences
        console.log(`${settingName} toggled to: ${value}`);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                
                <Text style={styles.header}>Settings</Text>

                {/* --- Account Settings --- */}
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.actionCard}>
                    <NavSettingItem 
                        name="Edit Profile" 
                        onPress={() => handleNavigation('Edit Profile')}
                    />
                    <NavSettingItem 
                        name="Manage Family Members" 
                        onPress={() => handleNavigation('Manage Family Members')}
                    />
                    <NavSettingItem 
                        name="Change Password" 
                        isLast
                        onPress={() => handleNavigation('Change Password')}
                    />
                </View>

                {/* --- App Preferences --- */}
                <Text style={styles.sectionTitle}>App Preferences</Text>
                <View style={styles.actionCard}>
                    <SwitchSettingItem
                        name="Dark Mode"
                        initialValue={isDarkMode}
                        onToggle={(val) => {
                            setIsDarkMode(val);
                            handleToggle('Dark Mode', val);
                        }}
                    />
                    <SwitchSettingItem
                        name="Enable Location Services"
                        initialValue={isLocationEnabled}
                        onToggle={(val) => {
                            setIsLocationEnabled(val);
                            handleToggle('Location Services', val);
                        }}
                        isLast
                    />
                </View>
                
                {/* --- Notification Settings --- */}
                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.actionCard}>
                    <SwitchSettingItem
                        name="Push Notifications"
                        initialValue={isPushEnabled}
                        onToggle={(val) => {
                            setIsPushEnabled(val);
                            handleToggle('Push Notifications', val);
                        }}
                    />
                    <NavSettingItem 
                        name="Appointment Reminders" 
                        isLast
                        onPress={() => handleNavigation('Appointment Reminders')}
                    />
                </View>

                {/* --- Legal & Info --- */}
                <Text style={styles.sectionTitle}>Help & Legal</Text>
                <View style={styles.actionCard}>
                    <NavSettingItem 
                        name="Terms and Conditions" 
                        onPress={() => handleNavigation('Terms')}
                    />
                    <NavSettingItem 
                        name="Privacy Policy" 
                        isLast
                        onPress={() => handleNavigation('Privacy')}
                    />
                </View>

            </ScrollView>
        </View>
    );
}
