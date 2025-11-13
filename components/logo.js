import { Image } from 'react-native';

export default function Logo({ size = 'medium', style }) {
  const sizes = {
    small: { width: 32, height: 32 },
    medium: { width: 60, height: 60 },
    large: { width: 100, height: 100 },
    xlarge: { width: 150, height: 150 },
  };

  return (
    <Image
      source={require('../assets/logo.png')}
      style={[sizes[size], style]}
      resizeMode="contain"
    />
  );
}