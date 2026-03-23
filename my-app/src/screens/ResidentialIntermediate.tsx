import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { getUnsyncedSurveys, updateLocalSurvey, getMasterData } from '../utils/storage';

interface FloorDetail {
  id: string;
  floorNumberId: number;
  occupancyStatusId: number;
  constructionNatureId: number;
  coveredArea: string;
  allRoomVerandaArea: string;
  allBalconyKitchenArea: string;
  allGarageArea: string;
  carpetArea: string;
}

interface MasterData {
  floorNumbers: { floorNumberId: number; floorNumberName: string }[];
  occupancyStatuses: { occupancyStatusId: number; occupancyStatusName: string }[];
  constructionNatures: { constructionNatureId: number; constructionNatureName: string }[];
}

interface SurveyData {
  id: string;
  surveyType: string;
  data: {
    residentialPropertyAssessments?: FloorDetail[];
    [key: string]: any;
  };
}

type Navigation = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

export default function ResidentialIntermediate() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute();
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<MasterData>({
    floorNumbers: [],
    occupancyStatuses: [],
    constructionNatures: [],
  });

  const surveyId = (route.params as any)?.surveyId;

  const loadSurveyData = useCallback(async () => {
    try {
      if (!surveyId) {
        Alert.alert('Error', 'Survey ID not found');
        navigation.goBack();
        return;
      }

      setLoading(true);
      const allSurveys = await getUnsyncedSurveys();
      const survey = allSurveys.find((s: any) => s.id === surveyId);
      
      if (!survey) {
        Alert.alert('Error', 'Survey not found. It may have been deleted or synced.');
        navigation.goBack();
        return;
      }
      
      setSurveyData(survey);
      
      // Load master data for displaying names
      const masterDataResult = await getMasterData();
      if (masterDataResult) {
        setMasterData({
          floorNumbers: masterDataResult?.floors || [],
          occupancyStatuses: masterDataResult?.occupancyStatuses || [],
          constructionNatures: masterDataResult?.constructionNatures || [],
        });
      }
    } catch (error) {
      console.error('Error loading survey data:', error);
      Alert.alert('Error', 'Failed to load survey data. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [surveyId, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadSurveyData();
      
      // Add back button handler
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackNavigation);
      
      return () => {
        backHandler.remove();
      };
    }, [loadSurveyData])
  );

  const handleBackNavigation = () => {
    navigation.goBack();
    // Prevent default back navigation
    return true;
  };

  const handleAddNewFloor = () => {
    if (!surveyData) return;

    navigation.navigate('ResidentialFloorDetail', {
      surveyId: surveyData.id,
      editMode: false,
      floorId: null,
    });
  };

  const handleEditFloor = (floorId: string) => {
    if (!surveyData || !surveyData.data) return;

    // Show confirmation dialog before editing
    Alert.alert(
      'Confirm Edit',
      'Are you sure you want to edit this floor detail?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit',
          style: 'default',
          onPress: () => {
            const floorData = surveyData.data.residentialPropertyAssessments?.find(
              (floor) => floor.id === floorId
            );

            if (!floorData) {
              Alert.alert('Error', 'Floor data not found');
              return;
            }

            navigation.navigate('ResidentialFloorDetail', {
              surveyId: surveyData.id,
              editMode: true,
              floorId: floorId,
              floorData: floorData,
            });
          },
        },
      ]
    );
  };

  const handleDeleteFloor = (floorId: string) => {
    if (!surveyData || !surveyData.data) return;

    Alert.alert('Delete Floor', 'Are you sure you want to delete this floor detail?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const updatedFloors =
              surveyData.data.residentialPropertyAssessments?.filter(
                (floor) => floor.id !== floorId
              ) || [];

            const updatedSurveyData = {
              ...surveyData,
              data: {
                ...surveyData.data,
                residentialPropertyAssessments: updatedFloors,
              },
            };

            await updateLocalSurvey(surveyData.id, updatedSurveyData);
            setSurveyData(updatedSurveyData);
            Alert.alert('Success', 'Floor detail deleted successfully');
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to delete floor detail. Please try again.');
          }
        },
      },
    ]);
  };

  const renderFloorCard = ({ item }: { item: FloorDetail }) => {
    // Get names from master data using IDs
    const floorName = masterData.floorNumbers.find(
      (f) => f.floorNumberId === item.floorNumberId
    )?.floorNumberName || 'Unknown';
    
    const occupancyStatusName = masterData.occupancyStatuses.find(
      (s) => s.occupancyStatusId === item.occupancyStatusId
    )?.occupancyStatusName || 'Unknown';
    
    const constructionNatureName = masterData.constructionNatures.find(
      (n) => n.constructionNatureId === item.constructionNatureId
    )?.constructionNatureName || 'Unknown';

    return (
    <View style={styles.floorCard}>
      <View style={styles.floorHeader}>
        <Text style={styles.floorTitle}>{floorName}</Text>
        <View style={styles.floorActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleEditFloor(item.id)}>
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteFloor(item.id)}>
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.floorDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Occupancy Status:</Text>
          <Text style={styles.detailValue}>{occupancyStatusName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Construction Nature:</Text>
          <Text style={styles.detailValue}>{constructionNatureName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Covered Area:</Text>
          <Text style={styles.detailValue}>{item.coveredArea} sq ft</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Carpet Area:</Text>
          <Text style={styles.detailValue}>{item.carpetArea} sq ft</Text>
        </View>
      </View>
    </View>
  );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.loadingContainer}>
          <Text>Loading floor details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!surveyData) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No survey data found</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const floors =
    surveyData.data && surveyData.data.residentialPropertyAssessments
      ? surveyData.data.residentialPropertyAssessments
      : [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBackButton}>
          <Text style={styles.topBackArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Residential Floor Details</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.summarySection}>
          <Text style={styles.summaryText}>Total Floors: {floors.length}</Text>
        </View>

        {floors.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No residential floor details added yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the button below to add your first floor detail
            </Text>
          </View>
        ) : (
          <FlatList
            data={floors}
            renderItem={renderFloorCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.floorList}
          />
        )}

        <View style={styles.addButtonContainer}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNewFloor}>
            <Text style={styles.addButtonText}>Add New Floor Detail</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summarySection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  floorList: {
    paddingBottom: 16,
  },
  floorCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  floorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  floorActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    color: 'white',
  },
  floorDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  addButtonContainer: {
    paddingVertical: 16,
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    height: 48,
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
});
