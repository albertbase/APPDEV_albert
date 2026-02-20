import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CustomButton, CustomTextInput } from '../../components';
import { COLORS, TYPOGRAPHY } from '../../styles';
import { ROUTES, IMG } from '../../util';

const { width } = Dimensions.get('window');

const Login = () => {
  const [emailAdd, setEmailAdd] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (emailAdd.trim() === '') {
      Alert.alert('Validation Error', 'Please enter your email!');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAdd)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address!');
      return;
    }
    if (password.trim() === '') {
      Alert.alert('Validation Error', 'Please enter your password!');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters!');
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Login Success', `Welcome ${emailAdd.split('@')[0]}!`);
      // TODO: Update isSignedIn state and navigate to MainStack
    }, 1500);
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset link will be sent to your email.');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: IMG.LOGO2 }}
            style={styles.logo}
          />
        </View>
        <Text style={styles.titleText}>Welcome Back!</Text>
        <Text style={styles.subtitleText}>Sign in to your account to continue</Text>
      </View>

      <View style={styles.formContainer}>
        <CustomTextInput
          label="Email Address"
          placeholder="your@email.com"
          value={emailAdd}
          onChangeText={setEmailAdd}
          containerStyle={styles.inputContainer}
          labelStyle={styles.label}
          textStyle={styles.input}
        />

        <View style={styles.passwordContainer}>
          <CustomTextInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            containerStyle={styles.inputContainer}
            labelStyle={styles.label}
            textStyle={styles.input}
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      <CustomButton
        label={isLoading ? 'LOGGING IN...' : 'LOGIN'}
        onPress={handleLogin}
        containerStyle={[styles.button, isLoading && { opacity: 0.7 }]}
        textStyle={styles.buttonText}
      />

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>New User?</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate(ROUTES.REGISTER)}>
          <Text style={styles.registerLink}>Create one now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>By signing in, you agree to our Terms & Conditions</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  titleText: {
    ...TYPOGRAPHY.h1,
    color: COLORS.black,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitleText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderColor: COLORS.lightGray,
    borderBottomWidth: 2,
    borderRadius: 4,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    bottom: 15,
  },
  eyeText: {
    fontSize: 18,
  },
  forgotPassword: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 10,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '700',
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.lightGray,
  },
  dividerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginHorizontal: 10,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  registerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
  },
  registerLink: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '700',
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    textAlign: 'center',
  },
});

export default Login;
