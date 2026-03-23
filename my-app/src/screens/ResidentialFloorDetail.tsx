import React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import {
  getUnsyncedSurveys,
  saveSurveyLocally,
  getSelectedAssignment,
  getMasterData,
} from '../utils/storage';

interface FloorDetail {
  id: string;
  floorNumberId: number;
  occupancyStatusId: number;
  constructionNatureId: number;
  coveredArea: number;
  allRoomVerandaArea: string;
  allBalconyKitchenArea: string;
  allGarageArea: string;
  carpetArea: number;
}

interface MasterData {
  floorNumbers: { floorNumberId: number; floorNumberName: string }[];
  occupancyStatuses: { occupancyStatusId: number; occupancyStatusName: string }[];
  constructionNatures: { constructionNatureId: number; constructionNatureName: string }[];
}

type Navigation = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

export default function ResidentialFloorDetail() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [masterData, setMasterData] = useState<MasterData>({
    floorNumbers: [],
    occupancyStatuses: [],
    constructionNatures: [],
  });

  // Form state
  const [formData, setFormData] = useState<FloorDetail>({
    id: '',
    floorNumberId: 0,
    occupancyStatusId: 0,
    constructionNatureId: 0,
    coveredArea: 0,
    allRoomVerandaArea: '',
    allBalconyKitchenArea: '',
    allGarageArea: '',
    carpetArea: 0,
  });

  const surveyId = (route.params as any)?.surveyId;
  const editMode = (route.params as any)?.editMode || false;
  const floorId = (route.params as any)?.floorId;
  const floorData = (route.params as any)?.floorData;
  const [assignment, setAssignment] = useState<any>(null);

  useEffect(() => {
    try {
      loadMasterData();
      
      if (editMode && floorData) {
        // Validate that floorData has required fields
        if (!floorData.id) {
          Alert.alert('Error', 'Invalid floor data provided');
          navigation.goBack();
          return;
        }
        setFormData(floorData);
      } else {
        // Generate new ID for new floor
        setFormData((prev) => ({
          ...prev,
          id: `floor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }));
      }
      
      (async () => {
        try {
          const selected = await getSelectedAssignment();
          if (selected) setAssignment(selected);
        } catch (error) {
          console.error('Error loading assignment:', error);
        }
      })();
    } catch (error) {
      console.error('Error initializing form:', error);
      Alert.alert('Error', 'Failed to initialize form. Please try again.');
      navigation.goBack();
    }
  }, []);

  const loadMasterData = async () => {
    try {
      const data = await getMasterData();
      setMasterData({
        floorNumbers: data?.floors || [],
        occupancyStatuses: data?.occupancyStatuses || [],
        constructionNatures: data?.constructionNatures || [],
      });
    } catch (error) {
      console.error('Error loading master data:', error);
      Alert.alert('Error', 'Failed to load master data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FloorDetail, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev };
      if (field === 'coveredArea') {
        // Only allow numbers, parse as float, default to 0 if invalid
        const num = parseFloat(value);
        newData.coveredArea = isNaN(num) ? 0 : num;
        // Auto-calculate carpet area as a number
        newData.carpetArea = isNaN(num) ? 0 : parseFloat((num * 0.8).toFixed(2));
      } else if (
        field === 'floorNumberId' ||
        field === 'occupancyStatusId' ||
        field === 'constructionNatureId'
      ) {
        newData[field] = parseInt(value) || 0;
      } else {
        // For string fields (allRoomVerandaArea, allBalconyKitchenArea, allGarageArea)
        newData[
          field as keyof Pick<
            FloorDetail,
            'allRoomVerandaArea' | 'allBalconyKitchenArea' | 'allGarageArea'
          >
        ] = value;
      }
      return newData;
    });
  };

  const validateForm = (): boolean => {
    if (!formData.floorNumberId) {
      Alert.alert('Validation Error', 'Please select Floor Number');
      return false;
    }
    if (!formData.occupancyStatusId) {
      Alert.alert('Validation Error', 'Please select Occupancy Status');
      return false;
    }
    if (!formData.constructionNatureId) {
      Alert.alert('Validation Error', 'Please select Construction Nature');
      return false;
    }
    if (!formData.coveredArea || formData.coveredArea <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid Covered Area');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    // Show confirmation dialog before saving
    const confirmTitle = editMode ? 'Confirm Update' : 'Confirm Save';
    const confirmMessage = editMode 
      ? 'Are you sure you want to update this floor detail?' 
      : 'Are you sure you want to save this floor detail?';
    const confirmButton = editMode ? 'Update' : 'Save';

    Alert.alert(
      confirmTitle,
      confirmMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: confirmButton,
          style: 'default',
          onPress: async () => {
            setSaving(true);
            try {
              const allSurveys = await getUnsyncedSurveys();
              const idx = allSurveys.findIndex((s: any) => s.id === surveyId);
              if (idx > -1) {
                const survey = allSurveys[idx];
                if (!survey) {
                  Alert.alert('Error', 'Survey not found');
                  setSaving(false);
                  return;
                }

                const processedFormData = {
                  ...formData,
                  coveredArea: formData.coveredArea || 0,
                  allRoomVerandaArea:
                    formData.allRoomVerandaArea === '' ? null : parseFloat(formData.allRoomVerandaArea),
                  allBalconyKitchenArea:
                    formData.allBalconyKitchenArea === ''
                      ? null
                      : parseFloat(formData.allBalconyKitchenArea),
                  allGarageArea: formData.allGarageArea === '' ? null : parseFloat(formData.allGarageArea),
                  carpetArea: formData.carpetArea || 0,
                  floorNumberId: Number(formData.floorNumberId),
                  occupancyStatusId: Number(formData.occupancyStatusId),
                  constructionNatureId: Number(formData.constructionNatureId),
                };

                const existingFloors =
                  survey.data && survey.data.residentialPropertyAssessments
                    ? survey.data.residentialPropertyAssessments
                    : [];
                let updatedFloors;

                if (editMode && floorId) {
                  // Update existing floor
                  updatedFloors = existingFloors.map((floor: FloorDetail) =>
                    floor.id === floorId ? processedFormData : floor
                  );
                } else {
                  // Add new floor
                  updatedFloors = [...existingFloors, processedFormData];
                }

                const updatedSurvey = {
                  ...survey,
                  data: {
                    ...survey.data,
                    residentialPropertyAssessments: updatedFloors,
                  },
                };

                await saveSurveyLocally(updatedSurvey);

                Alert.alert(
                  'Success',
                  editMode ? 'Floor detail updated successfully' : 'Floor detail added successfully',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack(),
                    },
                  ]
                );
              } else {
                Alert.alert('Error', 'Survey not found in local storage');
                setSaving(false);
              }
            } catch (error) {
              console.error('Error saving floor detail:', error);
              Alert.alert('Error', 'Failed to save floor detail. Please try again.');
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.loadingContainer}>
          <Text>Loading form data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.topBackButton}
            onPress={() => {
              Alert.alert(
                'Confirm Cancel',
                'Are you sure you want to cancel? Any unsaved changes will be lost.',
                [
                  { text: 'No', style: 'cancel' },
                  {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            }}
            disabled={saving}>
          <Text style={styles.topBackArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>
          {editMode ? 'Edit' : 'Add'} Residential Floor Detail
        </Text>
      </View>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Floor Number */}
          <View style={styles.formGroup}>
            <Text style={{ color: '#111' }}>
              Floor Number<Text style={{ color: 'red' }}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.floorNumberId}
                onValueChange={(value) => handleInputChange('floorNumberId', value.toString())}
                style={styles.picker}>
                <Picker.Item label="Select Floor Number" value={0} />
                {masterData.floorNumbers.map((floor) => (
                  <Picker.Item
                    key={floor.floorNumberId}
                    label={floor.floorNumberName}
                    value={floor.floorNumberId}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Occupancy Status */}
          <View style={styles.formGroup}>
            <Text style={{ color: '#111' }}>
              Occupancy Status<Text style={{ color: 'red' }}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.occupancyStatusId}
                onValueChange={(value) => handleInputChange('occupancyStatusId', value.toString())}
                style={styles.picker}>
                <Picker.Item label="Select Occupancy Status" value={0} />
                {masterData.occupancyStatuses.map((status) => (
                  <Picker.Item
                    key={status.occupancyStatusId}
                    label={status.occupancyStatusName}
                    value={status.occupancyStatusId}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Construction Nature */}
          <View style={styles.formGroup}>
            <Text style={{ color: '#111' }}>
              Construction Nature<Text style={{ color: 'red' }}>*</Text>
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.constructionNatureId}
                onValueChange={(value) =>
                  handleInputChange('constructionNatureId', value.toString())
                }
                style={styles.picker}>
                <Picker.Item label="Select Construction Nature" value={0} />
                {masterData.constructionNatures.map((nature) => (
                  <Picker.Item
                    key={nature.constructionNatureId}
                    label={nature.constructionNatureName}
                    value={nature.constructionNatureId}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Covered Area */}
          <View style={styles.formGroup}>
            <Text style={{ color: '#111' }}>
              Covered Area (sq ft)<Text style={{ color: 'red' }}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.coveredArea === 0 ? '' : String(formData.coveredArea)}
              onChangeText={(value) => handleInputChange('coveredArea', value)}
              placeholder="Enter covered area"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Total Rooms/Veranda Area */}
          <View style={styles.formGroup}>
            <Text style={{ color: '#111' }}>Total Rooms/Veranda Area (sq ft)</Text>
            <TextInput
              style={styles.input}
              value={formData.allRoomVerandaArea}
              onChangeText={(value) => handleInputChange('allRoomVerandaArea', value)}
              placeholder="Enter total rooms/veranda area"
              keyboardType="numeric"
            />
          </View>

          {/* Total Balcony/Kitchen Area */}
          <View style={styles.formGroup}>
            <Text style={{ color: '#111' }}>Total Balcony/Kitchen Area (sq ft)</Text>
            <TextInput
              style={styles.input}
              value={formData.allBalconyKitchenArea}
              onChangeText={(value) => handleInputChange('allBalconyKitchenArea', value)}
              placeholder="Enter total balcony/kitchen area"
              keyboardType="numeric"
            />
          </View>

          {/* All Garage Area */}
          <View style={styles.formGroup}>
            <Text style={{ color: '#111' }}>All Garage Area (sq ft)</Text>
            <TextInput
              style={styles.input}
              value={formData.allGarageArea}
              onChangeText={(value) => handleInputChange('allGarageArea', value)}
              placeholder="Enter all garage area"
              keyboardType="numeric"
            />
          </View>

          {/* Carpet Area (Auto-calculated) */}
          <View style={styles.formGroup}>
            <Text style={{ color: '#111' }}>
              Carpet Area (sq ft)<Text style={{ color: 'red' }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={formData.carpetArea === 0 ? '' : String(formData.carpetArea)}
              editable={false}
              placeholder="0"
            />
            <Text style={styles.helperText}>Automatically calculated as 80% of covered area</Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              Alert.alert(
                'Confirm Cancel',
                'Are you sure you want to cancel? Any unsaved changes will be lost.',
                [
                  { text: 'No', style: 'cancel' },
                  {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            }}
            disabled={saving}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}>
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : editMode ? 'Update' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'white',
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 10,
  },
  topBackButton: {
    position: 'absolute',
    left: 8,
    height: '500%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    zIndex: 11,
  },
  topBackArrow: {
    fontSize: 24,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  topHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
});
