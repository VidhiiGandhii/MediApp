import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- THEME ---
const PrimaryColor = '#63b0a3'; // Teal
const BackgroundColor = '#f0f4f7';
const CardColor = '#ffffff';
const TextColor = '#333333';
const SubtextColor = '#666666';

// Mock App Data
const APP_VERSION = '1.0.3';
const COMPANY_NAME = 'MediApp Health Solutions';
const YEAR = new Date().getFullYear();
const EMAIL_SUPPORT = 'support@mediapp.com';
const WEBSITE_URL = 'https://www.example.com/mediapp';


const AboutMediAppScreen = () => {

    const handleLinkPress = (url: string) => {
        Linking.openURL(url).catch(err => console.error("Failed to open URL", err));
    };

    const InfoRow = ({ label, value }: { label: string, value: string }) => (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View style={styles.headerContainer}>
                <Text style={styles.screenTitle}>About MediApp</Text>
            </View>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                
                <View style={styles.logoSection}>
                    <Ionicons name="medkit-outline" size={60} color={PrimaryColor} />
                    <Text style={styles.appName}>MediApp</Text>
                    <Text style={styles.appTagline}>Your proactive health partner.</Text>
                    <Text style={styles.versionText}>Version {APP_VERSION}</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Our Mission</Text>
                    <Text style={styles.missionText}>
                        MediApp is dedicated to simplifying personal and family healthcare management. We empower users with immediate symptom guidance, timely medication reminders, and secure access to medical professionals, making proactive health management effortless.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Application Details</Text>
                    <InfoRow label="Developer" value={""} />
                    <InfoRow label="Built With" value="React Native & Node.js/MongoDB" />
                    <InfoRow label="License" value="" />
                    <InfoRow label="Release Date" value="" />
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Legal & Support</Text>
                    <TouchableOpacity style={styles.linkItem} onPress={() => handleLinkPress(`${WEBSITE_URL}/terms`)}>
                        <Text style={styles.linkText}>Terms of Service</Text>
                        <Ionicons name="chevron-forward-outline" size={20} color={SubtextColor} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.linkItem} onPress={() => handleLinkPress(`${WEBSITE_URL}/privacy`)}>
                        <Text style={styles.linkText}>Privacy Policy</Text>
                        <Ionicons name="chevron-forward-outline" size={20} color={SubtextColor} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.linkItem} onPress={() => handleLinkPress(`mailto:${EMAIL_SUPPORT}`)}>
                        <Text style={styles.linkText}>Contact Support</Text>
                        <Ionicons name="chevron-forward-outline" size={20} color={SubtextColor} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.copyrightText}>© {YEAR} {COMPANY_NAME}. All rights reserved.</Text>

            </ScrollView>
        </SafeAreaView>
    );
};

export default AboutMediAppScreen;

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
    logoSection: {
        alignItems: 'center',
        marginBottom: 30,
        paddingTop: 10,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: PrimaryColor,
        marginTop: 10,
    },
    appTagline: {
        fontSize: 16,
        color: SubtextColor,
        marginBottom: 10,
    },
    versionText: {
        fontSize: 14,
        color: SubtextColor,
    },
    card: {
        backgroundColor: CardColor,
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: TextColor,
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: BackgroundColor,
    },
    missionText: {
        fontSize: 15,
        color: TextColor,
        lineHeight: 22,
        textAlign: 'justify',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 15,
        color: SubtextColor,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '500',
        color: TextColor,
    },
    linkItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: BackgroundColor,
    },
    linkText: {
        fontSize: 15,
        color: PrimaryColor,
    },
    copyrightText: {
        textAlign: 'center',
        fontSize: 12,
        color: SubtextColor,
        marginTop: 20,
    }
});