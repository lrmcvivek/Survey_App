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
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getUnsyncedSurveys,
  saveSurveyLocally,
  getSelectedAssignment,
  getMasterData,
} from '../utils/storage';
import { fetchNrPropertySubCategories } from '../services/masterDataService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FloorDetail {
  id: string;
  floorNumberId: number;
  nrPropertyCategoryId: number;
  nrSubCategoryId: number;
  establishmentName: string;
  licenseNo: string;
  licenseExpiryDate: string;
  occupancyStatusId: number;
  constructionNatureId: number;
  builtupArea: string | number;
}

interface MasterData {
  floorNumbers: { floorNumberId: number; floorNumberName: string }[];
  occupancyStatuses: { occupancyStatusId: number; occupancyStatusName: string }[];
  constructionNatures: { constructionNatureId: number; constructionNatureName: string }[];
  nrPropertyCategories: { propertyCategoryId: number; propertyCategoryName: string }[];
  nrPropertySubCategories: {
    subCategoryId: number;
    subCategoryName: string;
    propertyCategoryId: number;
  }[];
}

type Navigation = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

export default function NonResidentialFloorDetail() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [masterData, setMasterData] = useState<MasterData>({
    floorNumbers: [],
    occupancyStatuses: [],
    constructionNatures: [],
    nrPropertyCategories: [],
    nrPropertySubCategories: [],
  });
  const [subCategories, setSubCategories] = useState<
    { subCategoryId: number; subCategoryName: string; propertyCategoryId: number }[]
  >([]);

  // Form state
  const [formData, setFormData] = useState<FloorDetail>({
    id: '',
    floorNumberId: 0,
    nrPropertyCategoryId: 0,
    nrSubCategoryId: 0,
    establishmentName: '',
    licenseNo: '',
    licenseExpiryDate: '',
    occupancyStatusId: 0,
    constructionNatureId: 0,
    builtupArea: '',
  });

  const surveyId = (route.params as any)?.surveyId;
  const editMode = (route.params as any)?.editMode || false;
  const floorId = (route.params as any)?.floorId;
  const floorData = (route.params as any)?.floorData;

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
        // Load sub-categories for the existing category when editing
        if (floorData.nrPropertyCategoryId) {
          loadSubCategories(floorData.nrPropertyCategoryId);
        }
      } else {
        // Generate new ID for new floor
        setFormData((prev) => ({
          ...prev,
          id: `floor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }));
      }
    } catch (error) {
      console.error('Error initializing form:', error);
      Alert.alert('Error', 'Failed to initialize form. Please try again.');
      navigation.goBack();
    }
  }, []);

  const loadSubCategories = async (categoryId: number) => {
    try {
      const fetchedSubCategories = await fetchNrPropertySubCategories(categoryId);
      setSubCategories(fetchedSubCategories);
    } catch (error) {
      console.error('Error fetching sub-categories:', error);
      Alert.alert('Error', 'Failed to fetch sub-categories.');
      setSubCategories([]);
    }
  };

  const loadMasterData = async () => {
    try {
      const data = await getMasterData();
      setMasterData({
        floorNumbers: data?.floors || [],
        occupancyStatuses: data?.occupancyStatuses || [],
        constructionNatures: data?.constructionNatures || [],
        nrPropertyCategories: data?.nrPropertyCategories || [],
        nrPropertySubCategories: [], // This will be loaded dynamically
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

      // Handle number fields
      if (
        field === 'floorNumberId' ||
        field === 'nrPropertyCategoryId' ||
        field === 'nrSubCategoryId' ||
        field === 'occupancyStatusId' ||
        field === 'constructionNatureId'
      ) {
        newData[field] = parseInt(value) || 0;
      } else {
        newData[field] = value;
      }

      return newData;
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData((prev) => ({
        ...prev,
        licenseExpiryDate: selectedDate.toISOString().split('T')[0],
      }));
    }
  };

  const handleCategoryChange = async (categoryId: number) => {
    handleInputChange('nrPropertyCategoryId', categoryId.toString());
    handleInputChange('nrSubCategoryId', '0'); // Reset sub-category selection

    if (categoryId) {
      try {
        const fetchedSubCategories = await fetchNrPropertySubCategories(categoryId);
        setSubCategories(fetchedSubCategories);
      } catch (error) {
        console.error('Error fetching sub-categories:', error);
        Alert.alert('Error', 'Failed to fetch sub-categories.');
        setSubCategories([]);
      }
    } else {
      setSubCategories([]);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.floorNumberId) {
      Alert.alert('Validation Error', 'Please select Floor Number');
      return false;
    }
    if (!formData.nrPropertyCategoryId) {
      Alert.alert('Validation Error', 'Please select Property Category');
      return false;
    }
    if (!formData.nrSubCategoryId) {
      Alert.alert('Validation Error', 'Please select Property Sub Category');
      return false;
    }
    if (!formData.establishmentName.trim()) {
      Alert.alert('Validation Error', 'Please enter Establishment Name');
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
    const builtupValue = typeof formData.builtupArea === 'string' ? parseFloat(formData.builtupArea) : formData.builtupArea;
    if (!builtupValue || builtupValue <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid Built-up Area');
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
                  builtupArea: typeof formData.builtupArea === 'string' ? parseFloat(formData.builtupArea) || 0 : formData.builtupArea,
                  licenseNo: formData.licenseNo === '' ? null : formData.licenseNo,
                  licenseExpiryDate: !formData.licenseExpiryDate ? null : formData.licenseExpiryDate,
                  floorNumberId: Number(formData.floorNumberId),
                  nrPropertyCategoryId: Number(formData.nrPropertyCategoryId),
                  nrSubCategoryId: Number(formData.nrSubCategoryId),
                  occupancyStatusId: Number(formData.occupancyStatusId),
                  constructionNatureId: Number(formData.constructionNatureId),
                };

                const existingFloors =
                  survey.data && survey.data.nonResidentialPropertyAssessments
                    ? survey.data.nonResidentialPropertyAssessments
                    : [];
                let updatedFloors;

                if (editMode && floorId) {
                  // Update existing floor
                  updatedFloors = existingFloors.map((floor: any) =>
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
                    nonResidentialPropertyAssessments: updatedFloors,
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
        <TouchableOpacity style={styles.topBackButton} onPress={() => {
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
          {editMode ? 'Edit' : 'Add'} Non-Residential Floor Detail
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

          {/* Property Category */}
          <View style={styles.formGroup}>
            <Text style={{ color: '#111' }}>Property Category <Text style={{ color: 'red' }}>*</Text></Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.nrPropertyCategoryId}
                onValueChange={(value) => {
                  handleCategoryChange(value);
                }}
                style={styles.picker}>
                <Picker.Item label="Select Property Category" value={0} />
                {masterData.nrPropertyCategories.map((category) => (
                  <Picker.Item
                    key={category.propertyCategoryId}
                    label={category.propertyCategoryName}
                    value={category.propertyCategoryId}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Property Sub Category */}
          <View style={styles.formGroup}>
            <Text style={{ color: '#111' }}>Property Sub Category <Text style={{ color: 'red' }}>*</Text></Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.nrSubCategoryId}
                onValueChange={(value) => handleInputChange('nrSubCategoryId', value.toString())}
                style={styles.picker}
                enabled={!!formData.nrPropertyCategoryId && subCategories.length > 0}>
                <Picker.Item label="Select Property Sub Category" value={0} />
                {subCategories.map((subCategory) => (
                  <Picker.Item
                    key={subCategory.subCategoryId}
                    label={subCategory.subCategoryName}
                    value={subCategory.subCategoryId}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Establishment Name */}
          <View style={styles.formGroup}>
            <Text style={{ color: '#111' }}>Establishment Name <Text style={{ color: 'red' }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={formData.establishmentName}
              onChangeText={(value) => handleInputChange('establishmentName', value)}
              placeholder="Enter establishment name"
            />
          </View>

          {/* License Number */}
          <View style={styles.formGroup}>
            <Text style={{ color: '#111' }}>License Number</Text>
            <TextInput
              style={styles.input}
              value={formData.licenseNo}
              onChangeText={(value) => handleInputChange('licenseNo', value)}
              placeholder="Enter license number"
            />
          </View>

          {/* License Expiry Date */}
          <View style={styles.formGroup}>
            <Text style={{ color: '#111' }}>License Expiry Date</Text>
            <View style={styles.dateInputContainer}>
              <TouchableOpacity 
                style={[styles.dateInput, { flex: 1 }]} 
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={formData.licenseExpiryDate ? styles.dateText : styles.placeholderText}>
                  {formData.licenseExpiryDate || 'Select expiry date'}
                </Text>
              </TouchableOpacity>
              {formData.licenseExpiryDate && (
                <TouchableOpacity 
                  style={styles.clearDateButton}
                  onPress={() => setFormData((prev) => ({ ...prev, licenseExpiryDate: '' }))}
                >
                  <Text style={styles.clearDateButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Occupancy Status */}
          <View style={styles.formGroup}>
            <Text style={{ color: '#111' }}>Occupancy Status <Text style={{ color: 'red' }}>*</Text></Text>
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
            <Text style={{ color: '#111' }}>Construction Nature <Text style={{ color: 'red' }}>*</Text></Text>
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

          {/* Built-up Area */}
          <View style={styles.formGroup}>
            <Text style={{ color: '#111' }}>Built-up Area (sq ft) <Text style={{ color: 'red' }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={typeof formData.builtupArea === 'string' ? formData.builtupArea : String(formData.builtupArea)}
              onChangeText={(value) => handleInputChange('builtupArea', value)}
              placeholder="Enter built-up area"
              keyboardType="numeric"
            />
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

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.licenseExpiryDate ? new Date(formData.licenseExpiryDate) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
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
  dateInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearDateButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 34,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearDateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
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
