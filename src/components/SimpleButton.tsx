import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface SimpleButtonProps {
  title: string;
  onPress: () => void;
}

const SimpleButton = ({ title, onPress }: SimpleButtonProps) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.button}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'red',
    padding: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
});

export default SimpleButton;
