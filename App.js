// Arquivo: App.js

import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, SafeAreaView, BackHandler, Platform, StatusBar, LogBox, Text, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

// --- ATENÇÃO: Network Security Config ainda é necessária para erro SSL ---
// (Comentário sobre Network Security Config mantido, embora onReceivedSslError seja a solução aqui)

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

    // Script de limpeza (igual)
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

    // Tratamento de Erro (igual - ainda útil para outros erros)
    const handleError = (syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.warn('WebView Error: ', nativeEvent);
        setIsLoading(false); // Garante que o loading pare em caso de erro

        // Não entra em manutenção automaticamente por erros SSL aqui,
        // pois onReceivedSslError tentará prosseguir.
        // Mantém a lógica para outros erros (conexão, HTTP, etc.)
        const failedUrl = nativeEvent.url || currentUrl;
        const isSslError = nativeEvent.code === 3 || nativeEvent.description?.includes('SSL error') || nativeEvent.description?.includes('net::ERR_CERT');
        const isConnectionError = nativeEvent.code === -6 || nativeEvent.code === -2 || nativeEvent.description?.includes('Could not connect');
        const isHttpError = nativeEvent.httpStatusCode && nativeEvent.httpStatusCode >= 400; // Erros HTTP como 404, 500

        // Entra em manutenção se NÃO for um erro SSL (tratado em onReceivedSslError)
        // E for um erro de conexão, HTTP ou outro erro relevante que não seja 'abortado'
        const shouldShowMaintenance = !isSslError &&
                                      (isConnectionError || isHttpError || (nativeEvent.code && !nativeEvent.description?.includes('net::ERR_ABORTED')));


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

    // Tratamento de Mensagens (igual)
    const handleWebViewMessage = (event) => {
        const message = event.nativeEvent.data;
        console.log("Mensagem recebida do WebView:", message);
        if (message === 'reload') {
            setIsMaintenance(false);
            setDebugMessage(null);
            setIsLoading(true);
            setKey(prevKey => prevKey + 1);
        } else if (message === 'cleared') {
            console.log("Confirmação: Dados do WebView limpos via JS.");
        } else if (message.startsWith('clear_error:')) {
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

    // Fim do Carregamento (igual)
    const handleLoadEnd = (syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.log("WebView Load End:", nativeEvent.url, "Success:", !nativeEvent.loading && !nativeEvent.error);
        setIsLoading(false);

        if (!isMaintenance && !nativeEvent.error && webViewRef.current && nativeEvent.url === currentUrl) {
            console.log(`Carregamento de ${currentUrl} concluído com sucesso. Tentando limpar dados...`);
            clearData();
        } else if (!isMaintenance && nativeEvent.error) {
            console.warn("onLoadEnd reportou erro:", nativeEvent.description);
            // A lógica de manutenção já deve ter sido tratada por onError/onHttpError/onReceivedSslError
        }
    };

    // *** NOVO: Handler para Erros SSL (Android) ***
    const handleSslError = (event) => {
        // Esta função só é chamada no Android
        console.warn('SSL Error Detected:', event.nativeEvent);

        // --- AVISO DE SEGURANÇA ---
        // Chamar proceed() aqui ignora o erro SSL (certificado inválido, hostname mismatch, etc.)
        // Isso permite a conexão, mas remove uma camada importante de segurança.
        // Use apenas se você entender os riscos e confiar no destino.
        // Idealmente, o servidor deveria ter um certificado SSL corretamente configurado.
        // --------------------------

        // Verifica se o handler existe (garantia extra, deve existir no Android)
        if (event.nativeEvent.handler) {
             console.log('Ignorando erro SSL e tentando prosseguir...');
             event.nativeEvent.handler.proceed(); // Diz ao WebView para continuar apesar do erro SSL
        } else {
             console.error('Erro SSL detectado, mas o handler não está disponível (isso não deveria acontecer no Android).');
             // Se o handler não existir por algum motivo, o comportamento padrão (cancelar) ocorrerá.
             // Poderíamos forçar a manutenção aqui se quiséssemos, mas vamos manter simples por enquanto.
             // setIsMaintenance(true);
             // setDebugMessage('SSL Error Handler Missing');
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
                    incognito={Platform.OS === 'android' ? true : false}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    originWhitelist={['*']}
                    // --- Handlers de Eventos ---
                    onNavigationStateChange={handleNavigationStateChange}
                    onError={handleError} // Mantém para outros erros
                    onHttpError={handleError} // Mantém para erros HTTP
                    onMessage={handleWebViewMessage}
                    onLoadStart={handleLoadStart}
                    onLoadEnd={handleLoadEnd}
                    // *** NOVO: Handler específico para erros SSL no Android ***
                    onReceivedSslError={handleSslError}
                    // --- Outras Props ---
                    startInLoadingState={false}
                    androidHardwareAccelerationDisabled={false}
                    allowsInlineMediaPlayback={true}
                    onLoadProgress={({ nativeEvent }) => {
                         // console.log("Load progress:", nativeEvent.progress); // Descomente se precisar de log detalhado
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