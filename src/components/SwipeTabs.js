// Horizontal swipe between bottom tabs.
//
// @react-navigation/bottom-tabs has no built-in swipe gesture (only
// material-top-tabs does, and that needs react-native-pager-view which is
// unreliable on web/PWA — our priority target). So we detect the swipe
// ourselves with react-native-gesture-handler and navigate to the neighbour.
//
// withSwipeTabs(Screen) wraps a screen so:
//   • swipe LEFT  → next tab to the right
//   • swipe RIGHT → previous tab to the left
//
// The tab order is read from the navigator's live state at swipe time
// (navigation.getState()), so there is no hardcoded list to keep in sync —
// reordering the <Tab.Screen>s in App.js is automatically respected.
//
// The pan only ACTIVATES on a clearly horizontal drag (activeOffsetX) and
// FAILS the moment vertical movement dominates (failOffsetY), so it never
// fights a ScrollView inside the screen.

import React from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

export default function withSwipeTabs(ScreenComponent) {
  return function SwipeableScreen(props) {
    const navigation = useNavigation();

    const goTo = (dir) => {
      // getState() on a tab screen returns the tab navigator's state: the
      // focused tab `index` and the ordered `routeNames`.
      const { index, routeNames } = navigation.getState();
      const next = index + dir;
      if (next >= 0 && next < routeNames.length) {
        navigation.navigate(routeNames[next]);
      }
    };

    const pan = Gesture.Pan()
      .runOnJS(true)               // callbacks on JS thread — no worklets needed
      .activeOffsetX([-25, 25])    // only start tracking on a horizontal drag
      .failOffsetY([-20, 20])      // give up if it's really a vertical scroll
      .onEnd((e) => {
        if (e.translationX <= -60) goTo(1);       // swiped left  → next tab
        else if (e.translationX >= 60) goTo(-1);  // swiped right → prev tab
      });

    return (
      <GestureDetector gesture={pan}>
        <View style={{ flex: 1 }}>
          <ScreenComponent {...props} />
        </View>
      </GestureDetector>
    );
  };
}
