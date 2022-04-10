import React, {useEffect, useState} from 'react';
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {CometChat} from '@cometchat-pro/react-native-chat';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import CreateStory from './components/story/CreateStory';
import Login from './components/login/Login';
import SignUp from './components/register/SignUp';
import SuggestedFriends from './components/friend/SuggestedFriends';
import Tabs from './components/navigation/Tabs';

import {cometChatConfig} from './env';

import Context from './context';

import logOut from './images/logout.png';
import addUser from './images/add-user.png';
import plus from './images/plus.png';

const Stack = createNativeStackNavigator();

const App = () => {
  const [user, setUser] = useState(null);

  const initCometChat = async () => {
    const appID = `${cometChatConfig.cometChatAppId}`;
    const region = `${cometChatConfig.cometChatRegion}`;
    const appSetting = new CometChat.AppSettingsBuilder()
      .subscribePresenceForAllUsers()
      .setRegion(region)
      .build();
    CometChat.init(appID, appSetting).then(
      () => {
        console.log('CometChat was initialized successfully');
      },
      (error) => {},
    );
  };

  const initAuthenticatedUser = async () => {
    const authenticatedUser = await AsyncStorage.getItem('auth');
    setUser(() => (authenticatedUser ? JSON.parse(authenticatedUser) : null));
  };

  useEffect(() => {
    initCometChat();
    initAuthenticatedUser();
  }, []);

  const goToSuggestedFriends = (navigation) => () => {
    navigation.navigate('SuggestedFriends');
  };

  const goToCreateStory = (navigation) => () => {
    navigation.navigate('CreateStory');
  };

  const logout = (navigation) => () => {
    Alert.alert('Confirm', 'Do you want to log out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {text: 'OK', onPress: () => handleLogout(navigation)},
    ]);
  };

  const handleLogout = (navigation) => {
    CometChat.logout().then(
      () => {
        removeAuthedInfo();
        backToLogin(navigation);
      },
      (error) => {
        console.log('Logout failed with exception:', {error});
      },
    );
  };

  const removeAuthedInfo = () => {
    AsyncStorage.removeItem('auth');
    setUser(null);
  };

  const backToLogin = (navigation) => {
    // reset routes history and back to the login page.
    navigation.reset({
      index: 0,
      routes: [{name: 'Login'}],
    });
  };

  if (user) {
    return (
      <Context.Provider value={{user, setUser}}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="Home"
              component={Tabs}
              options={({navigation}) => ({
                headerTitle: () => (
                  <View>
                    <Text style={styles.headerTitle}>Snapchat</Text>
                  </View>
                ),
                headerLeft: () => (
                  <TouchableOpacity
                    style={[
                      styles.container,
                      Platform.OS === 'android' ? styles.mgr8 : null,
                    ]}
                    onPress={goToSuggestedFriends(navigation)}>
                    <Image source={addUser} style={styles.headerIcon} />
                  </TouchableOpacity>
                ),
                headerRight: () => (
                  <View style={styles.container}>
                    <TouchableOpacity
                      style={styles.headerGap}
                      onPress={goToCreateStory(navigation)}>
                      <Image source={plus} style={styles.headerIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={logout(navigation)}>
                      <Image source={logOut} style={styles.headerIcon} />
                    </TouchableOpacity>
                  </View>
                ),
              })}
            />
            <Stack.Screen
              name="SuggestedFriends"
              component={SuggestedFriends}
              options={{title: 'Add Friends'}}
            />
            <Stack.Screen name="CreateStory" component={CreateStory} />
          </Stack.Navigator>
        </NavigationContainer>
      </Context.Provider>
    );
  }

  return (
    <Context.Provider value={{user, setUser}}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="Home" component={Tabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </Context.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
  },
  headerGap: {
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerIcon: {
    height: 24,
    width: 24,
  },
  mgr8: {
    marginRight: 8,
  },
});

export default App;
