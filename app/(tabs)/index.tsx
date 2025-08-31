import React, { useState } from 'react';
import { StyleSheet, TextInput, Alert, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const primaryColor = '#4A90E2'; // Blue
  const secondaryColor = '#50C878'; // Green
  const accentColor = '#FF6B6B'; // Coral

  const handleLogin = () => {
    // Hardcoded credentials for now
    const validEmail = 'user@uniauth.com';
    const validPassword = 'password123';

    if (email === validEmail && password === validPassword) {
      router.push('/authenticator' as any);
    } else {
      Alert.alert('Login Failed', 'Invalid email or password');
    }
  };

  const handleSignUp = () => {
    Alert.alert('Sign Up', 'Sign up functionality coming soon!');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={[styles.title, { color: primaryColor }]}>
        UniAuth
      </ThemedText>
      <ThemedView style={styles.form}>
        <ThemedText style={[styles.demoText, { color: iconColor }]}>
          Demo credentials: user@uniauth.com / password123
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              color: textColor,
              backgroundColor,
              borderColor: primaryColor,
              shadowColor: primaryColor,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            },
          ]}
          placeholder="Email"
          placeholderTextColor={iconColor}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[
            styles.input,
            {
              color: textColor,
              backgroundColor,
              borderColor: secondaryColor,
              shadowColor: secondaryColor,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            },
          ]}
          placeholder="Password"
          placeholderTextColor={iconColor}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <ThemedView style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={handleLogin}
          >
            <ThemedText style={styles.buttonText}>Login</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: secondaryColor }]}
            onPress={handleSignUp}
          >
            <ThemedText style={styles.buttonText}>Sign Up</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: 'bold',
  },
  form: {
    gap: 20,
  },
  demoText: {
    textAlign: 'center',
    fontSize: 12,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 2,
    padding: 12,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
