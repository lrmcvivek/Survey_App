import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  BackHandler,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getUnsyncedSurveys, syncSurveysToBackend, setSelectedAssignment } from '../utils/storage';
import { fetchSurveyorAssignments } from '../services/surveyService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { getUnsavedDraft, clearUnsavedDraft } from '../utils/draftStorage';
import { SurveyRecoveryDialog } from '../components/SurveyRecoveryDialog';

type Navigation = {
  navigate: (screen: string, params?: any) => void;
};

const Card = ({
  title,
  onPress,
  disabled,
  subtitle,
  badge,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  subtitle?: string;
  badge?: number;
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, disabled && styles.disabledCard]}
      onPress={onPress}
      disabled={disabled}>
      <View style={styles.cardContent}>
        <Text style={styles.cardText}>{title}</Text>
        {subtitle && <Text style={styles.cardSubtext}>{subtitle}</Text>}
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function SurveyorDashboard() {
  const navigation = useNavigation<Navigation>();
  const [isSyncing, setIsSyncing] = useState(false);
  const [ongoingSurvey, setOngoingSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);
  const [primaryAssignment, setPrimaryAssignment] = useState<any>(null);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  // Recovery dialog state
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [unsavedDraft, setUnsavedDraft] = useState<any>(null);
  
  // Track if we should skip draft check (user just intentionally exited)
  const skipDraftCheckRef = React.useRef(false);

  // Wrap all async operations to prevent crashes
  const safeAsyncOperation = async (operation: () => Promise<void>, errorContext: string) => {
    try {
      await operation();
    } catch (error) {
      console.error(`Dashboard error in ${errorContext}:`, error);
      // Don't crash - just log and continue
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Exit App', 'Are you sure you want to exit?', [
          {
            text: 'Cancel',
            onPress: () => null,
            style: 'cancel',
          },
          { text: 'YES', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      // Safe data loading to prevent crashes
      safeAsyncOperation(checkOngoingSurvey, 'focus checkOngoingSurvey');
      safeAsyncOperation(loadUnsyncedCount, 'focus loadUnsyncedCount');
      
      // Only check for unsaved draft if NOT just exited from survey form
      // This prevents showing recovery dialog immediately after user intentionally exits
      if (!skipDraftCheckRef.current) {
        safeAsyncOperation(checkForUnsavedDraft, 'focus checkForUnsavedDraft');
      } else {
        console.log('[Dashboard] Skipping draft check - user just exited survey form');
        skipDraftCheckRef.current = false; // Reset for next time
      }

      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    // Safe initialization to prevent crashes
    safeAsyncOperation(checkOngoingSurvey, 'init checkOngoingSurvey');
    safeAsyncOperation(fetchAssignments, 'init fetchAssignments');
    safeAsyncOperation(loadPrimaryAssignment, 'init loadPrimaryAssignment');
    safeAsyncOperation(loadUnsyncedCount, 'init loadUnsyncedCount');
  }, []);

  const checkOngoingSurvey = async () => {
    try {
      console.log('Dashboard: Checking ongoing survey...');
      const allSurveys = await getUnsyncedSurveys();
      console.log('Dashboard: Got surveys:', allSurveys?.length || 0);
      
      // Safe check with proper error handling
      const ongoing = Array.isArray(allSurveys)
        ? allSurveys.find((s: any) => s?.status === 'incomplete')
        : null;
      
      console.log('Dashboard: Ongoing survey found:', !!ongoing);
      setOngoingSurvey(ongoing && ongoing.surveyType ? ongoing : null);
    } catch (error) {
      console.error('Dashboard: Error checking ongoing survey:', error);
      // Don't crash the dashboard - just set to null
      setOngoingSurvey(null);
    } finally {
      setLoading(false);
    }
  };

  const checkForUnsavedDraft = async () => {
    try {
      console.log('Dashboard: Checking for unsaved draft...');
      
      // First check if we should skip (user just exited survey form)
      const skipFlag = await AsyncStorage.getItem('@ptms_skip_draft_check');
      if (skipFlag === 'true') {
        console.log('[Dashboard] Skip flag found - user just exited survey form');
        await AsyncStorage.removeItem('@ptms_skip_draft_check'); // Clear flag
        return; // Don't show recovery dialog
      }
      
      const draft = await getUnsavedDraft();
      
      if (draft) {
        console.log('Dashboard: Found unsaved draft:', draft.surveyId);
        setUnsavedDraft(draft);
        setShowRecoveryDialog(true);
      } else {
        console.log('Dashboard: No unsaved draft found');
      }
    } catch (error) {
      console.error('Dashboard: Error checking unsaved draft:', error);
    }
  };

  const fetchAssignments = async () => {
    setAssignmentsLoading(true);
    setAssignmentsError(null);
    try {
      const data = await fetchSurveyorAssignments();
      // Filter to show only active assignments
      const activeAssignments = (data.assignments || []).filter((a: any) => a.isActive === true);
      setAssignments(activeAssignments);
      
      // CRITICAL: Validate primary assignment against active list
      const currentPrimaryJson = await AsyncStorage.getItem('primaryAssignment');
      if (currentPrimaryJson) {
        const currentPrimary = JSON.parse(currentPrimaryJson);
        const isStillActive = activeAssignments.some(
          (a: any) => a.assignmentId === currentPrimary.assignmentId
        );
        
        if (!isStillActive) {
          console.log('Dashboard: Primary assignment is no longer active, clearing it');
          await AsyncStorage.removeItem('primaryAssignment');
          setPrimaryAssignment(null);
          await setSelectedAssignment(null);
        } else {
          console.log('Dashboard: Primary assignment verified as active');
        }
      }
    } catch (err: any) {
      console.error(err);
      setAssignmentsError('Failed to load assignments');
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const loadPrimaryAssignment = async () => {
    try {
      console.log('Dashboard: Loading primary assignment...');
      const json = await AsyncStorage.getItem('primaryAssignment');
      
      if (json) {
        const parsed = JSON.parse(json);
        
        // CHECK: If ward number fields are missing, force refresh from backend
        if (parsed.ward && !parsed.ward.newWardNumber && !parsed.ward.oldWardNumber) {
          console.log('Dashboard: Detected stale assignment cache (missing ward numbers), refreshing from backend...');
          // Fetch fresh assignment data from backend
          const data = await fetchSurveyorAssignments();
          const activeAssignments = (data.assignments || []).filter((a: any) => a.isActive === true);
          const matchingAssignment = activeAssignments.find(
            (a: any) => a.assignmentId === parsed.assignmentId
          );
          
          if (matchingAssignment) {
            console.log('Dashboard: Refreshed assignment with ward numbers:', matchingAssignment.ward);
            await AsyncStorage.setItem('primaryAssignment', JSON.stringify(matchingAssignment));
            setPrimaryAssignment(matchingAssignment);
            return;
          } else {
            console.warn('Dashboard: Could not find matching assignment, using cached version');
          }
        }
        
        // Check if the stored primary assignment is still active
        if (parsed.isActive === false) {
          console.log('Dashboard: Primary assignment is inactive, clearing it');
          await AsyncStorage.removeItem('primaryAssignment');
          setPrimaryAssignment(null);
          
          // Also clear selectedAssignment to keep them in sync
          await setSelectedAssignment(null);
        } else {
          console.log('Dashboard: Primary assignment loaded and active');
          setPrimaryAssignment(parsed);
        }
      } else {
        // NO CACHE - Force fetch from backend and auto-select first active assignment
        console.log('Dashboard: No cached assignment found, fetching from backend...');
        const data = await fetchSurveyorAssignments();
        const activeAssignments = (data.assignments || []).filter((a: any) => a.isActive === true);
        
        if (activeAssignments.length > 0) {
          console.log('Dashboard: Found', activeAssignments.length, 'active assignment(s), auto-selecting first one');
          const firstAssignment = activeAssignments[0];
          await AsyncStorage.setItem('primaryAssignment', JSON.stringify(firstAssignment));
          setPrimaryAssignment(firstAssignment);
          await setSelectedAssignment(firstAssignment);
          console.log('Dashboard: Auto-selected assignment:', firstAssignment.assignmentId);
          console.log('Dashboard: Ward data:', firstAssignment.ward);
        } else {
          console.log('Dashboard: No active assignments available');
          setPrimaryAssignment(null);
        }
      }
    } catch (error) {
      console.error('Dashboard: Error loading primary assignment:', error);
      setPrimaryAssignment(null);
    }
  };

  const loadUnsyncedCount = async () => {
    try {
      console.log('Dashboard: Loading unsynced count...');
      const allSurveys = await getUnsyncedSurveys();
      
      if (!Array.isArray(allSurveys)) {
        console.warn('Dashboard: getUnsyncedSurveys returned non-array:', allSurveys);
        setUnsyncedCount(0);
        return;
      }
      
      const submittedUnsynced = allSurveys.filter(
        (s: any) => s?.status === 'submitted' && !s?.synced
      );
      console.log('Dashboard: Unsynced count:', submittedUnsynced.length);
      setUnsyncedCount(submittedUnsynced.length);
    } catch (error) {
      console.error('Dashboard: Error loading unsynced count:', error);
      // Don't crash - just set to 0
      setUnsyncedCount(0);
    }
  };

  const refreshData = async () => {
    if (refreshing) return; // Prevent concurrent refreshes
    
    setRefreshing(true);
    console.log('Dashboard: Starting refresh...');
    
    try {
      // Refresh all data in parallel for better performance
      await Promise.all([
        (async () => {
          try {
            const data = await fetchSurveyorAssignments();
            // Filter to show only active assignments
            const activeAssignments = (data.assignments || []).filter((a: any) => a.isActive === true);
            setAssignments(activeAssignments);
            setAssignmentsError(null);
            
            // CRITICAL: If there's a primary assignment, verify it's still in the active list
            const currentPrimaryJson = await AsyncStorage.getItem('primaryAssignment');
            if (currentPrimaryJson) {
              const currentPrimary = JSON.parse(currentPrimaryJson);
              const isStillActive = activeAssignments.some(
                (a: any) => a.assignmentId === currentPrimary.assignmentId
              );
              
              if (!isStillActive) {
                console.log('Dashboard: Primary assignment is no longer active, clearing it');
                await AsyncStorage.removeItem('primaryAssignment');
                setPrimaryAssignment(null);
                await setSelectedAssignment(null);
              } else {
                console.log('Dashboard: Primary assignment is still active');
              }
            }
          } catch (err: any) {
            console.error('Dashboard: Error refreshing assignments:', err);
            setAssignmentsError('Failed to load assignments');
            setAssignments([]);
          } finally {
            setAssignmentsLoading(false);
          }
        })(),
        loadPrimaryAssignment(),
        checkOngoingSurvey(),
        loadUnsyncedCount(),
      ]);
      
      console.log('Dashboard: Refresh completed successfully');
      // Show toast message on successful refresh
      Toast.show({
        type: 'success',
        text1: 'Dashboard Refreshed Successfully',
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
        props: {
          style: {
            marginTop: 60,
          },
        },
      });
    } catch (error) {
      console.error('Dashboard: Error during refresh:', error);
      // Don't show error to user during refresh - just log it
    } finally {
      setRefreshing(false);
    }
  };

  const handleSetPrimary = async (assignment: any) => {
    Alert.alert(
      'Set Primary Assignment',
      `Are you sure you want to set this assignment as your primary?\n\nULB: ${assignment.ulb?.ulbName || assignment.ulb?.ulbId || 'N/A'}\nZone: ${assignment.zone?.zoneName || assignment.zone?.zoneId || 'N/A'}\nWard: ${assignment.ward?.wardName || assignment.ward?.wardId || 'N/A'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set Primary',
          onPress: async () => {
            await AsyncStorage.setItem('primaryAssignment', JSON.stringify(assignment));
            setPrimaryAssignment(assignment);
            await setSelectedAssignment(assignment); // keep selectedAssignment in sync
            Alert.alert('Primary Assignment Set', 'This assignment is now your primary.');
          },
        },
      ]
    );
  };

  const handleCardPress = async (surveyType: string) => {
    try {
      // Check for unsaved draft BEFORE allowing new survey
      const existingDraft = await getUnsavedDraft();
      
      if (existingDraft) {
        // Show recovery dialog instead of starting new survey
        console.log('[Dashboard] Found draft when clicking card, showing recovery dialog');
        setUnsavedDraft(existingDraft);
        setShowRecoveryDialog(true);
        return; // Don't proceed with new survey
      }
      
      // No draft - proceed with normal flow
      // Check if user has any active assignments
      if (assignments.length === 0) {
      Alert.alert(
        'No Assignment',
        'You do not have any active ward assignment. Please contact your administrator.',
        [{ text: 'OK' }]
      );
      return;
    }

    // User MUST have a primary assignment set to do surveys
    if (!primaryAssignment) {
      Alert.alert(
        'Primary Assignment Required',
        'Please set a primary assignment from your ward assignments before starting a survey. Click on the Primary button to set one.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Verify primary assignment is active
    if (!primaryAssignment.isActive) {
      Alert.alert(
        'Assignment Inactive',
        'Your current assignment is inactive. You cannot proceed with the survey until your assignment is activated by the administrator.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (ongoingSurvey) {
      Alert.alert(
        'Ongoing Survey',
        'You have an ongoing survey. Would you like to continue with it or start a new one?',
        [
          {
            text: 'Continue Ongoing',
            onPress: () => {
              console.log('[Dashboard] Continuing ongoing survey:', ongoingSurvey.id);
              console.log('[Dashboard] Survey type:', ongoingSurvey.surveyType);
              console.log('[Dashboard] Survey data keys:', Object.keys(ongoingSurvey.data || {}));
              
              Alert.alert(
                'Continue Survey',
                `Do you want to continue the ongoing ${ongoingSurvey.surveyType} survey?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Continue',
                    onPress: () => {
                      console.log('[Dashboard] Navigating to SurveyIntermediate with ID:', ongoingSurvey.id);
                      navigation.navigate('SurveyIntermediate', {
                        surveyId: ongoingSurvey.id,
                        surveyType: ongoingSurvey.surveyType,
                      });
                    },
                  },
                ]
              );
            },
          },
          {
            text: 'Start New',
            onPress: () => {
              Alert.alert(
                'Start New Survey',
                `Are you sure you want to start a new ${surveyType} survey?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Start New',
                    onPress: () => navigation.navigate('SurveyForm', { surveyType }),
                  },
                ]
              );
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      Alert.alert(
        'Start New Survey',
        `Are you sure you want to start a new ${surveyType} survey?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start New',
            onPress: () => navigation.navigate('SurveyForm', { surveyType }),
          },
        ]
      );
    }
  } catch (error) {
    console.error('Error in handleCardPress:', error);
    // Fallback to normal behavior
    navigation.navigate('SurveyForm', { surveyType });
  }
};

  const handleContinueOngoing = () => {
    // Check if user has any active assignments
    if (assignments.length === 0) {
      Alert.alert(
        'No Assignment',
        'You do not have any active ward assignment. Please contact your administrator.',
        [{ text: 'OK' }]
      );
      return;
    }

    // User MUST have a primary assignment set to continue surveys
    if (!primaryAssignment) {
      Alert.alert(
        'Primary Assignment Required',
        'Please set a primary assignment from your ward assignments before continuing the survey.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Verify primary assignment is active
    if (!primaryAssignment.isActive) {
      Alert.alert(
        'Assignment Inactive',
        'Your current assignment is inactive. You cannot continue the survey until your assignment is activated by the administrator.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (ongoingSurvey) {
      Alert.alert(
        'Continue Survey',
        `Do you want to continue the ongoing ${ongoingSurvey.surveyType} survey?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => {
              navigation.navigate('SurveyIntermediate', {
                surveyId: ongoingSurvey.id,
                surveyType: ongoingSurvey.surveyType,
              });
            },
          },
        ]
      );
    }
  };

  const handleSyncData = async () => {
    Alert.alert(
      'Sync All Surveys',
      'This will upload all submitted surveys to the server and remove them from your device. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync All',
          onPress: async () => {
            setIsSyncing(true);
            try {
              const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
              const token = await AsyncStorage.getItem('userToken');
              if (!apiBaseUrl || !token) {
                Alert.alert('Error', 'Missing API base URL or auth token.');
                setIsSyncing(false);
                return;
              }
              const unsynced = await getUnsyncedSurveys();
              if (unsynced.length === 0) {
                Alert.alert('No Data', 'There are no surveys to sync.');
                setIsSyncing(false);
                return;
              }
              const { success, failed } = await syncSurveysToBackend(apiBaseUrl, token);
              let msg = `${success} survey(s) synced successfully.`;
              if (failed > 0) msg += ` ${failed} failed.`;
              Alert.alert('Sync Complete', msg);
              setOngoingSurvey(null);
              loadUnsyncedCount(); // Refresh count after sync
            } catch (error) {
              console.error(error);
              Alert.alert('Sync Error', 'An error occurred while syncing data. Please try again.');
            } finally {
              setIsSyncing(false);
            }
          },
        },
      ]
    );
  };

  const handleSurveyRecords = () => {
    navigation.navigate('SurveyRecordsScreen');
  };

  // Recovery dialog handlers
  const handleContinueDraft = () => {
    setShowRecoveryDialog(false);
    if (unsavedDraft) {
      console.log('[Dashboard] Continuing draft survey:', unsavedDraft.surveyId);
      // Navigate with draft data so SurveyForm can restore it
      navigation.navigate('SurveyForm', {
        surveyType: unsavedDraft.surveyType,
        editMode: false, // NOT edit mode - this is a new draft restoration
        surveyId: unsavedDraft.surveyId,  // Pass the draft's survey ID for matching
        hasDraft: true,  // Flag to indicate draft available
      });
      // Don't clear yet - let SurveyForm restore it first
      // SurveyForm will clear after successful restoration
    }
  };

  const handleNewSurveyFromRecovery = () => {
    setShowRecoveryDialog(false);
    clearUnsavedDraft();
    console.log('[Dashboard] User chose to start new survey from recovery');
    // After clearing, user needs to click the card again
    // Show a toast to inform user
    Toast.show({
      type: 'success',
      text1: 'Draft Cleared',
      text2: 'You can now start a new survey',
      visibilityTime: 2000,
    });
  };

  const handleCancelRecovery = () => {
    setShowRecoveryDialog(false);
    // DON'T clear draft - user might want to continue later
    // Only clear if user explicitly clicks "Start New Survey"
    console.log('[Dashboard] User cancelled recovery - keeping draft intact');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2776F5" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            colors={['#2776F5']}
            tintColor="#2776F5"
          />
        }>
        {/* Assignments Section */}
        <View style={{ marginBottom: 16, alignItems: 'center' }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Ward Assignment</Text>
            <TouchableOpacity
              style={[
                styles.refreshButton,
                refreshing && styles.refreshButtonDisabled,
              ]}
              onPress={refreshData}
              disabled={refreshing}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              {refreshing ? (
                <ActivityIndicator size="small" color="#2776F5" />
              ) : (
                <Icon name="refresh" size={20} color="#2776F5" />
              )}
            </TouchableOpacity>
          </View>
        {assignmentsLoading ? (
          <ActivityIndicator size="small" color="#2776F5" />
        ) : (
          <View style={{ width: '100%' }}>
            {assignmentsError ? (
              <View style={{ marginBottom: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#2776F5', padding: 16 }}>
                <Text style={{ fontWeight: '600', color: '#b91c1c' }}>{assignmentsError}</Text>
              </View>
            ) : assignments.length === 0 ? (
              <View style={{ marginBottom: 8, alignItems: 'center', borderRadius: 8, backgroundColor: '#fef3c7', padding: 16 }}>
                <Text style={{ color: '#a16207' }}>No Ward Assignment for you.</Text>
              </View>
            ) : (
              assignments.map((a, idx) => (
                <View
                  key={a.assignmentId || idx}
                  style={{ marginBottom: 8, borderRadius: 8, backgroundColor: '#e0e7ff', padding: 16, position: 'relative' }}>
                  {/* Primary Button Top Right */}
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor:
                        primaryAssignment && a.assignmentId === primaryAssignment.assignmentId
                          ? '#22c55e'
                          : '#3b82f6',
                      paddingVertical: 4,
                      paddingHorizontal: 12,
                      borderRadius: 16,
                      zIndex: 10,
                    }}
                    onPress={() => handleSetPrimary(a)}
                    disabled={
                      primaryAssignment && a.assignmentId === primaryAssignment.assignmentId
                    }>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
                      Primary
                    </Text>
                  </TouchableOpacity>
                  <Text>
                    <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>ULB: </Text>
                    <Text style={{ color: '#3b82f6', fontWeight: '600' }}>
                      {a.ulb?.ulbName || a.ulb?.ulbId || 'N/A'}
                    </Text>
                  </Text>
                  <Text>
                    <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>Zone: </Text>
                    <Text style={{ color: '#3b82f6', fontWeight: '600' }}>
                      {a.zone?.zoneName || a.zone?.zoneId || 'N/A'}
                    </Text>
                  </Text>
                  <Text>
                    <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>Ward: </Text>
                    <Text style={{ color: '#3b82f6', fontWeight: '600' }}>
                      {a.ward?.wardName || a.ward?.wardId || 'N/A'}
                    </Text>
                  </Text>
                  <Text>
                    <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>Mohallas: </Text>
                    <Text style={{ color: '#3b82f6', fontWeight: '600' }}>
                      {a.mohallas && a.mohallas.length > 0
                        ? a.mohallas.map((m: any) => m.mohallaName).join(', ')
                        : 'N/A'}
                    </Text>
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
        </View>

        {/* Ongoing Survey Alert */}
        {ongoingSurvey && (
        <View style={styles.ongoingSurveyCard}>
          <Text style={styles.ongoingSurveyTitle}>Ongoing {ongoingSurvey.surveyType} Survey</Text>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinueOngoing}>
            <Text style={styles.continueButtonText}>Continue Survey</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.grid}>
        <Card
          title="Residential"
          onPress={() => handleCardPress('Residential')}
          subtitle={ongoingSurvey ? 'Continue ongoing survey first' : 'Non-Commercial Category'}
        />
        <Card
          title="Non-Residential"
          onPress={() => handleCardPress('Non-Residential')}
          subtitle={ongoingSurvey ? 'Continue ongoing survey first' : 'Commercial Category'}
        />
        <Card
          title="Mixed"
          onPress={() => handleCardPress('Mixed')}
          subtitle={ongoingSurvey ? 'Continue ongoing survey first' : 'Commercial & Non-Commercial'}
        />
        <Card
          title="Unsynced Surveys"
          onPress={handleSurveyRecords}
          subtitle="View unsynced surveys"
          badge={unsyncedCount}
        />
        <Card
          title="Sync Data"
          onPress={handleSyncData}
          disabled={isSyncing}
          subtitle={isSyncing ? 'Syncing...' : 'Sync all surveys to server'}
        />
        <Card
          title="Survey Count"
          onPress={() => navigation.navigate('SurveyCountScreen')}
          subtitle="View synced survey count"
        />
      </View>

      {isSyncing && (
        <View style={styles.syncingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.syncingText}>Syncing...</Text>
        </View>
      )}
      </ScrollView>
      <Toast />
      
      {/* Recovery Dialog */}
      <SurveyRecoveryDialog
        visible={showRecoveryDialog}
        surveyType={unsavedDraft?.surveyType}
        timestamp={unsavedDraft?.timestamp}
        onContinue={handleContinueDraft}
        onNewSurvey={handleNewSurveyFromRecovery}
        onCancel={handleCancelRecovery}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 12,
    paddingTop: 0,
    paddingBottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
    position: 'relative',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    flex: 1,
  },
  refreshButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    marginLeft: 8,
    position: 'absolute',
    right: 0,
  },
  refreshButtonDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  ongoingSurveyCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  ongoingSurveyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 12,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledCard: {
    backgroundColor: '#E5E7EB',
  },
  cardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  cardSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  syncingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
