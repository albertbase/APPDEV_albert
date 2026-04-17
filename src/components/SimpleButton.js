import React from 'react';
import {TouchableOpacity, Text} from 'react-native';

const SimpleButton = ({title, onPress}) => {
  return (
    <TouchableOpacity onPress={onPress} style={{
        backgroundColor: 'red',
        padding: 20,
        borderRadius: 5,
        alignItems: 'center',
    }}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
};

export default SimpleButton;