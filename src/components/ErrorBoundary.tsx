import { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    } else {
      this.setState({ error: null });
    }
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReload}>
            <Text style={styles.buttonText}>Reload</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: Colors.ui.background },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.ui.text, marginBottom: 12 },
  message: { fontSize: 14, color: Colors.ui.textSecondary, textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
