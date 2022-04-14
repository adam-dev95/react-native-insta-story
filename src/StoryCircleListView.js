import { firebase } from "@react-native-firebase/messaging";
import React, { Component } from "react";
import { View, FlatList, Text } from "react-native";
import StoryCircleListItem from "./StoryCircleListItem";

class StoryCircleListView extends Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        const {
            data,
            handleStoryItemPress,
            unPressedBorderColor,
            pressedBorderColor,
            avatarSize,
            showText,
            textStyle,
            scroll
        } = this.props;

        return (
            <View>
                {scroll ?
                    (
                        <FlatList
                            keyExtractor={(item, index) => index.toString()}
                            data={data}
                            horizontal
                            style={{ paddingLeft: 12 }}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                            ListFooterComponent={<View style={{ flex: 1, width: 8 }} />}
                            renderItem={({ item, index }) => (
                                <View>
                                    {item.user_name === 'Sponsoring' ?
                                        (
                                            <View style={{ display: 'none' }}>
                                                <StoryCircleListItem
                                                    avatarSize={avatarSize}
                                                    handleStoryItemPress={() =>
                                                        handleStoryItemPress && handleStoryItemPress(item, index)
                                                    }
                                                    unPressedBorderColor={unPressedBorderColor}
                                                    pressedBorderColor={pressedBorderColor}
                                                    item={item}
                                                    showText={showText}
                                                    textStyle={textStyle}
                                                />
                                            </View>
                                        ) : (
                                            <StoryCircleListItem
                                                avatarSize={avatarSize}
                                                handleStoryItemPress={() =>
                                                    handleStoryItemPress && handleStoryItemPress(item, index)
                                                }
                                                unPressedBorderColor={unPressedBorderColor}
                                                pressedBorderColor={pressedBorderColor}
                                                item={item}
                                                showText={showText}
                                                textStyle={textStyle}
                                            />
                                        )}
                                </View>
                            )}
                        />
                    ) : (
                        <FlatList
                            keyExtractor={(item, index) => index.toString()}
                            data={data}
                            scrollEnabled={false}
                            style={{ paddingLeft: 0 }}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                            ListFooterComponent={<View style={{ flex: 1, width: 8 }} />}
                            renderItem={({ item, index }) => (
                                <StoryCircleListItem
                                    avatarSize={avatarSize}
                                    handleStoryItemPress={() =>
                                        handleStoryItemPress && handleStoryItemPress(item, index)
                                    }
                                    unPressedBorderColor={unPressedBorderColor}
                                    pressedBorderColor={pressedBorderColor}
                                    item={item}
                                    showText={showText}
                                    textStyle={textStyle}
                                />
                            )}
                        />
                    )}
            </View>
        );
    }
}

export default StoryCircleListView;
