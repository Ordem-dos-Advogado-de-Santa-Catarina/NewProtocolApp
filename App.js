import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, SafeAreaView, BackHandler, Platform, StatusBar, LogBox, Text, TouchableOpacity, View } from 'react-native'; // Import Text, TouchableOpacity, View
import { WebView } from 'react-native-webview';

// Conteúdo HTML da página de manutenção (inline para simplificar, baseado nos arquivos fornecidos)
const createMaintenanceHTML = (debugMessage) => `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aplicativo em Manutenção - OAB Santa Catarina</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            background-color: #f0f0f0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
        }
        .container {
            padding: 20px;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            margin: 20px;
        }
        h1 {
            color: #d9534f; /* Vermelho Bootstrap danger */
        }
        p {
            color: #333;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #0267a6;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 10px; /* Reduced margin for buttons */
            cursor: pointer; /* Indica que é clicável */
            margin-bottom: 10px; /* Added margin between buttons */
        }
        .debug-info {
            margin-top: 20px;
            padding: 10px;
            background-color: #eee;
            border: 1px solid #ccc;
            border-radius: 5px;
            text-align: left;
            font-size: 0.8em;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛠️ Aplicativo em Manutenção</h1>
        <p>Desculpe, o aplicativo está temporariamente em manutenção para melhorias.</p>
        <p>Por favor, tente novamente mais tarde.</p>
        <div class="button" id="reloadButton">Tentar Novamente</div>
        ${debugMessage ? `<div class="debug-info"><strong>Debug Info:</strong><br/>${debugMessage}</div>` : ''}
    </div>
    <script>
        document.getElementById('reloadButton').addEventListener('click', function() {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage('reload');
            } else {
                alert('Recarregar não disponível em modo de desenvolvimento web.'); // Mensagem para debug web
            }
        });
        document.getElementById('viewPageButton').addEventListener('click', function() { // New button action
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage('viewPage'); // New message to handle "view page anyway"
            } else {
                alert('Ver página não disponível em modo de desenvolvimento web.');
            }
        });
    </script>
</body>
</html>
`;


export default function App() {
    const [key, setKey] = useState(0);
    const webViewRef = useRef(null);
    const [canGoBack, setCanGoBack] = useState(false);
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [debugMessage, setDebugMessage] = useState(null); // State for debug message

    useEffect(() => {
        setKey(prevKey => prevKey + 1);
    }, []);

    useEffect(() => {
        // Função para lidar com o botão voltar do Android
        const backAction = () => {
            if (canGoBack && webViewRef.current && !isMaintenance) {
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
    }, [canGoBack, isMaintenance]);

    const handleNavigationStateChange = (navState) => {
        setCanGoBack(navState.canGoBack);
    };

    const handleError = (event) => {
        const { nativeEvent } = event;
        if (nativeEvent.httpStatusCode !== 404) {
            const errorInfo = `
                URL: ${nativeEvent.url || 'N/A'}<br/>
                Error Domain: ${nativeEvent.domain || 'N/A'}<br/>
                Error Code: ${nativeEvent.code || 'N/A'}<br/>
                Description: ${nativeEvent.description || 'N/A'}<br/>
                HTTP Status Code: ${nativeEvent.httpStatusCode || 'N/A'}
            `;
            setDebugMessage(errorInfo); // Set debug message state
            setIsMaintenance(true);
        } else {
            setIsMaintenance(false);
            setDebugMessage(null); // Clear debug message if 404
        }
    };

    const handleWebViewMessage = (event) => {
        if (event.nativeEvent.data === 'reload') {
            setIsMaintenance(false);
            setDebugMessage(null); // Clear debug message on reload attempt
            setKey(prevKey => prevKey + 1);
        } else if (event.nativeEvent.data === 'viewPage') { // Handle "viewPage" message
            setIsMaintenance(false); // Just exit maintenance mode, try to load original URL
            setDebugMessage(null); // Clear debug message when viewing page
            setKey(prevKey => prevKey + 1); // Force reload of original URL
        }
    };


    useEffect(() => {
        LogBox.ignoreLogs(['Warning: Text strings must be rendered within a <Text> component.']);
    }, []);


    return (
        <>
            <StatusBar backgroundColor={isMaintenance ? "#CC0000" : "rgb(57, 73, 171)"} barStyle="light-content" /> {/* Conditional StatusBar color */}
            <SafeAreaView style={styles.container}>
                {isMaintenance && debugMessage ? (
                    <View style={styles.debugOverlay}>
                         {/* You can render debug message in React Native view if needed, but HTML display is richer */}
                    </View>
                ) : null}
                <WebView
                    key={key}
                    ref={webViewRef}
                    source={isMaintenance ? { html: createMaintenanceHTML(debugMessage) } : { uri: 'https://intranet.oab-sc.org.br/arearestrita/NewProtocol' }}
                    cacheEnabled={false}
                    incognito={true}
                    style={styles.webview}
                    onNavigationStateChange={handleNavigationStateChange}
                    onError={handleError}
                    onMessage={handleWebViewMessage}
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
    debugOverlay: { // Example style for a React Native debug overlay (if you want to use it)
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderTopWidth: 1,
        borderColor: '#ccc',
    },
});