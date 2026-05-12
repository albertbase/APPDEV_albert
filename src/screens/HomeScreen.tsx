import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import type { Dispatch } from 'redux';
import { useDispatch } from 'react-redux';

import { authLogout, type AuthAction } from '../app/actions';
import { CustomButton, OfflineLogo } from '../components';
import type { RootStackParamList } from '../navigations/types';
import { COLORS, TYPOGRAPHY } from '../styles';
import { ROUTES } from '../util';

type HomeScreenNavigation = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigation>();
  const dispatch = useDispatch<Dispatch<AuthAction>>();

  return (
    <View style={styles.container}>
      <OfflineLogo label="HOME" size={200} style={styles.image} />

      <Text style={styles.title}>HomeScreen</Text>

      <CustomButton
        label="GO TO PROFILE"
        onPress={() => navigation.navigate(ROUTES.PROFILE)}
        textStyle={styles.buttonText}
        containerStyle={styles.button}
      />

      <CustomButton
        label="LOG OUT"
        onPress={() => dispatch(authLogout())}
        textStyle={styles.logoutButtonText}
        containerStyle={styles.logoutButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
    borderRadius: 100,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
    marginBottom: 30,
  },
  button: {
    backgroundColor: COLORS.success,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    fontWeight: '600',
  },
});

export default HomeScreen;
