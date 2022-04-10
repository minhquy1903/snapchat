import React, { useState, useContext, useEffect } from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import validator from "validator";

import Context from "../../context";

import { cometChatConfig } from '../../env';

import {
  auth,
  signInWithEmailAndPassword,
} from "../../firebase";

import { getFirebaseData } from '../../services/common';

const Login = props => {
  const { navigation } = props;

  const { setUser } = useContext(Context);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      setIsLoading(false);
    }
  }, []);

  const onEmailChanged = email => {
    setEmail(() => email);
  };

  const onPasswordChanged = password => {
    setPassword(() => password);
  };

  const login = async () => {
    if (isUserCredentialsValid(email, password)) {
      setIsLoading(true);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential) return;
        const userId = userCredential.user.uid;
        await loginCometChat(userId);
      } catch (error) {
        setIsLoading(false);
        showMessage('Error', 'Your username or password is not correct');
      }
    } else {
      setIsLoading(false);
      showMessage('Error', 'Your username or password is not correct');
    }
  };

  const isUserCredentialsValid = (email, password) => {
    return validator.isEmail(email) && password;
  };

  const loginCometChat = async id => {
    if (!id) return;
    try {
      const user = await CometChat.login(id, `${cometChatConfig.cometChatAuthKey}`);
      if (user) {
        const authenticatedUser = await getUser(id);
        if (authenticatedUser) {
          setIsLoading(false);
          setUser(authenticatedUser);
          saveAuthedInfo(authenticatedUser);
          navigate('Home');
        } else {
          setIsLoading(false);
          showMessage('Info', 'Cannot load the authenticated information, please try again');
        }
      } else {
        setIsLoading(false);
        showMessage('Error', 'Your username or password is not correct');
      }
    } catch (error) {
      setIsLoading(false);
      showMessage('Error', 'Your username or password is not correct');
    }
  };

  const getUser = async id => {
    if (!id) {
      return null;
    }
    return await getFirebaseData({ key: 'users/', id });
  };

  const saveAuthedInfo = authenticatedUser => {
    AsyncStorage.setItem('auth', JSON.stringify(authenticatedUser));
  };

  const showMessage = (title, message) => {
    Alert.alert(title, message);
  };

  const register = route => () => {
    navigate(route);
  };

  const navigate = route => {
    navigation.navigate(route);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoTitle}>Snapchat</Text>
      </View>
      <TextInput
        autoCapitalize='none'
        onChangeText={onEmailChanged}
        placeholder="Email"
        placeholderTextColor="#ccc"
        style={styles.input}
      />
      <TextInput
        autoCapitalize='none'
        onChangeText={onPasswordChanged}
        placeholder="Password"
        placeholderTextColor="#ccc"
        secureTextEntry
        style={styles.input}
      />
      <TouchableOpacity style={styles.loginBtn} onPress={login}>
        <Text style={styles.loginLabel}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.registerBtn} onPress={register('SignUp')}>
        <Text style={styles.registerLabel}>Register</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center'
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: 'bold'
  },
  input: {
    borderColor: '#ccc',
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginHorizontal: 24,
    marginVertical: 8,
    padding: 12,
  },
  loginBtn: {
    backgroundColor: '#FFFC00',
    borderRadius: 8,
    fontSize: 16,
    marginHorizontal: 24,
    marginVertical: 8,
    padding: 16,
  },
  loginLabel: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  registerBtn: {
    backgroundColor: '#fff',
    fontSize: 16,
    marginHorizontal: 24,
    marginVertical: 4,
    padding: 8,
  },
  registerLabel: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase'
  }
});

export default Login;