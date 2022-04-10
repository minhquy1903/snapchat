import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions
} from 'react-native';
import Video from 'react-native-video';
import VideoPlayer from 'react-native-video-controls';

const StoryItem = props => {
  const { story } = props;

  const renderPostContent = () => {
    if (story.category === 1) {
      return (
        <View style={styles.listItemContent}>
          <Image style={styles.listItemImage} source={{ uri: story.content }} />
        </View>
      );
    }
    return Platform.OS === 'ios' ? (
      <View style={styles.listItemContent}>
        <Video
          allowsExternalPlayback={false} 
          muted={true}
          shouldPlay
          source={{ uri: story.content }}
          style={styles.videoElement} />
      </View>
    ) : (
      <View style={styles.listItemContent}>
        <VideoPlayer
          autoplay
          repeat
          showOnStart={false}
          source={{ uri: story.content }}
          style={styles.videoElement}
        />
        <TouchableOpacity style={styles.videoOverlay} />
      </View>
    );
  }

  return (
    <View style={styles.listItem}>
      {renderPostContent()}
    </View>
  );
};

const {width} = Dimensions.get('window')

const styles = StyleSheet.create({
  listItem: {},
  listItemContent: {
    flex: 1,
  },
  listItemImage: {
    width: width / 2,
    aspectRatio: 1,
  },
  videoElement: {
    flex: 1
  },
  videoOverlay: {
    backgroundColor: 'transparent',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  }
});

export default StoryItem;