import React, { useState, useContext } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import 'react-native-get-random-values';
import { launchImageLibrary } from 'react-native-image-picker';
import { v4 as uuidv4 } from "uuid";
import Video from 'react-native-video';
import VideoPlayer from 'react-native-video-controls';

import Context from '../../context';

import {
  storage,
  storageRef,
  uploadBytesResumable,
  getDownloadURL
} from "../../firebase";

import { insertFirebaseDatabase } from '../../services/common';

const CreateStory = (props) => {
  const { navigation } = props;

  const [story, setStory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    user
  } = useContext(Context);

  const renderUploadedContent = () => {
    if (story && story.type && story.type.includes('image')) {
      return (
        <TouchableOpacity style={styles.storyContainer} onPress={chooseFile}>
          <Image style={styles.storyContent} source={{ uri: story.uri }} />
        </TouchableOpacity>
      );
    }
    if (story && story.type && story.type.includes('video')) {
      return Platform.OS === 'ios' ? (
        <View style={styles.videoContainer}>
          <Video
            style={styles.videoElement}
            shouldPlay
            muted={true}
            source={{ uri: story.uri }}
            allowsExternalPlayback={false} />
        </View>
      ) : (
        <View style={styles.videoContainer}>
          <VideoPlayer
            autoplay
            repeat
            showOnStart={false}
            style={styles.videoElement}
            source={{ uri: story.uri }}
          />
          <TouchableOpacity style={styles.videoOverlay} onPress={chooseFile} />
        </View>
      );
    }
    return (
      <TouchableOpacity style={styles.uploadContainer} onPress={chooseFile}>
        <Image style={styles.uploadImageIcon} source={require('../../images/image-gallery.png')} />
        <Text style={styles.uploadImageTitle}>Click to upload your image and video</Text>
      </TouchableOpacity>
    );
  }

  const chooseFile = () => {
    const options = {
      mediaType: 'mixed'
    };
    launchImageLibrary(options, (response) => {
      if (response.didCancel) return null;
      if (response.assets && response.assets.length) {
        const uri = response.assets[0].uri;
        const fileName = response.assets[0].fileName;
        const type = response.assets[0].type;
        if (uri && fileName) {
          setStory(() => ({
            name: fileName,
            uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
            type: type || 'video/quicktime'
          }));
        }
      }
    });
  };

  const createStory = async () => {
    if (!story) {
      showMessage('Error', 'Please upload your story image or video');
      return;
    }
    setIsLoading(true);
    const storageImageRef = storageRef(storage, `stories/${story.name}`);
    const localFile = await fetch(story.uri);
    const fileBlob = await localFile.blob();
    const uploadTask = uploadBytesResumable(storageImageRef, fileBlob, { contentType: story.type });
    uploadTask.on('state_changed',
      snapshot => {
      },
      error => {
        setStory(null);
        setIsLoading(false);
        showMessage('Error', 'Failure to create your story, please try again');
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        if (downloadUrl) {
          const uuid = uuidv4();
          const createdStory = buildStory({ id: uuid, content: downloadUrl });
          insertFirebaseDatabase({ key: 'stories/', id: uuid, payload: createdStory });
          setIsLoading(false);
          setStory(null);
          showMessage('Info', "Your story was created successfully");
          navigation.navigate('Home');
        }
      }
    );
  };

  const showMessage = (title, message) => {
    Alert.alert(
      title,
      message
    );
  };

  const buildStory = ({ id, content }) => ({ id, content, category: story.type.includes('image') ? 1 : 2 });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderUploadedContent()}
      <TouchableOpacity style={styles.uploadBtn} onPress={createStory}>
        <Text style={styles.uploadTxt}>Create Story</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  uploadImageIcon: {
    width: 96,
    height: 96
  },
  uploadImageTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    paddingVertical: 16
  },
  storyContainer: {
    flex: 1,
  },
  storyContent: {
    flex: 1,
    aspectRatio: 1,
    resizeMode: 'contain'
  },
  videoContainer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  videoElement: {
    flex: 1
  },
  videoOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    backgroundColor: 'transparent',
    right: 0,
    top: 0,
  },
  uploadBtn: {
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    display: 'flex',
    fontSize: 18,
    fontWeight: 'bold',
    height: 56,
    justifyContent: 'center',
    margin: 16,
    marginBottom: 24,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0
  },
  uploadTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default CreateStory;