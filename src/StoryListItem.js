import React, { useState, useEffect, useRef } from 'react';
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
import type { IUserStoryItem } from "./interfaces/IUserStory";
import { usePrevious } from "./helpers/StateHelpers";
import { isNullOrWhitespace } from "./helpers/ValidationHelpers";
import GestureRecognizer from 'react-native-swipe-gestures';
import firebase from '@react-native-firebase/app';
import { useNavigation } from '@react-navigation/native';
import colors, { screen, shadowStyles } from '../../../src/global/constants';
import SlidingUpPanel from 'rn-sliding-up-panel'
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import NativeAdView, {
    AdvertiserView,
    HeadlineView,
    StarRatingView,
    StoreView,
    TaglineView,
    ImageView,
    NativeMediaView,
    IconView
} from 'react-native-admob-native-ads';
import { AdManager } from 'react-native-admob-native-ads';
import Video from 'react-native-video';



const { width, height } = Dimensions.get('window');

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
    const [durationTime, setDurationTime] = useState(0)
    const nativeAdViewRef = useRef();
    const video = useRef();
    const configAds = {
        maxAdContetRating: "MA",
        tagForChildDirectedTreatment: false,
        tagForUnderAgeConsent: false,
    };
    AdManager.setRequestConfiguration(configAds);

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
        nativeAdViewRef.current?.loadAd();
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

    function start(e) {
        setLoad(false);
        progress.setValue(0);
        startAnimation(e);
    }

    function startAnimation(e) {
        if (content[current].image.includes('videoStory')) {
            Animated.timing(progress, {
                toValue: 1,
                duration: e * 1000,
                useNativeDriver: false
            }).start(({ finished }) => {
                if (finished) {
                    next();
                }
            });
        } else {
            Animated.timing(progress, {
                toValue: 1,
                duration: 10000,
                useNativeDriver: false
            }).start(({ finished }) => {
                if (finished) {
                    next();
                }
            });
        }
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
        const res = await db
            .collection('users')
            .doc(props.id)
            .onSnapshot(doc => {
                title = doc.data().title
                displayName = doc.data().displayName
                id = doc.data().id
                photoURL = doc.data().photoURL
                openProfile(title, displayName, id, photoURL)
            })
    }

    openProfile = (title, displayName, id, photoURL) => {
        data = {
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
        if (!open) {
            _panel.show()
            setOpen(!open)
            time = JSON.stringify(progress)
            time = parseFloat(time)
            progress.setValue(time)
        } else {
            _panel.hide()
            setOpen(!open)
            startAnimation()

        }
    }

    storyDelete = async () => {
        story_id = content[current].story_id
        id = firebase.auth().currentUser.uid

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
        time = JSON.stringify(progress)
        time = parseFloat(time)
        progress.setValue(time)
    }

    sendChat = () => {
        destinataireId = props.id
        destinataireName = props.profileName
        photoUrl = props.profileImage
        story_id = content[current].story_id
        storyImg = content[current].image

        let toSend = {
            _id: db.collection("chats").doc().id,
            createdAt: new Date(),
            destinataireId: destinataireId,
            destinataireSeen: false,
            share: {
                message: chat,
                story_id: story_id,
                story: storyImg,
                typeContent: 'story',
                contentUser: {
                    photoURL: photoUrl,
                    displayName: destinataireName,
                    id: destinataireId
                }
            },
            user: {
                _id: firebase.auth().currentUser.uid,
                avatar: firebase.auth().currentUser.photoURL,
                name: firebase.auth().currentUser.displayName
            },
        }
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
                                    users: [destinataireId]
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
                        await userChatRef.update({ lastMessage: toSend.createdAt })
                        await destinataireChatRef.update({ lastMessage: toSend.createdAt })
                        await chatRef.update({ lastMessage: toSend.createdAt })
                    })
            })
        setChat('')
        startAnimation()
    }

    function Logger(tag = 'AD', type, value) {
        console.log(`[${tag}][${type}]:`, value);
    }

    const onAdFailedToLoad = event => {
        Logger('AD', 'FAILED', event.error.message);
    };

    const onAdLoaded = () => {
        Logger('AD', 'LOADED', 'Ad has loaded successfully');
    };

    const onAdClicked = () => {
        Logger('AD', 'CLICK', 'User has clicked the Ad');
        props.onClosePress
    };

    const swipeText = content?.[current]?.swipeText || props.swipeText || 'Swipe Up';
    if (props.user) {
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
                            source={{ uri: content[current].image }}
                            style={styles.imageUser}
                        />
                        {load && <View style={styles.spinnerContainer}>
                            <ActivityIndicator size="large" color={'white'} />
                        </View>}
                    </View>
                </SafeAreaView>
                <View style={{ flexDirection: 'column', flex: 1, }}>
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
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Image style={styles.avatarImage}
                                source={{ uri: props.profileImage }}
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
                                    <Text style={{ color: 'white' }}>X</Text>
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
                            <View style={{ flex: 1 }} />
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
                            <View style={{ flex: 1 }} />
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
                                <Text style={{ color: 'white', marginTop: 5 }}></Text>
                                <Text style={{ color: 'white', marginTop: 5 }}>{swipeText}</Text>
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
    } else {
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
                        {content[current].image.includes("videoStory") ? (
                            <>
                                <Video
                                    source={{ uri: content[current].image }}
                                    ref={video}
                                    style={styles.image}
                                    onLoad={e => start(e.duration)}

                                />
                            </>
                        )
                            :
                            <>
                                <Image onLoadEnd={() => start()}
                                    source={props.profileName === 'Sponsoring' ? require("./assets/images/fullSaumonLight.png") : { uri: content[current].image }}
                                    style={props.id === firebase.auth().currentUser.uid ? styles.imageUser : styles.image}
                                />
                            </>
                        }
                        {/* {props.stories.map(doc=>{
                            if(doc.type =='image'){
                                return(
                                    <Image onLoadEnd={() => start()}
                                    source={props.profileName === 'Sponsoring' ? require("./assets/images/fullSaumonLight.png") : {uri: content[current].image} }
                                    style={props.id === firebase.auth().currentUser.uid ? styles.imageUser : styles.image}
                                />
                                )
                            }
                            else if(doc.type =='video'){
                                return(
                                <Video
                                    source={{uri: content[current].image}}
                                    ref={video}
                                    style={styles.image}
                                    onLoad={ e => start(e.duration)}
                                />
                                )
                            }
                            else{
                                return(
                                    <Image onLoadEnd={() => start()}
                                    source={props.profileName === 'Sponsoring' ? require("./assets/images/fullSaumonLight.png") : {uri: content[current].image} }
                                    style={props.id === firebase.auth().currentUser.uid ? styles.imageUser : styles.image}
                                />
                                )
                            }
                        })} */}

                        {load && <View style={styles.spinnerContainer}>
                            <ActivityIndicator size="large" color={'white'} />
                        </View>}
                    </View>
                </SafeAreaView>
                <View style={{ flexDirection: 'column', flex: 1, }}>
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
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {props.profileName === 'Sponsoring' ? (
                                <Image style={styles.avatarImage}
                                    source={require("../../../src/assets/images/logoNotif.png")}
                                />
                            ) : (
                                <Image style={styles.avatarImage}
                                    source={{ uri: props.profileImage }}
                                />
                            )}

                            <TouchableOpacity
                                onPress={() => console.log(content[current].image)}>
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
                                    <Text style={{ color: 'white' }}>X</Text>
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
                            <View style={{ flex: 1 }} />
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
                            <View style={{ flex: 1 }} />
                        </TouchableWithoutFeedback>
                    </View>
                </View>
                {props.profileName === 'Sponsoring' ? (
                    <View style={styles.adsContainer}>
                        <View style={styles.containerAds}>
                            <NativeAdView
                                ref={nativeAdViewRef}
                                refreshInterval={60000 * 2}
                                onAdClicked={onAdClicked}
                                style={{
                                    width: '100%',
                                    height: '80%',
                                    alignSelf: 'center',
                                    backgroundColor: "transparent",
                                }}
                                enableTestMode
                                adUnitID="ca-app-pub-3940256099942544/2247696110"
                            >
                                <View
                                    style={{
                                        width: '100%',
                                    }}
                                >
                                    <ImageView
                                        style={{
                                            width: "100%",
                                            height: 190,
                                            marginTop: 5,
                                            zIndex: 100
                                        }}
                                    />
                                    <View
                                        style={{
                                            marginTop: -10,
                                            height: 350,
                                            width: "100%",
                                            backgroundColor: 'rgb(245,165,114)',
                                            borderBottomEndRadius: 20,
                                            borderBottomStartRadius: 20,
                                            alignItems: 'center',
                                            paddingLeft: 30,
                                            paddingRight: 30
                                        }}>
                                        <IconView
                                            style={{
                                                width: 70,
                                                height: 70,
                                                marginTop: 50
                                            }}
                                        />

                                        <HeadlineView
                                            style={{
                                                fontSize: 18,
                                                fontFamily: 'Gelion-Regular',
                                                marginTop: 20,
                                                textAlign: 'center',
                                            }}
                                        />
                                        <TaglineView
                                            numberOfLines={2}
                                            style={{
                                                marginTop: 15,
                                                fontSize: 14,
                                                fontFamily: 'Gilroy-Medium',
                                                textAlign: 'center'
                                            }}
                                        />
                                        <AdvertiserView
                                            style={{
                                                fontSize: 10,
                                                color: 'gray',
                                            }}
                                        />
                                        <StoreView
                                            style={{
                                                fontSize: 12,
                                                marginTop: 15
                                            }}
                                        />
                                        <View
                                            style={{
                                                marginTop: 20,
                                                height: 50,
                                                width: "100%",
                                                backgroundColor: 'rgb( 252,232,201)',
                                                borderRadius: 12,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                ...shadowStyles
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontFamily: 'Gelion-Medium',
                                                    fontSize: 20,
                                                    color: colors.dBlue
                                                }}>Visiter</Text>

                                        </View>

                                    </View>

                                </View>
                            </NativeAdView>
                        </View>
                    </View>
                ) : (
                    <View></View>
                )}
                {props.id === firebase.auth().currentUser.uid || props.profileName === 'Sponsoring' ? (
                    <View></View>
                ) : (
                    comment ? (
                        <KeyboardAvoidingView style={styles.keyboard} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200} behavior={'position'}>
                            <View style={[styles.bottom, { minHeight: screen.h / 9 }]}>
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
                                        onFocus={pressTextInput}
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
                                    ) : (
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
                            <View style={styles.box}></View>

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
    imageUser: {
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
        top: 40,
        zIndex: 100
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
        marginTop: 1.5
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
    comment: {
        height: 40,
        width: screen.w / 1.5,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        alignSelf: 'center',
        borderRadius: 12,
        marginBottom: 10,
        justifyContent: 'center'

    },
    commentButton: {
        paddingLeft: 15
    },
    commentText: {
        color: 'white',
        fontFamily: 'Gelion-Medium'
    },
    keyboard: {
        position: 'absolute',
        bottom: 0,
        zIndex: 100,
        marginTop: 20

    },
    bottom: {
        width: screen.w,
        paddingHorizontal: 20,
        backgroundColor: 'rgb(49,37,33)',
        justifyContent: 'center',

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
        backgroundColor: 'rgb(49,37,33)',
        paddingTop: 10,

    },
    label: {
        fontFamily: "Gilroy-Light",
        fontSize: 17,
        color: 'white',
        marginLeft: 25
    },
    sendButton: {
        backgroundColor: 'grey',
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
    box: {
        height: 20,
        width: width,
        backgroundColor: 'rgb(49,37,33)'
    },
    adsContainer: {
        marginTop: 100,
        height: screen.h - 110,
        width: screen.w,
        padding: 20,
    },
    containerAds: {
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        padding: 10,
        ...shadowStyles
    }

});
