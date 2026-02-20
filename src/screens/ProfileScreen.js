import { Image, StyleSheet, Text, View } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../styles';
import { IMG } from '../util';

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: IMG.LOGO,
        }}
        style={styles.image}
      />
      <Text style={styles.title}>ProfileScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
});

export default ProfileScreen;