// This file provides a family member management screen for a React Native app.
// The backend logic has been refactored to simulate interaction with a 
// promise-based REST API (which would typically connect to a MongoDB database).

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// --- MOCK DATA TYPES ---

interface FamilyMember {
  id: string; // Used as the unique key (like a MongoDB _id)
  name: string;
  relationship: string;
  age: number;
}

// --- MOCK API SERVICE (Simulating a REST API endpoint for MongoDB) ---
// In a real application, these functions would use 'fetch' to hit your server.

let MOCK_DATABASE: FamilyMember[] = [
  { id: '1', name: 'John Doe', relationship: 'Spouse', age: 35 },
  { id: '2', name: 'Jane Doe', relationship: 'Child', age: 10 },
];

const API_LATENCY_MS = 800;

const apiFetchMembers = (): Promise<FamilyMember[]> => {
  console.log('API: Fetching all members...');
  return new Promise(resolve => {
    setTimeout(() => resolve(MOCK_DATABASE), API_LATENCY_MS);
  });
};

const apiAddMember = (newMember: Omit<FamilyMember, 'id'>): Promise<FamilyMember> => {
  console.log('API: Adding new member...');
  return new Promise(resolve => {
    setTimeout(() => {
      const memberWithId: FamilyMember = {
        ...newMember,
        id: Date.now().toString(), // Mock unique ID generation
      };
      MOCK_DATABASE.push(memberWithId);
      resolve(memberWithId);
    }, API_LATENCY_MS);
  });
};

const apiRemoveMember = (id: string): Promise<void> => {
  console.log(`API: Removing member with ID: ${id}...`);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const initialLength = MOCK_DATABASE.length;
      MOCK_DATABASE = MOCK_DATABASE.filter(member => member.id !== id);
      if (MOCK_DATABASE.length < initialLength) {
        resolve();
      } else {
        reject(new Error("Member not found."));
      }
    }, API_LATENCY_MS);
  });
};

// --- THEME AND STYLES (Unchanged) ---

const PrimaryColor = '#00a38d'; // Teal color
const BackgroundColor = '#f0f4f7'; // Light, clean background
const CardColor = '#ffffff';
const TextColor = '#333333';
const SubtextColor = '#666666';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BackgroundColor,
  },
  header: {
    backgroundColor: PrimaryColor,
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: CardColor,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: TextColor,
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  card: {
    backgroundColor: CardColor,
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  button: {
    backgroundColor: PrimaryColor,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: CardColor,
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    backgroundColor: BackgroundColor,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: TextColor,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addButtonContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 5,
  },
  secondaryButton: {
    backgroundColor: CardColor,
    borderColor: PrimaryColor,
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: PrimaryColor,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  pickerTrigger: {
    backgroundColor: BackgroundColor,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: TextColor,
  },
  placeholderText: {
    fontSize: 16,
    color: SubtextColor,
  },
  pickerOptionsContainer: {
    maxHeight: 150, 
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: CardColor,
    zIndex: 10, 
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedOption: {
    backgroundColor: PrimaryColor + '10', 
  },
  centerMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  }
});

// --- MODAL STYLES (Unchanged) ---
const modalStyles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100, 
    },
    modalCard: {
        width: '90%',
        maxWidth: 400,
        backgroundColor: CardColor,
        borderRadius: 15,
        padding: 25,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: TextColor,
        marginBottom: 5,
    },
    modalSubtitle: {
        fontSize: 16,
        color: SubtextColor,
        marginBottom: 20,
    },
    buttonGroup: {
      marginTop: 10,
    },
    actionButton: {
      marginTop: 15,
    },
    closeButton: {
      marginTop: 25,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: SubtextColor,
      alignItems: 'center',
    },
    closeButtonText: {
      color: SubtextColor,
      fontWeight: '600',
    }
});


// --- PICKER OPTIONS (Unchanged) ---
const RELATIONSHIP_OPTIONS = [
  'Spouse', 
  'Child', 
  'Parent', 
  'Sibling', 
  'Grandparent', 
  'Other'
];

// Generate ages from 1 to 100
const AGE_OPTIONS: number[] = Array.from({ length: 100 }, (_, i) => i + 1);

// --- COMPONENTS ---

interface FamilyMemberCardProps {
    member: FamilyMember;
    onRemove: (id: string) => Promise<void>;
    onViewActions: (member: FamilyMember) => void;
}

/**
 * Renders a card for a single family member.
 */
const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({ member, onRemove, onViewActions }) => (
  <View style={styles.card}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      {/* Profile Icon Placeholder */}
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: PrimaryColor + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
      }}>
        <Text style={{ fontSize: 20, color: PrimaryColor }}>🧑</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: TextColor }}>{member.name}</Text>
        <Text style={{ fontSize: 14, color: SubtextColor }}>{member.relationship} | {member.age} yrs</Text>
        <Text style={{ fontSize: 10, color: '#ccc' }}>ID: {member.id}</Text>
      </View>
      
      {/* Action Buttons: Remove and View */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* 1. Remove Button (Calls onRemove which uses the mock API) */}
        <TouchableOpacity
          style={{ 
            paddingVertical: 5, 
            paddingHorizontal: 8,
            borderRadius: 5, 
            marginRight: 10, 
            borderWidth: 1, 
            borderColor: '#F44336' // Red for removal
          }}
          onPress={() => {
            Alert.alert(
              'Confirm Removal',
             `Are you sure you want to remove ${member.name} from your family list?`,
              [
                { text: 'Cancel', style: 'cancel' },
                // Call API removal function
                { text: 'Remove', onPress: () => onRemove(member.id), style: 'destructive' },
              ]
            );
          }}
        >
          <Text style={{ color: '#F44336', fontSize: 14, fontWeight: '600' }}>X</Text>
        </TouchableOpacity>

        {/* 2. View/Action Button - Opens the modal */}
        <TouchableOpacity
          style={{ padding: 5, paddingHorizontal: 10, borderRadius: 5, backgroundColor: PrimaryColor }}
          onPress={() => onViewActions(member)}
        >
          <Text style={{ color: CardColor, fontSize: 12, fontWeight: '600' }}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);


/**
 * Renders the form to add a new family member. 
 * Updated to call the mock API service.
 */
const AddFamilyMemberForm: React.FC<{ onAdd: (member: Omit<FamilyMember, 'id'>) => Promise<void>; onCancel: () => void }> = ({ onAdd, onCancel }) => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [age, setAge] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isRelationshipPickerVisible, setIsRelationshipPickerVisible] = useState(false);
  const [isAgePickerVisible, setIsAgePickerVisible] = useState(false);

  const handleAdd = async () => {
    const parsedAge = parseInt(age);
    if (name.trim() && relationship.trim() && !isNaN(parsedAge) && parsedAge > 0) {
      setIsSubmitting(true);
      try {
        await onAdd({ name, relationship, age: parsedAge });
        // Reset form fields only on success
        setName('');
        setRelationship('');
        setAge('');
        setIsRelationshipPickerVisible(false);
        setIsAgePickerVisible(false);
        onCancel(); // Close form
      } catch (error) {
        console.error("Error adding document: ", error);
        Alert.alert('Error', 'Failed to save member. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      Alert.alert('Error', 'Please fill in Name, Relationship, and Age.');
    }
  };

  const AgePicker: React.FC = () => (
    <View style={styles.pickerOptionsContainer}>
      <ScrollView>
        {AGE_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.pickerOption, option.toString() === age && styles.selectedOption]}
            onPress={() => {
              setAge(option.toString());
              setIsAgePickerVisible(false);
            }}
          >
            <Text style={styles.pickerText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const RelationshipPicker: React.FC = () => (
    <View style={styles.pickerOptionsContainer}>
      <ScrollView>
        {RELATIONSHIP_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.pickerOption, option === relationship && styles.selectedOption]}
            onPress={() => {
              setRelationship(option);
              setIsRelationshipPickerVisible(false);
            }}
          >
            <Text style={styles.pickerText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={{ paddingHorizontal: 20 }}>
      <Text style={styles.sectionTitle}>New Member Details</Text>
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
        />
        
        {/* RELATIONSHIP DROP-DOWN */}
        <TouchableOpacity
          style={styles.pickerTrigger}
          onPress={() => {
            setIsRelationshipPickerVisible(!isRelationshipPickerVisible);
            setIsAgePickerVisible(false); // Close other picker
          }}
          disabled={isSubmitting}
        >
          <Text style={relationship ? styles.pickerText : styles.placeholderText}>
            {relationship || "Select Relationship"}
          </Text>
          <Text style={styles.pickerText}>{isRelationshipPickerVisible ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {isRelationshipPickerVisible && <RelationshipPicker />}
        
        {/* AGE DROP-DOWN */}
        <TouchableOpacity
          style={styles.pickerTrigger}
          onPress={() => {
            setIsAgePickerVisible(!isAgePickerVisible);
            setIsRelationshipPickerVisible(false); // Close other picker
          }}
          disabled={isSubmitting}
        >
          <Text style={age ? styles.pickerText : styles.placeholderText}>
            {age || "Select Age"}
          </Text>
          <Text style={styles.pickerText}>{isAgePickerVisible ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {isAgePickerVisible && <AgePicker />}

        <TouchableOpacity style={styles.button} onPress={handleAdd} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color={CardColor} />
          ) : (
            <Text style={styles.buttonText}>Save Family Member</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { marginTop: 10 }]}
          onPress={onCancel}
          disabled={isSubmitting}
        >
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- MODAL COMPONENT (Updated with new navigation handler props) ---
interface FamilyMemberActionsModalProps {
  member: FamilyMember;
  onClose: () => void;
  // Handlers now take a member and a destination screen type
  onNavigate: (member: FamilyMember, screen: 'Appointments' | 'Booking' | 'Reminders') => void;
}

const FamilyMemberActionsModal: React.FC<FamilyMemberActionsModalProps> = ({
  member,
  onClose,
  onNavigate,
}) => (
  <View style={modalStyles.overlay}>
    <View style={modalStyles.modalCard}>
      <Text style={modalStyles.modalTitle}>Manage {member.name}</Text>
      <Text style={modalStyles.modalSubtitle}>
        {member.relationship}, {member.age} yrs
      </Text>
      
      <View style={modalStyles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, modalStyles.actionButton]}
          onPress={() => {
            onNavigate(member, 'Appointments'); // Navigate to Appointments screen
            onClose();
          }}
        >
          <Text style={styles.buttonText}>View Appointments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, modalStyles.actionButton]}
          onPress={() => {
            onNavigate(member, 'Booking'); // Navigate to Booking screen
            onClose();
          }}
        >
          <Text style={styles.buttonText}>Book Appointment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, modalStyles.actionButton]}
          onPress={() => {
            onNavigate(member, 'Reminders'); // Navigate to Reminders screen
            onClose();
          }}
        >
          <Text style={styles.buttonText}>Set Reminders</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
        <Text style={modalStyles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// --- NEW MOCK SCREEN COMPONENTS ---

interface MockScreenProps {
    member: FamilyMember;
    screenType: 'Appointments' | 'Booking' | 'Reminders';
    onBack: () => void;
}

const MockNavigationScreen: React.FC<MockScreenProps> = ({ member, screenType, onBack }) => {
    
    let description = '';
    let bgColor = BackgroundColor;
    
    switch (screenType) {
        case 'Appointments':
            description = `Viewing the list of upcoming and past appointments for ${member.name}. This is where the contents of your 'Appointment.tsx' file would load.`;
            bgColor = '#e6f7ff'; // Light Blue
            break;
        case 'Booking':
            description = `Starting the doctor selection and booking process for ${member.name}. This is the main appointment booking flow.`;
            bgColor = '#fff7e6'; // Light Orange
            break;
        case 'Reminders':
            description = `Managing health and medication reminders for ${member.name}. A custom reminders interface would appear here.`;
            bgColor = '#e6ffe6'; // Light Green
            break;
    }

    return (
        <View style={[styles.container, { backgroundColor: bgColor, paddingHorizontal: 0 }]}>
            <View style={{...styles.header, marginBottom: 0}}>
                <Text style={{...styles.headerTitle, fontSize: 24}}>
                    {screenType} for {member.name}
                </Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10, color: TextColor }}>Navigation Successful!</Text>
                <Text style={{ fontSize: 16, color: SubtextColor, lineHeight: 24, marginBottom: 30 }}>{description}</Text>
                
                <TouchableOpacity style={styles.button} onPress={onBack}>
                    <Text style={styles.buttonText}>← Back to Family List</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    )
}


/**
 * Main Family Screen Component
 * Updated to use the Mock API for all data operations and manage mock navigation state.
 */
export default function FamilyScreen() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // State for API calls
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // State for modal
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  // --- NEW NAVIGATION STATE ---
  const [activeNavigation, setActiveNavigation] = useState<{ member: FamilyMember, screen: 'Appointments' | 'Booking' | 'Reminders' } | null>(null);


  /**
   * Fetches data from the mock API and updates the local state.
   */
  const fetchData = async () => {
    setIsFetching(true);
    try {
      const data = await apiFetchMembers();
      setFamilyMembers(data);
      console.log("Mock API Fetch successful. Member count:", data.length);
    } catch (e) {
      console.error("API Fetch Error:", e);
      Alert.alert("Error", "Could not fetch family data from the server.");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    fetchData();
  }, []); // Only runs once on component mount

  // --- CRUD OPERATIONS using Mock API (Unchanged) ---

  const handleAddMember = async (newMember: Omit<FamilyMember, 'id'>): Promise<void> => {
    try {
      await apiAddMember(newMember);
      await fetchData();
    } catch (e) {
      console.error("Error adding member via API:", e);
      throw e;
    }
  };

  const handleRemoveMember = async (id: string): Promise<void> => {
    try {
      await apiRemoveMember(id);
      await fetchData();
      Alert.alert('Removed', 'Family member has been successfully removed.');
    } catch (e) {
      console.error("Error deleting member via API:", e);
      Alert.alert('Error', 'Failed to remove member. Server error.');
    }
  };

  // --- MODAL ACTION HANDLER (Now sets the activeNavigation state) ---
  const handleNavigateFromModal = (member: FamilyMember, screen: 'Appointments' | 'Booking' | 'Reminders') => {
    setActiveNavigation({ member, screen });
  };


  // --- UI RENDERING ---

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Family</Text>
        </View>
        <View style={styles.centerMessage}>
          <ActivityIndicator size="large" color={PrimaryColor} />
          <Text style={{ marginTop: 10, color: SubtextColor }}>Connecting to MongoDB API...</Text>
        </View>
      </View>
    );
  }

  // --- 1. If an action has been triggered, show the mock navigation screen ---
  if (activeNavigation) {
    return (
        <MockNavigationScreen 
            member={activeNavigation.member} 
            screenType={activeNavigation.screen} 
            onBack={() => setActiveNavigation(null)} 
        />
    );
  }
  
  // --- 2. Otherwise, show the Family List screen (Default view) ---
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Family</Text>
      </View>

      <View style={styles.addButtonContainer}>
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => {
            setSelectedMember(null);
            setIsAdding(true);
          }} 
          disabled={isAdding || isFetching}
        >
          <Text style={{ fontSize: 20, color: PrimaryColor }}>+</Text>
          <Text style={styles.secondaryButtonText}>Add New Family Member</Text>
        </TouchableOpacity>
      </View>


      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        {isAdding ? (
          <AddFamilyMemberForm onAdd={handleAddMember} onCancel={() => setIsAdding(false)} />
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Registered Members ({familyMembers.length})</Text>
            {isFetching && (
               <View style={{ padding: 10, alignItems: 'center' }}>
                   <ActivityIndicator size="small" color={PrimaryColor} />
                   <Text style={{ fontSize: 12, color: SubtextColor }}>Synchronizing data...</Text>
               </View>
            )}

            {familyMembers.length === 0 && !isFetching ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: SubtextColor, fontSize: 16 }}>
                        No family members added yet. Tap "Add New Family Member" to begin!
                    </Text>
                </View>
            ) : (
                familyMembers.map((member) => (
                    <FamilyMemberCard 
                        key={member.id} 
                        member={member} 
                        onRemove={handleRemoveMember} 
                        onViewActions={setSelectedMember}
                    />
                ))
            )}
          </View>
        )}
      </ScrollView>

      {/* --- MODAL RENDERING: Renders only when a member is selected --- */}
      {selectedMember && (
          <FamilyMemberActionsModal 
              member={selectedMember}
              onClose={() => setSelectedMember(null)}
              onNavigate={handleNavigateFromModal} // Pass the new navigation handler
          />
      )}
    </View>
  );
}