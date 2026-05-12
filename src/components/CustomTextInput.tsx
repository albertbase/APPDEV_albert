import React from 'react';
import {
  Dimensions,
  Text,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { TextInput } from 'react-native-gesture-handler';

interface CustomTextInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

const CustomTextInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  labelStyle,
  textStyle,
  containerStyle,
  ...rest
}: CustomTextInputProps) => {
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
