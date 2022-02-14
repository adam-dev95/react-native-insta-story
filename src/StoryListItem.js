import React, {useState, useEffect, useRef} from 'react';
import {
    Animated,
    Image,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    TouchableWithoutFeedback,
    ActivityIndicator,
    View,
    Platform,
    SafeAreaView,
    KeyboardAvoidingView
} from "react-native";
import type {IUserStoryItem} from "./interfaces/IUserStory";
import {usePrevious} from "./helpers/StateHelpers";
import {isNullOrWhitespace} from "./helpers/ValidationHelpers";
import GestureRecognizer from 'react-native-swipe-gestures';
import firebase from '@react-native-firebase/app';
import { useNavigation } from '@react-navigation/native';
import colors, { screen } from '../../../src/global/constants';
import SlidingUpPanel from 'rn-sliding-up-panel'
import { ScrollView, TextInput } from 'react-native-gesture-handler';






const {width, height} = Dimensions.get('window');

type Props = {
    profileName: string,
    profileImage: string,
    duration?: number,
    onFinish?: function,
    onClosePress: function,
    key: number,
    swipeText?: string,
    customSwipeUpComponent?: any,
    customCloseComponent?: any,
    stories: IUserStoryItem[],
};

export const StoryListItem = (props: Props) => {
    const stories = props.stories;
    const db = firebase.firestore();
    const navigation = useNavigation()

    const [load, setLoad] = useState(true);
    const [pressed, setPressed] = useState(false);
    const [comment, setComment] = useState(true)
    const [chat, setChat] = useState('')
    const [open, setOpen] = useState(false);
    const [content, setContent] = useState(
        stories.map((x) => {
            return {
                story_id: x.story_id,
                image: x.story_image,
                onPress: x.onPress,
                swipeText: x.swipeText,
                finish: 0
            }
        }));

    const [current, setCurrent] = useState(0);

    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        setCurrent(0);
        if (props.currentPage != 0) {
            let data = [...content];
            data.map((x, i) => {
                x.finish = 0;
            })
            setContent(data)
            start();
        }
    }, [props.currentPage]);

    const prevCurrent = usePrevious(current);

    useEffect(() => {
        if (!isNullOrWhitespace(prevCurrent)) {
            if (current > prevCurrent && content[current - 1].image == content[current].image) {
                start();
            } else if (current < prevCurrent && content[current + 1].image == content[current].image) {
                start();
            }
        }

    }, [current]);

    function start() {
        setLoad(false);
        progress.setValue(0);
        startAnimation();
    }

    function startAnimation() {
        Animated.timing(progress, {
            toValue: 1,
            duration: props.duration,
            useNativeDriver: false
        }).start(({finished}) => {
            if (finished) {
                next();
            }
        });
    }

    function onSwipeUp() {
        if (props.onClosePress) {
            props.onClosePress();
        }
        if (content[current].onPress) {
            content[current].onPress();
        }
    }

    function onSwipeDown() {
        props?.onClosePress();
    }

    const config = {
        velocityThreshold: 0.3,
        directionalOffsetThreshold: 80
    };

    function next() {
        // check if the next content is not empty
        setLoad(true);
        setChat('')
        if (current !== content.length - 1) {
            let data = [...content];
            data[current].finish = 1;
            setContent(data);
            setCurrent(current + 1);
            progress.setValue(0);
        } else {
            // the next content is empty
            close('next');
        }
    }

    function previous() {
        // checking if the previous content is not empty
        setLoad(true);
        setChat('')

        if (current - 1 >= 0) {
            let data = [...content];
            data[current].finish = 0;
            setContent(data);
            setCurrent(current - 1);
            progress.setValue(0);
        } else {
            // the previous content is empty
            close('previous');
        }
    }

    function close(state) {
        let data = [...content];
        data.map(x => x.finish = 0);
        setContent(data);
        progress.setValue(0);
        if (props.currentPage == props.index) {
            if (props.onFinish) {
                props.onFinish(state);
            }
        }
    }

     getProfileInfos = async () => {
        const res=await db
        .collection('users')
        .doc(props.id)
        .onSnapshot(doc=>{
            title=doc.data().title
            displayName=doc.data().displayName
            id=doc.data().id
            photoURL=doc.data().photoURL
            openProfile(title,displayName,id,photoURL)
        })
      }

     openProfile=(title,displayName,id,photoURL)=>{
        data={
            id: id,
            name: displayName,
            title: title,
            photoUrl: photoURL
            }
        props.onClosePress()
        navigation.navigate("ProfileFriend", {
            userData: data
        });
     }

     slidePanel = () => {

        if(!open){
            _panel.show()
            setOpen(!open)
            time=JSON.stringify(progress)
            time=parseFloat(time)
            progress.setValue(time)
        }else{
            _panel.hide()
            setOpen(!open)
            startAnimation()

        }
    }

    storyDelete = async () => {
        story_id=content[current].story_id
        id=firebase.auth().currentUser.uid

        const res = await db
        .collection('users')
        .doc(id)
        .collection('stories')
        .doc(story_id)
        .delete()

        props.onClosePress()

    }

    optionSliding = () => {
        _panel.hide()
        setOpen(!open)
        startAnimation()
    }

    pressTextInput = () => {
        time=JSON.stringify(progress)
        time=parseFloat(time)
        progress.setValue(time)
    }

    outTextInput = () => {
        startAnimation()
    }

    sendChat = () =>{
        destinataireId=props.id
        destinataireName=props.profileName
        photoUrl=props.profileImage
        story_id=content[current].story_id
        storyImg=content[current].image

        let toSend = { 
            _id: db.collection("chats").doc().id,
            createdAt: new Date(),
            destinataireId: destinataireId,
            destinataireSeen: false,
            share: {
              message:chat,
              story_id: story_id,
              story:storyImg,
              typeContent: 'story',
              contentUser:{
                  photoURL:photoUrl,
                  displayName:destinataireName,
                  id:destinataireId
              }
            },
            user: {
              _id: firebase.auth().currentUser.uid,
              avatar: firebase.auth().currentUser.photoURL,
              name: firebase.auth().currentUser.displayName
            },
        }
        // const chatId = props.id + firebase.auth().currentUser.uid
        if (firebase.auth().currentUser.uid < props.id) {
            chatId = firebase.auth().currentUser.uid + props.id;
          } else {
            chatId = props.id + firebase.auth().currentUser.uid;
          }
        let chatRef = db.collection("chats").doc(chatId);

        let userChatRef = db
        .collection("users")
        .doc(firebase.auth().currentUser.uid)
        .collection("chats")
        .doc(chatId)

        let destinataireChatRef = db
          .collection("users")
          .doc(destinataireId)
          .collection("chats")
          .doc(chatId)
        chatRef
          .get()
          .then(async chat => {
            if (!chat.exists) {
              chatRef.set(
                {
                  users: [firebase.auth().currentUser.uid, destinataireId]
                },
                { merge: true }
              )
              .then(() => {
                userChatRef.set(
                  {
                    users: [destinaireId]
                  },
                  { merge: true }
                ).then(() => {
                  destinataireChatRef.set(
                    {
                      users: [firebase.auth().currentUser.uid]
                    },
                    { merge: true }
                  )
                })
              })
            }
            chatRef.collection("messages")
              .add(toSend)
              .then(async ref => {
                await userChatRef.update({lastMessage: toSend.createdAt})
                await destinataireChatRef.update({lastMessage: toSend.createdAt})
                await chatRef.update({lastMessage: toSend.createdAt})
              })
          })
          setChat('')
    }




    const swipeText = content?.[current]?.swipeText || props.swipeText || 'Swipe Up';
     if(props.user){
        return (
            <GestureRecognizer
                onSwipeUp={(state) => onSwipeUp(state)}
                onSwipeDown={(state) => onSwipeDown(state)}
                config={config}
                style={{
                    flex: 1,
                    backgroundColor: 'black'
                }}
            >
                <SafeAreaView>
                    <View style={styles.backgroundContainer}>
                        <Image onLoadEnd={() => start()}
                            source={{uri: content[current].image}}
                            style={styles.imageUser}
                        />
                        {load && <View style={styles.spinnerContainer}>
                            <ActivityIndicator size="large" color={'white'}/>
                        </View>}
                    </View>
                </SafeAreaView>
                <View style={{flexDirection: 'column', flex: 1,}}>
                    <View style={styles.animationBarContainer}>
                        {content.map((index, key) => {
                            return (
                                <View key={key} style={styles.animationBackground}>
                                    <Animated.View
                                        style={{
                                            flex: current == key ? progress : content[key].finish,
                                            height: 2,
                                            backgroundColor: 'white',
                                        }}
                                    />
                                </View>
                            );
                        })}
                    </View>
                    <View style={styles.userContainer}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Image style={styles.avatarImage}
                                   source={{uri: props.profileImage}}
                            />

                            <Text style={styles.avatarText}>Vous</Text>
                        </View>
                        <TouchableOpacity onPress={() => {
                            if (props.onClosePress) {
                                props.onClosePress();
                            }
                        }}>
                            <View style={styles.closeIconContainer}>
                                {props.customCloseComponent ?
                                    props.customCloseComponent :
                                    <Text style={{color: 'white'}}>X</Text>
                                }
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.option}>
                                <TouchableOpacity
                                    style={styles.more}
                                    onPress={slidePanel}
                                >
                                    <View style={styles.moreDots} />
                                    <View style={styles.moreDots} />
                                    <View style={styles.moreDots} />
                                </TouchableOpacity>
                            </View>
                    <View style={styles.pressContainer}>
                        <TouchableWithoutFeedback
                            onPressIn={() => progress.stopAnimation()}
                            onLongPress={() => setPressed(true)}
                            onPressOut={() => {
                                setPressed(false);
                                startAnimation();
                            }}
                            onPress={() => {
                                if (!pressed && !load) {
                                    previous()
                                }
                            }}
                        >
                            <View style={{flex: 1}}/>
                        </TouchableWithoutFeedback>
                        <TouchableWithoutFeedback onPressIn={() => progress.stopAnimation()}
                                                  onLongPress={() => setPressed(true)}
                                                  onPressOut={() => {
                                                      setPressed(false);
                                                      startAnimation();
                                                  }}
                                                  onPress={() => {
                                                      if (!pressed && !load) {
                                                          next()
                                                      }
                                                  }}>
                            <View style={{flex: 1}}/>
                        </TouchableWithoutFeedback>
                    </View>
                </View>
                {content[current].onPress &&
                <TouchableOpacity activeOpacity={1}
                                  onPress={onSwipeUp}
                                  style={styles.swipeUpBtn}>
                    {props.customSwipeUpComponent ?
                        props.customSwipeUpComponent :
                        <>
                            <Text style={{color: 'white', marginTop: 5}}></Text>
                            <Text style={{color: 'white', marginTop: 5}}>{swipeText}</Text>
                        </>
                    }
                </TouchableOpacity>}
                <SlidingUpPanel
                    ref={(b) => (_panel = b)}
                    animatedValue={new Animated.Value(0)}
                    containerStyle={styles.containerSliding}
                    draggableRange={{ top: 140, bottom: 0 }}
                    showBackdrop={false}
                    allowDragging={false}
                    snappingPoints={[140, 0]}
                >
                    <ScrollView contentContainerStyle={styles.interaction}>
                        <TouchableOpacity
                            onPress={optionSliding}>
                            <View style={styles.optionBar} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.buttonOption}
                            onPress={storyDelete}
                        >
                            <Text style={styles.optionLabel}>Supprimer</Text>

                        </TouchableOpacity>

                    </ScrollView>
                </SlidingUpPanel>
            </GestureRecognizer>
        )
     }else{
        return (

            <GestureRecognizer
                onSwipeUp={(state) => onSwipeUp(state)}
                onSwipeDown={(state) => onSwipeDown(state)}
                config={config}
                style={{
                    flex: 1,
                    backgroundColor: 'black'
                }}
            >
                <SafeAreaView>
                    <View style={styles.backgroundContainer}>
                        <Image onLoadEnd={() => start()}
                            source={{uri: content[current].image}}
                            style={props.id === firebase.auth().currentUser.uid ? styles.imageUser : styles.image}
                        />
                        {load && <View style={styles.spinnerContainer}>
                            <ActivityIndicator size="large" color={'white'}/>
                        </View>}
                    </View>
                </SafeAreaView>
                <View style={{flexDirection: 'column', flex: 1,}}>
                    <View style={styles.animationBarContainer}>
                        {content.map((index, key) => {
                            return (
                                <View key={key} style={styles.animationBackground}>
                                    <Animated.View
                                        style={{
                                            flex: current == key ? progress : content[key].finish,
                                            height: 2,
                                            backgroundColor: 'white',
                                        }}
                                    />
                                </View>
                            );
                        })}
                    </View>
                    <View style={styles.userContainer}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Image style={styles.avatarImage}
                                   source={{uri: props.profileImage}}
                            />
                            <TouchableOpacity
                            onPress={getProfileInfos}>
                            <Text style={styles.avatarText}>{props.profileName}</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={() => {
                            if (props.onClosePress) {
                                props.onClosePress();
                            }
                        }}>
                            <View style={styles.closeIconContainer}>
                                {props.customCloseComponent ?
                                    props.customCloseComponent :
                                    <Text style={{color: 'white'}}>X</Text>
                                }
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.pressContainer}>
                        <TouchableWithoutFeedback
                            onPressIn={() => progress.stopAnimation()}
                            onLongPress={() => setPressed(true)}
                            onPressOut={() => {
                                setPressed(false);
                                startAnimation();
                            }}
                            onPress={() => {
                                if (!pressed && !load) {
                                    previous()
                                }
                            }}
                        >
                            <View style={{flex: 1}}/>
                        </TouchableWithoutFeedback>
                        <TouchableWithoutFeedback onPressIn={() => progress.stopAnimation()}
                                                  onLongPress={() => setPressed(true)}
                                                  onPressOut={() => {
                                                      setPressed(false);
                                                      startAnimation();
                                                  }}
                                                  onPress={() => {
                                                      if (!pressed && !load) {
                                                          next()
                                                      }
                                                  }}>
                            <View style={{flex: 1}}/>
                        </TouchableWithoutFeedback>
                    </View>
                </View>
                {props.id === firebase.auth().currentUser.uid ? (
                    <View></View>
                ):(
                    comment ? (
                        <KeyboardAvoidingView style={styles.keyboard} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200} behavior={'position'}>
                        <View style={[styles.bottom, {minHeight: screen.h/9 }]}>
                          <View style={[styles.rowContainer]}

                          >
                            <TextInput
                              style={styles.input}
                              value={chat}
                              placeholder={'Ecrivez votre message...'}
                              placeholderTextColor={colors.label}
                              keyboardType={"default"}
                              maxLength={25}
                              multiline={true}
                              returnKeyType={"done"}
                              onChangeText={e => setChat(e)}
                              ref={input => { text = input }}
                              onFocus={pressTextInput}
                              onBlur={outTextInput}
                            />
                            {chat.length > 0 ? (
                                <TouchableOpacity
                                    onPress={this.sendChat}
                                    style={styles.sendButton}
                                >
                                    <Image
                                      source={require("../../../src/assets/images/icons/bxs-sendWhite.png")}
                                      resizeMode={"contain"}
                                      style={styles.illuSend}
                                    />
                                </TouchableOpacity>
                            ) :(
                            <TouchableOpacity
                                onPress={this.sendChat}
                                style={styles.sendButton}
                                disabled
                            >
                                    <Image
                                      source={require("../../../src/assets/images/icons/bxs-sendWhite.png")}
                                      resizeMode={"contain"}
                                      style={styles.illuSend}
                                    />
                          </TouchableOpacity>)}
                          </View>
                        </View>
                        <View style={styles.feinte}></View>

                      </KeyboardAvoidingView>
                ) : (
                    <View>

                    </View>
                )
                )}
            </GestureRecognizer>
        )
     }
}


export default StoryListItem;

StoryListItem.defaultProps = {
    duration: 10000
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    image: {
        width: width,
        height: height,
        resizeMode: 'cover'
    },
    imageUser:{
        width: width,
        height: height,
        resizeMode: 'cover'
    },
    backgroundContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    },
    spinnerContainer: {
        zIndex: -100,
        position: "absolute",
        justifyContent: 'center',
        backgroundColor: 'black',
        alignSelf: 'center',
        width: width,
        height: height,
    },
    animationBarContainer: {
        flexDirection: 'row',
        paddingTop: 10,
        paddingHorizontal: 10,
    },
    animationBackground: {
        height: 2,
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(117, 117, 117, 0.5)',
        marginHorizontal: 2,
    },
    userContainer: {
        height: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
    },
    avatarImage: {
        height: 30,
        width: 30,
        borderRadius: 100
    },
    avatarText: {
        fontWeight: 'bold',
        color: 'white',
        paddingLeft: 10,
    },
    closeIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        paddingHorizontal: 15,
    },
    pressContainer: {
        flex: 1,
        flexDirection: 'row'
    },
    swipeUpBtn: {
        position: 'absolute',
        right: 0,
        left: 0,
        alignItems: 'center',
        bottom: Platform.OS == 'ios' ? 20 : 50
    },
    option: {
        position: 'absolute',
        paddingTop: 25,
        right: 18,
        top:40,
        zIndex:100
    },
    more: {
        alignItems: 'center',
        alignContent: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 30,
        height: 32,
        width: 32,
        paddingRight: 3,
    },
    moreDots: {
        width: 5,
        height: 5,
        borderRadius: 3,
        marginLeft: 3,
        backgroundColor: colors.appBg,
        color: colors.appBg,
        marginTop:1.5
    },
    containerSliding: {
        zIndex: 1000,
        paddingLeft: 30,
        paddingRight: 20,
        borderTopStartRadius: 20,
        borderTopEndRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        elevation: 6,
    },
    interaction: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    optionBar: {
        marginTop: 10,
        marginBottom: 10,
        height: 5,
        width: 60,
        backgroundColor: colors.andOne,
        borderRadius: 30,
    },
    buttonOption: {
        marginTop: 15,
        width: screen.w / 1.2,
        height: 50,
        marginBottom: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'space-between',
        alignItems: 'center',
        alignSelf: 'center',
        flexDirection: 'row',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: colors.dBlue,
    },
    optionLabel: {
        fontFamily: 'Gelion-Medium',
        color: 'white',
        fontSize: 19,
        marginLeft: 20,
    },
    optionArrow: {
        marginRight: 20,
    },
    comment:{
        height:40,
        width:screen.w/1.5,
        backgroundColor:'rgba(0, 0, 0, 0.4)',
        alignSelf:'center',
        borderRadius:12,
        marginBottom:10,
        justifyContent:'center'

    },
    commentButton:{
        paddingLeft:15
    },
    commentText:{
        color:'white',
        fontFamily:'Gelion-Medium'
    },
    keyboard: {
        position: 'absolute',
        bottom:0,
        zIndex: 100,
        marginTop:20

      },
      bottom: {
        width: screen.w,
        paddingHorizontal: 20,
        backgroundColor:'rgb(49,37,33)',
        justifyContent:'center',

      },
      rowContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: 'space-between',
        width: screen.w - 40,

      },
      input: {
        fontFamily: "Gelion-Light",
        fontSize: 17,
        color: 'white',
        width: screen.w / 1.4,
        height: "100%",
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: colors.greyBorder,
        borderRadius: 20,
        backgroundColor:'rgb(49,37,33)',
        paddingTop:10,

      },
      label: {
        fontFamily: "Gilroy-Light",
        fontSize: 17,
        color: 'white',
        marginLeft: 25
      },
      sendButton: {
        backgroundColor:'grey',
        height: 45,
        width: 45,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
      },
      illuSend: {
        width: 20,
        height: 20
      },
      feinte:{
          height:20,
          width:width,
          backgroundColor:'rgb(49,37,33)'
        }

});
