import {
  createPostResponse,
  createActionHeaders,
  ActionPostResponse,
  ActionGetResponse,
  ActionPostRequest,
} from '@solana/actions';
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';

import "dotenv/config";
import { getKeypairFromEnvironment } from "@solana-developers/helpers";
import { transcode } from 'buffer';

// SECRET_KEY'i alıyoruz
const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) throw new Error("SECRET_KEY is not defined");
console.log("Loaded SECRET_KEY:", SECRET_KEY);

// SECRET_KEY'i JSON formatında parse ediyoruz
let parsedSecretKey: number[];
try {
    parsedSecretKey = JSON.parse(SECRET_KEY); // JSON stringini diziye dönüştürüyoruz
} catch (error) {
    throw new Error("SECRET_KEY must be a valid JSON array.");
}

// web sayfasi icin header ve icon alir.
const headers = createActionHeaders();
let icon_ = 'https://ibb.co/Hn3KGV0';

export const GET = async (req: Request) => {
  try{
    const requestUrl = new URL(req.url); 

    const baseHref = new URL (
      '/api/actions/superteam?',
      requestUrl.origin,
    ).toString();
    

    const payload: ActionGetResponse = {
      type: 'action',
      title: 'Solφ Superteam Advertisement',
      icon: icon_,
      description:
        'Earn SOL by Watching Advertisements!',
      label: 'Transfer',
      links: {
        actions: [
          {
            label: 'Send',
            type: 'transaction',
            href: `${baseHref}receiverWallet={receiverWallet}`,
            parameters: [
              {
                name: 'receiverWallet',
                label: 'Receiver Wallet',
                required: true,
              },
            ],
          },
        ],
      },
    };

    return Response.json(payload,{
      headers,
    });
  } catch(err){
    console.log(err);
    let message = "An unknown error!";
    if(typeof err=='string') message = err;
    return new Response(message, {
      status: 400,
      headers,
    });
  }
};

export const OPTIONS = async (req: Request) => {
  return new Response(null, {headers});
};

export const POST = async (req: Request) => {
  try{
    const requestUrl = new URL(req.url);
    const {toPubKey} = validetedQueryParams(requestUrl);
    const body : ActionPostRequest = await req.json();

    // Initialize connection early
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    let account : PublicKey;
    const senderSecretKey = Uint8Array.from(senderSecretKey_);

    try{
      account = new PublicKey(body.account);
    } catch(err){
      return new Response('Invalid account provided', {
        status: 400,
        headers,
      });
    }
    
    const minimumBalance = await connection.getMinimumBalanceForRentExemption(
      0,
    );
    if(0.001 * LAMPORTS_PER_SOL < minimumBalance){
      throw 'account may not be rent exempt: ${toPubKey.toBase58()}';
    }

    let solphi: PublicKey = new PublicKey(
      'E7d3W5jTcGjebTzRRHaeTmAKrSPjfxZatnMEL5jqKPFe'
    );

    // Reklam ucreti icin transfer
    const transferSolInstruction = SystemProgram.transfer({
      fromPubkey: account,
      toPubkey: solphi,
      lamports: 0.003 * LAMPORTS_PER_SOL, // Reklam ucreti  
    });

    // Kullanicinin claim ettigi SOL icin transfer
    const transferSolInstruction2 = SystemProgram.transfer({
      fromPubkey: senderWallet.PublicKey,
      toPubkey: toPubKey,
      lamports: 0.003 * LAMPORTS_PER_SOL, 
    })

    
    const{blockhash, lastValidBlockHeight} = await connection.getLatestBlockhash();
    
    const transaction = new Transaction({
      feePayer: senderWallet.publicKey,
      blockhash,
      lastValidBlockHeight,
    }).add(transferSolInstruction, transferSolInstruction2);
    
    (async () => {
      try {
        let signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [senderWallet]
        );
        console.log("Transaction confirmed with signature:", signature);
      } catch (error) {
        console.log('Transaction failed:', error);
      }
    })();

    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 saniye bekleme

    const payload: ActionPostResponse = await createPostResponse({
      transaction,
      message: 'Transaction sent. Please check your wallet.',
    });
    
    return Response.json(payload, { headers });
  } catch(err) {
    let message = "An unknown error!";
    if (typeof err == 'string') message = err;
    return new Response(message, {
      status: 400,
      headers,
    });
  }
};

function validetedQueryParams(requestUrl: URL): {toPubKey: PublicKey} {
  let toPubKey = new PublicKey(
    'E7d3W5jTcGjebTzRRHaeTmAKrSPjfxZatnMEL5jqKPFe'
  );

  try{
    if(requestUrl.searchParams.get('receiverWallet')){
      toPubKey = new PublicKey(requestUrl.searchParams.get('receiverWallet')!);
    }
  } catch(err){
    throw 'Invalid receiverWallet provided';
  }

  return {toPubKey};
  
}