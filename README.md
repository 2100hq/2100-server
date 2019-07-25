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
  service=2100           //internal name of service to run
  rethink.db=2100        //set your database name
  socket.port=9312       //set the public socket api port

  cmdTickRate=1000       //set your block speed for processing transactions
  mintingTickRate=15000  //set your minting tick rate for generating staking rewards
  confirmations=20       //confirmations before accepting deposit

  ethers.provider.type=JsonRpcProvider //usually this is what you want but see ethers docs
  ethers.provider.url=                 //provider url

  defaultStartBlock=8182562  //optional, otherwise start at latest block on chain
  primaryToken=DAI           //symbol for default staking token, can use address too

  #token defaults when creating new token
  tokens.supply=2100000000000000000000 //measured in wei
  tokens.creatorReward=0               //reward given to creator of token in wei (experimental)
  tokens.ownerShare=.1                 //fraction of share of mining reward issued to owner, from 0-1
  tokens.ownerAddress=0                //default owner address, can be anything really, claimed through another process
  tokens.reward=210000000000000        //mining rewards in wei, split between stakers every block
```

## API
Describes the public api. Currently only socket io is used for frontend backend communication. 

### Authentication
Authentication is done through privatekey signatures. Authentication methods happen on the auth channel.

### Public State 
Public data follows this general schema and comes in through the private channel.

### Private State
Private state is data scoped to a particular public address. You will get private data once authenticated and 
listening to the private channel.

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

