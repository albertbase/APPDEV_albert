import React from 'react';
import {
  Dimensions,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

interface CustomButtonProps {
  containerStyle?: StyleProp<ViewStyle>;
  label: string;
  textStyle?: StyleProp<TextStyle>;
  onPress: () => void;
}

const CustomButton = ({
  containerStyle,
  label,
  textStyle,
  onPress,
}: CustomButtonProps) => {
  const { width } = Dimensions.get('window');

  return (
    <View style={containerStyle}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            padding: width * 0.04, // responsive padding
          }}
        >
          <Text style={textStyle}>{label}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default CustomButton;
