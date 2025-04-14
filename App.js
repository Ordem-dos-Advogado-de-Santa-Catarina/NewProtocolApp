import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, SafeAreaView, BackHandler, Platform, StatusBar, LogBox } from 'react-native'; // Import LogBox
import { WebView } from 'react-native-webview';

export default function App() {
    const [key, setKey] = useState(0);
    const webViewRef = useRef(null);
    const [canGoBack, setCanGoBack] = useState(false);

    useEffect(() => {
        setKey(prevKey => prevKey + 1);
    }, []);

    useEffect(() => {
        // Função para lidar com o botão voltar do Android
        const backAction = () => {
            if (canGoBack && webViewRef.current) {
                webViewRef.current.goBack();
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [canGoBack]);

    const handleNavigationStateChange = (navState) => {
        setCanGoBack(navState.canGoBack);
    };

    // Ignora o aviso específico de "Text strings must be rendered within a <Text> component."
    useEffect(() => {
        LogBox.ignoreLogs(['Warning: Text strings must be rendered within a <Text> component.']);
    }, []);


    return (
        <>
            <StatusBar backgroundColor="#rgb(57, 73, 171)" barStyle="light-content" />
            <SafeAreaView style={styles.container}>
                <WebView
                    key={key}
                    ref={webViewRef}
                    source={{ uri: 'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/' }}
                    cacheEnabled={false}
                    incognito={true}
                    style={styles.webview}
                    onNavigationStateChange={handleNavigationStateChange}
                />
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
});