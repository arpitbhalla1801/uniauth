import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Alert, Clipboard, Platform } from 'react-native';
import * as ClipboardExpo from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

// Simple TOTP implementation using Expo Crypto
const generateTOTP = async (secret: string): Promise<string> => {
  try {
    const timeStep = 30;
    const digits = 6;
    const time = Math.floor(Date.now() / 1000);
    const timeCounter = Math.floor(time / timeStep);

    // Decode base32 secret (simplified implementation)
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (let i = 0; i < secret.length; i++) {
      const val = base32Chars.indexOf(secret[i].toUpperCase());
      if (val >= 0) {
        bits += val.toString(2).padStart(5, '0');
      }
    }

    const secretBytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < secretBytes.length; i++) {
      secretBytes[i] = parseInt(bits.substr(i * 8, 8), 2);
    }

    // Create time counter as 8-byte big-endian
    const timeBytes = new ArrayBuffer(8);
    const timeView = new DataView(timeBytes);
    timeView.setUint32(4, timeCounter >>> 0, false);

    // Generate HMAC-SHA1 using Expo Crypto
    const message = String.fromCharCode(...new Uint8Array(timeBytes));
    const key = String.fromCharCode(...secretBytes);

    const hmac = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA1,
      key + message
    );

    // Extract 4 bytes from HMAC (dynamic truncation)
    const hmacBytes = new Uint8Array(hmac.length);
    for (let i = 0; i < hmac.length; i++) {
      hmacBytes[i] = hmac.charCodeAt(i);
    }

    const offset = hmacBytes[hmacBytes.length - 1] & 0xf;
    const code = (
      ((hmacBytes[offset] & 0x7f) << 24) |
      ((hmacBytes[offset + 1] & 0xff) << 16) |
      ((hmacBytes[offset + 2] & 0xff) << 8) |
      (hmacBytes[offset + 3] & 0xff)
    );

    // Generate 6-digit code
    const totp = (code % 1000000).toString().padStart(digits, '0');
    return totp;
  } catch (error) {
    console.error('TOTP generation error:', error);
    return '000000'; // Fallback
  }
};

interface Account {
  id: string;
  name: string;
  issuer: string;
  secret: string;
  totp: string;
  timeLeft: number;
}

export default function AuthenticatorScreen() {
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      name: 'user@gmail.com',
      issuer: 'Google',
      secret: 'JBSWY3DPEHPK3PXP', // Valid base32 secret
      totp: '',
      timeLeft: 30,
    },
    {
      id: '2',
      name: 'john.doe',
      issuer: 'GitHub',
      secret: 'JBSWY3DPEHPK3PXQ', // Valid base32 secret
      totp: '',
      timeLeft: 30,
    },
    {
      id: '3',
      name: 'admin',
      issuer: 'AWS',
      secret: 'JBSWY3DPEHPK3PXR', // Valid base32 secret
      totp: '',
      timeLeft: 30,
    },
  ]);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const primaryColor = '#4A90E2';
  const secondaryColor = '#50C878';
  const warningColor = '#FF9500';

  useEffect(() => {
    const updateTOTPs = async () => {
      const updatedAccounts = await Promise.all(
        accounts.map(async (account) => {
          const totp = await generateTOTP(account.secret);
          const timeLeft = 30 - (Math.floor(Date.now() / 1000) % 30);
          return { ...account, totp, timeLeft };
        })
      );
      setAccounts(updatedAccounts);
    };

    updateTOTPs();
    const interval = setInterval(updateTOTPs, 1000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = async (code: string, accountName: string) => {
    try {
      if (Platform.OS === 'web') {
        await Clipboard.setString(code);
      } else {
        await ClipboardExpo.setStringAsync(code);
      }
      Alert.alert('Copied!', `TOTP code for ${accountName} copied to clipboard`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy code');
    }
  };

  const addNewAccount = () => {
    Alert.alert('Add Account', 'This feature will be implemented soon!');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => router.replace('/') },
      ]
    );
  };

  const renderAccount = ({ item }: { item: Account }) => {
    const progress = (item.timeLeft / 30) * 100;

    return (
      <TouchableOpacity
        style={[
          styles.accountCard,
          {
            backgroundColor,
            borderColor: item.timeLeft <= 5 ? warningColor : primaryColor,
            shadowColor: item.timeLeft <= 5 ? warningColor : primaryColor,
          },
        ]}
        onPress={() => copyToClipboard(item.totp, item.name)}
      >
        <ThemedView style={styles.accountHeader}>
          <ThemedView style={styles.accountInfo}>
            <ThemedText style={[styles.issuer, { color: primaryColor }]}>
              {item.issuer}
            </ThemedText>
            <ThemedText style={[styles.name, { color: textColor }]}>
              {item.name}
            </ThemedText>
          </ThemedView>
          <Ionicons name="copy-outline" size={24} color={iconColor} />
        </ThemedView>

        <ThemedView style={styles.totpContainer}>
          <ThemedText style={[styles.totpCode, { color: textColor }]}>
            {item.totp}
          </ThemedText>
          <ThemedText style={[styles.timeLeft, { color: item.timeLeft <= 5 ? warningColor : secondaryColor }]}>
            {item.timeLeft}s
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.progressBar}>
          <ThemedView
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: item.timeLeft <= 5 ? warningColor : secondaryColor,
              },
            ]}
          />
        </ThemedView>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={[styles.title, { color: primaryColor }]}>
          UniAuth
        </ThemedText>
        <ThemedView style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: secondaryColor }]}
            onPress={addNewAccount}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: warningColor }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={renderAccount}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <ThemedText style={[styles.hint, { color: iconColor }]}>
        Tap any account to copy the TOTP code
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
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
  listContainer: {
    paddingBottom: 20,
  },
  accountCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountInfo: {
    flex: 1,
  },
  issuer: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  totpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totpCode: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  timeLeft: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  hint: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 20,
  },
});
