import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { defineMessages, intlShape } from 'react-intl';
import vjf from 'mobx-react-form/lib/validators/VJF';
import suggestedMnemonics from '../../../../../common/config/crypto/valid-words.en';
import { isValidMnemonic } from '../../../../../common/config/crypto/decrypt';
import ReactToolboxMobxForm from '../../../utils/ReactToolboxMobxForm';
import { validateMnemonics } from '../../../utils/validations';
import DialogCloseButton from '../../widgets/DialogCloseButton';
import Dialog from '../../widgets/Dialog';
import styles from './WalletRecoveryPhraseStepDialogs.scss';
import { MnemonicInput } from '../mnemonic-input';

export const messages = defineMessages({
  recoveryPhraseStep2Title: {
    id: 'wallet.settings.recoveryPhraseStep2Title',
    defaultMessage: '!!!Wallet recovery phrase verification',
    description: 'Label for the recoveryPhraseStep2Title on wallet settings.',
  },
  recoveryPhraseStep2Description: {
    id: 'wallet.settings.recoveryPhraseStep2Description',
    defaultMessage:
      '!!!Please enter your wallet recovery phrase. Make sure you enter the words in the correct order.',
    description:
      'Label for the recoveryPhraseStep2Description on wallet settings.',
  },
  recoveryPhraseStep2Subtitle: {
    id: 'wallet.settings.recoveryPhraseStep2Subtitle',
    defaultMessage: '!!!Recovery phrase',
    description:
      'Label for the recoveryPhraseStep2Subtitle on wallet settings.',
  },
  recoveryPhraseStep2Button: {
    id: 'wallet.settings.recoveryPhraseStep2Button',
    defaultMessage: '!!!Verify',
    description: 'Label for the recoveryPhraseStep2Button on wallet settings.',
  },
  recoveryPhraseNoResults: {
    id: 'wallet.settings.recoveryPhraseInputNoResults',
    defaultMessage: '!!!No results',
    description:
      '"No results" message for the recovery phrase input search results.',
  },
  recoveryPhraseStep2InvalidMnemonics: {
    id: 'wallet.settings.recoveryPhraseStep2InvalidMnemonics',
    defaultMessage: '!!!Invalid recovery phrase',
    description:
      'Error message shown when invalid recovery phrase was entered.',
  },
});
type Props = {
  onContinue: (...args: Array<any>) => any;
  onClose: (...args: Array<any>) => any;
  expectedWordCount: number | Array<number>;
  walletName: string;
};
type State = {
  isVerifying: boolean;
};

interface FormFields {
  recoveryPhrase: string;
}

@observer
class WalletRecoveryPhraseStep2Dialog extends Component<Props, State> {
  static contextTypes = {
    intl: intlShape.isRequired,
  };
  state = {
    isVerifying: false,
  };
  form = new ReactToolboxMobxForm<FormFields>(
    {
      fields: {
        recoveryPhrase: {
          value: [],
          validators: ({ field }) =>
            validateMnemonics({
              requiredWords: this.props.expectedWordCount,
              providedWords: field.value,
              validator: (enteredWords) => [
                isValidMnemonic(enteredWords.join(' '), enteredWords.length),
                this.context.intl.formatMessage(
                  messages.recoveryPhraseStep2InvalidMnemonics
                ),
              ],
            }),
        },
      },
    },
    {
      plugins: {
        vjf: vjf(),
      },
      options: {
        showErrorsOnChange: false,
        validateOnChange: true,
      },
    }
  );

  handleSubmit = () => {
    this.form.submit({
      onSuccess: (form) => {
        const { recoveryPhrase } = form.values();

        this.setState({ isVerifying: true });
        this.props.onContinue({ recoveryPhrase });
      },
    });
  };

  render() {
    const { form } = this;
    const { intl } = this.context;
    const { onClose, expectedWordCount, walletName } = this.props;
    const { isVerifying } = this.state;
    const recoveryPhraseField = form.$('recoveryPhrase');
    const { length: enteredWordCount } = recoveryPhraseField.value;
    const canSubmit =
      !recoveryPhraseField.error &&
      !isVerifying &&
      (Array.isArray(expectedWordCount)
        ? expectedWordCount.includes(enteredWordCount)
        : enteredWordCount === expectedWordCount);
    const { reset, ...mnemonicInputProps } = recoveryPhraseField.bind();
    const actions = [
      {
        className: isVerifying ? styles.isVerifying : null,
        label: intl.formatMessage(messages.recoveryPhraseStep2Button),
        primary: true,
        onClick: this.handleSubmit,
        disabled: !canSubmit,
      },
    ];
    const maxSelections = Array.isArray(expectedWordCount)
      ? Math.max(...expectedWordCount)
      : expectedWordCount;
    return (
      <Dialog
        className={styles.dialog}
        title={intl.formatMessage(messages.recoveryPhraseStep2Title)}
        subtitle={walletName}
        actions={actions}
        closeOnOverlayClick={false}
        onClose={onClose}
        closeButton={<DialogCloseButton />}
      >
        <div className={styles.subtitle}>
          <p>{intl.formatMessage(messages.recoveryPhraseStep2Description)}</p>
        </div>
        <MnemonicInput
          {...mnemonicInputProps}
          label={intl.formatMessage(messages.recoveryPhraseStep2Subtitle)}
          availableWords={suggestedMnemonics}
          wordCount={maxSelections}
          error={recoveryPhraseField.error}
          reset={form.resetting}
        />
      </Dialog>
    );
  }
}

export default WalletRecoveryPhraseStep2Dialog;
