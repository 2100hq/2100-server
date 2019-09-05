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
Install [mongodb by docker](https://hub.docker.com/_/mongo) or 
[ubuntu](https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-18-04).

optionally install pm2. `npm install pm2 -g`

`npm install`

`touch .env` - edit your .env based on env section

If using pm2:
- `pm2 start ecosystem.config.js`

If using node:
- `npm run auth` - runs the auth server
- `npm run blocks` - runs the blocks and log getter
- `npm start` - runs main 2100 app

## ENV
This parseEnv file will dynamically parse envs if they start with a lowercase letter or number.
The idea being you can reconstruct this as a json object. Uses lodash set to set keys in the config.
Just slightly less friction for adding new envs.

```
# internal name of service to run
service=2100           

# set mongo database uri
mongo.uri=mongodb://user:pass@localhost:port/database?authSource=admin

# set the public socket api port
socket.port=9312       

# set auth host and port
auth.host=ws://localhost:9315
auth.socket.port=9315

# set your rate speed for processing all commands 
cmdTickRate=1000       

# confirmations before accepting deposit
confirmations=20       

# usually this is what you want but see ethers docs
ethers.provider.type=JsonRpcProvider 
# provider url, see ethers docs
ethers.provider.url=                 

# optional, otherwise start at latest block on chain
defaultStartBlock=0

# optional, block watcher starts from latest block in chain. block watcher requires restart.
forceLatestBlock=true

# optional, disable any block rewards, block service requires restart if running
disableBlockRewards=true

# optional, disable auth, 2100 service requires restart
disableAuth=true

# default total supply measured in wei (will change to eth in future)
tokens.supply=2100000000000000000000
# default token decimal points
tokens.decimals=18
# default reward given to creator of token in wei (not implemented)
tokens.creatorReward=0               
# default fraction of share of mining reward issued to owner, from 0-1
tokens.ownerShare=.1                 
# default default owner address, can be anything really, claimed through another process
tokens.ownerAddress=0                
# default mining rewards in wei, split between stakers every block (will be updated to eth)
tokens.reward=210000000000000        

# secret private key of signer. this will sign all coupons to be issued to users
signer.privateKey=
# public address of the system user, this is the first user who can create admins
# it will be assigned when authenticated
systemAddress=
```
## Auth Service ##
This should run as a seperate application service. 

### Start
First update env then
`npm run start-auth` or `service=auth node start`

### ENV
You can add this to the same env as 2100.
```
auth.socket.port=9315
```

## API
Describes the public api. Currently only socket io is used for frontend backend communication. 
Api is split between state and actions. State is not queried, but pushed to user through socket.
Actions are request/response from user to server.

### Authentication
Authentication is done through tokens over socket. There is a specific flow required to correctly
authenticate.


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
  },
  coupons:{
    create:{  
      [coupon.id]:couponSchema,  //signed coupons for creating a token
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
    withdraw:{
      [coupon.id]:couponSchema,  //signed coupons for withdrawing tokens
    }
  },
  me:{
    id:string,
    publicAddress:string,
    isAdmin:string,  //is the user admin? will not exist if not
  }
}
```
### Public Actions
Public actions mainly have system stats. 

**getStakeHistory(tokenid:string,blockStart:number,blockEnd:number):stakeStats[]**   
Returns stats for a token based on staking.

```
//stakeStats
{
  id:string, //id of stat
  created:number, //date created
  updated:number, //date updated
  stats:{
    id:tokenid,
    total:number //total dai staked across all users for this token
    rank:number //the rank of this token based on total staked compared to all other tokens
    stakers:{  //stakers percentages
      [key:userid]:value:percentage
    }
  }
}
```

**getAllStakeHistory(blockStart:number,blockEnd:number):{[tokenid]:stakeStats[]}**   
Get stake stats for every token

**getGlobalStats():globalStats**   
Return latest global stats

```
global stats schema
{
  id:string, //id of stat
  created:number, //date created
  updated:number, //date updated
  stats:{
    tokenCount:number,//total tokens active in system
    userCount:number, //total registered users
    totalDai:string,  //total dai deposited
    totalStaking:string,  //total dai staking across all tokensj:wa
  }
}
```

**getGlobalHistoryStats(blockStart:number,blockEnd:number):globalStats[]**
Return latest global stats across blocks.

### Private Actions
Private actions are scoped the the socket private channel and can only be called once authenticated

**me**
- returns your user. Its already avaialble in your private state, but here for testing.

**verifyTwitter({link:string,tweetType:string='2100',description:string=''})**
- Create a new token based on you twitter name. Requires a tweetType that looks up a template in utils.tweetTemplates
- link - full https link to tweet which contains the formatted message.
- tweetType - '2100' or 'humanitydao'
- description - optional description of your token. 

**setFavorite(tokenid:string,favorite=true)**
- adds a token to your favorites list. can also remove token by setting favorite=false.

**setTokenDescription(tokenid:string,description='')**
- set the description of a token you own. 

### Admin Actions
Special routes only admins can call.

**createPendingToken({name:string,ownerAddress:(string,optional)})**
- creates ownerless token which needs to be confirmed on blockchain.

**createTokenByName({name:string,ownerAddress:string,description:(string,optional)})**
-  creates an active token off chain which has these properties. 

**setTokenDescription(tokenid:string,description='')**
- set the description of any active token.

**setAdmin({userid:string,isAdmin:boolean})**
- user ids are identical to user addresses
- sets a public address to be admin or not. isAdmin = true makes them an admin, isAdmin = false revokes.
- you cannot mess with your own admin status

### System Actions
Only system user can take these actions. System address is specified in the .env file.

**setAdmin({userid:string,isAdmin:boolean})**
- sets a public address to be admin or not. isAdmin = true makes them an admin, isAdmin = false revokes.
- you can set yourself to be admin or not, it wont matter you will still have access to system route

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

