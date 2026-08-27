import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import { name as appName } from '../app.json';
import App from '../App';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing #root element');
}

AppRegistry.registerComponent(appName, () => App);
AppRegistry.runApplication(appName, { rootTag: root });
