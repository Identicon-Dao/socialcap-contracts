import { PrivateKey, PublicKey, Mina, Field, AccountUpdate, fetchAccount } from "snarkyjs";
import { VotingContract } from "./VotingContract.js";
import { checkTransaction } from "./tests/test-helpers.js";

export { ClaimsVotingFactory, VotingInstance };

let proofsEnabled = true;

const ClaimsVotingFactory = {
  compile: compileVotingContract, 
  deploy: deployVotingContract,
  getInstance: getVotingInstance
}

type VotingInstance = {
  instance: any,
  address: PublicKey,
  secret?: PrivateKey
}

const DEPLOY_TX_FEE = 300_000_000;


async function compileVotingContract(proofsEnabled?: boolean) {
  // compile Contract
  proofsEnabled = proofsEnabled === undefined ? true : proofsEnabled;
  console.log("proofs enabled=", proofsEnabled);
  console.log("compiling Contract ...");
  if (proofsEnabled) await VotingContract.compile();
  console.log("compiled !");
}


async function deployVotingContract(
  claimUid: Field,
  requiredVotes: Field,
  requiredPositives: Field,
  deployerAccount: PublicKey,
  deployerKey: PrivateKey,
): Promise<VotingInstance> {
  // we need to generate a new key pair for each deploy !
  const zkAppKey = PrivateKey.random();
  const zkAppAddr = zkAppKey.toPublicKey();
  console.log(`\nzkApp instance address=${zkAppAddr.toBase58()}`);

  let zkApp = new VotingContract(zkAppAddr);
  console.log("zkApp instance created!");
  
  // deploy it 
  let txn = await Mina.transaction(
    { sender:deployerAccount, fee: DEPLOY_TX_FEE }, () => {
    // IMPORTANT: the deployer account must already be funded 
    // or this will fail miserably ughhh
    AccountUpdate.fundNewAccount(deployerAccount);
    zkApp.deploy();
  });
  await txn.prove();

  // this tx needs .sign(), because `deploy()` adds an account update 
  // that requires signature authorization
  txn.sign([deployerKey, zkAppKey]);
  let pendingTx = await txn.send();
  console.log("zkApp instance deployed !")
  
  checkTransaction(pendingTx);

  // wait for account ...
  await fetchAccount({ publicKey: zkAppAddr });

  await loopUntilAccountExists({
    account: zkAppAddr,
    eachTimeNotExist: () => {
      console.log('Waiting for zkApp account to be fully available ...');
    },
    isZkAppAccount: true,
  });

  // initialize it !
  // we can only call setup() AFTER we are sure the deployed account exists
  // otherwise we have failures when initializing ...
  txn = await Mina.transaction(
    { sender:deployerAccount, fee: DEPLOY_TX_FEE }, () => {
    zkApp.setup(claimUid, requiredVotes, requiredPositives);
  });
  await txn.prove();
  let pndTx2 = await txn.sign([deployerKey]).send();
  console.log("zkApp instance initialized !")

  checkTransaction(pndTx2);

  // get some value after deploy
  let actionsState = zkApp.actionsState.get(); 
  console.log("zkApp instance actionsState=", actionsState.toString())

  const instance: VotingInstance = {
    instance: zkApp, 
    address: zkAppAddr, 
    secret: zkAppKey 
  };

  logIt(instance);
  return instance;
}


async function getVotingInstance(
  publicKey: PublicKey
): Promise<VotingInstance> {
  // we need to create an instance of an already deployed contract
  console.log(`\nzkApp instance address=${publicKey.toBase58()}`);

  let response = await fetchAccount({ publicKey: publicKey });
  console.log("zkApp account exists ?", response);
  console.log("zkApp status=", response.account?.zkapp?.appState);

  let zkApp = new VotingContract(publicKey);
  console.log("zkApp instance created!");
  
  // get some value after creating just for checking
  let actionsState = zkApp.actionsState.get(); 
  console.log("zkApp instance actionsState=", actionsState.toString())

  const instance: VotingInstance = {
    instance: zkApp, 
    address: publicKey
  };

  logIt(instance);
  return instance;
}


function logIt(zkapp: any) {
  console.log(
    `instance= ${JSON.stringify(zkapp.instance.account, null, 2)}`
    +`\naddress= ${zkapp.address.toBase58()}`
    +`\nsecret= ${zkapp?.secret?.toBase58() || ''}`  
  );
}


async function loopUntilAccountExists({
  account,
  eachTimeNotExist,
  isZkAppAccount,
}: {
  account: PublicKey;
  eachTimeNotExist: () => void;
  isZkAppAccount: boolean;
}) {
  for (;;) {
    let response = await fetchAccount({ publicKey: account });
    let accountExists = response.account !== undefined;
    //console.log(response.account);

    if (isZkAppAccount) {
      // CHANGED: accountExists = response.account?.appState !== undefined;
      accountExists = response.account?.zkapp?.appState !== undefined;
    }

    if (!accountExists) {
      eachTimeNotExist();
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } else {
      // TODO add optional check that verification key is correct once this is available in SnarkyJS
      return response.account!;
    }
  }
}
