import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CustomButton, CustomTextInput, OfflineLogo } from '../../components';
import { COLORS, TYPOGRAPHY } from '../../styles';
import { ROUTES } from '../../util';

const Register = () => {
  const navigation = useNavigation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name!');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email!');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address!');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Validation Error', 'Please enter a password!');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters!');
      return;
    }
    if (!confirmPassword.trim()) {
      Alert.alert('Validation Error', 'Please confirm your password!');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match!');
      return;
    }
    if (!agreeTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms & Conditions!');
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Registration Success', `Welcome ${fullName}! You can now login.`, [
        { text: 'OK', onPress: () => navigation.navigate(ROUTES.LOGIN) },
      ]);
    }, 1500);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          <OfflineLogo label="NEW" size={80} />
        </View>
        <Text style={styles.titleText}>Create Account</Text>
        <Text style={styles.subtitleText}>Join our community</Text>
      </View>

      <View style={styles.formContainer}>
        <CustomTextInput
          label="Full Name"
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={setFullName}
          containerStyle={styles.inputContainer}
          labelStyle={styles.label}
          textStyle={styles.input}
        />

        <CustomTextInput
          label="Email Address"
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          containerStyle={styles.inputContainer}
          labelStyle={styles.label}
          textStyle={styles.input}
        />

        <View style={styles.passwordContainer}>
          <CustomTextInput
            label="Password"
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            containerStyle={styles.inputContainer}
            labelStyle={styles.label}
            textStyle={styles.input}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.passwordContainer}>
          <CustomTextInput
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            containerStyle={styles.inputContainer}
            labelStyle={styles.label}
            textStyle={styles.input}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Text style={styles.eyeText}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}
            onPress={() => setAgreeTerms(!agreeTerms)}
          >
            {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </View>

      <CustomButton
        label={isLoading ? 'CREATING ACCOUNT...' : 'REGISTER'}
        onPress={handleRegister}
        containerStyle={[styles.button, isLoading && { opacity: 0.7 }]}
        textStyle={styles.buttonText}
      />

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LOGIN)}>
          <Text style={styles.loginLink}>Sign in here</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>Your data is secure and encrypted</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  headerSection: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 20, alignItems: 'center' },
  logoContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: COLORS.primary },
  logo: { width: 80, height: 80, borderRadius: 40 },
  titleText: { ...TYPOGRAPHY.h1, color: COLORS.primary, fontWeight: '700', marginBottom: 8 },
  subtitleText: { ...TYPOGRAPHY.body, color: COLORS.gray, textAlign: 'center' },
  formContainer: { paddingHorizontal: 20, marginBottom: 15 },
  inputContainer: { marginBottom: 18 },
  label: { ...TYPOGRAPHY.body, color: COLORS.black, fontWeight: '600', marginBottom: 8 },
  input: { ...TYPOGRAPHY.body, color: COLORS.black, paddingVertical: 12, paddingHorizontal: 12, borderColor: COLORS.lightGray, borderBottomWidth: 2, borderRadius: 4 },
  passwordContainer: { position: 'relative' },
  eyeIcon: { position: 'absolute', right: 12, bottom: 15 },
  eyeText: { fontSize: 18 },
  termsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, alignItems: 'flex-start' },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: COLORS.gray, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.success },
  checkmark: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  termsText: { ...TYPOGRAPHY.caption, color: COLORS.black, lineHeight: 20 },
  termsLink: { color: COLORS.primary, fontWeight: '600' },
  button: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 8, marginHorizontal: 20, marginVertical: 15, shadowColor: COLORS.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  buttonText: { ...TYPOGRAPHY.body, color: COLORS.white, fontWeight: '700', textAlign: 'center' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginHorizontal: 20, marginBottom: 20 },
  loginText: { ...TYPOGRAPHY.body, color: COLORS.black },
  loginLink: { ...TYPOGRAPHY.body, color: COLORS.primary, fontWeight: '700' },
  footerContainer: { paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center' },
  footerText: { ...TYPOGRAPHY.caption, color: COLORS.gray, textAlign: 'center' },
});

export default Register;
