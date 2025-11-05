import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- THEME ---
const PrimaryColor = '#63b0a3';
const BackgroundColor = '#f0f4f7';
const CardColor = '#ffffff';
const TextColor = '#333333';
const SubtextColor = '#666666';

const NotificationSettingsScreen = () => {
    const [settings, setSettings] = useState({
        medication: true,
        appointments: true,
        healthTips: false,
        inventory: true,
    });

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
        // NOTE: In a real app, you would save this preference to the user's profile in the backend.
        if (key === 'medication' && !settings.medication) {
            Alert.alert('Permission Check', 'MediApp needs notification permission to send reminders.');
            // Add actual permission request here using expo-notifications
        }
    };

    const NotificationItem = ({ label, description, stateKey }: { label: string, description: string, stateKey: keyof typeof settings }) => (
        <View style={styles.itemContainer}>
            <View style={styles.textColumn}>
                <Text style={styles.itemLabel}>{label}</Text>
                <Text style={styles.itemDescription}>{description}</Text>
            </View>
            <Switch
                trackColor={{ false: "#D3D3D3", true: PrimaryColor }}
                thumbColor={settings[stateKey] ? CardColor : CardColor}
                ios_backgroundColor="#D3D3D3"
                onValueChange={() => handleToggle(stateKey)}
                value={settings[stateKey]}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View style={styles.headerContainer}>
                <Text style={styles.screenTitle}>Notification Settings</Text>
            </View>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                
                <Text style={styles.sectionHeader}>Reminders & Alerts</Text>
                <View style={styles.card}>
                    <NotificationItem 
                        label="Medication Reminders"
                        description="Alerts for scheduled medication intake times."
                        stateKey="medication"
                    />
                     <NotificationItem 
                        label="Appointment Alerts"
                        description="Reminders for upcoming doctor visits."
                        stateKey="appointments"
                    />
                    <NotificationItem 
                        label="Inventory Low Stock"
                        description="Alerts when a medication stock falls below the refill threshold."
                        stateKey="inventory"
                    />
                </View>

                <Text style={styles.sectionHeader}>Informational</Text>
                <View style={styles.card}>
                     <NotificationItem 
                        label="General Health Tips"
                        description="Occasional tips and wellness recommendations."
                        stateKey="healthTips"
                    />
                </View>

                <TouchableOpacity 
                    style={styles.permissionButton}
                    onPress={() => Alert.alert('Check Permissions', 'This would re-prompt the user for notification permissions.')}
                >
                    <Ionicons name="settings-outline" size={20} color={PrimaryColor} />
                    <Text style={styles.permissionButtonText}>Review App Permissions</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

export default NotificationSettingsScreen;

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
    sectionHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: SubtextColor,
        marginBottom: 10,
    },
    card: {
        backgroundColor: CardColor,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        overflow: 'hidden',
        marginBottom: 25,
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: BackgroundColor,
    },
    textColumn: {
        flex: 1,
        paddingRight: 15,
    },
    itemLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: TextColor,
    },
    itemDescription: {
        fontSize: 13,
        color: SubtextColor,
        marginTop: 2,
    },
    permissionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        backgroundColor: CardColor,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: PrimaryColor,
    },
    permissionButtonText: {
        marginLeft: 10,
        color: PrimaryColor,
        fontWeight: '600',
        fontSize: 16,
    }
});