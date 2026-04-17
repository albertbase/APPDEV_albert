import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';

const CustomTextInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  labelStyle,
  textStyle,
  containerStyle,
  ...rest
}) => {
  const { width } = Dimensions.get('window');

  return (
    <View style={containerStyle}>
      <Text style={[{ fontWeight: 'bold' }, labelStyle]}>
        {label}
      </Text>

      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        {...rest}
        style={[
          {
            width: width * 0.9,
            borderBottomWidth: 1,
          },
          textStyle,
        ]}
      />
    </View>
  );
};

export default CustomTextInput;
