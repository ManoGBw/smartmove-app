# Smart Move Vendas (App Mobile)

Este é o repositório para o aplicativo mobile de gerenciamento de vendas Smart Move, desenvolvido com React Native e Expo.

## Tecnologias Utilizadas

- **React Native**: Framework para desenvolvimento de aplicativos móveis nativos.
- **Expo**: Plataforma e conjunto de ferramentas para facilitar o desenvolvimento com React Native.
- **TypeScript**: Superset do JavaScript que adiciona tipagem estática.
- **React Navigation**: Solução completa de navegação para aplicativos React Native.
- **Lucide React Native**: Pacote de ícones SVG.

## Pré-requisitos

Antes de começar, você vai precisar ter instalado em sua máquina:
- [Node.js](https://nodejs.org/en/) (versão LTS recomendada)
- [NPM](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)
- O aplicativo **Expo Go** instalado no seu dispositivo de teste (Android/iOS).

## 🚀 Começando o Projeto

Siga os passos abaixo para configurar e executar o ambiente de desenvolvimento local.

### 1. Instalação das Dependências

Clone o repositório e, na pasta raiz do projeto, execute o seguinte comando para instalar todas as dependências listadas no `package.json`:

```bash
npm install
```

### 2. Executando o Projeto

Com as dependências instaladas, inicie o servidor de desenvolvimento do Expo:

```bash
npx expo start
```

Após executar o comando, um QR Code será exibido no terminal.

**Para rodar no seu celular:**
1.  Certifique-se de que seu computador e seu celular estejam conectados na **mesma rede Wi-Fi**.
2.  Abra o aplicativo **Expo Go** no seu dispositivo.
3.  Escaneie o QR Code exibido no terminal.
4.  O aplicativo será compilado e abrirá automaticamente no seu celular.

## 📂 Estrutura de Pastas

A estrutura de pastas principal do projeto está organizada da seguinte forma:

```
src/
├── components/   # Componentes de UI reutilizáveis (Button, Card, Input)
├── navigation/   # Configuração das rotas e da navegação do app
├── screens/      # As telas principais do aplicativo (Login, Register, Dashboard)
└── theme/        # Arquivos de tema, como cores e fontes
```

## Comandos Úteis

- `npm start` ou `npx expo start`: Inicia o servidor de desenvolvimento.
- `npx expo start --android`: Inicia o servidor e tenta abrir o app em um emulador Android (se configurado).
- `npx expo start --ios`: Inicia o servidor e tenta abrir o app em um simulador iOS (requer macOS).
- `npx expo start -c`: inicia limpando cache
- `npx expo install expo-secure-store`: instalar expo-secure para armazenar o token
