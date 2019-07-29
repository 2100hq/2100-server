# 2100 Server
In the centralized formulation of the 2100 protocol this is the server which would run the bulk of business logic.

## Responsibilities
- syncronize app with blockchain
- calculate staking rewards
- maintain user balances
- create responsive public api
- allow proper transactions and withdraw/deposits from blockchain

Other notes
- Final database tech no decided, currently using rethink for prototyping
- API design is open

## Starting
Install [rethinkdb](https://hub.docker.com/_/rethinkdb/).

`npm install`

`touch .env` - edit your .env based on env section

`npm start`

## ENV
This parseEnv file will dynamically parse envs if they start with a lowercase letter or number.
The idea being you can reconstruct this as a json object. Uses lodash set to set keys in the config.
Just slightly less friction for adding new envs.

```
# internal name of service to run
service=2100           
# set your database name
rethink.db=2100        
# set the public socket api port
socket.port=9312       

# set your rate speed for processing all commands 
cmdTickRate=1000       

# confirmations before accepting deposit
confirmations=20       

# usually this is what you want but see ethers docs
ethers.provider.type=JsonRpcProvider 
# provider url, see ethers docs
ethers.provider.url=                 

# optional, otherwise start at latest block on chain
defaultStartBlock=8182562  

# default total supply measured in eth
tokens.supply=2100 
# default token decimal points
token.decimals=18
# default reward given to creator of token in wei (experimental)
tokens.creatorReward=0               
# default fraction of share of mining reward issued to owner, from 0-1
tokens.ownerShare=.1                 
# default default owner address, can be anything really, claimed through another process
tokens.ownerAddress=0                
# default mining rewards in wei, split between stakers every block
tokens.reward=210000000000000        

# secret private key of signer. this will sign all coupons to be issued to users
signerKey=
# public address of the system user, this is the first user who can create admins
# it will be assigned when authenticated
systemAddress=
```

## API
Describes the public api. Currently only socket io is used for frontend backend communication. 
Api is split between state and actions. State is not queried, but pused to user through socket.
Actions are request/response from user to server.

### Public State 
Public data follows this general schema and comes in through the private channel.

```js
{
  latestBlock:blockSchema,  //current ethereum block
  tokens:{
    active:{
      [token.id]:tokenSchema  //list of all tokens availble to be staked on
    },
    pending:{
      [token.id]:pendingTokenSchema //list of all tokens which need to be confirmed on chain
    },
    disabled:{
      [token.id]:tokenSchema  //list of all disabled tokens
    },
  }
}
```

### Private State
Private state is data scoped to a particular public address. You will get private data once authenticated and 
listening to the private channel.

```js
{
  myWallets:{
    available:{
      [wallet.tokenid]:walletSchema,  //funds available for staking or withdraw
    },
    locked:{
      [wallet.tokenid]:walletSchema,  //locked funds due to deposit/withdrwa confirm
    }
  },
  myCommands:{
    [commands.id]:commandSchema, //all commands/types issued by user
  },
  myCoupons:{
    create:{  
      [coupon.id]:couponSchema,  //signed coupons for creating a token
    },
    withdraw:{
      [coupon.id]:couponSchema,  //signed coupons for withdrawing tokens
    }
  },
  me:{
    id:string,
    publicAddress:string,
  }
}
```
### Private Actions
Private actions are scoped the the socket private channel and can only be called once authenticated

** createToken(name:string) **
- this generates a pending token which needs confirmation on blockchain
- string must be a valid twitter name or action will fail
- this generates a command for the user which can be monitored in private.myCommands

### Authentication
Authentication is done through privatekey signatures. Authentication methods happen on the auth channel.

- request a token from the server
- sign with metamask `2100 Login: ${token}` and submit to server using the "authenticate" function
- wait for private data to come in through socket


## Development
Notes for developing and maintaining code base.

### Directories
General directory structure of project as of now. This may get out of date quickly as we iterate.

- start.js - Initial entry point file, runs services defined in libs/services
- test - high level e2e tests if any
- scripts - misc files for anything
- libs - main source files
  - services - only 1 service, the 2100 app
    - 2100 - contains 2100 initializtion helpers
      - service.js - top level file which initializes and runs timers
  - engines 
    - blocks.js - process each new block to get events and sync blockchain
    - eventlogs.js - process each event type to create commands
    - commands.js - process commands, these mutate state of wallets and other things
  - models - models define how to mutate and query data. Database connectors need to implmement set/get/has/delete and any specific queries.
    - All models contain the following files:
      - model.js - all models have this file which defines mutations
      - rethink.js - database connector with set/get/has/delete and queries
      - schema.js - data schema using fastest-validator
      - defaults.js - usually defines data id and other default values
    - wallets - main model for updating wallets. 
    - users - stores user data
    - tokens - stores token data on tokens being created
    - commands - stores pending/processed commands
    - blocks - stores pending/processed blocks
    - eventlogs - stores pending/processed block log events
  - socket - interfaces with api events and actions layers to expose api to public

