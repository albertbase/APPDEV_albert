import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { ROUTES } from '../util';

import type { RootStackParamList } from './types';

// screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

type MainStackParamList = Pick<
  RootStackParamList,
  typeof ROUTES.HOME | typeof ROUTES.PROFILE
>;

const Stack = createStackNavigator<MainStackParamList>();

const MainNavigation = () => {
  return (
    <Stack.Navigator initialRouteName={ROUTES.HOME}>
      <Stack.Screen name={ROUTES.HOME} component={HomeScreen} />
      <Stack.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigation;
