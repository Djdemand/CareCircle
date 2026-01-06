import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator 
} from 'react-native';
import { supabase } from '../utils/supabase';
import { Mail, Lock, LogIn, User } from 'lucide-react-native';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [patientName, setPatientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async () => {
    setErrorMsg('');
    if (!email || !password || (isSignUp && !patientName)) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    setLoading(true);
    console.log('Attempting auth:', isSignUp ? 'SignUp' : 'SignIn', email);

    try {
      if (isSignUp) {
        // Sign up new user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        // Create caregiver profile
        if (data.user) {
          console.log('User created, creating profile...');
          // Use RPC to create patient and caregiver in one transaction (bypassing RLS issues)
          const { error: rpcError } = await supabase.rpc('create_patient_and_caregiver', {
            patient_name: patientName,
            caregiver_name: email.split('@')[0],
            caregiver_email: data.user.email!,
            caregiver_id: data.user.id
          });

          if (rpcError) {
            console.error('RPC Error:', rpcError);
            throw rpcError;
          }
        }

        if (Platform.OS === 'web') {
          window.alert('Account created! You can now log in.');
        } else {
          Alert.alert(
            'Success',
            'Account created! You can now log in.',
            [{ text: 'OK', onPress: () => setIsSignUp(false) }]
          );
        }
        setIsSignUp(false);
      } else {
        // Sign in existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Login error:', error);
          throw error;
        }
        console.log('Login successful:', data);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setErrorMsg(error.message || 'An error occurred');
      if (Platform.OS !== 'web') {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <LogIn size={48} color="#3b82f6" />
          </View>
          <Text style={styles.title}>CareCircle</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </Text>
        </View>

        {errorMsg ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {isSignUp && (
            <View style={styles.inputContainer}>
              <User size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Patient Name"
                placeholderTextColor="#64748b"
                value={patientName}
                onChangeText={setPatientName}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Mail size={20} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={styles.button}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
            }}
          >
            <Text style={styles.switchText}>
              {isSignUp 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 16,
    paddingVertical: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
});