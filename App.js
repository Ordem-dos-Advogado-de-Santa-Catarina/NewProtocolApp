import React, { useEffect } from 'react'; // Importe useEffect
import { StyleSheet, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import * as BrowsingData from 'expo-web-browser'; // Importe BrowsingData

export default function App() {
    useEffect(() => {
        const clearWebViewData = async () => {
            try {
                await BrowsingData.dismissAuthSession(); // Tenta limpar sessões de autenticação
                await BrowsingData.removeCookiesAsync('https://intranet.oab-sc.org.br'); // Limpa cookies específicos do domínio
                await BrowsingData.clearCacheAsync(); // Limpa o cache do navegador (pode ser mais abrangente)

                console.log('Dados de navegação limpos.');
            } catch (error) {
                console.error('Erro ao limpar dados de navegação:', error);
            }
        };

        clearWebViewData();
    }, []); // O array vazio [] garante que o useEffect rode apenas uma vez, na montagem do componente

    return (
        <SafeAreaView style={styles.container}>
            <WebView
                source={{ uri: 'https://intranet.oab-sc.org.br/arearestrita/NewProtocol/' }}
                style={styles.webview}
            />
        </SafeAreaView>
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