import { Mina, PrivateKey, PublicKey, Field, MerkleMapWitness } from 'o1js';
import { ClaimVotingContract } from '../ClaimVotingContract.js';
import { ClaimElectorNullifier, ClaimElectorNullifierLeaf } from '../claim-elector-nullifier.js';
import { BatchVoteNullifier, BatchVoteNullifierWitness } from '@socialcap/batch-voting';


export async function dispatchTheVote(
  zkClaim: ClaimVotingContract,
  sender: {puk: PublicKey, prk: PrivateKey}, // sender and voter MUST be the same!
  vote: Field, // +1 positive, -1 negative or 0 ignored
  batchRoot: Field,
  batchWitness: BatchVoteNullifierWitness, 
  nullifierRoot: Field,
  nullifierWitness: MerkleMapWitness
) {
  // send the Vote Now
  const VOTING_TX_FEE = 300_000_000;
  const senderAndFee = { sender: sender.puk, fee: VOTING_TX_FEE };
  console.log(`\ndispatchVote claim=${zkClaim.claimUid.get()} vote=${vote} payer=${sender.puk.toBase58()}`);  

  try {
    let tx = await Mina.transaction(senderAndFee, () => { 
      zkClaim.dispatchVote(
        sender.puk,
        vote, // +1 positive, -1 negative or 0 ignored
        batchRoot,
        batchWitness,
        nullifierRoot,
        nullifierWitness
      ); 
    });
    await tx.prove();
    tx.sign([sender.prk]);
    let pendingTx = await tx.send();

    // check if Tx was success or failed
    if (!pendingTx.isSuccess) {
      console.log('error sending transaction (see above)');
      // process.exit(0); // we will NOT exit here, but retry latter !!!
      // break; 
    }
    
    console.log(
      `See transaction at https://berkeley.minaexplorer.com/transaction/${pendingTx.hash()}
      Waiting for transaction to be included...`
    );

    // TODO: I am not sure we need to do this or if we can send another transaction
    // while this one is being processed ...
    await pendingTx.wait();
  }
  catch (err: any) {
    console.log("helpers sendVote ERROR=", err.toString())
  }
}


export async function dispatchTestCase(
  zkClaim: ClaimVotingContract,
  claimUid: Field,
  testCase: { batches: any[], nullis: BatchVoteNullifier[] },
  electors: { puk: PublicKey, prk: PrivateKey }[],
  electorsInClaim: ClaimElectorNullifier
) {
  for (let j=0; j < testCase.batches.length; j++) {
    let votes = testCase.batches[j];
    let nulli = testCase.nullis[j];
  
    // now we dispatch the votes for this claim in each batch
    for (let k=0; k < votes.length; k++) {
      await dispatchTheVote(
        zkClaim, 
        electors[j],
        votes[k].result, // first batch
        nulli.root(),
        nulli.witness(BigInt(k)),
        electorsInClaim.root(),
        electorsInClaim.witness(ClaimElectorNullifierLeaf.key(
          electors[j].puk, 
          claimUid
        ))
      );
    }
  }

  let result = zkClaim.result.get();
  return result;
}
