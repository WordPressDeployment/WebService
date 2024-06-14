# mCylia Web Service
The purpose of this web service is to display real time data about a pool of mCylia boxes that a user owns

## Dependencies
* [Webject](https://www.npmjs.com/package/webject)
* [ws](https://www.npmjs.com/package/ws)
* [mysql](https://www.npmjs.com/package/mysql)

## Installing Dependencies
```bash
npm install
```

## Routes
There are two routes for real time connections
* one is for a trusted server after it sends a request for a user with correct headers, a url to be used as an iframe is returned so that server gets text from webservice, sends iframe of webservice/receivedtext
* one is for admin, it is a route that when loaded, a token is prompted on first time and is used for a connection to all the data

## Environment Variables
There are some environment variables required to be set for this repository to work
- `AUTH_HEAD`: for only allowing an entity that knows its content to get desired interaction with this webservice
- `AUTH_VALUE`: just like *AUTH_HEAD* and it would be sent as a setHeader(AUTH_HEAD,AUTH_VALUE) to obtain desired interaction frmo this webservice (leave these two out to allow anyone to use this webservice)
- `DB_URL`: the url to connect to the database
- `DB_USER`: the username to use when connecting to the database
- `DB_PASS`: the password to use when connecting to the database