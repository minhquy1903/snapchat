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

import { getFirebaseData, insertFirebaseDatabase } from '../../services/common';

const SuggestedFriends = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [authedUser, setAuthedUser] = useState(null);
  const [suggestedFriends, setSuggestedFriends] = useState([]);

  const { user } = useContext(Context);

  const loadSuggestedFriends = () => {
    setIsLoading(true);
    const usersRef = databaseRef(database, 'users');
    databaseOnValue(usersRef, async snapshot => {
      const values = snapshot.val();
      if (values) {
        const keys = Object.keys(values);
        const suggestedFriends = keys.map(key => values[key]);
        const transformedSuggestedFriends = transformSuggestedFriends(suggestedFriends);
        setSuggestedFriends(() => transformedSuggestedFriends);
      } else {
        setSuggestedFriends(() => []);
      }
      setIsLoading(false);
    });
  };

  const transformSuggestedFriends = suggestedFriends => {
    const transformedSuggestedFriends = [];
    for (const friend of suggestedFriends) {
      if (shouldSuggested(friend)) {
        transformedSuggestedFriends.push(friend);
      }
    }
    return transformedSuggestedFriends;
  }

  const shouldSuggested = friend => {
    return !hasPendingRequest(friend) && !hasWaitingForApprovalRequest(friend) && !isAuthedUser(friend);
  };

  const hasPendingRequest = friend => {
    return authedUser && authedUser.pending && authedUser.pending.length && authedUser.pending.includes(friend.id);
  };

  const hasWaitingForApprovalRequest = friend => {
    return authedUser && authedUser.waiting && authedUser.waiting.length && authedUser.waiting.includes(friend.id);
  };

  const isAuthedUser = friend => {
    return friend.id === authedUser.id;
  };

  useEffect(() => {
    if (authedUser) {
      loadSuggestedFriends();
    }
    return () => {
      setSuggestedFriends([]);
      const usersRef = databaseRef(database, 'users');
      databaseOff(usersRef);
    }
  }, [authedUser]);

  useEffect(() => {
    if (user) {
      async function loadAuthedUser() {
        if (!user || !user.id) {
          return null;
        }
        const authedUser = await getFirebaseData({ key: 'users/', id: user.id });
        setAuthedUser(() => authedUser);
      };
      loadAuthedUser();
    }
  }, [user]);

  const renderItems = (item) => {
    const friend = item.item;
    return (
      <View style={styles.listItem}>
        <View style={styles.listItemLeft}>
          <Image style={styles.listItemImage} source={{ uri: friend.avatar }} />
          <Text style={styles.listItemName}>{friend.fullname}</Text>
        </View>
        <View style={styles.listItemRight}>
          <TouchableOpacity style={styles.addFriendBtn} onPress={addFriend(friend)}>
            <Text style={styles.addFriendLabel}>Add Friend</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const addFriend = friend => async () => {
    try {
      setIsLoading(true);
      await addPendingRequestForSender(friend);
      await addWaitingForApprovalForReceiver(friend);
      await addNotificationsForReceiver(friend);
      setIsLoading(false);
      showMessage('Success', 'Your request has been sent successfully');
    } catch (error) {
      setIsLoading(false);
      showMessage('Error', 'Failure to send your request');
    }
  };

  const addPendingRequestForSender = async friend => {
    if (!authedUser || !friend) return;
    authedUser.pending = authedUser.pending && authedUser.pending.length ? [...authedUser.pending, friend.id] : [friend.id];
    insertFirebaseDatabase({ key: 'users/', id: authedUser.id, payload: authedUser });
  };

  const addWaitingForApprovalForReceiver = async friend => {
    if (!authedUser || !friend) return;
    const receiver = await getReceiver(friend.id);
    if (!receiver) return;
    receiver.waiting = receiver.waiting && receiver.waiting.length ? [...receiver.waiting, authedUser.id] : [authedUser.id];
    insertFirebaseDatabase({ key: 'users/', id: receiver.id, payload: receiver });
  };

  const getReceiver = async id => {
    if (!id) return null;
    return await getFirebaseData({ key: 'users/', id });
  };

  const addNotificationsForReceiver = async friend => {
    if (!friend) return;
    const id = friend.id;
    const notifications = getLastestNotifications(id);
    const newNotification = buildNewNotification();
    const updatedNotifications = notifications && notifications.length ? [...notifications, newNotification] : [newNotification];
    insertFirebaseDatabase({ key: 'notifications/', id, payload: updatedNotifications });
  };

  const getLastestNotifications = async userId => {
    if (!userId) return;
    return await getFirebaseData({ key: 'notifications/', id: userId });
  };

  const buildNewNotification = () => ({
    status: 0,
    isFriendRequest: true,
    notificationId: uuidv4(),
    notificationImage: authedUser.avatar,
    notificationTitle: `You have received a friend request from ${authedUser.fullname}`,
    senderId: authedUser.id
  });

  const showMessage = (title, message) => {
    Alert.alert(title, message);
  };

  const getKey = (item) => {
    return item.id;
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
        data={suggestedFriends}
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
    flexDirection: 'row',
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
  listItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 16
  },
  listItemRight: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  addFriendBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addFriendLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  }
});

export default SuggestedFriends;