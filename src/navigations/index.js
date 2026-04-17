import React, { useEffect } from 'react';
import { Platform, StatusBar, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth screens
import Login from '../screens/auth/Login';
import Register from '../screens/auth/Register';

// Home screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

// utils
import { ROUTES } from '../util';

const Stack = createNativeStackNavigator();

// --- Auth Stack ---
const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: true,
    }}
  >
    <Stack.Screen
      name={ROUTES.LOGIN}
      component={Login}
      options={{ title: 'Login' }}
    />
    <Stack.Screen
      name={ROUTES.REGISTER}
      component={Register}
      options={{ title: 'Register' }}
    />
  </Stack.Navigator>
);

// --- Main Stack ---
const MainStack = () => (
  <Stack.Navigator
    initialRouteName={ROUTES.HOME}
    screenOptions={{
      headerShown: true,
      animationEnabled: true,
    }}
  >
    <Stack.Screen
      name={ROUTES.HOME}
      component={HomeScreen}
      options={{ title: 'Home', headerShown: true }}
    />
    <Stack.Screen
      name={ROUTES.PROFILE}
      component={ProfileScreen}
      options={{ title: 'Profile', headerShown: true }}
    />
  </Stack.Navigator>
);

// --- Root Navigator ---
const AppNav = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const auth = useSelector(state => state.auth);
  const isLoggedIn = !!auth?.isAuthenticated;

  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content', true);
    }
  }, [isDarkMode]);

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNav;
