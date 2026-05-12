import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { COLORS, TYPOGRAPHY } from '../styles';

interface OfflineLogoProps {
  label?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const OfflineLogo = ({ label = 'APP', size = 96, style }: OfflineLogoProps) => {
  const borderRadius = size / 2;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { fontSize: Math.max(18, size * 0.24) }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderColor: COLORS.success,
    borderWidth: 2,
    justifyContent: 'center',
  },
  label: {
    ...TYPOGRAPHY.h2,
    color: COLORS.white,
    fontWeight: '700',
  },
});

export default OfflineLogo;
