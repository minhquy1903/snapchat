import React, { useEffect, useState, useContext } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import 'react-native-get-random-values';
import { v4 as uuidv4 } from "uuid";

import Context from '../../context';

import {
  database,
  databaseRef,
  databaseOnValue,
  databaseOff
} from "../../firebase";


import { cometChatConfig } from '../../env';

import { getFirebaseData, insertFirebaseDatabase } from '../../services/common';

const Notifications = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const { user } = useContext(Context);

  const loadNotifications = () => {
    setIsLoading(true);
    const notificationsRef = databaseRef(database, 'notifications');
    databaseOnValue(notificationsRef, async snapshot => {
      const values = snapshot.val();
      setNotifications(() => values ? values[user.id] : []);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
    return () => {
      loadNotifications([]);
      const notificationsRef = databaseRef(database, 'notifications');
      databaseOff(notificationsRef);
    }
  }, [user]);

  const renderItems = (item) => {
    const notification = item.item;
    if (notification.isFriendRequest) {
      return (
        <View style={styles.listItem}>
          <View style={styles.listItemLeft}>
            <Image style={styles.listItemImage} source={{ uri: notification.notificationImage }} />
            <View style={styles.listItemTitleContainer}>
              <Text style={styles.listItemMessage}>{notification.notificationTitle}</Text>
              {notification.status !== 0 && <View>
                <Text style={styles.listItemStatusLabel}>Status: {notification.status === 1 ? 'Accepted' : 'Rejected'}</Text>
              </View>}
            </View>
          </View>
          {notification.status === 0 && <View style={styles.listItemRight}>
            <TouchableOpacity style={styles.acceptFriendBtn} onPress={acceptFriendRequest(notification)}>
              <Text style={styles.acceptFriendLabel}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectFriendBtn} onPress={rejectFriendRequest(notification)}>
              <Text style={styles.rejectFriendLabel}>Reject</Text>
            </TouchableOpacity>
          </View>}
        </View>
      );
    }
    return (
      <View style={styles.listItem}>
        <View style={styles.listItemLeft}>
          <Image style={styles.listItemImage} source={{ uri: notification.notificationImage }} />
          <Text style={[styles.listItemMessage, styles.listItemMessageFlex]}>{notification.notificationTitle}</Text>
        </View>
      </View>
    );
  };

  const acceptFriendRequest = notification => async () => {
    if (!notification || !notification.senderId) return;
    try {
      setIsLoading(true);
      const senderId = notification.senderId;
      await removePendingRequestForSender(senderId);
      await removeWaitingForApprovalForReceiver(senderId);
      await updateNotificationStatus(notification, 1);
      await addCometChatFriend(senderId);
      await addNotificationForSender(senderId);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  const rejectFriendRequest = notification => async () => {
    if (!notification || !notification.senderId) return;
    try {
      setIsLoading(true);
      const senderId = notification.senderId;
      await removePendingRequestForSender(senderId);
      await removeWaitingForApprovalForReceiver(senderId);
      await updateNotificationStatus(notification, -1);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    } 
  };  

  const removePendingRequestForSender = async senderId => {
    const sender = await getData('users/', senderId);
    if (!sender) return;
    sender.pending = sender.pending && sender.pending.length ? sender.pending.filter(p => p !== user.id) : [];
    insertFirebaseDatabase({ key: 'users/', id: senderId, payload: sender });
  };

  const removeWaitingForApprovalForReceiver = async senderId => {
    const receiver = await getData('users/', user.id);
    if (!receiver) return;
    receiver.waiting = receiver.waiting && receiver.waiting.length ? receiver.waiting.filter(w => w !== senderId) : [];
    insertFirebaseDatabase({ key: 'users/', id: receiver.id, payload: receiver })
  };

  const updateNotificationStatus = async (notification, status) => {
    if (!notification) return;
    const notifications = await getData('notifications/', user.id);
    notification.status = status;
    const updatedNotifications = notifications && notifications.length ? notifications.map(n => n.notificationId === notification.notificationId ? notification : n) : [];
    insertFirebaseDatabase({ key: 'notifications/', id: user.id, payload: updatedNotifications });
  };

  const addCometChatFriend = async senderId => {
    if (!user || !senderId) {
      return;
    }
    const cometChatAppId = `${cometChatConfig.cometChatAppId}`;
    const cometChatAppRegion = `${cometChatConfig.cometChatRegion}`;
    const cometChatApiKey = `${cometChatConfig.cometChatRestApiKey}`;
    const url = `https://${cometChatAppId}.api-${cometChatAppRegion}.cometchat.io/v3/users/${user.id}/friends`;
    const options = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        appId: cometChatAppId,
        apiKey: cometChatApiKey,
      },
      body: JSON.stringify({ accepted: [senderId] }),
    };
    try {
      const response = await fetch(url, options);
      if (response) {
        showMessage('Info', 'The request was accepted successfully');
      } else {
        showMessage('Error', 'Failure to add friend. Please try again');
      }
    } catch (error) {
      showMessage('Error', 'Failure to add friend. Please try again');
    }
  };

  const addNotificationForSender = async senderId => {
    if (!senderId) return;
    const notifications = await getData('notifications/', senderId);
    const newNotification = buildNewNotification();
    const updatedNotifications = notifications && notifications.length ? [...notifications, newNotification] : [newNotification];
    insertFirebaseDatabase({ key: 'notifications/', id: senderId, payload: updatedNotifications });
  };

  const buildNewNotification = () => ({
    isFriendRequest: false,
    notificationId: uuidv4(),
    notificationImage: user.avatar,
    notificationTitle: `${user.fullname} has accepted your friend request`,
    senderId: user.id
  });

  const getData = async (key, id) => {
    if (!id) {
      return null;
    }
    return await getFirebaseData({ key, id });
  };

  const showMessage = (title, message) => {
    Alert.alert(title, message);
  };

  const getKey = (item) => {
    return item.notificationId;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.list}>
      <FlatList
        numColumns={1}
        data={notifications}
        renderItem={renderItems}
        keyExtractor={(item, index) => getKey(item)}
      />
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
  list: {
    backgroundColor: '#fff',
    flex: 1,
  },
  listItem: {
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  listItemLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  listItemImage: {
    width: 72,
    height: 72,
    borderRadius: 36
  },
  listItemTitleContainer: {
    flexDirection: 'column',
    flex: 1
  },
  listItemMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  listItemMessageFlex: {
    flex: 1
  },
  listItemStatusLabel: {
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  listItemRight: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8
  },
  acceptFriendBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 88
  },
  acceptFriendLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  rejectFriendBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 88
  },
  rejectFriendLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center'
  }
});

export default Notifications;