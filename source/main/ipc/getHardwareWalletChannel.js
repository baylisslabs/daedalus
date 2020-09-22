// @flow
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
import AppAda, { utils } from '@cardano-foundation/ledgerjs-hw-app-cardano';
import wasm from 'cardano-serialization-lib-nodejs'
import { BrowserWindow } from 'electron';
import { mnemonicToEntropy } from 'bip39';
import {
  DEVICE_EVENT,
  DEVICE,
  TRANSPORT_EVENT,
  UI_EVENT,
} from 'trezor-connect';
import { get, map } from 'lodash';
import { MainIpcChannel } from './lib/MainIpcChannel';
import {
  GET_HARDWARE_WALLET_TRANSPORT_CHANNEL,
  GET_EXTENDED_PUBLIC_KEY_CHANNEL,
  GET_CARDANO_ADA_APP_CHANNEL,
  GET_HARDWARE_WALLET_CONNECTION_CHANNEL,
  DERIVE_ADDRESS_CHANNEL,
  SHOW_ADDRESS_CHANNEL,
  ATTEST_UTXO_CHANNEL,
  SIGN_TRANSACTION_CHANNEL,
} from '../../common/ipc/api';

const TrezorConnect = require('trezor-connect').default;

import type {
  getHardwareWalletTransportRendererRequest,
  getHardwareWalletTransportMainResponse,
  getExtendedPublicKeyRendererRequest,
  getExtendedPublicKeyMainResponse,
  getCardanoAdaAppRendererRequest,
  getCardanoAdaAppMainResponse,
  getHardwareWalletConnectiontMainRequest,
  getHardwareWalletConnectiontRendererResponse,
  deriveAddressRendererRequest,
  deriveAddressMainResponse,
  showAddressRendererRequest,
  showAddresMainResponse,
  attestUtxoRendererRequest,
  attestUtxoMainResponse,
  signTransactionRendererRequest,
  signTransaMainResponse,
} from '../../common/ipc/api';

const getHardwareWalletTransportChannel: MainIpcChannel<
  getHardwareWalletTransportRendererRequest,
  getHardwareWalletTransportMainResponse
> = new MainIpcChannel(GET_HARDWARE_WALLET_TRANSPORT_CHANNEL);

const getExtendedPublicKeyChannel: MainIpcChannel<
  getExtendedPublicKeyRendererRequest,
  getExtendedPublicKeyMainResponse
> = new MainIpcChannel(GET_EXTENDED_PUBLIC_KEY_CHANNEL);

const getCardanoAdaAppChannel: MainIpcChannel<
  getCardanoAdaAppRendererRequest,
  getCardanoAdaAppMainResponse
> = new MainIpcChannel(GET_CARDANO_ADA_APP_CHANNEL);

const getHardwareWalletConnectionChannel: MainIpcChannel<
  getHardwareWalletConnectiontMainRequest,
  getHardwareWalletConnectiontRendererResponse
> = new MainIpcChannel(GET_HARDWARE_WALLET_CONNECTION_CHANNEL);

const deriveAddressChannel: MainIpcChannel<
  deriveAddressRendererRequest,
  deriveAddressMainResponse
> = new MainIpcChannel(DERIVE_ADDRESS_CHANNEL);

const showAddressChannel: MainIpcChannel<
  showAddressRendererRequest,
  showAddresMainResponse
> = new MainIpcChannel(SHOW_ADDRESS_CHANNEL);

const attestUtxoChannel: MainIpcChannel<
  attestUtxoRendererRequest,
  attestUtxoMainResponse
> = new MainIpcChannel(ATTEST_UTXO_CHANNEL);

const signTransactionChannel: MainIpcChannel<
  signTransactionRendererRequest,
  signTransaMainResponse
> = new MainIpcChannel(SIGN_TRANSACTION_CHANNEL);

class EventObserver {
  constructor(props) {
    // $FlowFixMe
    this.mainWindow = props;
  }
  next(eventText) {
    if (eventText.type === 'remove') {
      getHardwareWalletConnectionChannel.send(
        { disconnected: true },
        // $FlowFixMe
        this.mainWindow
      );
    }
  }
  error(e) {
    throw e;
  }
  complete() {}
}

// SETUP trezor-connect
export const handleInitTrezorConnect = sender => {
  console.debug('>>> INI: ', sender);
  const initTrezorConnect = async () => {
    TrezorConnect.on(TRANSPORT_EVENT, event => {
      console.debug('>>> TRANSPORT_EVENT: ', event);
    });
    TrezorConnect.on(DEVICE_EVENT, event => {
      console.debug('>>> DEVICE_EVENT: ', event);
    });
    TrezorConnect.on(UI_EVENT, event => {
      console.debug('>>> UI_EVENT: ', event);
    });
    // TrezorConnect.init({
    //     popup: false, // render your own UI
    //     webusb: false, // webusb is not supported in electron
    //     debug: false, // see what's going on inside connect
    //     // lazyLoad: true, // set to "false" (default) if you want to start communication with bridge on application start (and detect connected device right away)
    //     // set it to "true", then trezor-connect will not be initialized until you call some TrezorConnect.method()
    //     // this is useful when you don't know if you are dealing with Trezor user
    //     manifest: {
    //         email: 'email@developer.com',
    //         appUrl: 'electron-app-boilerplate',
    //     },
    // });
    TrezorConnect.manifest({
      email: 'email@developer.com',
      appUrl: 'http://your.application.com',
    });
    TrezorConnect.init({
      popup: false, // render your own UI
      webusb: false, // webusb is not supported in electron
      debug: false, // see what's going on inside connect
      // lazyLoad: true, // set to "false" (default) if you want to start communication with bridge on application start (and detect connected device right away)
      // set it to "true", then trezor-connect will not be initialized until you call some TrezorConnect.method()
      // this is useful when you don't know if you are dealing with Trezor user
      manifest: {
        email: 'email@developer.com',
        appUrl: 'http://your.application.com',
      },
    })
      .then(res => {
        console.debug('>>> TREZOR INIT - SUCCESS: ', res);
        sender.send('trezor-connect', 'TrezorConnect is ready!');
      })
      .catch(error => {
        console.debug('>>> TREZOR INIT - ERROR ', error);
        sender.send('trezor-connect', 'TrezorConnect init error:' + error);
      });
  };

  return initTrezorConnect;

  //  TrezorConnect.init({
  //      popup: false, // render your own UI
  //      webusb: false, // webusb is not supported in electron
  //      debug: false, // see what's going on inside connect
  //      // lazyLoad: true, // set to "false" (default) if you want to start communication with bridge on application start (and detect connected device right away)
  //      // set it to "true", then trezor-connect will not be initialized until you call some TrezorConnect.method()
  //      // this is useful when you don't know if you are dealing with Trezor user
  //      manifest: {
  //          email: 'email@developer.com',
  //          appUrl: 'electron-app-boilerplate',
  //      },
  //  }).then(() => {
  //    console.debug('>>> INIT TREZOR success <<<');
  //      // sender.send('trezor-connect', 'TrezorConnect is ready!');
  //  }).catch(error => {
  //    console.debug('>>> INIT TREZOR error <<<: ', error);
  //      // sender.send('trezor-connect', 'TrezorConnect init error:' + error);
  //  });
  //  console.debug('>>> INIT TREZOR DONE');
};

export const handleHardwareWalletDevices = (mainWindow: BrowserWindow) => {
  const handleCheckHardwareWalletDevices = async () => {
    const observer = new EventObserver(mainWindow);
    await TransportNodeHid.listen(observer);
  };

  return handleCheckHardwareWalletDevices;
};

export const handleHardwareWalletRequests = async () => {
  let deviceConnection = null;
  getHardwareWalletTransportChannel.onRequest(async request => {
    const { isTrezor } = request;
    console.debug('>>> ESTABLISH CONNECTION:  <<<, ', isTrezor);
    // Connected Trezor device info
    let deviceFeatures;
    if (isTrezor) {
      try {
        console.debug('>>> ESTABLISH CONNECTION Trezor');
        deviceFeatures = await TrezorConnect.getFeatures();
        console.debug('>>> Trezor Connected');
      } catch (e) {
        console.debug('>>> ESTABLISH CONNECTION error: <<<', error);
      }
    }

    if (deviceFeatures && deviceFeatures.success) {
      return Promise.resolve({
        deviceID: deviceFeatures.payload.device_id,
        deviceType: 'trezor',
        deviceModel: deviceFeatures.payload.model, // e.g. "1" or "T"
        deviceName:
          deviceFeatures.payload.model === '1'
            ? 'Trezor Model One'
            : 'Trezor Model T', // @TODO - to be defined
      });
    }

    try {
      const transportList = await TransportNodeHid.list();
      let hw;
      if (
        !deviceConnection ||
        (deviceConnection &&
          deviceConnection.transport &&
          // $FlowFixMe
          deviceConnection.transport.disconnected)
      ) {
        if (transportList.length) {
          hw = await TransportNodeHid.create();
        } else {
          hw = await TransportNodeHid.create();
        }
      } else {
        hw = deviceConnection.transport;
      }
      deviceConnection = new AppAda(hw);
      if (hw.deviceModel) {
        const { id, productName } = hw.deviceModel;
        return Promise.resolve({
          deviceID: null, // @TODO - to be defined
          deviceType: 'ledger',
          deviceModel: id, // e.g. nanoS
          deviceName: productName, // e.g. Ledger Nano S
        });
      }
      throw new Error('Missing device info');
    } catch (error) {
      throw error;
    }
  });

  getCardanoAdaAppChannel.onRequest(async () => {
    const transportList = await TransportNodeHid.list();
    // If transport is initialized outside Cardano ADA app it is set to disconnected so we need to reconnect same channel
    try {
      const newConnection = await TransportNodeHid.open(transportList[0]);
      deviceConnection = new AppAda(newConnection);
    } catch (e) {
      throw e;
    }
    try {
      const appVersion = await deviceConnection.getVersion();
      return Promise.resolve(appVersion);
    } catch (error) {
      throw error;
    }
  });

  getExtendedPublicKeyChannel.onRequest(async params => {
    const { path, isTrezor } = params;
    let trezorConnected = false;
    if (isTrezor) {
      const deviceFeatures = await TrezorConnect.getFeatures();
      if (deviceFeatures.success) {
        trezorConnected = true;
      }
    }
    try {
      if (!deviceConnection && !trezorConnected) {
        throw new Error('Device not connected');
      }
      let extendedPublicKey;
      if (trezorConnected && isTrezor) {
        const extendedPublicKeyResponse = await TrezorConnect.cardanoGetPublicKey(
          {
            path: "m/1852'/1815'/0'",
            showOnTrezor: true,
          }
        );
        if (!extendedPublicKeyResponse.success) {
          throw extendedPublicKeyResponse.payload;
        }
        extendedPublicKey = get(
          extendedPublicKeyResponse,
          ['payload', 'node'],
          {}
        );
      } else {
        extendedPublicKey = await deviceConnection.getExtendedPublicKey(path);
      }
      return Promise.resolve({
        publicKeyHex: isTrezor
          ? extendedPublicKey.public_key
          : extendedPublicKey.publicKeyHex,
        chainCodeHex: isTrezor
          ? extendedPublicKey.chain_code
          : extendedPublicKey.chainCodeHex,
      });
    } catch (error) {
      throw error;
    }
  });

  deriveAddressChannel.onRequest(async params => {
    // About address derivation - https://github.com/input-output-hk/cardano-wallet/wiki/About-Address-Derivation
    const derivationPath = params.derivationPath || "44'/1815'/0'/1/0";
    try {
      if (!deviceConnection) {
        throw new Error('Device not connected');
      }
      const derivedAddress = await deviceConnection.deriveAddress(
        utils.str_to_path(derivationPath)
      );
      return Promise.resolve(derivedAddress);
    } catch (error) {
      throw error;
    }
  });

  showAddressChannel.onRequest(async params => {
    const derivationPath = params.derivationPath || "44'/1815'/0'/1/0";
    try {
      if (!deviceConnection) {
        throw new Error('Device not connected');
      }
      const address = await deviceConnection.showAddress(
        utils.str_to_path(derivationPath)
      );
      return Promise.resolve(address);
    } catch (error) {
      throw error;
    }
  });

  attestUtxoChannel.onRequest(async params => {
    const { txHexData, outputIndex } = params;
    try {
      if (!deviceConnection) {
        throw new Error('Device not connected');
      }
      const utxo = await deviceConnection.attestUtxo(txHexData, outputIndex);
      return Promise.resolve(utxo);
    } catch (error) {
      throw error;
    }
  });

  signTransactionChannel.onRequest(async params => {
    const { inputs, outputs, transactions, protocolMagic, isTrezor, fee, ttl, networkId } = params;
    if (isTrezor) {
      try {
        const signedTransaction = await TrezorConnect.cardanoSignTransaction({
          inputs,
          outputs,
          fee,
          ttl,
          protocolMagic,
          networkId
        });
        return Promise.resolve({ serializedTx: signedTransaction.payload.serializedTx });
      } catch (e) {
        throw e;
      }
    }

    try {
      const signedTransaction = await deviceConnection.signTransaction(
        networkId,
        protocolMagic,
        inputs,
        outputs,
        feeStr,
        ttlStr,
        certificates,
        withdrawals,
        metadataHashHex,
      );
      return Promise.resolve(signedTransaction);
    } catch (e) {
      throw e;
    }
  });
};
