import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { StyleSheet, Text, View } from 'react-native';
import { CustomButton, OfflineLogo } from '../components';
import { COLORS, TYPOGRAPHY } from '../styles';
import { ROUTES } from '../util';
import { authLogout } from '../app/actions';

const HomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

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
    borderRadius:  100,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
    marginBottom: 30,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    paddingVertical: 8,
  },
  inputContainer: {
    marginBottom: 20,
    width: '100%',
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
