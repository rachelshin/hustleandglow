// react-native-gesture-handler MUST be the very first import.
// Without this, gesture-based interactions will crash at startup.
import 'react-native-gesture-handler';

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
