const fs = require('fs');
const path = require('path');
const constants = require('./constants')

const filePath = path.join(__dirname, '..', '..', '..', constants.PATH_TO_NEWLY_GENERATED_TRANSACTION_INDEX);
const dirPath = path.dirname(filePath);

let rawdata;
if (fs.existsSync(filePath)) {
  rawdata = fs.readFileSync(filePath);
} else if (!fs.existsSync(dirPath)) {
    // create new directory
    fs.mkdirSync(dirPath, { recursive: true });
    // create new file
    fs.writeFileSync(filePath, '{}');
    rawdata = fs.readFileSync(filePath);
} else{
  // create new file
  fs.writeFileSync(filePath, '{}');
  rawdata = fs.readFileSync(filePath);
}


async function saveTxnIndex(
    TransactionName,
    txnIndex,
    submitTransactionHash,
    confirmationTransactionHash,
    executeTransactionHash
)
{
    let newTxnStore;
    console.log("Transaction Saving : .................", TransactionName)
    if(rawdata.length <=0){
        //if no data present just create a new object and have idx as 1
        let object = {}
        object[TransactionName] = 
        [
            {
                "id":1,
                "txnIndex": txnIndex,
                "submitTransactionHash": submitTransactionHash,
                "confirmationTransactionHash": confirmationTransactionHash,
                "executeTransactionHash": executeTransactionHash
            }
        ]
        newTxnStore = object
    }else{
        let object = JSON.parse(rawdata)
        if(object.hasOwnProperty(TransactionName)){
            //if key is already there push to it
            object[TransactionName].push(
                {
                    "id": object[TransactionName].length+1,
                    "txnIndex": txnIndex,
                    "submitTransactionHash": submitTransactionHash,
                    "confirmationTransactionHash": confirmationTransactionHash,
                    "executeTransactionHash": executeTransactionHash
                }
            )
        }else{
            //if key is not present make a new object
            object[TransactionName] = [
                {
                    "id":1,
                    "txnIndex": txnIndex,
                    "submitTransactionHash": submitTransactionHash,
                    "confirmationTransactionHash": confirmationTransactionHash,
                    "executeTransactionHash": executeTransactionHash
                }
            ]
        }
        newTxnStore = object
    }

    let data = JSON.stringify(newTxnStore,null," ");

    fs.writeFileSync(constants.PATH_TO_NEWLY_GENERATED_TRANSACTION_INDEX,data, function(err){
        if(err){
            console.log(err)
        } 
    })
}

module.exports = {
    saveTxnIndex
}

//The above code will give output like below:

// {
//     "transferIndex": [
//      {
//       "id": 1,
//       "txnIndex": "0x000000000000000000000000000000000000000000000000000000000000000e"
//      },
//      {
//       "id": 2,
//       "txnIndex": "0x0000000000000000000000000000000000000000000000000000000000000013"
//      },
//      {
//       "id": 3,
//       "txnIndex": "0x0000000000000000000000000000000000000000000000000000000000000017"
//      },
//      {
//       "id": 4,
//       "txnIndex": "0x0000000000000000000000000000000000000000000000000000000000000018"
//      }
//     ],
//     "addLiquidityXDCTxnIdx": [
//      {
//       "id": 1,
//       "txnIndex": "0x0000000000000000000000000000000000000000000000000000000000000010"
//      },
//      {
//       "id": 2,
//       "txnIndex": "0x0000000000000000000000000000000000000000000000000000000000000012"
//      },
//      {
//       "id": 3,
//       "txnIndex": "0x0000000000000000000000000000000000000000000000000000000000000016"
//      }
//     ],
//     "upgradeTxnIdx": [
//      {
//       "id": 1,
//       "txnIndex": "0x0000000000000000000000000000000000000000000000000000000000000014"
//      }
//     ]
//    }