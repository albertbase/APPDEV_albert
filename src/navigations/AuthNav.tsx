import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { ROUTES } from '../util';

import type { RootStackParamList } from './types';

// screens
import Login from '../screens/auth/Login';
import Register from '../screens/auth/Register';

type AuthStackParamList = Pick<
  RootStackParamList,
  typeof ROUTES.LOGIN | typeof ROUTES.REGISTER
>;

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigation = () => {
  return (
    <Stack.Navigator initialRouteName={ROUTES.LOGIN}>
      <Stack.Screen
        name={ROUTES.LOGIN}
        component={Login}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name={ROUTES.REGISTER} component={Register} />
    </Stack.Navigator>
  );
};

export default AuthNavigation;
