import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const TYPOGRAPHY = {
  h1: {
    fontSize: width * 0.08,
    fontWeight: '700',
  },
  h2: {
    fontSize: width * 0.06,
    fontWeight: '600',
  },
  body: {
    fontSize: width * 0.04,
    fontWeight: '400',
  },
  caption: {
    fontSize: width * 0.03,
    fontWeight: '400',
  },
};
