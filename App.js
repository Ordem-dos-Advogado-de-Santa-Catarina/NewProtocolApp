// Arquivo: App.js

import React, { useEffect, useState, useRef } from 'react';
import {
    StyleSheet,
    SafeAreaView,
    BackHandler,
    Platform, // <<< GARANTIDO QUE ESTÁ IMPORTADO
    StatusBar,
    LogBox,
    Text, // <<< Text não está sendo usado diretamente, mas mantido caso necessário
    View, // <<< View não está sendo usado diretamente, mas mantido caso necessário
    ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';

// Conteúdo HTML da página de manutenção (igual ao seu)
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

// Script de limpeza (igual ao seu)
const clearWebViewDataScript = `(function() { try { localStorage.clear(); sessionStorage.clear(); var cookies = document.cookie.split(";"); for (var i = 0; i < cookies.length; i++) { var cookie = cookies[i]; var eqPos = cookie.indexOf("="); var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie; document.cookie = name.trim() + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"; } window.ReactNativeWebView?.postMessage('cleared'); return true; } catch (e) { window.ReactNativeWebView?.postMessage('clear_error: ' + e.message); return false; } })();`;


export default function App() {
  const [key, setKey] = useState(Date.now());
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [debugMessage, setDebugMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState('https://intranet.oab-sc.org.br/arearestrita/NewProtocol');

  // Função de limpeza (igual à sua)
  const clearData = () => {
    if (webViewRef.current) {
      console.log("Injetando script de limpeza de dados...");
      webViewRef.current.injectJavaScript(clearWebViewDataScript);
    }
  };

  // Botão Voltar (igual ao seu)
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

  // Estado de Navegação (igual ao seu)
  const handleNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
    console.log('Navigation State:', navState.url); // Log URL changes (mantido)
  };

  // Tratamento de Erro Genérico (onError)
  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    // Log detalhado do erro (mantido)
    console.warn('WebView Error Details (onError):', JSON.stringify(nativeEvent, null, 2));
    setIsLoading(false);

    // <<< REMOVIDO o if que tentava ignorar SSL aqui >>>
    // A lógica de ignorar SSL será tratada por onReceivedSslError

    // Verifica se o erro é SSL e se estamos no Android. Se sim, provavelmente já foi tratado
    // por onReceivedSslError, então evitamos mostrar a manutenção desnecessariamente.
    const isSslError = nativeEvent.description?.includes('SSL error') || nativeEvent.description?.includes('net::ERR_CERT');
    if (isSslError && Platform.OS === 'android') {
         console.log("onError: Erro SSL detectado no Android, provavelmente tratado por onReceivedSslError. Ignorando para manutenção.");
         return; // Não mostra a tela de manutenção para este caso específico
    }

    // Lógica para mostrar manutenção para outros erros (igual à sua, ajustada sem a checagem SSL explícita aqui)
    const failedUrl = nativeEvent.url || currentUrl;
    const isConnectionError = nativeEvent.code === -6 || nativeEvent.code === -2 || nativeEvent.description?.includes('Could not connect');
    // A condição shouldShowMaintenance agora foca em erros de conexão ou outros não abortados/SSL já tratados
    const shouldShowMaintenance = nativeEvent.httpStatusCode !== 404 && (isConnectionError || !nativeEvent.description?.includes('net::ERR_ABORTED'));

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

  // --- ADICIONADO HANDLER PARA ERROS SSL (ANDROID) ---
  const handleSslError = (event) => {
      if (Platform.OS === 'android') {
          console.warn('SSL Error Received (onReceivedSslError):', event.nativeEvent.url, event.nativeEvent.error);
          // !!! ATENÇÃO: ISSO IGNORA O ERRO SSL E CONTINUA !!!
          // !!! USE COM EXTREMO CUIDADO E APENAS SE CONFIA NO DOMÍNIO !!!
          // !!! A SOLUÇÃO CORRETA É ARRUMAR O CERTIFICADO NO SERVIDOR !!!
          try {
               // A API pode variar um pouco entre versões, mas geralmente é `event.proceed()`
               if (typeof event.proceed === 'function') {
                  console.log("Chamando event.proceed()");
                  event.proceed();
               } else {
                  console.error("onReceivedSslError: event.proceed is not a function. Não foi possível ignorar o erro SSL.");
                  // Se proceed não existir, não podemos fazer nada, o erro ocorrerá.
               }

          } catch (e) {
              console.error("Erro ao tentar chamar event.proceed() em onReceivedSslError:", e);
          }
          return true; // Indica que o evento foi tratado
      }
      // Em outras plataformas ou se não puder tratar, retorna false (ou nada)
      return false;
  };
  // --- FIM DO HANDLER SSL ---

  // Tratamento de Mensagens (igual ao seu)
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

  // Limpeza de Logs (igual ao seu)
  useEffect(() => {
    LogBox.ignoreLogs(['Require cycle:']);
    // LogBox.ignoreLogs(['WebView: `onReceivedSslError` is not supported on iOS.']); // Descomente se o aviso incomodar
  }, []);

  // Início do Carregamento (igual ao seu)
  const handleLoadStart = (syntheticEvent) => {
    if (!isMaintenance) {
      console.log("WebView Load Start:", syntheticEvent.nativeEvent.url);
      setIsLoading(true);
    }
  };

  // Fim do Carregamento (igual ao seu, com lógica de limpeza)
  const handleLoadEnd = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.log("WebView Load End:", nativeEvent.url, "Success:", !nativeEvent.loading && !nativeEvent.error);
    // Esconde o loading independentemente do sucesso aqui, pois onError/onReceivedSslError tratarão falhas
    setIsLoading(false);

    if (!isMaintenance && !nativeEvent.error && webViewRef.current && nativeEvent.url === currentUrl) {
      console.log(`Carregamento de ${currentUrl} concluído com sucesso. Tentando limpar dados...`);
      clearData();
    } else if (!isMaintenance && nativeEvent.error) {
      // Apenas loga, confia nos handlers de erro específicos
      console.warn("onLoadEnd reportou erro:", nativeEvent.description);
    }
  };

  // Define a source (igual ao seu)
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
          style={styles.webview} // Estilo mantido
          // --- Props Essenciais (mantidas do seu código) ---
          cacheEnabled={false}
          incognito={Platform.OS === 'android' ? true : false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={['*']}
          // --- Handlers de Eventos (com adição do onReceivedSslError) ---
          onNavigationStateChange={handleNavigationStateChange}
          onError={handleError}
          onHttpError={handleError} // Mantido por segurança
          onReceivedSslError={handleSslError} // <<< ADICIONADO PARA IGNORAR ERROS SSL NO ANDROID
          onMessage={handleWebViewMessage}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          // --- Outras Props (mantidas do seu código) ---
          startInLoadingState={false}
          androidHardwareAccelerationDisabled={false}
          allowsInlineMediaPlayback={true}
          mixedContentMode="always" // Mantido do seu código
          // --- Debug (mantido do seu código) ---
          onLoadProgress={({ nativeEvent }) => {
            console.log("Load progress:", nativeEvent.progress);
          }}
        />
        {/* Indicador de Loading (igual ao seu) */}
        {isLoading && !isMaintenance && (
          <ActivityIndicator
            style={styles.loadingIndicator} // Estilo mantido
            size="large"
            color="#0267a6"
          />
        )}
      </SafeAreaView>
    </>
  );
}

// Estilos (iguais aos seus, não modificados)
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