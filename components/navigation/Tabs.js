import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Image,
  StyleSheet
} from 'react-native';

import Chat from '../chat/Chat';
import Notifications from '../notification/Notifications';
import Stories from '../story/Stories';

const Tab = createBottomTabNavigator();

const Tabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          if (route.name === 'Chat') {
            const chatIcon = focused ? require('../../images/chat-active.png') : require('../../images/chat.png');
            return <Image style={styles.tabBarIconStyle} source={chatIcon} style={styles.tabBarIcon} />
          } else if (route.name === 'Stories') {
            const storyIcon = focused ? require('../../images/book-active.png') : require('../../images/book.png');
            return <Image style={styles.tabBarIconStyle} source={storyIcon} style={styles.tabBarIcon} />
          } else if (route.name === 'Notifications') {
            const bellIcon = focused ? require('../../images/bell-active.png') : require('../../images/bell.png');
            return <Image style={styles.tabBarIconStyle} source={bellIcon} style={styles.tabBarIcon} />
          }
          return null;
        },
        headerStyle: {
          borderBottomWidth: 0,
        },
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#fff',
        tabBarLabelStyle: styles.tabBarLabelStyle,
        tabBarStyle: {
          backgroundColor: '#000'
        },
        unmountOnBlur: true,
      })}>
      <Tab.Screen name="Chat" component={Chat} />
      <Tab.Screen name="Stories" component={Stories} />
      <Tab.Screen name="Notifications" component={Notifications} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarIcon: {
    height: 22,
    width: 22,
  },
  tabBarIconStyle: {
    height: 24,
    width: 24,
  },
  tabBarLabelStyle: {
    fontSize: 14,
    fontWeight: 'bold'
  }
});

export default Tabs;