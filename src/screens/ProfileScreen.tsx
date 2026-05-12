import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { OfflineLogo } from '../components';
import { COLORS, TYPOGRAPHY } from '../styles';

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <OfflineLogo label="ME" size={250} style={styles.image} />
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
    borderWidth: 3, // merged from old version
    borderColor: 'blue', // merged from old version
  },
  image: {
    width: 350, // from old version
    height: 350, // from old version
    marginBottom: 20,
    borderRadius: 125,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.black,
    fontSize: 40, // merged from old version
    
  },
});

export default ProfileScreen;
