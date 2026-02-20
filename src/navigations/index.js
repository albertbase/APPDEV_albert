import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

// Auth screens
import Login from '../screens/auth/Login';
import Register from '../screens/auth/Register';

// Home screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

// utils
import { ROUTES } from '../util';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen
        name={ROUTES.LOGIN}
        component={Login}
        options={{
          title: 'Login',
        }}
      />
      <Stack.Screen
        name={ROUTES.REGISTER}
        component={Register}
        options={{
          title: 'Register',
        }}
      />
    </Stack.Navigator>
  );
};

const MainStack = () => {
  return (
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
        options={{
          title: 'Home',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={ROUTES.PROFILE}
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default () => {
  // TODO: Add authentication state logic here
  // For now, show AuthStack (Login/Register)
  const isSignedIn = false; // Change this based on actual auth state

  return (
    <NavigationContainer>
      {isSignedIn ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};