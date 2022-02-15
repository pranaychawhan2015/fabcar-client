'use strict';

const { Gateway, Wallets } = require('fabric-network');
const favicon = require('serve-favicon');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const port = 3000;
let result = '';
let contract;
let int = 0;

app.use(ignoreFavicon)


app.get('/', (req, res) => {
           try
           {
                int = int+1;
                app.get('/favicon.ico', (req, res) => res.status(404).end().next());
                res.statusCode = 200;         
                Perform('/', req.params).then(function(result){
                    res.send(result);
                });
           }
           catch(error)
           {
               res.status(404).send("Not Found");
           }
})

app.use(function (error, req, res, next) {
    console.error(error.stack)
    res.status(500).send('Something broke!')
  })

app.get('/queryAllCars', (req, res) => {
    //const resultBuffer = main();
    try
    {
        int = int+1;
        app.get('/favicon.ico', (req, res) => res.status(404).end().next());
        res.statusCode = 200;
        res.redirect('/');
    }
    catch(error)
    {
        res.status(404).send('Something broke!')
    }
})

app.get('/favicon.ico', (req, res) => res.status(404).end().next());


app.get('/changeCarOwner/:carNumber/:newOwner', (req, res) => {
    try
    {
        int = int+1;
        app.get('/favicon.ico', (req, res) => res.status(404).end().next());
        //const resultBuffer = main();
        console.log(req.params.carNumber);
        console.log(req.params.newOwner);
        res.statusCode = 200;
        Perform('/changeCarOwner', req.params).then(function(result){
            res.redirect('/');
        });
    }
    catch(error)
    {
        res.status(404).send('Something broke!')
    }
})



app.get('/createCar/:carNumber/:make/:model/:color/:owner', (req, res) => {
    try
    {
        int = int+1;
        app.get('/favicon.ico', (req, res) => res.status(204).end().next());
        //const resultBuffer = main();
        res.statusCode = 200;
        if(res.headersSent)
        Perform('/createCar', req.params).then(function(result){
            res.redirect('/');
        });
    }
    catch(error)
    {
        res.status(404).send('Something broke!')   
    }
})

app.get('/queryCar/:carNumber', (req, res) => {
    try
    {
        int = int+1;

        //const resultBuffer = main();
        res.statusCode = 200;
        Perform('/queryCar', req.params).then(function(result){
            res.send(result);
        })
    }
    catch(error)
    {
        res.status(404).send('Something broke!')   
    }
})

app.get('/deleteAllCars',(req, res)=>{
    try
    {
        int = int+1;

        res.statusCode = 200;
        Perform('/deleteAllCars', req.params).then(function(result)
        {
            res.redirect('/');
        });
    }
    catch(error)
    {
        res.statusCode(404).send('Something broke !');
    }
})


app.get('/deleteCar/:carNumber',(req, res)=>{

    try
    {
        int = int+1;
        res.statusCode = 200;
        Perform('/deleteCar', req.params).then(
            function(result){
                res.redirect('/');
            }
        )
    }
    catch(error)
    {
        res.statusCode(404).send("Something broke !");
    }
})

app.get('/initCars', (req, res)=>{
    try
    {
        int = int+1;
        res.statusCode = 200;
        Perform('/initCars', req.params).then(function(result){
            res.redirect('/');
        });
    }
    catch(error)
    {
        res.status(404).send("Something broke !")
    }
})


 async function Perform(endPoint, params ) {
    try {
        
        if(int == 1)
        {
                    // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        contract = network.getContract('fabcar');
        }

        // Submit the specified transaction.
        // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
        // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR12', 'Dave')
        if(endPoint == '/' || endPoint == '/queryAllCars')
        {
            result = await (await contract.evaluateTransaction('queryAllCars')).toString();
        }
        else if(endPoint == "/changeCarOwner")
        {
            result = await (await contract.submitTransaction("changeCarOwner", params.carNumber, params.newOwner)).toString();
        }
        else if(endPoint == "/createCar")
        {
            result = await (await contract.submitTransaction('createCar', params.carNumber, params.make, params.model, params.color, params.owner));
        }
        else if(endPoint == "/queryCar")
        {
            result = await (await contract.evaluateTransaction("queryCar", params.carNumber)).toString();
        }
        else if(endPoint == '/deleteAllCars')
        {
            result = await (await contract.submitTransaction('deleteAllCars'));
        }
        else if(endPoint == '/deleteCar')
        {
            result = await (await contract.submitTransaction('deleteCar', params.carNumber));
        }
        else if(endPoint == '/initCars')
        {
            result = await (await contract.submitTransaction('initLedger'));
        }
        console.log('Transaction has been submitted ', result.toString());
    
        // Disconnect from the gateway.
        //await gateway.disconnect();
        return result;
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }
}


function ignoreFavicon(req, res, next) {
    if (req.originalUrl.includes('favicon.ico')) {
      res.status(404).end()
    }
    next();
  }
  

app.listen(port, () => {
    console.log('Hello world');
})

