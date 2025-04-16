// Arquivo: config-plugins/withNetworkSecurityConfig.js

const { withAndroidManifest } = require('@expo/config-plugins');

// Função principal do plugin
const withNetworkSecurityConfig = (config) => {
  // Usa o helper 'withAndroidManifest' para modificar o AndroidManifest.xml
  return withAndroidManifest(config, async (modConfig) => {
    // modConfig.modResults é o objeto JSON representando o AndroidManifest.xml
    const manifest = modConfig.modResults;

    // Encontra a tag <application> (geralmente a primeira e única)
    const application = manifest.manifest.application?.[0];

    if (!application) {
      console.warn('withNetworkSecurityConfig: Não foi possível encontrar a tag <application> no AndroidManifest.xml');
      return modConfig;
    }

    // Garante que o atributo '$' (onde os atributos XML ficam) exista
    if (!application.$) {
      application.$ = {};
    }

    // Adiciona ou sobrescreve o atributo 'android:networkSecurityConfig'
    // O valor "@xml/network_security_config" é a referência padrão do Android
    // para o arquivo que criamos em res/xml/network_security_config.xml
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    console.log('withNetworkSecurityConfig: Atributo android:networkSecurityConfig adicionado/atualizado na tag <application>.');

    // Retorna a configuração modificada
    return modConfig;
  });
};

// Exporta o plugin
module.exports = withNetworkSecurityConfig;