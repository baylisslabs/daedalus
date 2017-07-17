import React from 'react';
import { observable, runInAction } from 'mobx';
import { storiesOf } from '@kadira/storybook';
import faker from 'faker';
import moment from 'moment';
import StoryDecorator from './support/StoryDecorator';
import WalletTransactionsList from '../app/components/wallet/transactions/WalletTransactionsList';
import WalletTransaction from '../app/domain/WalletTransaction';
import TrasactionAddresses from '../app/domain/WalletTransaction';
import BigNumber from 'bignumber.js';

const generateTransaction = (
  type, date, amount, confirmations=1
) => {
  return new WalletTransaction({
    id: faker.random.uuid(),
    title: '',
    type,
    amount,
    date,
    description: '',
    numberOfConfirmations: confirmations,
    addresses: new TrasactionAddresses({
      from: [faker.random.uuid()], to: [faker.random.uuid()]
    }),
  });
};

storiesOf('WalletTransactionsList', module)

  .addDecorator((story) => (
    <StoryDecorator>
      {story()}
    </StoryDecorator>
  ))

  // ====== Stories ======

  .add('transactions grouped by days', () => (
    <WalletTransactionsList
      transactions={[
        generateTransaction('adaIncome', new Date(), new BigNumber(1)),
        generateTransaction('adaIncome', moment().subtract(1, 'days').toDate(), new BigNumber(1)),
        generateTransaction('adaIncome', new Date(), new BigNumber(1)),
        generateTransaction('adaIncome', moment().subtract(2, 'days').toDate(), new BigNumber(1)),
        generateTransaction('adaIncome', moment().subtract(1, 'days').toDate(), new BigNumber(1)),
      ]}
      isLoadingTransactions={false}
      hasMoreToLoad={false}
      assuranceMode={{ low: 1, medium: 2 }}
    />
  ));
