import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Animated, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const { getStoredProfile } = useAuth();

  // Map role codes to display names
  const getRoleDisplayName = (role: string): string => {
    const roleMap: { [key: string]: string } = {
      SUPERADMIN: 'Super Admin',
      ADMIN: 'Admin',
      SUPERVISOR: 'Supervisor',
      SURVEYOR: 'Surveyor',
    };
    return roleMap[role] || role;
  };

  // Helper to format date as DD/MM/YYYY
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Clear assignment cache and force fresh fetch
  const handleClearAssignmentCache = async () => {
    Alert.alert(
      'Clear Assignment Cache',
      'This will clear your cached assignment data and force a fresh sync from the server. Your login session will remain intact.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('primaryAssignment');
              Toast.show({
                type: 'success',
                text1: 'Cache Cleared',
                text2: 'Assignment cache has been cleared. Restart the app to fetch fresh data.',
              });
            } catch (error) {
              console.error('Failed to clear cache:', error);
              Toast.show({
                type: 'error',
                text1: 'Clear Failed',
                text2: 'Failed to clear assignment cache. Please try again.',
              });
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getStoredProfile();
        if (!data) {
          navigation.replace('LoginScreen');
          return;
        }
        setProfile(data);
      } catch (err) {
        console.error(err);
        Toast.show({ type: 'error', text1: 'Failed to load profile' });
        navigation.replace('LoginScreen');
      } finally {
        setLoading(false);
      }
    })();
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [animatedValue, navigation, getStoredProfile]);

  if (loading) {
    return (
      <SafeAreaView
        edges={['left', 'right', 'bottom']}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme === 'dark' ? '#111827' : '#ffffff' }}>
        <ActivityIndicator
          size="large"
          color={theme === 'dark' ? '#e5e7eb' : '#2563eb'}
          accessibilityLabel="Loading profile"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: theme === 'dark' ? '#111827' : '#ffffff' }}>
      <Animated.View
        style={{
          flex: 1,
          padding: 16,
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}>
        <Text style={{ marginBottom: 16, fontSize: 24, fontWeight: 'bold', color: theme === 'dark' ? '#f3f4f6' : '#111827' }}>Profile</Text>
        <View style={{ borderRadius: 12, borderWidth: 1, borderColor: theme === 'dark' ? '#374151' : '#e5e7eb', backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
          <View style={{ gap: 8 }}>
            <Text
              style={{ fontSize: 18, fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#111827' }}
              accessibilityLabel={`Name: ${profile?.name || 'Not available'}`}>
              Name: {profile?.name || 'N/A'}
            </Text>
            <Text
              style={{ fontSize: 18, fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#111827' }}
              accessibilityLabel={`Username: ${profile?.username || 'Not available'}`}>
              Username: {profile?.username || 'N/A'}
            </Text>
            <Text
              style={{ fontSize: 18, fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#111827' }}
              accessibilityLabel={`Mobile: ${profile?.mobileNumber || 'Not available'}`}>
              Mobile: {profile?.mobileNumber || 'N/A'}
            </Text>
            <Text
              style={{ fontSize: 18, fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#111827' }}
              accessibilityLabel={`Role: ${profile?.role || 'Not available'}`}>
              Role: {getRoleDisplayName(profile?.role) || 'N/A'}
            </Text>
            <Text
              style={{ fontSize: 18, fontWeight: '500', color: theme === 'dark' ? '#f3f4f6' : '#111827' }}
              accessibilityLabel={`Member Since: ${profile?.createdAt ? formatDate(profile.createdAt) : 'Not available'}`}>
              Member Since: {profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Clear Cache Button */}
        <TouchableOpacity
          onPress={handleClearAssignmentCache}
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            backgroundColor: theme === 'dark' ? '#dc2626' : '#ef4444',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#ffffff',
            }}>
            🗑️ Clear Assignment Cache
          </Text>
        </TouchableOpacity>

        <Toast />
      </Animated.View>
    </SafeAreaView>
  );
}
