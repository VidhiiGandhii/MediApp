import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store'; // Import SecureStore for token management

// Define the structure for a settings item
interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap | keyof typeof MaterialIcons.glyphMap | keyof typeof Feather.glyphMap;
  iconSet: 'Ionicons' | 'MaterialIcons' | 'Feather';
  label: string;
  onPress: () => void;
  color?: string;
  isLast?: boolean;
}

// Reusable component for a single setting row
const SettingsItem: React.FC<SettingsItemProps> = ({ icon, iconSet, label, onPress, color = '#333', isLast = false }) => {
  const IconComponent = iconSet === 'Ionicons' ? Ionicons : iconSet === 'MaterialIcons' ? MaterialIcons : Feather;

  return (
    <TouchableOpacity 
      style={[styles.itemContainer, isLast && styles.lastItem]} 
      onPress={onPress}
    >
      <View style={styles.iconBackground}>
        {/* @ts-ignore: Icon name type is handled by the parent interface */}
        <IconComponent name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.itemLabel, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward-outline" size={20} color="#ccc" />
    </TouchableOpacity>
  );
};


export default function SettingsScreen() {
  const router = useRouter();

  // Function to handle the actual token removal and navigation
  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Yes, Log Out", 
          onPress: async () => {
            // Clear the JWT token from secure storage
            try {
              await SecureStore.deleteItemAsync('userToken');
              console.log("User token cleared successfully.");
            } catch (e) {
              console.error("Failed to delete token from SecureStore", e);
            }
            
            // Navigate back to the login screen, effectively ending the session
            router.replace('/(auth)/login'); 
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* --- Section 1: Account Management --- */}
        <Text style={styles.sectionHeader}>Account Management</Text>
        <View style={styles.sectionContainer}>
          <SettingsItem
            icon="person-outline"
            iconSet="Ionicons"
            label="Edit Profile"
            onPress={() => console.log('Navigate to Edit Profile')}
          />
          <SettingsItem
            icon="people-outline"
            iconSet="Ionicons"
            label="Manage Family Members"
            onPress={() => router.push('/screens/FamilyScreen')}
          />
          <SettingsItem
            icon="key-outline"
            iconSet="Ionicons"
            label="Change Password"
            onPress={() => console.log('Navigate to Change Password')}
            isLast
          />
        </View>

        {/* --- Section 2: App Preferences --- */}
        <Text style={styles.sectionHeader}>App Preferences</Text>
        <View style={styles.sectionContainer}>
          <SettingsItem
            icon="notifications-outline"
            iconSet="Ionicons"
            label="Notification Settings"
            onPress={() => console.log('Navigate to Notifications')}
          />
          <SettingsItem
            icon="color-palette-outline"
            iconSet="Ionicons"
            label="Theme & Appearance"
            onPress={() => console.log('Navigate to Theme')}
          />
          <SettingsItem
            icon="language-outline"
            iconSet="Ionicons"
            label="Language"
            onPress={() => console.log('Navigate to Language')}
            isLast
          />
        </View>

        {/* --- Section 3: Support and Legal --- */}
        <Text style={styles.sectionHeader}>Support & Legal</Text>
        <View style={styles.sectionContainer}>
          <SettingsItem
            icon="help-circle-outline"
            iconSet="Ionicons"
            label="Help Center"
            onPress={() => console.log('Navigate to Help Center')}
          />
          <SettingsItem
            icon="document-text-outline"
            iconSet="Ionicons"
            label="Terms of Service"
            onPress={() => console.log('Navigate to Terms of Service')}
          />
          <SettingsItem
            icon="info-outline"
            iconSet="Ionicons"
            label="About MediApp"
            onPress={() => console.log('Navigate to About App')}
            isLast
          />
        </View>

        {/* --- Logout Button --- */}
        <View style={{ marginHorizontal: 20, marginTop: 30, marginBottom: 50 }}>
          <SettingsItem
            icon="log-out-outline"
            iconSet="Ionicons"
            label="Log Out"
            onPress={handleLogout}
            color="#FF3B30"
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  scrollContainer: {
    paddingVertical: 10,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  iconBackground: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  itemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
});