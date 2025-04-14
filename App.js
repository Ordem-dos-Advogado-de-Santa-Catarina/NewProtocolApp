// Arquivo: App.js

import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, SafeAreaView, BackHandler, Platform, StatusBar, LogBox, Text, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

// --- ATENÇÃO: Network Security Config ainda é necessária para erro SSL ---
// (Comentário sobre Network Security Config mantido)

// Conteúdo HTML da página de manutenção (igual ao anterior)
const createMaintenanceHTML = (debugMessage) => `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aplicativo em Manutenção - OAB Santa Catarina</title>
    <style>
        /* Estilos CSS (iguais aos anteriores) */
        body { font-family: Arial, sans-serif; margin: 0; background-color: #f0f0f0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; }
        .container { padding: 20px; background-color: white; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); margin: 20px; }
        h1 { color: #d9534f; }
        p { color: #333; line-height: 1.6; }
        .button { display: inline-block; padding: 10px 20px; background-color: #0267a6; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; cursor: pointer; margin-bottom: 10px; }
        .debug-info { margin-top: 20px; padding: 10px; background-color: #eee; border: 1px solid #ccc; border-radius: 5px; text-align: left; font-size: 0.8em; color: #555; word-wrap: break-word; /* Para quebrar linhas longas no debug */ }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛠️ Aplicativo em Manutenção</h1>
        <p>Desculpe, o aplicativo está temporariamente em manutenção para melhorias.</p>
        <p>Por favor, tente novamente mais tarde.</p>
        <div class="button" id="reloadButton">Tentar Novamente</div>
        ${debugMessage ? `<div class="debug-info"><strong>Debug Info:</strong><br/>${debugMessage.replace(/\n/g, '<br/>')}</div>` : ''}
    </div>
    <script>
        // Script do botão (igual ao anterior)
        document.getElementById('reloadButton').addEventListener('click', function() {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage('reload');
            }
        });
    </script>
</body>
</html>
`;

export default function App() {
    const [key, setKey] = useState(Date.now());
    const webViewRef = useRef(null);
    const [canGoBack, setCanGoBack] = useState(false);
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [debugMessage, setDebugMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUrl, setCurrentUrl] = useState('https://intranet.oab-sc.org.br/arearestrita/NewProtocol');

    // Script de limpeza (igual, com try-catch)
    const clearWebViewDataScript = `(function() { try { localStorage.clear(); sessionStorage.clear(); var cookies = document.cookie.split(";"); for (var i = 0; i < cookies.length; i++) { var cookie = cookies[i]; var eqPos = cookie.indexOf("="); var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie; document.cookie = name.trim() + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"; } window.ReactNativeWebView?.postMessage('cleared'); return true; } catch (e) { window.ReactNativeWebView?.postMessage('clear_error: ' + e.message); return false; } })();`;

    // Função de limpeza (igual)
    const clearData = () => {
        if (webViewRef.current) {
            console.log("Injetando script de limpeza de dados...");
            webViewRef.current.injectJavaScript(clearWebViewDataScript);
        }
    };

    // Botão Voltar (igual)
    useEffect(() => {
        const backAction = () => {
            if (canGoBack && webViewRef.current && !isMaintenance) {
                webViewRef.current.goBack();
                return true;
            }
            return false;
        };
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [canGoBack, isMaintenance]);

    // Estado de Navegação (igual)
    const handleNavigationStateChange = (navState) => {
        setCanGoBack(navState.canGoBack);
    };

    // Tratamento de Erro (igual)
    const handleError = (syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.warn('WebView Error: ', nativeEvent);
        setIsLoading(false);

        const failedUrl = nativeEvent.url || currentUrl;
        const isSslError = nativeEvent.code === 3 || nativeEvent.description?.includes('SSL error') || nativeEvent.description?.includes('net::ERR_CERT');
        const isConnectionError = nativeEvent.code === -6 || nativeEvent.code === -2 || nativeEvent.description?.includes('Could not connect');
        const shouldShowMaintenance = nativeEvent.httpStatusCode !== 404 && (isSslError || isConnectionError || !nativeEvent.description?.includes('net::ERR_ABORTED'));

        if (shouldShowMaintenance) {
            const errorInfo = `
                URL: ${failedUrl}<br/>
                Code: ${nativeEvent.code || 'N/A'}<br/>
                Description: ${nativeEvent.description || 'N/A'}<br/>
                Domain: ${nativeEvent.domain || 'N/A'}<br/>
                HTTP Status: ${nativeEvent.httpStatusCode || 'N/A'}<br/>
                SSL Related: ${isSslError ? 'Yes' : 'No'}
            `;
            setDebugMessage(errorInfo);
            setIsMaintenance(true);
        }
    };

    // Tratamento de Mensagens (MODIFICADO)
    const handleWebViewMessage = (event) => {
        const message = event.nativeEvent.data;
        console.log("Mensagem recebida do WebView:", message);
        if (message === 'reload') {
            setIsMaintenance(false); // Sai do modo manutenção
            setDebugMessage(null);    // Limpa mensagem de erro
            // REMOVIDO: clearData(); // NÃO limpa dados aqui, pois o contexto é errado
            setIsLoading(true);       // Mostra loading para a nova tentativa
            setKey(prevKey => prevKey + 1); // Força recarga completa do WebView
        } else if (message === 'cleared') {
            console.log("Confirmação: Dados do WebView limpos via JS.");
        } else if (message.startsWith('clear_error:')) {
            // Loga o erro que veio do catch do script injetado
            console.error("Erro reportado pelo script de limpeza:", message);
        }
    };

    // Limpeza de Logs (igual)
    useEffect(() => {
        LogBox.ignoreLogs(['Require cycle:']);
    }, []);

    // Início do Carregamento (igual)
    const handleLoadStart = (syntheticEvent) => {
        if (!isMaintenance) {
           console.log("WebView Load Start:", syntheticEvent.nativeEvent.url);
           setIsLoading(true);
        }
    };

    // Fim do Carregamento (MODIFICADO - Lógica de Limpeza)
    const handleLoadEnd = (syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.log("WebView Load End:", nativeEvent.url, "Success:", !nativeEvent.loading && !nativeEvent.error);
        setIsLoading(false); // Esconde o loading independentemente do sucesso aqui

        // Limpa os dados SOMENTE SE:
        // 1. NÃO estivermos em modo de manutenção
        // 2. O carregamento NÃO terminou com erro
        // 3. O WebView existe
        // 4. A URL carregada é a URL principal que queremos limpar
        if (!isMaintenance && !nativeEvent.error && webViewRef.current && nativeEvent.url === currentUrl) {
            console.log(`Carregamento de ${currentUrl} concluído com sucesso. Tentando limpar dados...`);
            clearData(); // <<< Chama a limpeza aqui, no contexto correto
        } else if (!isMaintenance && nativeEvent.error) {
            // Se não estiver em manutenção, mas onLoadEnd reportar um erro que onError não pegou
            console.warn("onLoadEnd reportou erro, verificando se manutenção é necessária:", nativeEvent.description);
            // Poderia re-chamar handleError ou parte de sua lógica aqui se necessário,
            // mas geralmente onError/onHttpError são mais confiáveis para isso.
        }
    };

    // Define a source (igual)
    const webViewSource = isMaintenance
        ? { html: createMaintenanceHTML(debugMessage) }
        : { uri: currentUrl };

    return (
        <>
            <StatusBar backgroundColor={isMaintenance ? "#CC0000" : "rgb(57, 73, 171)"} barStyle="light-content" />
            <SafeAreaView style={styles.container}>
                <WebView
                    key={key}
                    ref={webViewRef}
                    source={webViewSource}
                    style={styles.webview}
                    // --- Props Essenciais ---
                    cacheEnabled={false}
                    incognito={Platform.OS === 'android' ? true : false} // incognito é mais relevante/suportado no Android para tentar limpar estado
                    javaScriptEnabled={true}
                    domStorageEnabled={true} // Crucial para localStorage funcionar
                    originWhitelist={['*']} // Permite postMessage de/para qualquer origem
                    // --- Handlers de Eventos ---
                    onNavigationStateChange={handleNavigationStateChange}
                    onError={handleError}
                    onHttpError={handleError} // Redundante mas seguro
                    onMessage={handleWebViewMessage}
                    onLoadStart={handleLoadStart}
                    onLoadEnd={handleLoadEnd} // <<< Lógica de limpeza movida para cá
                    // --- Outras Props ---
                    startInLoadingState={false} // Usamos nosso ActivityIndicator
                    androidHardwareAccelerationDisabled={false}
                    allowsInlineMediaPlayback={true}
                    // --- Debug (remova se não precisar mais) ---
                    onLoadProgress={({ nativeEvent }) => {
                         console.log("Load progress:", nativeEvent.progress);
                    }}
                />

                {/* Indicador de Loading (igual) */}
                {isLoading && !isMaintenance && (
                    <ActivityIndicator
                        style={styles.loadingIndicator}
                        size="large"
                        color="#0267a6"
                    />
                )}
            </SafeAreaView>
        </>
    );
}

// Estilos (igual ao anterior)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    webview: {
        flex: 1,
    },
    loadingIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 10
    },
});