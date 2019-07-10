# 2100 Server
In the centralized formulation of the 2100 protocol this is the server which would run the bulk of business logic.

## Responsibilities
- syncronize app with blockchain
- calculate staking rewards
- maintain user balances
- create responsive public api
- allow proper transactions and withdraw/deposits from blockchain

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
  service=2100
  rethink.db=2100  //set your database name
  txTickRate=1000 //set your block speed for processing transactions
  mintingTickRate=15000  //set your minting tick rate for generating staking rewards
  socket.port=9312 //set the public socket api port
```

## Directories
General directory structure of project as of now.

- test - high level e2e tests if any
- scripts - misc files for anything
- libs - main source files
  - services - only 1 service, the 2100 app
    - 2100 - contains 2100 initializtion helpers
      - service.js - top level file which initializes and runs timers
  - engines 
    - transactions.js - serializes transaction data and only place that updates wallet balance
    - minting.js - generates transactions from minting/staking with proper reward ratio
  - models - models define how to mutate and query data. Database connectors need to implmement set/get/has/delete and any specific queries.
    - wallets - main model for updating wallets. All models contain the following files:
      - model.js - all models have this file which defines mutations
      - rethink.js - database connector with set/get/has/delete and queries
      - schema.js - data schema using fastest-validator
      - defaults.js - usually defines data id and other default values
    - users - stores user data
    - tokens - stores token data on tokens being created
    - transactions - stores transactions, uses an incrementing id system for sorted key stores
  - socket - interfaces with api events and actions layers to expose api to public


    




