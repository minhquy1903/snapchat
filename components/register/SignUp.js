import React, { useState, useRef } from 'react';
import { CometChat } from '@cometchat-pro/react-native-chat';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import validator from "validator";

import { cometChatConfig } from '../../env';

import {
  auth,
  createUserWithEmailAndPassword,
  getDownloadURL,
  storage,
  storageRef,
  uploadBytesResumable,
} from "../../firebase";

import { insertFirebaseDatabase } from '../../services/common';

const SignUp = () => {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullname, setFullname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [userAvatar, setUserAvatar] = useState(null);

  const selectAvatar = () => {
    const options = {
      mediaType: 'photo'
    };
    launchImageLibrary(options, async response => {
      if (response.didCancel) return null;
      if (response.assets && response.assets.length) {
        const uri = response.assets[0].uri;
        const fileName = response.assets[0].fileName;
        const type = response.assets[0].type;
        if (uri && fileName) {
          setUserAvatar(() => ({
            name: fileName,
            uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
            type: type || 'video/quicktime'
          }));
        }
      }
    });
  };

  const onFullnameChanged = (fullname) => {
    setFullname(() => fullname);
  };

  const onEmailChanged = (email) => {
    setEmail(() => email);
  };

  const onPasswordChanged = (password) => {
    setPassword(() => password);
  };

  const onConfirmPasswordChanged = (confirmPassword) => {
    setConfirmPassword(() => confirmPassword);
  };

  const register = async () => {
    if (isSignupValid({ confirmPassword, email, fullname, password })) {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential) {
        const id = userCredential._tokenResponse.localId;
        const createdAccount = buildCreatedAccount({ id, fullname, email });
        await insertFirebaseDatabase({ key: 'users/', id, payload: createdAccount});
        await uploadUserAvatar(createdAccount, onAvatarUploaded);
      } else {
        setIsLoading(false);
        showMessage('Error', 'Fail to create your account, your account might be existed');
      }
    }
  };

  const isSignupValid = ({ confirmPassword, email, password, fullname }) => {
    if (!userAvatar) {
      showMessage('Error', 'Please upload your avatar');
      return false;
    }
    if (validator.isEmpty(fullname)) {
      showMessage('Error', 'Please input your full name');
      return false;
    }
    if (validator.isEmpty(email) || !validator.isEmail(email)) {
      showMessage('Error', 'Please input your email');
      return false;
    }
    if (validator.isEmpty(password)) {
      showMessage('Error', 'Please input your password');
      return false;
    }
    if (validator.isEmpty(confirmPassword)) {
      showMessage('Error', 'Please input your confirm password');
      return false;
    }
    if (password !== confirmPassword) {
      showMessage('Error', 'Your confirm password must be matched with your password');
      return false;
    }
    return true;
  };

  const buildCreatedAccount = ({ id, fullname, email }) => ({ id, fullname, email });

  const uploadUserAvatar = async (createdAccount, onAvatarUploaded) => {
    const storageImageRef = storageRef(storage, `users/${userAvatar.name}`);
    const localFile = await fetch(userAvatar.uri);
    const fileBlob = await localFile.blob();
    const uploadTask = uploadBytesResumable(storageImageRef, fileBlob, { contentType: userAvatar.type });
    uploadTask.on('state_changed',
      (snapshot) => {
      },
      (error) => {
        setUserAvatar(null);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        if (downloadUrl) {
          onAvatarUploaded(createdAccount, downloadUrl);
        }
      }
    );
  };

  const onAvatarUploaded = (createdAccount, downloadUrl) => {
    if (!downloadUrl) return;
    createdAccount.avatar = downloadUrl;
    insertFirebaseDatabase({ key: 'users/', id: createdAccount.id, payload: createdAccount});
    createCometChatAccount(createdAccount);
  }

  const createCometChatAccount = async createdAccount => {
    try {
      const authKey = `${cometChatConfig.cometChatAuthKey}`;
      const user = new CometChat.User(createdAccount.id);
      user.setName(createdAccount.fullname);
      user.setAvatar(createdAccount.avatar);
      const cometChatUser = await CometChat.createUser(user, authKey);
      if (cometChatUser) {
        showMessage('Info', `${fullname} was created successfully! Please sign in with your created account`);
        setIsLoading(false);
        setUserAvatar(null);
      } else {
        setIsLoading(false);
        setUserAvatar(null);
      }
    } catch (error) {
      showMessage('Error', 'Fail to create your CometChat user, please try again');
    }
  };

  const showMessage = (title, message) => {
    Alert.alert(
      title,
      message
    );
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
      <TouchableOpacity style={styles.uploadContainer} onPress={selectAvatar}>
        {!userAvatar && <>
          <Image style={styles.uploadImage} source={require('../../images/image-gallery.png')} />
          <Text style={styles.uploadTitle}>Upload your avatar</Text>
        </>}
        {userAvatar && <Image style={styles.userAvatar} source={{ uri: userAvatar.uri }} />}
      </TouchableOpacity>
      <TextInput
        autoCapitalize='none'
        onChangeText={onFullnameChanged}
        placeholder="Full name"
        placeholderTextColor="#ccc"
        style={styles.input}
      />
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
      <TextInput
        autoCapitalize='none'
        onChangeText={onConfirmPasswordChanged}
        placeholder="Confirm Password"
        placeholderTextColor="#ccc"
        secureTextEntry
        style={styles.input}
      />
      <TouchableOpacity style={styles.registerBtn} onPress={register}>
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
  uploadContainer: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  uploadImage: {
    height: 96,
    width: 96,
  },
  userAvatar: {
    borderRadius: 128 / 2,
    height: 128,
    width: 128,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 16
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
  registerBtn: {
    backgroundColor: '#FFFC00',
    borderRadius: 8,
    fontSize: 16,
    marginHorizontal: 24,
    marginVertical: 8,
    padding: 16,
  },
  registerLabel: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});

export default SignUp;