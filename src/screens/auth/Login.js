import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { CustomButton, CustomTextInput, OfflineLogo, SimpleButton } from '../../components';
import { COLORS, TYPOGRAPHY } from '../../styles';
import { authLogin } from '../../app/actions';

const Login = () => {
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!auth.isLoading && auth.isError && auth.error) {
      Alert.alert('Login failed', auth.error);
    }
  }, [auth.isLoading, auth.isError, auth.error]);

  useEffect(() => {
    if (auth?.data?.offlineMode) {
      Alert.alert('Offline Mode', 'Logged in using local offline mode for device testing.');
    }
  }, [auth?.data]);

  const handleLogin = () => {
    if (auth.isLoading) {
      return;
    }

    if (username.trim() === '' || password.trim() === '') {
      Alert.alert('Validation Error', 'Please enter both username and password!');
      return;
    }

    dispatch(
      authLogin({
        username: username.trim(),
        password,
      }),
    );
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset link will be sent to your email.');
  };

  const handleAnimatedLogin = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();

    handleLogin();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          <OfflineLogo label="A" size={80} />
        </View>
        <Text style={styles.titleText}>Welcome Back!</Text>
        <Text style={styles.subtitleText}>Sign in to your account</Text>
      </View>

      <View style={styles.formContainer}>
        <CustomTextInput
          label="Username"
          placeholder="Enter your username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
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
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.inputContainer}
            labelStyle={styles.label}
            textStyle={styles.input}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            transform: [{ translateX: shakeAnimation }],
          },
        ]}
      >
        <CustomButton
          label={auth.isLoading ? 'LOGGING IN...' : 'LOGIN'}
          onPress={handleAnimatedLogin}
          containerStyle={[styles.button, auth.isLoading && styles.buttonDisabled]}
          textStyle={styles.buttonText}
        />
      </Animated.View>

      {/* <SimpleButton
        title="Test Me"
        onPress={() =>alert('Hello') }
      /> */}

      // {/* Old login button reference
      // <CustomButton
      //   label={isLoading ? 'LOGGING IN...' : 'LOGIN'}
      //   onPress={handleLogin}
      //   containerStyle={[styles.button, isLoading && styles.buttonDisabled]}
      //   textStyle={styles.buttonText}
      // />
      // */}
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
  buttonWrapper: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '700',
    textAlign: 'center',
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
