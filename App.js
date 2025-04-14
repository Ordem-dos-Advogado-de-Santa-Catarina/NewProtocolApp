// Arquivo modificado: App.js

import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, SafeAreaView, BackHandler, Platform, StatusBar, LogBox } from 'react-native';
import { WebView } from 'react-native-webview';

// Conteúdo HTML da página de manutenção (inline para simplificar, baseado nos arquivos fornecidos)
const maintenanceHTML = `
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
            margin-top: 20px;
            cursor: pointer; /* Indica que é clicável */
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛠️ Aplicativo em Manutenção</h1>
        <p>Desculpe, o aplicativo está temporariamente em manutenção para melhorias.</p>
        <p>Por favor, tente novamente mais tarde.</p>
        <div class="button" id="reloadButton">Tentar Novamente</div> 
        </div>
    <script>
        document.getElementById('reloadButton').addEventListener('click', function() {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage('reload');
            } else {
                alert('Recarregar não disponível em modo de desenvolvimento web.'); // Mensagem para debug web
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
            setIsMaintenance(true);
        } else {
            setIsMaintenance(false);
        }
    };

    const handleWebViewMessage = (event) => {
        if (event.nativeEvent.data === 'reload') {
            setIsMaintenance(false); // Sai do modo de manutenção
            setKey(prevKey => prevKey + 1); // Força o WebView a recarregar a URL original
        }
    };


    useEffect(() => {
        LogBox.ignoreLogs(['Warning: Text strings must be rendered within a <Text> component.']);
    }, []);


    return (
        <>
            <StatusBar backgroundColor="rgb(57, 73, 171)" barStyle="light-content" />
            <SafeAreaView style={styles.container}>
                <WebView
                    key={key}
                    ref={webViewRef}
                    source={isMaintenance ? { html: maintenanceHTML } : { uri: 'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/' }}
                    cacheEnabled={false}
                    incognito={true}
                    style={styles.webview}
                    onNavigationStateChange={handleNavigationStateChange}
                    onError={handleError}
                    onMessage={handleWebViewMessage} // Handler para mensagens do WebView
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