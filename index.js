import { registerRootComponent } from 'expo';
import { useEffect } from 'react';



import App from './App';

// In your App.js or main component
useEffect(() => {
    const requestPermissions = async () => {
        try {
            const result = await AlarmModule.requestPermissions();
            if (!result.granted) {
                console.warn('Alarm permissions not granted');
            }
        } catch (error) {
            console.error('Permission request error:', error);
        }
    };
    requestPermissions();
}, []);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
