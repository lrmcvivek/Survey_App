import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Image as RNImage,
  Modal,
  BackHandler,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import FormInput from '../components/FormInput';
import FormDropdown from '../components/FormDropdown';
import {
  saveSurveyLocally,
  getLocalSurvey,
  getUnsyncedSurveys,
  getMasterData,
} from '../utils/storage';
import { saveUnsavedDraft, clearUnsavedDraft, getUnsavedDraft, updateSurveyStatus } from '../utils/draftStorage';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { insertImagesForSurvey } from '../services/imageStorage';
import { insertSurveyImage } from '../services/sqlite';
import { storeImageForSurvey } from '../services/imageStorage';
import React from 'react';

// Local Error Boundary for Camera Modal
class CameraErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Camera Error Boundary caught error:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Camera Error Boundary details:', error, errorInfo);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
          <Text style={{ fontSize: 18, color: '#666', textAlign: 'center', margin: 20 }}>
            Camera encountered an error. Please try again.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#3B82F6', padding: 12, borderRadius: 8 }}
            onPress={() => {
              this.setState({ hasError: false });
              this.props.onError();
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Close Camera</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Global Error Boundary for entire Survey Form
class SurveyFormErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: Error) => void; navigation?: any },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; onError: (error: Error) => void; navigation?: any }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('🚨 SurveyForm Error Boundary caught critical error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 SurveyForm Error Boundary details:', error, errorInfo);
    // Save error info for recovery
    AsyncStorage.setItem('@ptms_last_crash_error', JSON.stringify({
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
    })).catch(() => {});
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
          <View style={{ padding: 20, backgroundColor: 'white', borderRadius: 12, maxWidth: '90%' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#DC2626', marginBottom: 12, textAlign: 'center' }}>
              ⚠️ Application Error
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 16, textAlign: 'center' }}>
              The survey form encountered an unexpected error. Your data has been saved automatically.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: '#3B82F6', padding: 14, borderRadius: 8, alignItems: 'center' }}
              onPress={() => {
                // Navigate back to dashboard
                this.props.navigation?.goBack();
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Return to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

interface FormData {
  ulbId: string;
  zoneId: string;
  wardId: string;
  mohallaId: string;
  parcelId: string | number;
  mapId: string | number;
  gisId: string;
  subGisId: string;
  responseTypeId: number;
  oldHouseNumber: string;
  electricityConsumerName: string;
  waterSewerageConnectionNumber: string;
  respondentName: string;
  respondentStatusId: number;
  ownerName: string;
  fatherHusbandName: string;
  mobileNumber: string;
  aadharNumber: string;
  propertyLatitude: string | number;
  propertyLongitude: string | number;
  assessmentYear: string;
  propertyTypeId: number;
  buildingName: string;
  roadTypeId: number;
  constructionYear: string;
  constructionTypeId: number;
  addressRoadName: string;
  locality: string;
  pinCode: string | number;
  landmark: string;
  fourWayEast: string;
  fourWayWest: string;
  fourWayNorth: string;
  fourWaySouth: string;
  newWardNumber: string;
  waterSourceId: number;
  rainWaterHarvestingSystem: string;
  plantation: string;
  parking: string;
  pollution: string;
  pollutionMeasurementTaken: string;
  waterSupplyWithin200Meters: string;
  sewerageLineWithin100Meters: string;
  disposalTypeId: number;
  totalPlotArea: string | number;
  builtupAreaOfGroundFloor: string | number;
  remarks: string;
}

export default function SurveyForm({ route }: any) {
  // Add mount logging to track component lifecycle
  const componentId = useRef(`SurveyForm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  console.log(`📱 SurveyForm mounting [${componentId.current}] with params:`, route?.params);
  
  // CRASH DEBUGGING: Add global error handler for this component
  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error('🚨 GLOBAL ERROR CAUGHT in SurveyForm:', error);
      console.error('🚨 Error stack:', error.error?.stack);
      // Save crash info
      AsyncStorage.setItem('@ptms_last_crash', JSON.stringify({
        type: 'global_error',
        message: error.message,
        stack: error.error?.stack,
        timestamp: Date.now(),
        componentId: componentId.current,
      })).catch(() => {});
    };
    
    // Add error listener
    if (ErrorUtils) {
      ErrorUtils.setGlobalHandler(errorHandler);
    }
    
    return () => {
      // Cleanup on unmount
      console.log('Removing global error handler');
    };
  }, []);
  
  let {
    surveyType,
    surveyData: initialSurveyData,
    editMode,
    surveyId,
  } = route.params as {
    surveyType: string;
    surveyData?: any;
    editMode?: boolean;
    surveyId?: string;
  };
  if (surveyType === 'Mix') surveyType = 'Mixed';
  type SurveyTypeKey = 'Residential' | 'Non-Residential' | 'Mixed';
  const surveyTypeKey = surveyType as SurveyTypeKey;
  const navigation = useNavigation();
  console.log(`📱 Navigation stack info [${componentId.current}]:`, navigation?.getState?.());
  
  // All refs first (before any state)
  const scrollViewRef = useRef<ScrollView>(null);
  const fieldRefs = useRef<{ [key: string]: View | null }>({});
  const cameraViewRef = useRef<CameraView | null>(null);
  const navigationBlocked = useRef(true);
  const componentMounted = useRef(true);
  const activeOperations = useRef(new Set<string>());
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Refs to track latest values for draft saving (avoids dependency issues)
  const formDataRef = useRef<any>({ ulbId: '', zoneId: '', wardId: '', mohallaId: '', parcelId: '', mapId: '', gisId: '', subGisId: '', responseTypeId: 0, oldHouseNumber: '', electricityConsumerName: '', waterSewerageConnectionNumber: '', respondentName: '', respondentStatusId: 0, ownerName: '', fatherHusbandName: '', mobileNumber: '', aadharNumber: '', propertyLatitude: '', propertyLongitude: '', assessmentYear: new Date().getFullYear().toString(), propertyTypeId: 0, buildingName: '', roadTypeId: 0, constructionYear: '', constructionTypeId: 0, addressRoadName: '', locality: '', pinCode: '', landmark: '', fourWayEast: '', fourWayWest: '', fourWayNorth: '', fourWaySouth: '', newWardNumber: '', waterSourceId: 0, rainWaterHarvestingSystem: 'NO', plantation: 'NO', parking: 'NO', pollution: 'NO', pollutionMeasurementTaken: '', waterSupplyWithin200Meters: 'NO', sewerageLineWithin100Meters: 'NO' });
  const photosRef = useRef<{ [key: string]: string | null }>({ khasra: null, front: null, left: null, right: null, other1: null, other2: null });
  const CAMERA_IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes idle timeout

  // All useState calls together
  // State for master data
  const [masterData, setMasterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locLoading, setLocLoading] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);

  // Use assignment data for ULB, Zone, Ward, and Mohalla options
  const [assignment, setAssignment] = useState<any>(null);

  // Add surveyId state to track current survey being edited or created
  const [surveyIdState, setSurveyIdState] = useState<string | undefined>(surveyId);
  const [photos, setPhotos] = useState<{ [key: string]: string | null }>({
    khasra: null,
    front: null,
    left: null,
    right: null,
    other1: null,
    other2: null,
  });
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraKey, setCameraKey] = useState<keyof typeof photos | null>(null);
  const [cameraCardName, setCameraCardName] = useState<string>(''); // Display name for the photo card
  const [cameraLoading, setCameraLoading] = useState(false);
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [viewerCardName, setViewerCardName] = useState<string>(''); // Display name for viewed photo
  // Add state to track camera initialization status
  const [cameraInitializing, setCameraInitializing] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const CLICK_DEBOUNCE_MS = 1000; // Prevent clicks within 1 second
  const [cameraReady, setCameraReady] = useState(false);
  
  // Add state to track save operation status (prevents rapid clicks)
  const [isSaving, setIsSaving] = useState(false);
  const SAVE_DEBOUNCE_MS = 2000; // Prevent save clicks within 2 seconds
  
  // Track if draft was already saved on exit to prevent double-save
  const draftSavedOnExit = useRef(false);

  // Photo card display name mapping
  const photoCardNames: { [key in keyof typeof photos]: string } = {
    khasra: 'Khasra No.',
    front: 'Building',
    left: 'Left Side',
    right: 'Right Side',
    other1: 'Other 1',
    other2: 'Other 2',
  };

  // Safe state setter that only works if component is mounted
  const safeSetState = (setter: () => void, operationName: string = 'unknown') => {
    if (componentMounted.current) {
      try {
        setter();
      } catch (error) {
        console.error(`Safe state update failed for ${operationName}:`, error);
      }
    } else {
      console.log(`Blocked state update for ${operationName} - component unmounted`);
    }
  };

  // Reset idle timer on user interaction (using refs to avoid dependency issues)
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    idleTimerRef.current = setTimeout(() => {
      if (componentMounted.current && cameraVisible) {
        console.log('Camera idle timeout - cleaning up');
        safeSetState(() => {
          setCameraVisible(false);
          setCameraReady(false);
          setCameraKey(null);
          setCameraCardName('');
          setCameraLoading(false);
        }, 'idleTimeoutCleanup');
        
        Alert.alert(
          'Session Timeout',
          'Camera was inactive for too long. Please restart the capture.',
          [{ text: 'OK' }]
        );
      }
    }, CAMERA_IDLE_TIMEOUT);
  }, []); // Empty deps - uses refs and current state values directly

  // Track async operations to cancel them during navigation
  const trackOperation = (operationId: string) => {
    activeOperations.current.add(operationId);
    return () => activeOperations.current.delete(operationId);
  };

  // Auto-save form data periodically when app goes background
  const saveFormDataForRecovery = useCallback(async () => {
    try {
      const formDataToSave = {
        surveyId: surveyIdState,
        surveyType: surveyTypeKey,
        editMode,
        assignment,
        masterData,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem('@ptms_survey_form_recovery', JSON.stringify(formDataToSave));
      console.log('[SurveyForm] Auto-saved form data for recovery');
    } catch (error) {
      console.error('[SurveyForm] Failed to auto-save form data:', error);
    }
  }, [surveyIdState, surveyTypeKey, editMode, assignment, masterData]);

  // Save complete draft for recovery (includes form field values)
  const saveCompleteDraft = useCallback(async (actionType: 'form_updated' | 'photo_added' | 'navigation_exit' = 'navigation_exit') => {
    try {
      console.log('[SaveCompleteDraft] === STARTING DRAFT SAVE PROCESS ===');
      console.log('[SaveCompleteDraft] Action type:', actionType);
      console.log('[SaveCompleteDraft] Current formData state keys:', Object.keys(formData).length);
      console.log('[SaveCompleteDraft] Current photos state:', JSON.stringify(photos));
      console.log('[SaveCompleteDraft] formDataRef current keys:', Object.keys(formDataRef.current).length);
      console.log('[SaveCompleteDraft] photosRef current:', JSON.stringify(photosRef.current));
      
      // Ensure survey ID exists - generate one if needed
      let currentSurveyId = surveyIdState;
      
      if (!currentSurveyId) {
        console.warn('[SaveCompleteDraft] No survey ID available, generating temporary ID...');
        currentSurveyId = `temp_survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('[SaveCompleteDraft] Generated survey ID:', currentSurveyId);
        
        // Set it in state for future use (async, won't block save)
        safeSetState(() => setSurveyIdState(currentSurveyId), 'setSurveyIdState_save');
      }
      
      if (!componentMounted.current) {
        console.error('[SaveCompleteDraft] Cannot save draft - component unmounted');
        return;
      }
      
      console.log('[SaveCompleteDraft] Survey ID:', currentSurveyId);
      console.log('[SaveCompleteDraft] Component mounted:', componentMounted.current);
      
      // CRITICAL FIX: Use refs which ALWAYS have the most recent values
      // State updates happen immediately, refs sync via useEffect and persist across renders
      const latestFormData = { ...formDataRef.current };
      const latestPhotos = { ...photosRef.current };
      
      console.log('[SaveCompleteDraft] Using formDataRef (most recent synced values)');
      console.log('[SaveCompleteDraft] Using photosRef (most recent synced values)');
      console.log('[SaveCompleteDraft] Sample formDataRef values:', {
        ulbId: formDataRef.current.ulbId,
        zoneId: formDataRef.current.zoneId,
        wardId: formDataRef.current.wardId,
        mohallaId: formDataRef.current.mohallaId,
        mapId: formDataRef.current.mapId,
        oldHouseNumber: formDataRef.current.oldHouseNumber,
        respondentName: formDataRef.current.respondentName,
      });
      console.log('[SaveCompleteDraft] Sample photosRef values:', latestPhotos);
      
      // Use refs to get most recent values (avoids dependency issues)
      // Refs are kept in sync with state via useEffect hooks
      const draft = {
        surveyId: currentSurveyId,
        surveyType: surveyTypeKey,
        editMode: editMode || false,
        assignment,
        masterData,
        formData: latestFormData,
        photos: latestPhotos,
        timestamp: Date.now(),
        lastAction: actionType,
      };
      
      console.log('[SaveCompleteDraft] Draft object created, validating...');
      console.log('[SaveCompleteDraft] Draft has formData:', !!draft.formData);
      console.log('[SaveCompleteDraft] Draft has photos:', !!draft.photos);
      console.log('[SaveCompleteDraft] Photo values:', draft.photos);
      
      // Validate that we have at least SOME data to save
      // Check if ANY form field has a non-empty/non-default value
      const hasFormData = draft.formData && Object.values(draft.formData).some(
        v => v !== '' && v !== null && v !== undefined && v !== 0
      );
      
      // Check if ANY photo has been captured (non-null URI)
      const hasPhotos = draft.photos && Object.values(draft.photos).some(
        v => v !== null && v !== undefined && v !== ''
      );
      
      console.log('[SaveCompleteDraft] Has form data (with actual values):', hasFormData);
      console.log('[SaveCompleteDraft] Has photos (captured):', hasPhotos);
      console.log('[SaveCompleteDraft] Form data sample values:', {
        ulbId: draft.formData?.ulbId,
        zoneId: draft.formData?.zoneId,
        respondentName: draft.formData?.respondentName,
        oldHouseNumber: draft.formData?.oldHouseNumber,
      });
      
      if (!hasFormData && !hasPhotos) {
        console.log('[SaveCompleteDraft] ℹ️ Saving draft with minimal data (user just started survey)');
      } else {
        console.log('[SaveCompleteDraft] ✅ Draft has meaningful data - FormData:', hasFormData, 'Photos:', hasPhotos);
      }
      
      // Try to stringify to catch any serialization errors
      try {
        const serialized = JSON.stringify(draft);
        console.log('[SaveCompleteDraft] Draft serialized successfully, size:', serialized.length, 'bytes');
        
        // Check if it's actually savable
        if (serialized === '{}' || serialized.length < 10) {
          console.error('[SaveCompleteDraft] ERROR: Draft appears to be empty or invalid!');
        }
      } catch (serializeError) {
        console.error('[SaveCompleteDraft] Serialization failed:', serializeError);
        // Don't abort - AsyncStorage might handle it differently
      }
      
      await saveUnsavedDraft(draft);
      console.log('[SurveyForm] ✅ Saved complete draft with latest data:', draft.surveyId, '| Action:', actionType);
      console.log('[SurveyForm] Form data fields saved:', Object.keys(latestFormData).length);
      console.log('[SurveyForm] Photos saved:', JSON.stringify(latestPhotos));
      console.log('[SaveCompleteDraft] === DRAFT SAVE PROCESS COMPLETED ===');
    } catch (error) {
      console.error('[SurveyForm] ❌ Failed to save complete draft:', error);
      // Don't crash - draft save is best effort
    }
  }, [surveyIdState, surveyTypeKey, editMode, assignment, masterData]);

  // Restore form data from recovery
  const restoreFormDataFromRecovery = useCallback(async () => {
    try {
      const savedData = await AsyncStorage.getItem('@ptms_survey_form_recovery');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        
        // Check if data is recent (less than 30 minutes old)
        const age = Date.now() - parsed.timestamp;
        const MAX_AGE = 30 * 60 * 1000; // 30 minutes
        
        if (age < MAX_AGE && parsed.surveyId === surveyIdState) {
          console.log('[SurveyForm] Found recent form data for recovery');
          // Could restore state here if needed
          return parsed;
        } else {
          console.log('[SurveyForm] Recovery data too old or different survey, clearing');
          await AsyncStorage.removeItem('@ptms_survey_form_recovery');
        }
      }
      return null;
    } catch (error) {
      console.error('[SurveyForm] Failed to restore form data:', error);
      return null;
    }
  }, [surveyIdState]);

  // Direct exit without state complexity
  const handleExit = async () => {
    console.log('=== User confirmed exit - preparing safe navigation ===');
    
    // Ensure we have a survey ID for draft saving
    let currentSurveyId = surveyIdState;
    
    if (!currentSurveyId) {
      // Generate a temporary survey ID for this session
      currentSurveyId = `temp_survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('[HandleExit] No survey ID found, generated temporary ID:', currentSurveyId);
      
      // Set it in state for future use
      safeSetState(() => setSurveyIdState(currentSurveyId), 'setSurveyIdState_exit');
    }
    
    // Save draft before exiting (for recovery) - this will UPDATE existing draft or create new one
    // Always save draft regardless of whether we have form data or photos
    console.log('[HandleExit] Calling saveCompleteDraft to update/create draft...');
    await saveCompleteDraft('navigation_exit');
    console.log('[HandleExit] Draft saved/updated successfully');
    
    // Mark that we already saved on exit to prevent cleanup from saving again
    draftSavedOnExit.current = true;
    console.log('[HandleExit] Set draftSavedOnExit flag to prevent double-save');
    
    // Cancel all active operations BEFORE unmounting
    console.log('Cancelling', activeOperations.current.size, 'active operations');
    activeOperations.current.clear();
    
    // Clear idle timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    
    // Set flag to skip draft check in Dashboard (user intentionally exited)
    await AsyncStorage.setItem('@ptms_skip_draft_check', 'true');
    console.log('[SurveyForm] Set skip draft check flag');
    
    // DON'T set componentMounted to false here - let cleanup handle it
    // This ensures navigation can complete safely
    navigationBlocked.current = false;
    
    // Force immediate navigation
    navigation.goBack();
  };
  
  // Exit without saving draft
  const handleExitWithoutSaving = async () => {
    console.log('User chose to exit without saving - discarding draft');
    
    // Clear any existing draft
    await clearUnsavedDraft();
    console.log('[SurveyForm] Draft cleared - user chose not to save');
    
    // Mark that we explicitly exited (prevent cleanup from saving)
    draftSavedOnExit.current = true;
    console.log('[HandleExitWithoutSaving] Set draftSavedOnExit flag to prevent cleanup save');
    
    // Mark component as unmounting
    componentMounted.current = false;
    navigationBlocked.current = false;
    
    // Cancel all active operations
    activeOperations.current.clear();
    
    // Set skip flag
    await AsyncStorage.setItem('@ptms_skip_draft_check', 'true');
    
    // Navigate back
    navigation.goBack();
  };

  // Simple confirmation dialog with draft save notification
  const showExitConfirmation = async () => {
    try {
      // Check if there's already a draft
      const existingDraft = await getUnsavedDraft();
      
      console.log('[ShowExitConfirmation] Checking for existing draft...');
      console.log('[ShowExitConfirmation] Existing draft:', existingDraft ? `Found for survey ${existingDraft.surveyId}` : 'None found');
      console.log('[ShowExitConfirmation] Current surveyId:', surveyIdState);
      
      if (existingDraft && existingDraft.surveyId === surveyIdState) {
        // Already have a draft for this survey - will UPDATE it
        console.log('[ShowExitConfirmation] Will UPDATE existing draft on Save & Exit');
        Alert.alert(
          'Leave Survey?',
          'Your latest progress will be saved and will UPDATE your existing draft. You can continue later where you left off.',
          [
            { text: 'Stay', style: 'cancel' },
            { 
              text: 'Save & Exit', 
              style: 'default',
              onPress: handleExit 
            },
            {
              text: 'Exit Without Saving',
              style: 'destructive',
              onPress: handleExitWithoutSaving
            }
          ],
          { cancelable: false }
        );
      } else if (existingDraft && existingDraft.surveyId !== surveyIdState) {
        // Have a draft for a DIFFERENT survey - will REPLACE it
        console.log('[ShowExitConfirmation] Different survey draft exists, will REPLACE on Save & Exit');
        Alert.alert(
          'Leave Survey?',
          `You have an unsaved ${existingDraft.surveyType} draft from another survey. Saving now will REPLACE that draft with this survey's data.`,
          [
            { text: 'Stay', style: 'cancel' },
            { 
              text: 'Save & Exit', 
              style: 'default',
              onPress: handleExit 
            },
            {
              text: 'Exit Without Saving',
              style: 'destructive',
              onPress: handleExitWithoutSaving
            }
          ],
          { cancelable: false }
        );
      } else {
        // No existing draft - will CREATE new one
        console.log('[ShowExitConfirmation] No draft exists, will CREATE new draft on Save & Exit');
        Alert.alert(
          'Leave Survey?',
          'Unsaved changes will be saved automatically as a new draft so you can continue later.',
          [
            { text: 'Stay', style: 'cancel' },
            { 
              text: 'Save & Exit', 
              style: 'default',
              onPress: handleExit 
            },
            {
              text: 'Exit Without Saving',
              style: 'destructive',
              onPress: handleExitWithoutSaving
            }
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error('Exit confirmation error:', error);
      // Fallback to simple exit
      handleExit();
    }
  };

  // Add navigation focus/blur listeners to track navigation events
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      console.log(`🔍 SurveyForm focused [${componentId.current}]`);
      
      // Safety check: if camera is visible but component lost focus, reset it
      if (!componentMounted.current) {
        console.warn('Component not mounted but received focus event, resetting camera state');
        setCameraVisible(false);
        setCameraReady(false);
        setCameraKey(null);
        setCameraCardName('');
        setCameraLoading(false);
        setCameraInitializing(false);
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
        }
        return;
      }
      
      resetIdleTimer(); // Reset idle timer on focus
    });
    
    const unsubscribeBlur = navigation.addListener('blur', () => {
      console.log(`🔍 SurveyForm blurred [${componentId.current}]`);
      // Clear idle timer on blur to prevent timeouts during navigation
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    });
    
    // Ultra-simple navigation protection using ref
    const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', (e) => {
      console.log(`🔍 SurveyForm beforeRemove [${componentId.current}]:`, e.data.action, 'Blocked:', navigationBlocked.current);
      
      // Check ref value directly - no state delays
      if (!navigationBlocked.current) {
        console.log('Navigation allowed, proceeding');
        return;
      }
      
      // Block and show confirmation
      if (e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP') {
        e.preventDefault();
        showExitConfirmation();
      }
    });

    // Simple Android back button
    const handleBackPress = () => {
      if (navigationBlocked.current) {
        showExitConfirmation();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
      unsubscribeBeforeRemove();
      backHandler.remove();
    };
  }, [navigation, resetIdleTimer]);

  // Auto-save form data when app goes to background
  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('[SurveyForm] AppState changed to:', nextAppState);
      
      // Save form data when going to background
      if (nextAppState === 'background') {
        console.log('[SurveyForm] App going to background, auto-saving form data...');
        saveFormDataForRecovery();
      }
    });

    return () => {
      appStateSubscription.remove();
    };
  }, [saveFormDataForRecovery]); // Minimal dependencies

  // Track when component is fully mounted and stable
  useEffect(() => {
    console.log(`✅ SurveyForm fully mounted and stable [${componentId.current}]`);
    console.log(`✅ Survey Type: ${surveyTypeKey}, Edit Mode: ${editMode}, Survey ID: ${surveyId}`);
    
    // Check if we should restore from draft
    const checkAndRestoreDraft = async () => {
      try {
        const draft = await getUnsavedDraft();
        
        if (draft && componentMounted.current) {
          console.log('[SurveyForm] Found draft, restoring...');
          console.log('[SurveyForm] Draft surveyId:', draft.surveyId);
          console.log('[SurveyForm] Current surveyIdState:', surveyIdState);
          
          // Validate expiry (30 minutes)
          const age = Date.now() - draft.timestamp;
          const MAX_AGE = 30 * 60 * 1000;
          
          if (age > MAX_AGE) {
            console.log('[SurveyForm] Draft expired, not restoring');
            return;
          }
          
          // Restore form data safely
          if (draft.formData && componentMounted.current) {
            safeSetState(() => setFormData(prev => ({ ...prev, ...draft.formData })), 'restoreFormData');
            console.log('[SurveyForm] Restored form data - fields updated:', Object.keys(draft.formData).length);
          }
          
          // Restore photos safely
          if (draft.photos && componentMounted.current) {
            safeSetState(() => setPhotos(draft.photos), 'restorePhotos');
            console.log('[SurveyForm] Restored photos:', JSON.stringify(draft.photos));
          }
          
          // Sync refs immediately after restoration to ensure consistency
          formDataRef.current = { ...formDataRef.current, ...draft.formData };
          photosRef.current = { ...photosRef.current, ...draft.photos };
          console.log('[SurveyForm] Synced refs with restored data');
          
          // DON'T clear draft here - keep it for potential future recoveries
          // Draft will be cleared when user saves or starts new survey
          console.log('[SurveyForm] Draft restored (kept for safety)');
          
          Toast.show({
            type: 'success',
            text1: 'Draft Restored',
            text2: 'Your unsaved progress has been recovered',
            visibilityTime: 3000,
          });
        } else if (!draft) {
          console.log('[SurveyForm] No draft found');
        }
      } catch (error) {
        console.error('[SurveyForm] Failed to restore draft:', error);
        // Don't crash - just log the error
      }
    };
    
    checkAndRestoreDraft();
    
    // Component mount tracking
    componentMounted.current = true;
    navigationBlocked.current = true;
    draftSavedOnExit.current = false; // Reset exit flag for fresh session
    
    // Cleanup function - runs when component unmounts
    return () => {
      console.log(`🧹 SurveyForm unmounting [${componentId.current}], cleaning up...`);
      
      // Mark as unmounted FIRST to prevent ANY state updates
      componentMounted.current = false;
      navigationBlocked.current = false;
      
      // Cancel ALL active operations immediately (prevents camera/storage crashes)
      activeOperations.current.clear();
      
      // Clear idle timer (prevents timeout callbacks)
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      
      // DON'T call setState here - component is already unmounting!
      // Just clear refs and let React handle the rest
      
      // Clear camera reference (not state - avoid setState on unmount)
      if (cameraViewRef.current) {
        cameraViewRef.current = null;
      }
      
      // Save draft on unmount ONLY if not already saved via handleExit
      // This is a fire-and-forget operation - don't await it
      if (surveyIdState && !draftSavedOnExit.current) {
        console.log('[Cleanup] Draft not saved on exit, saving now (async)...');
        // Call without await and catch errors silently
        saveCompleteDraft('navigation_exit').catch(() => {
          console.log('[Cleanup] Draft save failed (component already unmounted)');
        });
      } else if (draftSavedOnExit.current) {
        console.log('[Cleanup] Draft already saved on exit, skipping duplicate save');
      }
      
      // Clear recovery data on clean exit (fire-and-forget)
      AsyncStorage.removeItem('@ptms_survey_form_recovery').catch(() => {});
      
      console.log(`🧹 SurveyForm cleanup completed [${componentId.current}]`);
    };
  }, []); // Empty deps array - only runs on mount/unmount

  useEffect(() => {
    const loadAssignment = async () => {
      const operationId = `load_assignment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const cleanupOperation = trackOperation(operationId);
      
      try {
        if (!componentMounted.current || !activeOperations.current.has(operationId)) {
          console.log('Assignment loading cancelled - component unmounted');
          return;
        }
        
        const json = await AsyncStorage.getItem('primaryAssignment');
        
        // Check if still active after async operation
        if (!componentMounted.current || !activeOperations.current.has(operationId)) {
          console.log('Assignment loading cancelled after storage read');
          return;
        }
        
        if (json) {
          const parsedAssignment = JSON.parse(json);
          
          // Check if assignment is active
          if (!parsedAssignment.isActive) {
            console.log('Inactive assignment detected');
            Alert.alert(
              'Assignment Inactive',
              'Your assignment is currently inactive. Please contact your administrator.',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]
            );
            cleanupOperation();
            return;
          }
          
          safeSetState(() => setAssignment(parsedAssignment), 'setAssignment');
        } else {
          // No assignment found
          console.log('No primary assignment found');
          Alert.alert(
            'No Assignment',
            'You do not have any assignment. Please contact your administrator.',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
          cleanupOperation();
          return;
        }
      } catch (error) {
        console.error('Failed to load assignment from storage:', error);
      } finally {
        cleanupOperation();
      }
    };
    
    loadAssignment();
  }, []);

  // Simple component cleanup
  useEffect(() => {
    return () => {
      try {
        console.log(`🚪 SurveyForm unmounting [${componentId.current}]`);
        
        // Mark component as unmounted FIRST to prevent state updates
        componentMounted.current = false;
        
        // Cancel all active operations
        console.log('Cancelling', activeOperations.current.size, 'active operations on unmount');
        activeOperations.current.clear();
        
        // Clear idle timer
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
          idleTimerRef.current = null;
        }
        
        // Reset navigation blocking
        navigationBlocked.current = false;
        
        // Simple cleanup - only if component was still mounted
        try {
          setCameraVisible(false);
          setCameraReady(false);
          setCameraLoading(false);
          setCameraKey(null);
          setCameraInitializing(false);
          setViewerVisible(false);
          setViewerUri(null);
          setLocLoading(false);
          setLoading(false);
        } catch (stateError: any) {
          console.log('State cleanup failed (expected during unmount):', stateError?.message || stateError);
        }
        
        if (cameraViewRef.current) {
          cameraViewRef.current = null;
        }
        
      } catch (cleanupError) {
        console.error(`Cleanup error [${componentId.current}]:`, cleanupError);
      }
    };
  }, []);

  // Diagnostic function for camera issues
  const diagnoseCameraState = () => {
    console.log('=== Camera State Diagnosis ===');
    console.log('cameraVisible:', cameraVisible);
    console.log('cameraReady:', cameraReady);
    console.log('cameraLoading:', cameraLoading);
    console.log('cameraKey:', cameraKey);
    console.log('cameraViewRef.current:', !!cameraViewRef.current);
    console.log('camPermission granted:', camPermission?.granted);
    console.log('==============================');
  };

  // Function to reset camera state when issues occur
  const resetCameraState = (reason?: string) => {
    if (reason) {
      console.log(`Resetting camera state due to: ${reason}`);
    }
    
    setCameraVisible(false);
    setCameraReady(false);
    setCameraLoading(false);
    setCameraKey(null);
    setCameraCardName('');
    
    // Clear the camera ref to force reinitialization
    if (cameraViewRef.current) {
      cameraViewRef.current = null;
    }
  };

  // Handle camera permission changes with reset
  useEffect(() => {
    if (cameraVisible && !camPermission?.granted) {
      resetCameraState('Camera permission revoked');
      Alert.alert(
        'Camera Permission', 
        'Camera permission was revoked. Please grant permission to continue.',
        [
          {
            text: 'Grant Permission',
            onPress: async () => {
              await requestCamPermission();
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    }
  }, [camPermission?.granted, cameraVisible]);

  // Simple memory cleanup (removed interval to prevent navigation conflicts)
  const performMemoryCleanup = () => {
    try {
      // Only perform cleanup if component is still mounted
      if (__DEV__ && global.gc && componentMounted.current) {
        global.gc();
        console.log('Memory cleanup performed (development mode)');
      }
    } catch (error) {
      console.warn('Memory cleanup failed:', error);
    }
  };

  const requestLocationPermissionIfNeeded = async (): Promise<boolean> => {
    if (hasLocationPermission === true) return true;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasLocationPermission(granted);
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to fetch GPS coordinates.'
        );
      }
      return granted;
    } catch {
      Alert.alert('Error', 'Unable to request location permission.');
      return false;
    }
  };

  const handleFetchLocation = async () => {
    const operationId = `location_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const cleanupOperation = trackOperation(operationId);
    
    try {
      const permitted = await requestLocationPermissionIfNeeded();
      
      if (!permitted || !componentMounted.current || !activeOperations.current.has(operationId)) {
        cleanupOperation();
        return;
      }
      
      safeSetState(() => setLocLoading(true), 'setLocLoading');
      
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        
        // Check if still active after async operation
        if (!componentMounted.current || !activeOperations.current.has(operationId)) {
          console.log('Location fetch cancelled after getting position');
          return;
        }
        
        const { latitude, longitude } = position.coords;
        const latStr = latitude.toFixed(8);
        const lonStr = longitude.toFixed(8);
        
        // Update both fields in a single batch to prevent race conditions
        safeSetState(() => {
          handleInputChange('propertyLatitude', latStr);
          handleInputChange('propertyLongitude', lonStr);
        }, 'location coordinates');
        
        if (componentMounted.current) {
          Alert.alert('Success', '📍 Location fetched successfully!');
        }
      } catch (locationError) {
        if (componentMounted.current) {
          Alert.alert(
            'Location Error',
            'Unable to fetch GPS location. Please ensure GPS is enabled and try again.'
          );
        }
      }
    } catch (error) {
      console.error('Location fetch error:', error);
    } finally {
      if (componentMounted.current) {
        safeSetState(() => setLocLoading(false), 'setLocLoading');
      }
      cleanupOperation();
    }
  };

  const ensureCameraPermission = async (): Promise<boolean> => {
    try {
      const res = camPermission?.granted ? camPermission : await requestCamPermission();
      if (!res?.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to capture photos.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      Alert.alert('Error', 'Failed to request camera permission.');
      return false;
    }
  };

  const openCameraFor = async (key: keyof typeof photos) => {
    try {
      const currentTime = Date.now();
      
      // Implement click debouncing to prevent rapid clicks
      if (currentTime - lastClickTime < CLICK_DEBOUNCE_MS) {
        console.log(`Rapid click detected for ${key}, ignoring (${currentTime - lastClickTime}ms since last click)`);
        return;
      }
      
      setLastClickTime(currentTime);
      console.log(`Camera open requested for: ${key}`);
      
      // Prevent multiple operations with comprehensive checking
      if (cameraLoading || cameraVisible || cameraInitializing) {
        console.log(`Camera state busy - loading: ${cameraLoading}, visible: ${cameraVisible}, initializing: ${cameraInitializing}`);
        return;
      }
      
      // Verify component is still mounted before proceeding
      if (!componentMounted.current) {
        console.log('Component not mounted, cannot open camera');
        return;
      }
      
      // Set initialization state immediately
      setCameraInitializing(true);
      setCameraLoading(true);
      
      // Set camera key and card name immediately and persistently
      setCameraKey(key);
      setCameraCardName(photoCardNames[key] || 'Photo');
      console.log(`Camera key set to: ${key}, Card name: ${photoCardNames[key]}`);
      
      try {
        // Check camera permission
        if (!camPermission?.granted) {
          console.log('Requesting camera permission...');
          const result = await requestCamPermission();
          if (!result?.granted) {
            throw new Error('Camera permission denied');
          }
        }
        
        // Check location permission
        const locPermitted = await requestLocationPermissionIfNeeded();
        if (!locPermitted) {
          throw new Error('Location permission denied');
        }
        
        // Reset camera ready state
        setCameraReady(false);
        
        // Small delay to ensure all state updates are processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Final validation - check component is still mounted
        if (!componentMounted.current) {
          console.log('Component unmounted during camera setup, aborting');
          setCameraInitializing(false);
          setCameraLoading(false);
          setCameraKey(null);
          return;
        }
        
        // Open camera modal
        setCameraVisible(true);
        console.log(`Camera opened successfully for: ${key}`);
        
      } catch (setupError) {
        console.error('Camera setup failed:', setupError);
        
        // Reset states on setup failure
        setCameraVisible(false);
        setCameraReady(false);
        setCameraKey(null);
        setCameraCardName('');
        
        Alert.alert(
          'Camera Setup Error', 
          (setupError instanceof Error ? setupError.message : String(setupError)) || 'Failed to set up camera. Please try again.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('Error in openCameraFor:', error);
      
      // Reset all camera state on any error
      setCameraVisible(false);
      setCameraReady(false);
      setCameraKey(null);
      setCameraCardName('');
      
      Alert.alert('Camera Error', 'Failed to open camera. Please try again.');
    } finally {
      // Always reset loading and initializing states
      setCameraLoading(false);
      setCameraInitializing(false);
    }
  };

  // Step 1: Skip overlay drawing here. Overlay is added via off-screen compositing in Step 2.

  const handleCapture = async () => {
    // Store current camera key at the start to prevent race conditions
    const captureKey = cameraKey;
    const captureTime = Date.now();
    
    console.log(`Starting capture process for: ${captureKey} at ${captureTime}`);
    
    // Critical: Check if component is still mounted
    if (!componentMounted.current) {
      console.error('Component not mounted, aborting capture');
      return;
    }
    
    // Enhanced validation with recovery mechanisms
    if (!cameraViewRef.current) {
      console.error('Camera reference is null');
      Alert.alert('Camera Error', 'Camera is not ready. Please close and reopen the camera.');
      return;
    }
    
    if (!captureKey) {
      console.error('Camera key not available - rapid click detected');
      Alert.alert('Please Wait', 'Camera is still initializing. Please wait a moment and try again.');
      return;
    }

    if (!cameraReady) {
      console.error('Camera not ready yet');
      Alert.alert('Camera Not Ready', 'Please wait for the camera to initialize completely.');
      return;
    }

    // Prevent double capture with more specific checking
    if (cameraLoading) {
      console.log('Capture already in progress, ignoring');
      return;
    }

    try {
      setCameraLoading(true);
      console.log(`Starting image capture for: ${captureKey}`);

      // Validate camera reference again
      if (!cameraViewRef.current) {
        throw new Error('Camera reference lost during capture');
      }

      // Step 1: Take picture with error handling and timeout
      let photo;
      try {
        console.log('Taking picture with camera...');
        
        // Add a timeout to prevent hanging
        const capturePromise = cameraViewRef.current.takePictureAsync({
          quality: 0.7,
          skipProcessing: true,
        });
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Camera capture timeout')), 5000); // Reduced to 5 seconds
        });
        
        photo = await Promise.race([capturePromise, timeoutPromise]) as any;
        console.log('Picture taken successfully:', (photo as any).uri);
        
      } catch (photoError: any) {
        console.error('Camera capture failed:', photoError);
        if (photoError?.message?.includes('timeout')) {
          throw new Error('Camera capture timed out. Please try again.');
        }
        throw new Error('Failed to capture image. Please close and reopen the camera.');
      }

      // Step 2: File operations with enhanced error handling
      const fileName = `survey_${surveyIdState || 'new'}_${captureKey}_${captureTime}.jpg`;
      const destUri = `${FileSystem.documentDirectory}${fileName}`;
      let finalUri = (photo as any).uri;

      try {
        console.log('Copying image file...');
        await FileSystem.copyAsync({
          from: (photo as any).uri,
          to: destUri,
        });
        finalUri = destUri;
        console.log('File copied successfully to:', destUri);
        
        // Clean up original temp file
        try {
          await FileSystem.deleteAsync((photo as any).uri, { idempotent: true });
        } catch (cleanupErr) {
          console.warn('Temp file cleanup failed:', cleanupErr);
        }
        
      } catch (copyErr) {
        console.error('File copy failed, using temp URI', copyErr);
        finalUri = (photo as any).uri;
      }

      // Step 3: Update UI immediately using the stored camera key
      console.log(`Updating UI with captured image for: ${captureKey}`);
      safeSetState(() => setPhotos((prev) => ({ ...prev, [captureKey]: finalUri })), 'setPhotos_capture');

      // Step 4: Close camera immediately to prevent state issues
      console.log('Closing camera after successful capture...');
      
      // Verify component is still mounted before closing
      if (componentMounted.current) {
        // Batch all camera state resets together using safeSetState
        safeSetState(() => {
          setCameraVisible(false);
          setCameraKey(null);
          setCameraCardName('');
          setCameraReady(false);
          setCameraLoading(false);
          setCameraInitializing(false);
        }, 'closeCamera_afterCapture');
        
        // Clear idle timer
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
          idleTimerRef.current = null;
        }
        
        // Clear camera ref
        if (cameraViewRef.current) {
          cameraViewRef.current = null;
        }
      }

      // Step 5: Background storage (non-blocking with safety)
      const operationId = `capture_${captureTime}_${Math.random().toString(36).substr(2, 5)}`;
      const cleanupOperation = trackOperation(operationId);
      
      // Increased timeout to ensure UI has fully updated
      setTimeout(async () => {
        try {
          // CRITICAL: Check mount status FIRST
          if (!componentMounted.current) {
            console.log('[Camera] Component unmounted, skipping background storage');
            cleanupOperation();
            return;
          }
          
          // Double-check operation is still active
          if (!activeOperations.current.has(operationId)) {
            console.log('[Camera] Operation cancelled, skipping background storage');
            return;
          }
          
          if (!surveyIdState) {
            const tempSurveyId = `temp_survey_${captureTime}_${Math.random().toString(36).substr(2, 9)}`;
            safeSetState(() => setSurveyIdState(tempSurveyId), 'setSurveyIdState_background');
            console.log('[Camera] Generated temporary survey ID for storage:', tempSurveyId);
          }
          
          const finalSurveyId = surveyIdState || `temp_survey_${captureTime}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Triple-check before proceeding
          if (!componentMounted.current || !activeOperations.current.has(operationId)) {
            console.log('[Camera] Aborted - component unmounted or operation cancelled');
            return;
          }
          
          // Try to store in database (background, non-blocking)
          const storedUri = await storeImageForSurvey(
            finalSurveyId,
            finalUri,
            String(captureKey)
          );
          
          // Update UI with stored URI if successful and component still mounted
          if (componentMounted.current && activeOperations.current.has(operationId)) {
            safeSetState(() => setPhotos((prev) => ({ ...prev, [captureKey]: storedUri })), 'setPhotos_backgroundStorage');
            console.log('Background storage completed:', storedUri);
          }
          
        } catch (bgStorageError) {
          console.error('Background storage failed (non-critical):', bgStorageError);
          // Image is already in UI, so this failure is not critical
        } finally {
          cleanupOperation();
        }
      }, 500); // Increased delay to ensure UI updates complete

      console.log(`Image capture completed successfully for: ${captureKey}`);

    } catch (e) {
      console.error('Image capture error:', e);
      
      // Ensure camera is closed even on error using safeSetState
      safeSetState(() => {
        setCameraVisible(false);
        setCameraKey(null);
        setCameraReady(false);
      }, 'closeCamera_onError');
      
      const errorMessage = e instanceof Error ? e.message : 'Failed to capture image. Please try again.';
      Alert.alert('Capture Error', errorMessage);
    } finally {
      safeSetState(() => setCameraLoading(false), 'setCameraLoading_finally');
      
      // Safety cleanup with shorter timeout
      setTimeout(() => {
        if (cameraLoading) {
          console.warn('Force clearing camera loading state');
          safeSetState(() => setCameraLoading(false), 'setCameraLoading_safety');
        }
      }, 1000); // Reduced timeout
    }
  };

  // Integer IDs for SurveyTypeMaster (replace with real IDs from your DB/seed)
  const SURVEY_TYPE_IDS = {
    Residential: 1,
    'Non-Residential': 2,
    Mixed: 3,
  };

  const [formData, setFormData] = useState<FormData>({
    // Default initial state
    ulbId: assignment?.ulb ? assignment.ulb.ulbId : '',
    zoneId: assignment?.zone ? assignment.zone.zoneId : '',
    wardId: assignment?.ward ? assignment.ward.wardId : '',
    mohallaId:
      assignment?.mohallas && assignment.mohallas.length > 0
        ? assignment.mohallas[0].mohallaId
        : '',
    parcelId: '',
    mapId: '',
    gisId: '',
    subGisId: '',
    responseTypeId: 0,
    oldHouseNumber: '',
    electricityConsumerName: '',
    waterSewerageConnectionNumber: '',
    respondentName: '',
    respondentStatusId: 0,
    ownerName: '',
    fatherHusbandName: '',
    mobileNumber: '',
    aadharNumber: '',
    propertyLatitude: '',
    propertyLongitude: '',
    assessmentYear: new Date().getFullYear().toString(),
    propertyTypeId: 0,
    buildingName: '',
    roadTypeId: 0,
    constructionYear: '',
    constructionTypeId: 0,
    addressRoadName: '',
    locality: '',
    pinCode: '',
    landmark: '',
    fourWayEast: '',
    fourWayWest: '',
    fourWayNorth: '',
    fourWaySouth: '',
    newWardNumber: '',
    waterSourceId: 0,
    rainWaterHarvestingSystem: 'NO',
    plantation: 'NO',
    parking: 'NO',
    pollution: 'NO',
    pollutionMeasurementTaken: '',
    waterSupplyWithin200Meters: 'NO',
    sewerageLineWithin100Meters: 'NO',
    disposalTypeId: 0,
    totalPlotArea: '',
    builtupAreaOfGroundFloor: '',
    remarks: '',
  });

  useEffect(() => {
    const loadData = async () => {
      const operationId = `load_data_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const cleanupOperation = trackOperation(operationId);
      
      try {
        safeSetState(() => setLoading(true), 'setLoading');
        
        // Check if component is still mounted
        if (!componentMounted.current || !activeOperations.current.has(operationId)) {
          console.log('Data loading cancelled - component unmounted');
          return;
        }
        
        const data = await getMasterData();
        
        // Check again after async operation
        if (!componentMounted.current || !activeOperations.current.has(operationId)) {
          console.log('Data loading cancelled after getMasterData');
          return;
        }
        
        safeSetState(() => setMasterData(data), 'setMasterData');
        
        let surveyToLoad = null;
        let loadedSurveyId = surveyId;
        
        if (editMode && surveyId) {
          // Check if still active before proceeding
          if (!componentMounted.current || !activeOperations.current.has(operationId)) {
            console.log('Survey loading cancelled before getLocalSurvey');
            return;
          }
          
          const localSurvey = await getLocalSurvey(surveyId);
          
          // Check again after async operation
          if (!componentMounted.current || !activeOperations.current.has(operationId)) {
            console.log('Survey loading cancelled after getLocalSurvey');
            return;
          }
          
          if (localSurvey && !Array.isArray(localSurvey)) {
            surveyToLoad = localSurvey.data;
            loadedSurveyId = localSurvey.id;
          }
        } else if (editMode && initialSurveyData) {
          surveyToLoad = initialSurveyData;
        }
        
        if (surveyToLoad && componentMounted.current && activeOperations.current.has(operationId)) {
          const flatData = {
            ...surveyToLoad.surveyDetails,
            ...surveyToLoad.propertyDetails,
            ...surveyToLoad.ownerDetails,
            ...surveyToLoad.locationDetails,
            ...surveyToLoad.otherDetails,
          };
          safeSetState(() => setFormData((prev) => ({ ...prev, ...flatData })), 'setFormData');
        }
        
        // Always set surveyId state for use in save if component is still mounted
        if (loadedSurveyId && componentMounted.current && activeOperations.current.has(operationId)) {
          safeSetState(() => setSurveyIdState(loadedSurveyId), 'setSurveyIdState');
        }
        
      } catch (error) {
        console.error('Failed to load data:', error);
        if (componentMounted.current && activeOperations.current.has(operationId)) {
          Alert.alert('Error', 'Could not load survey data. Please try again later.');
        }
      } finally {
        if (componentMounted.current && activeOperations.current.has(operationId)) {
          safeSetState(() => setLoading(false), 'setLoading');
        }
        cleanupOperation();
      }
    };
    
    loadData();
  }, [editMode, surveyId, initialSurveyData]);

  useEffect(() => {
    if (assignment && componentMounted.current) {
      safeSetState(() => setFormData((prev) => ({
        ...prev,
        ulbId: assignment.ulb ? assignment.ulb.ulbId : '',
        zoneId: assignment.zone ? assignment.zone.zoneId : '',
        wardId: assignment.ward ? assignment.ward.wardId : '',
        mohallaId:
          assignment.mohallas && assignment.mohallas.length > 0
            ? assignment.mohallas[0].mohallaId
            : '',
      })), 'setFormData from assignment');
    }
  }, [assignment]);

  // Update refs when state changes (MUST be separate useEffects at top level)
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const createDropdownOptions = (items: any[], labelKey: string, valueKey: string) => {
    if (!items) return [{ label: 'No selection', value: 0 }];
    return items.map((item) => ({
      label: item[labelKey],
      value: item[valueKey],
    }));
  };

  // Transform master data to dropdown options format
  // Note: These options are available but not currently used in the form
  // const responseTypeOptions = masterData?.responseTypes?.map((item: any) => ({
  //   label: item.responseTypeName,
  //   value: item.responseTypeId,
  // })) || [];

  // const respondentStatusOptions = masterData?.respondentStatuses?.map((item: any) => ({
  //   label: item.respondentStatusName,
  //   value: item.respondentStatusId,
  // })) || [];

  // const propertyTypeOptions = masterData?.propertyTypes?.map((item: any) => ({
  //   label: item.propertyTypeName,
  //   value: item.propertyTypeId,
  // })) || [];

  // const roadTypeOptions = masterData?.roadTypes?.map((item: any) => ({
  //   label: item.roadTypeName,
  //   value: item.roadTypeId,
  // })) || [];

  // const constructionTypeOptions = masterData?.constructionTypes?.map((item: any) => ({
  //   label: item.constructionTypeName,
  //   value: item.constructionTypeId,
  // })) || [];

  // const waterSourceOptions = masterData?.waterSources?.map((item: any) => ({
  //   label: item.waterSourceName,
  //   value: item.waterSourceId,
  // })) || [];

  // const disposalTypeOptions = masterData?.disposalTypes?.map((item: any) => ({
  //   label: item.disposalTypeName,
  //   value: item.disposalTypeId,
  // })) || [];

  const handleInputChange = (name: keyof FormData, value: string | number) => {
    // Direct state update - no debouncing for text inputs (causes keyboard issues)
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const requiredFields: { key: keyof FormData; label: string }[] = [
      { key: 'mohallaId', label: 'Mohalla' },
      { key: 'mapId', label: 'Map ID' },
      { key: 'gisId', label: 'GIS ID' },
      { key: 'responseTypeId', label: 'Response Type' },
      { key: 'respondentName', label: 'Respondent Name' },
      { key: 'respondentStatusId', label: 'Respondent Status' },
      { key: 'ownerName', label: 'Owner Name' },
      { key: 'fatherHusbandName', label: 'Father/Husband Name' },
      { key: 'propertyTypeId', label: 'Property Type' },
      { key: 'roadTypeId', label: 'Road Type' },
      { key: 'constructionYear', label: 'Construction Year' },
      { key: 'constructionTypeId', label: 'Construction Type' },
      { key: 'addressRoadName', label: 'Address/Road Name' },
      { key: 'pinCode', label: 'PIN Code' },
      { key: 'waterSourceId', label: 'Source of Water' },
      { key: 'rainWaterHarvestingSystem', label: 'Rain Water Harvesting' },
      { key: 'waterSupplyWithin200Meters', label: 'Water Supply within 200m' },
      { key: 'sewerageLineWithin100Meters', label: 'Sewerage Line within 100m' },
      { key: 'disposalTypeId', label: 'Disposal Type' },
      { key: 'totalPlotArea', label: 'Total Plot Area' },
      { key: 'builtupAreaOfGroundFloor', label: 'Built-up Area of Ground Floor' },
      { key: 'newWardNumber', label: 'New Ward Number' },
    ];

    if (surveyTypeKey !== 'Residential') {
      requiredFields.push(
        { key: 'plantation', label: 'Plantation Available' },
        { key: 'parking', label: 'Parking Available' },
        { key: 'pollution', label: 'Pollution Created' }
      );
    }

    if (surveyTypeKey === 'Non-Residential') {
      // For Non-Residential, propertyTypeId is OPTIONAL (not required)
      // Remove it from required fields list
      const idx = requiredFields.findIndex((f) => f.key === 'propertyTypeId');
      if (idx !== -1) requiredFields.splice(idx, 1);
    }

    const firstMissingField = requiredFields.find((field) => {
      const value = formData[field.key];
      // For propertyTypeId, treat 0 as missing for Residential/Mixed
      if (
        field.key === 'propertyTypeId' &&
        (surveyTypeKey === 'Residential' || surveyTypeKey === 'Mixed')
      ) {
        return value === 0 || value === undefined || value === null;
      }
      if (typeof value === 'number') {
        return value === 0;
      } else {
        return !value;
      }
    });

    if (firstMissingField) {
      Alert.alert('Validation Error', `${firstMissingField.label} is required.`);
      // Scroll to the field
      if (fieldRefs.current[firstMissingField.key]) {
        fieldRefs.current[firstMissingField.key]?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y, animated: true });
          },
          () => {}
        );
      }
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    // Implement save debouncing to prevent rapid clicks
    const currentTime = Date.now();
    if (currentTime - lastClickTime < SAVE_DEBOUNCE_MS) {
      console.log(`Rapid save click detected, ignoring (${currentTime - lastClickTime}ms since last save)`);
      return;
    }
    
    // Prevent multiple simultaneous save operations
    if (isSaving) {
      console.log('Save already in progress, ignoring duplicate request');
      return;
    }
    
    // Set saving state immediately
    setIsSaving(true);
    setLastClickTime(currentTime);
    
    // Track this save operation
    const operationId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const cleanupOperation = trackOperation(operationId);
    
    try {
      if (!componentMounted.current) {
        console.log('Save cancelled - component unmounted');
        return;
      }
      
      if (!validateForm()) {
        setIsSaving(false);
        return;
      }
      
      const toNumber = (v: any) =>
        v === '' || v === null || v === undefined ? undefined : Number(v);
      const surveyTypeId = SURVEY_TYPE_IDS[surveyTypeKey];
      
      const surveyDetails = {
        ulbId: formData.ulbId,
        zoneId: formData.zoneId,
        wardId: formData.wardId,
        mohallaId: formData.mohallaId,
        surveyTypeId, // required by backend
        parcelId: toNumber(formData.parcelId),
        mapId: toNumber(formData.mapId),
        gisId: formData.gisId,
        subGisId: formData.subGisId,
        entryDate: new Date().toISOString(),
      };
      
      const propertyDetails = {
        responseTypeId: formData.responseTypeId,
        oldHouseNumber: formData.oldHouseNumber,
        electricityConsumerName: formData.electricityConsumerName,
        waterSewerageConnectionNumber: formData.waterSewerageConnectionNumber,
        respondentName: formData.respondentName,
        respondentStatusId: formData.respondentStatusId,
      };
      
      const ownerDetails = {
        ownerName: formData.ownerName,
        fatherHusbandName: formData.fatherHusbandName,
        mobileNumber: formData.mobileNumber,
        aadharNumber:
          formData.aadharNumber && formData.aadharNumber.length === 12
            ? formData.aadharNumber
            : undefined,
      };
      
      const locationDetails = {
        propertyLatitude: toNumber(formData.propertyLatitude),
        propertyLongitude: toNumber(formData.propertyLongitude),
        assessmentYear: formData.assessmentYear,
        ...(surveyTypeKey === 'Residential' || surveyTypeKey === 'Mixed'
          ? { propertyTypeId: formData.propertyTypeId }
          : {}),
        buildingName: formData.buildingName,
        roadTypeId: formData.roadTypeId,
        constructionYear: formData.constructionYear,
        constructionTypeId: formData.constructionTypeId,
        addressRoadName: formData.addressRoadName,
        locality: formData.locality,
        pinCode: toNumber(formData.pinCode),
        landmark: formData.landmark,
        fourWayEast: formData.fourWayEast,
        fourWayWest: formData.fourWayWest,
        fourWayNorth: formData.fourWayNorth,
        fourWaySouth: formData.fourWaySouth,
        newWardNumber: formData.newWardNumber,
      };
      
      const otherDetails = {
        waterSourceId: formData.waterSourceId,
        rainWaterHarvestingSystem: formData.rainWaterHarvestingSystem,
        plantation: formData.plantation,
        parking: formData.parking,
        pollution: formData.pollution,
        pollutionMeasurementTaken: formData.pollutionMeasurementTaken,
        waterSupplyWithin200Meters: formData.waterSupplyWithin200Meters,
        sewerageLineWithin100Meters: formData.sewerageLineWithin100Meters,
        disposalTypeId: formData.disposalTypeId,
        totalPlotArea: toNumber(formData.totalPlotArea),
        builtupAreaOfGroundFloor: toNumber(formData.builtupAreaOfGroundFloor),
        remarks: formData.remarks,
      };
      
      let idToUse = surveyIdState || surveyId || (editMode && route.params?.surveyId) || undefined;
      let surveyToSave;
      
      // Check if operation was cancelled before proceeding with storage
      if (!activeOperations.current.has(operationId) || !componentMounted.current) {
        console.log('Save operation cancelled');
        return;
      }
      
      if (editMode && idToUse) {
        // Update existing survey with safe async operations
        try {
          const allSurveys = await getUnsyncedSurveys();
          
          // Check again after async operation
          if (!activeOperations.current.has(operationId) || !componentMounted.current) {
            console.log('Save cancelled during storage lookup');
            return;
          }
          
          const idx = allSurveys.findIndex((s: any) => s.id === idToUse);
          if (idx > -1) {
            surveyToSave = {
              ...allSurveys[idx],
              data: {
                surveyDetails,
                propertyDetails,
                ownerDetails,
                locationDetails,
                otherDetails,
                // preserve any floor details or extra data
                ...allSurveys[idx].data,
              },
              synced: false,
              status: 'incomplete',
            };
            
            // Final check before save
            if (!activeOperations.current.has(operationId) || !componentMounted.current) {
              console.log('Save cancelled before final storage');
              return;
            }
            
            await saveSurveyLocally(surveyToSave);
            
            if (componentMounted.current) {
              Alert.alert('Updated', 'Survey updated locally.');
            }
          } else {
            // fallback: treat as new
            idToUse = `survey_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
            surveyToSave = {
              id: idToUse,
              data: {
                surveyDetails,
                propertyDetails,
                ownerDetails,
                locationDetails,
                otherDetails,
              },
              synced: false,
              createdAt: new Date().toISOString(),
              surveyType: surveyTypeKey,
              status: 'incomplete',
            };
            
            if (!activeOperations.current.has(operationId) || !componentMounted.current) {
              console.log('Save cancelled before fallback storage');
              return;
            }
            
            await saveSurveyLocally(surveyToSave);
            
            if (componentMounted.current) {
              Alert.alert('Saved', 'Survey saved locally.');
              
              // Mark survey as saved and clear draft
              if (idToUse) {
                await updateSurveyStatus(idToUse, true);
                await clearUnsavedDraft();
                console.log('[SurveyForm] Survey marked as saved, draft cleared');
              }
            }
          }
        } catch (storageError) {
          console.error('Storage error during save:', storageError);
          if (componentMounted.current) {
            Alert.alert('Error', 'Failed to save survey. Please try again.');
          }
          return;
        }
      } else {
        // Create new survey
        idToUse = `survey_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        surveyToSave = {
          id: idToUse,
          data: {
            surveyDetails,
            propertyDetails,
            ownerDetails,
            locationDetails,
            otherDetails,
          },
          synced: false,
          createdAt: new Date().toISOString(),
          surveyType: surveyTypeKey,
          status: 'incomplete',
        };
        
        if (!activeOperations.current.has(operationId) || !componentMounted.current) {
          console.log('Save cancelled before new survey storage');
          return;
        }
        
        try {
          await saveSurveyLocally(surveyToSave);
          
          if (componentMounted.current) {
            Alert.alert('Saved', 'Survey saved locally.');
            
            // Mark survey as saved and clear draft
            if (idToUse) {
              await updateSurveyStatus(idToUse, true);
              await clearUnsavedDraft();
              console.log('[SurveyForm] Survey marked as saved, draft cleared');
            }
          }
        } catch (storageError) {
          console.error('Storage error during new survey save:', storageError);
          if (componentMounted.current) {
            Alert.alert('Error', 'Failed to save survey. Please try again.');
          }
          return;
        }
      }
      
      // Store images for the final survey ID (images are already in permanent storage)
      // No additional action needed as images were stored during capture
      console.log('Images already stored in permanent storage for survey:', idToUse);
      
      if (componentMounted.current) {
        safeSetState(() => setSurveyIdState(idToUse), 'setSurveyIdState');
      }
      
      const selectedMohalla = assignment?.mohallas?.find(
        (m: any) => m.mohallaId === formData.mohallaId
      );
      const mohallaName = selectedMohalla ? selectedMohalla.mohallaName : '';
      
      // Final check before navigation
      if (!activeOperations.current.has(operationId) || !componentMounted.current) {
        console.log('Save cancelled before navigation');
        return;
      }
      
      // Safe navigation with error handling
      try {
        navigationBlocked.current = false; // Allow navigation after successful save
        (navigation as any).navigate('SurveyIntermediate', {
          surveyId: idToUse,
          surveyType: surveyTypeKey,
          mohallaName,
        });
      } catch (navError) {
        console.error('Navigation error:', navError);
        if (componentMounted.current) {
          Alert.alert('Navigation Error', 'Unable to navigate to next screen. Survey has been saved.');
        }
      }
    } catch (error) {
      console.error('Save operation error:', error);
      if (componentMounted.current) {
        Alert.alert('Error', 'Failed to save survey locally.');
      }
    } finally {
      // Reset saving state
      if (componentMounted.current) {
        setIsSaving(false);
      }
      cleanupOperation();
    }
  };

  const handleBackConfirm = () => {
    showExitConfirmation();
  };

  // For yes/no dropdowns, use:
  const yesNoOptions = [
    { label: 'Yes', value: 'YES' },
    { label: 'No', value: 'NO' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Wrap main render in try-catch for crash prevention
  try {

  return (
    <SurveyFormErrorBoundary onError={(error) => console.error('SurveyForm crashed:', error)} navigation={navigation}>
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={handleBackConfirm} style={styles.topBackButton}>
          <Text style={styles.topBackArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>{`New ${surveyType} Survey`}</Text>
      </View>
      <ScrollView ref={scrollViewRef}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Survey Details</Text>
          <FormInput label="ULB" value={assignment?.ulb?.ulbName || ''} editable={false} />
          <FormInput label="Zone" value={assignment?.zone?.zoneName || ''} editable={false} />
          <FormInput label="Ward" value={assignment?.ward?.wardName || ''} editable={false} />
          <FormDropdown
            label="Mohalla"
            required
            items={
              assignment?.mohallas?.map((m: any) => ({
                label: m.mohallaName,
                value: m.mohallaId,
              })) || []
            }
            onValueChange={(value: string | number) => handleInputChange('mohallaId', value)}
            value={formData.mohallaId}
          />
          <FormInput
            label="Parcel ID"
            onChangeText={(value: string) => handleInputChange('parcelId', value)}
            value={String(formData.parcelId ?? '')}
            keyboardType="numeric"
          />
          <FormInput
            label="Map ID"
            required
            onChangeText={(value: string) => handleInputChange('mapId', value)}
            value={String(formData.mapId ?? '')}
            keyboardType="numeric"
          />
          <FormInput
            label="GIS ID"
            required
            onChangeText={(value: string) => handleInputChange('gisId', value)}
            value={formData.gisId}
          />
          <FormInput
            label="Sub-GIS ID"
            onChangeText={(value: string) => handleInputChange('subGisId', value)}
            value={String(formData.subGisId ?? '')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Property Details</Text>
          <FormDropdown
            label="Response Type"
            required
            items={createDropdownOptions(
              masterData?.responseTypes,
              'responseTypeName',
              'responseTypeId'
            )}
            onValueChange={(value) => handleInputChange('responseTypeId', value)}
            value={formData.responseTypeId}
          />
          <FormInput
            label="Old House No."
            onChangeText={(value) => handleInputChange('oldHouseNumber', value)}
            value={formData.oldHouseNumber}
          />
          <FormInput
            label="Electricity Consumer Name"
            onChangeText={(value) => handleInputChange('electricityConsumerName', value)}
            value={String(formData.electricityConsumerName ?? '')}
          />
          <FormInput
            label="Water Sewerage Connection No."
            onChangeText={(value) => handleInputChange('waterSewerageConnectionNumber', value)}
            value={String(formData.waterSewerageConnectionNumber ?? '')}
          />
          <FormInput
            label="Respondent Name"
            required
            onChangeText={(value) => handleInputChange('respondentName', value)}
            value={formData.respondentName}
          />
          <FormDropdown
            label="Respondent Status"
            required
            items={createDropdownOptions(
              masterData?.respondentStatuses,
              'respondentStatusName',
              'respondentStatusId'
            )}
            onValueChange={(value) => handleInputChange('respondentStatusId', value)}
            value={formData.respondentStatusId}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Owner Details</Text>
          <FormInput
            label="Owner Name"
            required
            onChangeText={(value) => handleInputChange('ownerName', value)}
            value={formData.ownerName}
          />
          <FormInput
            label="Father/Husband Name"
            required
            onChangeText={(value) => handleInputChange('fatherHusbandName', value)}
            value={formData.fatherHusbandName}
          />
          <FormInput
            label="Mobile Number"
            onChangeText={(value) => handleInputChange('mobileNumber', value)}
            value={String(formData.mobileNumber ?? '')}
            keyboardType="phone-pad"
          />
          <FormInput
            label="Aadhar Number"
            onChangeText={(value) => handleInputChange('aadharNumber', value)}
            value={String(formData.aadharNumber ?? '')}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>4. Location Details</Text>
            <TouchableOpacity
              onPress={handleFetchLocation}
              accessibilityLabel="Fetch current location"
              style={styles.iconButton}>
              {locLoading ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Feather name="map-pin" size={20} color="#3B82F6" />
              )}
            </TouchableOpacity>
          </View>
          <FormInput
            label="Latitude"
            onChangeText={(value: string) => handleInputChange('propertyLatitude', value)}
            value={String(formData.propertyLatitude ?? '')}
            keyboardType="numeric"
          />
          <FormInput
            label="Longitude"
            onChangeText={(value: string) => handleInputChange('propertyLongitude', value)}
            value={String(formData.propertyLongitude ?? '')}
            keyboardType="numeric"
          />
          <FormInput label="Assessment Year" value={formData.assessmentYear} editable={false} />
          {/* Property Type: For all survey types, but required only for Residential/Mixed */}
          <FormDropdown
            label={`Property Type`}
            required={surveyTypeKey !== 'Non-Residential'}
            items={
              surveyTypeKey === 'Non-Residential'
                ? // Only show PLOT/LAND option for Non-Residential
                  createDropdownOptions(
                    masterData?.propertyTypes?.filter((pt: any) => pt.propertyTypeId === 3),
                    'propertyTypeName',
                    'propertyTypeId'
                  )
                : // Show all property types for Residential and Mixed
                  createDropdownOptions(
                    masterData?.propertyTypes,
                    'propertyTypeName',
                    'propertyTypeId'
                  )
            }
            onValueChange={(value) => handleInputChange('propertyTypeId', value)}
            value={formData.propertyTypeId}
          />
          <FormInput
            label="Building Name"
            onChangeText={(value) => handleInputChange('buildingName', value)}
            value={String(formData.buildingName ?? '')}
          />
          <FormDropdown
            label="Road Type"
            required
            items={createDropdownOptions(masterData?.roadTypes, 'roadTypeName', 'roadTypeId')}
            onValueChange={(value) => handleInputChange('roadTypeId', value)}
            value={formData.roadTypeId}
          />
          <FormInput
            label="Construction Year"
            required
            onChangeText={(value) => handleInputChange('constructionYear', value)}
            value={formData.constructionYear}
            keyboardType="numeric"
          />
          <FormDropdown
            label="Construction Type"
            required
            items={createDropdownOptions(
              masterData?.constructionTypes,
              'constructionTypeName',
              'constructionTypeId'
            )}
            onValueChange={(value) => handleInputChange('constructionTypeId', value)}
            value={formData.constructionTypeId}
          />
          <FormInput
            label="Address/Road Name"
            required
            onChangeText={(value: string) => handleInputChange('addressRoadName', value)}
            value={String(formData.addressRoadName ?? '')}
          />
          <FormInput
            label="Locality"
            onChangeText={(value) => handleInputChange('locality', value)}
            value={formData.locality}
          />
          <FormInput
            label="PIN Code"
            required
            onChangeText={(value) => handleInputChange('pinCode', value)}
            value={String(formData.pinCode ?? '')}
            keyboardType="numeric"
          />
          <FormInput
            label="Landmark"
            onChangeText={(value) => handleInputChange('landmark', value)}
            value={String(formData.landmark ?? '')}
          />
          <FormInput
            label="Four Way-East"
            onChangeText={(value: string) => handleInputChange('fourWayEast', value)}
            value={String(formData.fourWayEast ?? '')}
          />
          <FormInput
            label="Four Way-West"
            onChangeText={(value: string) => handleInputChange('fourWayWest', value)}
            value={String(formData.fourWayWest ?? '')}
          />
          <FormInput
            label="Four Way-North"
            onChangeText={(value: string) => handleInputChange('fourWayNorth', value)}
            value={String(formData.fourWayNorth ?? '')}
          />
          <FormInput
            label="Four Way-South"
            onChangeText={(value: string) => handleInputChange('fourWaySouth', value)}
            value={String(formData.fourWaySouth ?? '')}
          />
          <FormInput
            label="New Ward Number"
            required
            onChangeText={(value: string) => handleInputChange('newWardNumber', value)}
            value={formData.newWardNumber}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Other Details</Text>
          <FormDropdown
            label="Source of Water"
            required
            items={createDropdownOptions(
              masterData?.waterSources,
              'waterSourceName',
              'waterSourceId'
            )}
            onValueChange={(value: string | number) => handleInputChange('waterSourceId', value)}
            value={formData.waterSourceId}
          />
          <FormDropdown
            label="Rain Water Harvesting"
            required
            items={yesNoOptions}
            onValueChange={(value: string | number) =>
              handleInputChange('rainWaterHarvestingSystem', value)
            }
            value={formData.rainWaterHarvestingSystem}
          />

          {surveyType !== 'Residential' && (
            <>
              <FormDropdown
                label="Plantation Available"
                required
                items={yesNoOptions}
                onValueChange={(value: string | number) => handleInputChange('plantation', value)}
                value={formData.plantation}
              />
              <FormDropdown
                label="Parking Available"
                required
                items={yesNoOptions}
                onValueChange={(value: string | number) => handleInputChange('parking', value)}
                value={formData.parking}
              />
              <FormDropdown
                label="Pollution Created"
                required
                items={yesNoOptions}
                onValueChange={(value: string | number) => handleInputChange('pollution', value)}
                value={formData.pollution}
              />
              <FormInput
                label="Pollution Measurement"
                onChangeText={(value: string) =>
                  handleInputChange('pollutionMeasurementTaken', value)
                }
                value={formData.pollutionMeasurementTaken}
              />
            </>
          )}

          <FormDropdown
            label="Water Supply within 200m"
            required
            items={yesNoOptions}
            onValueChange={(value: string | number) =>
              handleInputChange('waterSupplyWithin200Meters', value)
            }
            value={formData.waterSupplyWithin200Meters}
          />
          <FormDropdown
            label="Sewerage Line within 100m"
            required
            items={yesNoOptions}
            onValueChange={(value: string | number) =>
              handleInputChange('sewerageLineWithin100Meters', value)
            }
            value={formData.sewerageLineWithin100Meters}
          />
          <FormDropdown
            label="Disposal Type"
            required
            items={createDropdownOptions(
              masterData?.disposalTypes,
              'disposalTypeName',
              'disposalTypeId'
            )}
            onValueChange={(value: string | number) => handleInputChange('disposalTypeId', value)}
            value={formData.disposalTypeId}
          />
          <FormInput
            label="Total Plot Area"
            required
            onChangeText={(value) => handleInputChange('totalPlotArea', value)}
            value={String(formData.totalPlotArea ?? '')}
            keyboardType="numeric"
          />
          <FormInput
            label="Built-up Area of Ground Floor"
            required
            onChangeText={(value) => handleInputChange('builtupAreaOfGroundFloor', value)}
            value={String(formData.builtupAreaOfGroundFloor ?? '')}
            keyboardType="numeric"
          />
          <FormInput
            label="Remarks"
            onChangeText={(value: string) => handleInputChange('remarks', value)}
            value={String(formData.remarks ?? '')}
            multiline
          />
          <View style={styles.photosHeaderRow}>
            <Text style={styles.sectionTitle}>Photos</Text>
          </View>
          <View style={styles.photosGrid}>
            {/* Building (was Front) */}
            <View style={styles.photoCard}>
              {photos.front ? (
                <>
                  <RNImage source={{ uri: photos.front }} style={styles.photoPreview} />
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => {
                        setViewerUri(photos.front);
                        setViewerCardName(photoCardNames.front);
                        setViewerVisible(true);
                      }}>
                      <Text style={styles.cardActionText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => openCameraFor('front')}>
                      <Text style={styles.cardActionText}>Retake</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.photoCardTouch}
                  onPress={() => openCameraFor('front')}>
                  <Text style={styles.photoLabel}>Building</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Khasra No. */}
            <View style={styles.photoCard}>
              {photos.khasra ? (
                <>
                  <RNImage source={{ uri: photos.khasra }} style={styles.photoPreview} />
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => {
                        setViewerUri(photos.khasra);
                        setViewerCardName(photoCardNames.khasra);
                        setViewerVisible(true);
                      }}>
                      <Text style={styles.cardActionText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => openCameraFor('khasra')}>
                      <Text style={styles.cardActionText}>Retake</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.photoCardTouch}
                  onPress={() => openCameraFor('khasra')}>
                  <Text style={styles.photoLabel}>Khasra No.</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Left */}
            <View style={styles.photoCard}>
              {photos.left ? (
                <>
                  <RNImage source={{ uri: photos.left }} style={styles.photoPreview} />
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => {
                        setViewerUri(photos.left);
                        setViewerCardName(photoCardNames.left);
                        setViewerVisible(true);
                      }}>
                      <Text style={styles.cardActionText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => openCameraFor('left')}>
                      <Text style={styles.cardActionText}>Retake</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.photoCardTouch}
                  onPress={() => openCameraFor('left')}>
                  <Text style={styles.photoLabel}>Left</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Right */}
            <View style={styles.photoCard}>
              {photos.right ? (
                <>
                  <RNImage source={{ uri: photos.right }} style={styles.photoPreview} />
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => {
                        setViewerUri(photos.right);
                        setViewerCardName(photoCardNames.right);
                        setViewerVisible(true);
                      }}>
                      <Text style={styles.cardActionText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => openCameraFor('right')}>
                      <Text style={styles.cardActionText}>Retake</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.photoCardTouch}
                  onPress={() => openCameraFor('right')}>
                  <Text style={styles.photoLabel}>Right</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Other 1 (optional) */}
            <View style={styles.photoCard}>
              {photos.other1 ? (
                <>
                  <RNImage source={{ uri: photos.other1 }} style={styles.photoPreview} />
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => {
                        setViewerUri(photos.other1);
                        setViewerCardName(photoCardNames.other1);
                        setViewerVisible(true);
                      }}>
                      <Text style={styles.cardActionText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => openCameraFor('other1')}>
                      <Text style={styles.cardActionText}>Retake</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.photoCardTouch}
                  onPress={() => openCameraFor('other1')}>
                  <Text style={styles.photoLabel}>Other</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Other 2 (optional) */}
            <View style={styles.photoCard}>
              {photos.other2 ? (
                <>
                  <RNImage source={{ uri: photos.other2 }} style={styles.photoPreview} />
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => {
                        setViewerUri(photos.other2);
                        setViewerCardName(photoCardNames.other2);
                        setViewerVisible(true);
                      }}>
                      <Text style={styles.cardActionText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => openCameraFor('other2')}>
                      <Text style={styles.cardActionText}>Retake</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.photoCardTouch}
                  onPress={() => openCameraFor('other2')}>
                  <Text style={styles.photoLabel}>Other</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button 
            title={isSaving ? "Saving..." : "Save Survey"} 
            onPress={handleSave} 
            disabled={isSaving}
          />
        </View>
      </ScrollView>

      <Modal
        visible={cameraVisible}
        animationType="slide"
        onRequestClose={() => {
          console.log('Camera modal close requested');
          // Comprehensive cleanup with proper state reset
          setCameraVisible(false);
          setCameraReady(false);
          setCameraKey(null);
          setCameraCardName('');
          setCameraLoading(false);
          setCameraInitializing(false);
          if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
          }
          // Clear camera ref to force reinitialization
          if (cameraViewRef.current) {
            cameraViewRef.current = null;
          }
        }}>
        <SafeAreaView style={styles.cameraContainer} edges={['top', 'left', 'right', 'bottom']}>
          <View style={styles.cameraHeader}>
            <TouchableOpacity onPress={() => {
              console.log('Camera back button pressed');
              // Comprehensive cleanup with proper state reset
              setCameraVisible(false);
              setCameraReady(false);
              setCameraKey(null);
              setCameraCardName('');
              setCameraLoading(false);
              setCameraInitializing(false);
              if (idleTimerRef.current) {
                clearTimeout(idleTimerRef.current);
              }
              // Clear camera ref to force reinitialization
              if (cameraViewRef.current) {
                cameraViewRef.current = null;
              }
            }} style={styles.cameraBackBtn}>
              <Text style={styles.topBackArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.topHeaderTitle}>{cameraCardName}</Text>
          </View>
          <View style={styles.cameraViewWrapper}>
            {camPermission?.granted ? (
              <CameraView 
                style={styles.camera} 
                ref={cameraViewRef} 
                facing="back"
                onCameraReady={() => {
                  console.log('Camera is ready');
                  resetIdleTimer(); // Start idle timer when camera is ready
                  setTimeout(() => {
                    setCameraReady(true);
                  }, 300); // Shorter delay for better UX
                }}
                onMountError={(error) => {
                  console.error('Camera mount error:', error);
                  // Comprehensive cleanup on mount error
                  setCameraVisible(false);
                  setCameraReady(false);
                  setCameraKey(null);
                  setCameraCardName('');
                  setCameraLoading(false);
                  setCameraInitializing(false);
                  if (idleTimerRef.current) {
                    clearTimeout(idleTimerRef.current);
                  }
                  if (cameraViewRef.current) {
                    cameraViewRef.current = null;
                  }
                  Alert.alert(
                    'Camera Error', 
                    'Failed to initialize camera. Please try again.',
                    [{ text: 'OK' }]
                  );
                }}
              />
            ) : (
              <View style={styles.cameraErrorContainer}>
                <Text style={styles.cameraErrorText}>Camera permission required</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={async () => {
                    try {
                      const result = await requestCamPermission();
                      if (result?.granted) {
                        // Refresh camera view
                        setCameraVisible(false);
                        setTimeout(() => setCameraVisible(true), 100);
                      }
                    } catch (error) {
                      console.error('Permission retry error:', error);
                      Alert.alert('Permission Error', 'Failed to request camera permission.');
                    }
                  }}
                >
                  <Text style={styles.retryButtonText}>Grant Permission</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.cameraControls}>
            <TouchableOpacity
              onPress={() => {
                try {
                  resetIdleTimer(); // Reset idle timer on capture
                  handleCapture();
                } catch (error) {
                  console.error('Capture button error:', error);
                  Alert.alert('Camera Error', 'Failed to capture image. Please try again.');
                  setCameraLoading(false);
                }
              }}
              style={styles.captureButton}
              disabled={cameraLoading || !cameraReady}>
              {cameraLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.captureButtonText}>Capture</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
      {/* Image viewer modal */}
      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setViewerVisible(false);
          setViewerUri(null);
          setViewerCardName('');
        }}>
        <View style={styles.viewerBackdrop}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerVisible(false)}>
              <Text style={styles.viewerCloseText}>✕</Text>
            </TouchableOpacity>
            {viewerCardName ? (
              <Text style={styles.viewerTitle}>{viewerCardName}</Text>
            ) : null}
          </View>
          {viewerUri ? <RNImage source={{ uri: viewerUri }} style={styles.viewerImage} /> : null}
        </View>
      </Modal>
      <Toast />
    </SafeAreaView>
    </SurveyFormErrorBoundary>
  );
  } catch (renderError) {
    console.error('SurveyForm render error:', renderError);
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }}>
        <Text style={{ fontSize: 18, color: '#666', textAlign: 'center', margin: 20 }}>
          An error occurred while loading the survey form.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: '#3B82F6', padding: 12, borderRadius: 8 }}
          onPress={() => {
            try {
              (navigation as any).goBack();
            } catch (navErr) {
              console.error('Navigation error in fallback:', navErr);
            }
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
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
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    padding: 16,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 0,
  },
  iconButton: {
    padding: 6,
    marginLeft: 8,
  },
  buttonContainer: {
    padding: 16,
  },
  photosHeaderRow: {
    marginTop: 12,
    marginBottom: 8,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    borderColor: '#E5E7EB',
    borderWidth: 1,
  },
  photoCardTouch: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardActions: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    gap: 6,
  },
  cardActionBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: '90%',
    height: '75%',
    resizeMode: 'contain',
  },
  viewerClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  viewerCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  viewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  viewerTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  cameraHeader: {
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
  },
  cameraBackBtn: {
    position: 'absolute',
    left: 8,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    zIndex: 11,
  },
  cameraViewWrapper: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    padding: 16,
    backgroundColor: 'white',
  },
  captureButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 9999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  captureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
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
  cameraErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 20,
  },
  cameraErrorText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
