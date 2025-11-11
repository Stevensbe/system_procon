import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!username || !password) {
      Alert.alert('Campos obrigatórios', 'Informe usuário e senha.');
      return;
    }
    try {
      setLoading(true);
      await login({ username, password });
      router.replace('/home');
    } catch (error: any) {
      Alert.alert('Falha no login', error?.message || 'Não foi possível autenticar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.title}>Acessar Fiscalização</Text>

        <TextInput
          style={styles.input}
          placeholder="Usuário (CPF/Matrícula)"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </Pressable>

        <Pressable onPress={() => Alert.alert('Contato TI', 'Solicite redefinição ao suporte.')}
        >
          <Text style={styles.link}>Esqueci minha senha</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101828',
    justifyContent: 'center',
    padding: 24,
  },
  panel: {
    backgroundColor: '#1D2939',
    borderRadius: 16,
    padding: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F2F4F7',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#111827',
    color: '#F2F4F7',
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#475467',
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
    color: '#fff',
  },
  link: {
    marginTop: 16,
    textAlign: 'center',
    color: '#98A2B3',
    textDecorationLine: 'underline',
  },
});
