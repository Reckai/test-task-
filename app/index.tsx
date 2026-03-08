import { View, Text, StyleSheet } from 'react-native';

export default function Text1Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Text 1</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
