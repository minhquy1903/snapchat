import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import 'react-native-get-random-values';

import StoryItem from './StoryItem';

import {
  database,
  databaseRef,
  databaseOnValue,
  databaseOff
} from "../../firebase";

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadStories = () => {
    setIsLoading(true);
    const storiesRef = databaseRef(database, 'stories');
    databaseOnValue(storiesRef, async snapshot => {
      const values = snapshot.val();
      if (values) {
        const keys = Object.keys(values);
        const stories = keys.map(key => values[key]);
        const transformedStories = await transformStories(stories);
        setStories(() => transformedStories);
        setIsLoading(false);
      } else {
        setStories(() => []);
        setIsLoading(false);
      }
    });
  };

  const transformStories = async stories => {
    if (!stories || !stories.length) {
      return [];
    }
    const transformedStories = [];
    for (const story of stories) {
      transformedStories.push(story);
    }
    return transformedStories;
  };

  useEffect(() => {
    loadStories();
    return () => {
      setStories([]);
      const postsRef = databaseRef(database, 'posts');
      databaseOff(postsRef);
    }
  }, []);

  const renderItems = (item) => {
    const story = item.item;
    return <StoryItem story={story} />;
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
        numColumns={2}
        data={stories}
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
  }
});

export default Stories;