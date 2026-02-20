import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CustomButton, CustomTextInput } from '../components';
import { COLORS, TYPOGRAPHY } from '../styles';
import { IMG, ROUTES } from '../util';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [inputValue, setInputValue] = useState('');
  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: IMG.LOGO2,
        }}
        style={styles.image}
      />
      <Text style={styles.title}>HomeScreen</Text>

      <CustomTextInput
        label="Enter your name"
        placeholder="Type here..."
        value={inputValue}
        onChangeText={setInputValue}
        labelStyle={styles.label}
        textStyle={styles.input}
        containerStyle={styles.inputContainer}
      />

      <CustomButton
        label="GO TO PROFILE"
        onPress={() => navigation.navigate(ROUTES.PROFILE)}
        textStyle={styles.buttonText}
        containerStyle={styles.button}
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
  },
  buttonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default HomeScreen;